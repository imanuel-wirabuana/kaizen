import { useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  fetchWorkspaceInvites,
  createWorkspaceInviteRecord,
  revokeInviteRecord,
  restoreInviteRecord,
  deleteInviteRecord,
  batchRevokeInviteRecords,
  batchRestoreInviteRecords,
  batchDeleteInviteRecords,
  updateInviteRecord,
  subscribeToInviteChanges,
} from "@/features/members/services/invite-service"
import { memberKeys } from "@/features/members/services/member-keys"
import type { WorkspaceInvite, WorkspacePermissions } from "@/types/member"

export function useWorkspaceInvites() {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. TanStack React Query: Cached Server State
  const {
    data: invites = [],
    isLoading,
    error,
    refetch: refreshInvites,
  } = useQuery({
    queryKey: memberKeys.invites(workspaceId),
    queryFn: () => fetchWorkspaceInvites(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  // 2. Realtime Subscription: Update React Query Cache directly
  useEffect(() => {
    if (!workspaceId) return

    const unsubscribe = subscribeToInviteChanges(workspaceId, {
      onInsert: (newInvite) => {
        queryClient.setQueryData<WorkspaceInvite[]>(
          memberKeys.invites(workspaceId),
          (old) => {
            if (!old) return [newInvite]
            if (old.some((i) => i.id === newInvite.id)) return old
            return [newInvite, ...old]
          }
        )
      },
      onUpdate: (updatedInvite) => {
        queryClient.setQueryData<WorkspaceInvite[]>(
          memberKeys.invites(workspaceId),
          (old) =>
            old?.map((i) => (i.id === updatedInvite.id ? updatedInvite : i)) ?? [
              updatedInvite,
            ]
        )
      },
      onDelete: (deletedId) => {
        queryClient.setQueryData<WorkspaceInvite[]>(
          memberKeys.invites(workspaceId),
          (old) => old?.filter((i) => i.id !== deletedId) ?? []
        )
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId])

  // 3. React Query Mutations
  const createInviteMutation = useMutation({
    mutationFn: async ({
      permissions,
      maxUses,
      expiredAt,
    }: {
      permissions: WorkspacePermissions
      maxUses?: number
      expiredAt?: string | null
    }) => {
      if (!workspaceId || !user) {
        throw new Error("Active workspace and authenticated user required.")
      }

      return createWorkspaceInviteRecord({
        workspaceId,
        ownerId: user.id,
        permissions,
        maxUses,
        expiredAt,
      })
    },
    onSuccess: (newInvite) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) => (old ? [newInvite, ...old] : [newInvite])
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invite link generated", {
        description: `Invite code ${newInvite.code} is ready to share.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to generate invite", {
        description: (err as Error).message || "Could not generate invite code.",
      })
    },
  })

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      return revokeInviteRecord(inviteId)
    },
    onSuccess: (_, inviteId) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) =>
          old?.map((i) =>
            i.id === inviteId
              ? { ...i, revoked_at: new Date().toISOString() }
              : i
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invite revoked", {
        description: "The invite link has been deactivated.",
      })
    },
    onError: (err) => {
      toast.error("Failed to revoke invite", {
        description: (err as Error).message || "Could not revoke invite code.",
      })
    },
  })

  const restoreInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      return restoreInviteRecord(inviteId)
    },
    onSuccess: (_, inviteId) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) =>
          old?.map((i) =>
            i.id === inviteId ? { ...i, revoked_at: null } : i
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invite restored", {
        description: "The invite code has been re-activated.",
      })
    },
    onError: (err) => {
      toast.error("Failed to restore invite", {
        description: (err as Error).message || "Could not restore invite code.",
      })
    },
  })

  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      return deleteInviteRecord(inviteId)
    },
    onSuccess: (_, inviteId) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) => old?.filter((i) => i.id !== inviteId) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invite deleted", {
        description: "The invite code has been permanently deleted.",
      })
    },
    onError: (err) => {
      toast.error("Failed to delete invite", {
        description: (err as Error).message || "Could not delete invite code.",
      })
    },
  })

  const batchRevokeMutation = useMutation({
    mutationFn: async (inviteIds: number[]) => {
      return batchRevokeInviteRecords(inviteIds)
    },
    onSuccess: (_, inviteIds) => {
      const nowIso = new Date().toISOString()
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) =>
          old?.map((i) =>
            inviteIds.includes(i.id) ? { ...i, revoked_at: nowIso } : i
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invites revoked", {
        description: `${inviteIds.length} invite codes have been deactivated.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to batch revoke", {
        description: (err as Error).message || "Could not revoke invite codes.",
      })
    },
  })

  const batchRestoreMutation = useMutation({
    mutationFn: async (inviteIds: number[]) => {
      return batchRestoreInviteRecords(inviteIds)
    },
    onSuccess: (_, inviteIds) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) =>
          old?.map((i) =>
            inviteIds.includes(i.id) ? { ...i, revoked_at: null } : i
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invites restored", {
        description: `${inviteIds.length} invite codes have been re-activated.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to batch restore", {
        description: (err as Error).message || "Could not restore invite codes.",
      })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (inviteIds: number[]) => {
      return batchDeleteInviteRecords(inviteIds)
    },
    onSuccess: (_, inviteIds) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) => old?.filter((i) => !inviteIds.includes(i.id)) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invites deleted", {
        description: `${inviteIds.length} invite codes permanently deleted.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to batch delete", {
        description: (err as Error).message || "Could not delete invite codes.",
      })
    },
  })

  const updateInviteMutation = useMutation({
    mutationFn: async ({
      inviteId,
      ...updates
    }: {
      inviteId: number
      permissions?: WorkspacePermissions
      maxUses?: number
      expiredAt?: string | null
    }) => {
      return updateInviteRecord(inviteId, updates)
    },
    onSuccess: (updatedInvite) => {
      queryClient.setQueryData<WorkspaceInvite[]>(
        memberKeys.invites(workspaceId),
        (old) =>
          old?.map((i) => (i.id === updatedInvite.id ? updatedInvite : i)) ?? [
            updatedInvite,
          ]
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.invites(workspaceId),
      })
      toast.success("Invite updated", {
        description: `Invite code ${updatedInvite.code} has been saved.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to update invite", {
        description: (err as Error).message || "Could not save invite settings.",
      })
    },
  })

  return {
    invites,
    isLoading,
    error: error ? (error as Error).message : null,
    createInvite: (params: {
      permissions: WorkspacePermissions
      maxUses?: number
      expiredAt?: string | null
    }) => createInviteMutation.mutateAsync(params),
    revokeInvite: (inviteId: number) =>
      revokeInviteMutation.mutateAsync(inviteId),
    restoreInvite: (inviteId: number) =>
      restoreInviteMutation.mutateAsync(inviteId),
    deleteInvite: (inviteId: number) =>
      deleteInviteMutation.mutateAsync(inviteId),
    batchRevokeInvites: (inviteIds: number[]) =>
      batchRevokeMutation.mutateAsync(inviteIds),
    batchRestoreInvites: (inviteIds: number[]) =>
      batchRestoreMutation.mutateAsync(inviteIds),
    batchDeleteInvites: (inviteIds: number[]) =>
      batchDeleteMutation.mutateAsync(inviteIds),
    updateInvite: (params: {
      inviteId: number
      permissions?: WorkspacePermissions
      maxUses?: number
      expiredAt?: string | null
    }) => updateInviteMutation.mutateAsync(params),
    updateInvitePermissions: (params: {
      inviteId: number
      permissions: WorkspacePermissions
    }) => updateInviteMutation.mutateAsync(params),
    isCreating: createInviteMutation.isPending,
    isRevoking: revokeInviteMutation.isPending,
    isRestoring: restoreInviteMutation.isPending,
    isDeleting: deleteInviteMutation.isPending,
    isUpdating: updateInviteMutation.isPending,
    isBatchOperating:
      batchRevokeMutation.isPending ||
      batchRestoreMutation.isPending ||
      batchDeleteMutation.isPending,
    refreshInvites,
  }
}
