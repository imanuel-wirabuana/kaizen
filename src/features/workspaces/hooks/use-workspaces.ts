import { useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import {
  useWorkspaceStore,
  useActiveWorkspace,
} from "@/stores/workspace-store"
import {
  fetchActiveWorkspaces,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  archiveWorkspaceRecord,
  deleteWorkspaceRecord,
  transferWorkspaceOwnershipRecord,
  subscribeToWorkspaceChanges,
} from "@/features/workspaces/services/workspace-service"
import { workspaceKeys } from "@/features/workspaces/services/workspace-keys"
import { memberKeys } from "@/features/members/services/member-keys"
import type { Workspace, WorkspaceSettings } from "@/types/workspace"

const EMPTY_WORKSPACES: Workspace[] = []

export function useWorkspaces() {
  const { user, isLoaded: isUserLoaded } = useUser()

  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId)
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace)

  const activeWorkspace = useActiveWorkspace()

  // 1. TanStack React Query: Cached Server State
  const {
    data: queryWorkspaces,
    isLoading: isQueryLoading,
    error: queryError,
    refetch: refreshWorkspaces,
  } = useQuery({
    queryKey: workspaceKeys.list(user?.id),
    queryFn: () => fetchActiveWorkspaces(user!.id),
    enabled: Boolean(user && isUserLoaded),
  })

  const storeWorkspaces = useWorkspaceStore((state) => state.workspaces)
  const workspaces = queryWorkspaces ?? storeWorkspaces ?? EMPTY_WORKSPACES

  // Keep Zustand client store synchronized with cached query data
  useEffect(() => {
    if (isUserLoaded && user && queryWorkspaces !== undefined) {
      setWorkspaces(queryWorkspaces)
    }
  }, [queryWorkspaces, isUserLoaded, user, setWorkspaces])

  // 2. Realtime Subscription: Update React Query Cache directly (0ms latency)
  useEffect(() => {
    if (!isUserLoaded || !user) return

    const unsubscribe = subscribeToWorkspaceChanges(user.id, {
      onInsert: (workspace) => {
        queryClient.setQueryData<Workspace[]>(
          workspaceKeys.list(user.id),
          (old) => {
            if (!old) return [workspace]
            if (old.some((w) => w.id === workspace.id)) return old
            return [...old, workspace]
          }
        )
        upsertWorkspace(workspace)
      },
      onUpdate: (workspace) => {
        queryClient.setQueryData<Workspace[]>(
          workspaceKeys.list(user.id),
          (old) => old?.map((w) => (w.id === workspace.id ? workspace : w)) ?? [workspace]
        )
        upsertWorkspace(workspace)
      },
      onDelete: (id) => {
        queryClient.setQueryData<Workspace[]>(
          workspaceKeys.list(user.id),
          (old) => old?.filter((w) => w.id !== id) ?? []
        )
        removeWorkspace(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [user, isUserLoaded, upsertWorkspace, removeWorkspace])

  // 3. React Query Mutations
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      settings,
    }: {
      name: string
      description?: string
      settings?: WorkspaceSettings
    }) => {
      if (!user) throw new Error("You must be signed in to create a workspace")
      return createWorkspaceRecord({
        name,
        description,
        ownerId: user.id,
        settings,
      })
    },
    onSuccess: (created) => {
      if (!user) return
      queryClient.setQueryData<Workspace[]>(
        workspaceKeys.list(user.id),
        (old) => (old ? [...old, created] : [created])
      )
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list(user.id) })
      upsertWorkspace(created)
      setActiveWorkspaceId(created.id)
      toast.success("Workspace created", {
        description: `"${created.name}" is now ready and active.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create workspace", {
        description: (error as Error).message || "Unable to create workspace.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number
      updates: Partial<Workspace>
    }) => {
      return updateWorkspaceRecord(id, updates)
    },
    onSuccess: (updated) => {
      if (!user) return
      queryClient.setQueryData<Workspace[]>(
        workspaceKeys.list(user.id),
        (old) => old?.map((w) => (w.id === updated.id ? updated : w)) ?? [updated]
      )
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list(user.id) })
      upsertWorkspace(updated)
      toast.success("Workspace updated", {
        description: `"${updated.name}" updated successfully.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update workspace", {
        description: (error as Error).message || "Unable to update workspace.",
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      return archiveWorkspaceRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !user) return
      const target = workspaces.find((w) => w.id === id)
      queryClient.setQueryData<Workspace[]>(
        workspaceKeys.list(user.id),
        (old) => old?.filter((w) => w.id !== id) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list(user.id) })
      removeWorkspace(id)
      toast.success("Workspace archived", {
        description: target
          ? `"${target.name}" has been archived.`
          : "Workspace has been archived.",
      })
    },
    onError: (error) => {
      toast.error("Failed to archive workspace", {
        description: (error as Error).message || "Unable to archive workspace.",
      })
    },
  })

  const createWorkspace = async (
    name: string,
    description?: string,
    settings?: WorkspaceSettings
  ): Promise<Workspace> => {
    return createMutation.mutateAsync({ name, description, settings })
  }

  const updateWorkspace = async (
    id: number,
    updates: Partial<Workspace>
  ): Promise<Workspace> => {
    return updateMutation.mutateAsync({ id, updates })
  }

  const archiveWorkspace = async (id: number): Promise<boolean> => {
    return archiveMutation.mutateAsync(id)
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteWorkspaceRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !user) return
      const target = workspaces.find((w) => w.id === id)
      queryClient.setQueryData<Workspace[]>(
        workspaceKeys.list(user.id),
        (old) => old?.filter((w) => w.id !== id) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list(user.id) })
      removeWorkspace(id)
      toast.success("Workspace deleted", {
        description: target
          ? `"${target.name}" has been permanently deleted.`
          : "Workspace has been permanently deleted.",
      })
    },
    onError: (error) => {
      toast.error("Failed to delete workspace", {
        description: (error as Error).message || "Unable to delete workspace.",
      })
    },
  })

  const transferOwnershipMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      newOwnerId,
    }: {
      workspaceId: number
      newOwnerId: string
    }) => {
      if (!user) throw new Error("You must be logged in to transfer ownership")
      return transferWorkspaceOwnershipRecord(workspaceId, user.id, newOwnerId)
    },
    onSuccess: (updated) => {
      if (!user) return
      queryClient.setQueryData<Workspace[]>(
        workspaceKeys.list(user.id),
        (old) => old?.map((w) => (w.id === updated.id ? updated : w)) ?? [updated]
      )
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.list(user.id) })
      void queryClient.invalidateQueries({ queryKey: memberKeys.list(updated.id) })
      upsertWorkspace(updated)
      toast.success("Ownership transferred", {
        description: `Ownership of "${updated.name}" has been transferred successfully.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to transfer ownership", {
        description: (error as Error).message || "Unable to transfer ownership.",
      })
    },
  })

  const deleteWorkspace = async (id: number): Promise<boolean> => {
    return deleteMutation.mutateAsync(id)
  }

  const transferOwnership = async (
    workspaceId: number,
    newOwnerId: string
  ): Promise<Workspace> => {
    return transferOwnershipMutation.mutateAsync({ workspaceId, newOwnerId })
  }

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    isLoading: isQueryLoading,
    error: queryError ? (queryError as Error).message : null,
    createWorkspace,
    updateWorkspace,
    archiveWorkspace,
    deleteWorkspace,
    transferOwnership,
    isArchiving: archiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTransferring: transferOwnershipMutation.isPending,
    setActiveWorkspaceId,
    refreshWorkspaces,
  }
}
