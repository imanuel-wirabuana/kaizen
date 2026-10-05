import { useCallback, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  useWorkspaceStore,
  useActiveWorkspace,
} from "@/stores/workspace-store"
import {
  fetchActiveWorkspaces,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  archiveWorkspaceRecord,
  subscribeToWorkspaceChanges,
} from "@/features/workspaces/services/workspace-service"
import type { Workspace, WorkspaceSettings } from "@/types/workspace"

export function useWorkspaces() {
  const { user, isLoaded: isUserLoaded } = useUser()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const isLoading = useWorkspaceStore((state) => state.isLoading)
  const error = useWorkspaceStore((state) => state.error)

  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces)
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId)
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace)
  const setIsLoading = useWorkspaceStore((state) => state.setIsLoading)
  const setError = useWorkspaceStore((state) => state.setError)
  const resetStore = useWorkspaceStore((state) => state.reset)

  const activeWorkspace = useActiveWorkspace()

  // Fetch workspaces for current authenticated user
  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      resetStore()
      return
    }

    try {
      setIsLoading(true)
      const data = await fetchActiveWorkspaces(user.id)
      setWorkspaces(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspaces"
      setError(message)
    }
  }, [user, resetStore, setIsLoading, setWorkspaces, setError])

  // Lifecycle: fetch and subscribe to realtime changes
  useEffect(() => {
    if (!isUserLoaded) return

    if (!user) {
      resetStore()
      return
    }

    void refreshWorkspaces()

    const unsubscribe = subscribeToWorkspaceChanges(user.id, {
      onInsert: (workspace) => {
        upsertWorkspace(workspace)
      },
      onUpdate: (workspace) => {
        upsertWorkspace(workspace)
      },
      onDelete: (id) => {
        removeWorkspace(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [
    user,
    isUserLoaded,
    refreshWorkspaces,
    upsertWorkspace,
    removeWorkspace,
    resetStore,
  ])

  // Create Workspace
  const createWorkspace = async (
    name: string,
    description?: string,
    settings?: WorkspaceSettings
  ): Promise<Workspace> => {
    if (!user) {
      throw new Error("You must be signed in to create a workspace")
    }

    const created = await createWorkspaceRecord({
      name,
      description,
      ownerId: user.id,
      settings,
    })

    upsertWorkspace(created)
    setActiveWorkspaceId(created.id)
    return created
  }

  // Update Workspace
  const updateWorkspace = async (
    id: number,
    updates: Partial<Workspace>
  ): Promise<Workspace> => {
    const updated = await updateWorkspaceRecord(id, updates)
    upsertWorkspace(updated)
    return updated
  }

  // Archive Workspace
  const archiveWorkspace = async (id: number): Promise<boolean> => {
    const success = await archiveWorkspaceRecord(id)
    if (success) {
      removeWorkspace(id)
    }
    return success
  }

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    isLoading,
    error,
    createWorkspace,
    updateWorkspace,
    archiveWorkspace,
    setActiveWorkspaceId,
    refreshWorkspaces,
  }
}
