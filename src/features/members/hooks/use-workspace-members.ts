import { useEffect, useMemo } from "react"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  fetchWorkspaceMembers,
  updateMemberPermissionsRecord,
  revokeMemberRecord,
  restoreMemberRecord,
  deleteMemberRecord,
  batchRevokeMemberRecords,
  batchRestoreMemberRecords,
  batchDeleteMemberRecords,
  subscribeToMemberChanges,
  syncWorkspaceUserProfile,
} from "@/features/members/services/member-service"
import { memberKeys } from "@/features/members/services/member-keys"
import {
  OWNER_PERMISSIONS,
  type WorkspaceMember,
  type WorkspaceMemberProfile,
  type WorkspacePermissions,
  type MemberProfileData,
} from "@/types/member"

export function useWorkspaceMembers() {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. TanStack React Query: Cached Server State
  const {
    data: rawMembers = [],
    isLoading,
    error,
    refetch: refreshMembers,
  } = useQuery({
    queryKey: memberKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceMembers(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  // Silent background sync of current user's Clerk profile to workspace_members.profile
  useEffect(() => {
    if (!workspaceId || !user) return
    const isOwner = Boolean(
      activeWorkspace && activeWorkspace.owner_id === user.id
    )
    void syncWorkspaceUserProfile({ workspaceId, user, isOwner })
  }, [
    workspaceId,
    user,
    activeWorkspace,
  ])

  // 2. Realtime Subscription: Update React Query Cache directly
  useEffect(() => {
    if (!workspaceId) return

    const unsubscribe = subscribeToMemberChanges(workspaceId, {
      onInsert: (newMember) => {
        queryClient.setQueryData<WorkspaceMember[]>(
          memberKeys.list(workspaceId),
          (old) => {
            if (!old) return [newMember]
            if (old.some((m) => m.id === newMember.id)) return old
            return [...old, newMember]
          }
        )
      },
      onUpdate: (updatedMember) => {
        queryClient.setQueryData<WorkspaceMember[]>(
          memberKeys.list(workspaceId),
          (old) =>
            old?.map((m) => (m.id === updatedMember.id ? updatedMember : m)) ?? [
              updatedMember,
            ]
        )
      },
      onDelete: (deletedId) => {
        queryClient.setQueryData<WorkspaceMember[]>(
          memberKeys.list(workspaceId),
          (old) => old?.filter((m) => m.id !== deletedId) ?? []
        )
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId])

  // 3. React Query Mutations with mandatory toasts
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({
      memberId,
      permissions,
    }: {
      memberId: number
      permissions: WorkspacePermissions
    }) => {
      return updateMemberPermissionsRecord(memberId, permissions)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) =>
          old?.map((m) => (m.id === updated.id ? updated : m)) ?? [updated]
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      void queryClient.invalidateQueries({
        queryKey: memberKeys.myPermissions(workspaceId, updated.user_id),
      })
      toast.success("Permissions updated", {
        description: "Member permissions have been updated successfully.",
      })
    },
    onError: (err) => {
      toast.error("Failed to update permissions", {
        description: (err as Error).message || "An unexpected error occurred.",
      })
    },
  })

  const revokeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return revokeMemberRecord(memberId)
    },
    onSuccess: (_, memberId) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) =>
          old?.map((m) =>
            m.id === memberId
              ? { ...m, revoked_at: new Date().toISOString() }
              : m
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      toast.success("Member access revoked", {
        description: "The collaborator's access to this workspace has been revoked.",
      })
    },
    onError: (err) => {
      toast.error("Failed to revoke member", {
        description: (err as Error).message || "Unable to revoke access.",
      })
    },
  })

  const restoreMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return restoreMemberRecord(memberId)
    },
    onSuccess: (_, memberId) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) =>
          old?.map((m) =>
            m.id === memberId ? { ...m, revoked_at: null } : m
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      toast.success("Member access restored", {
        description: "The collaborator can access the workspace again.",
      })
    },
    onError: (err) => {
      toast.error("Failed to restore member", {
        description: (err as Error).message || "Unable to restore access.",
      })
    },
  })

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return deleteMemberRecord(memberId)
    },
    onSuccess: (_, memberId) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) => old?.filter((m) => m.id !== memberId) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      toast.success("Member deleted", {
        description: "The collaborator record has been permanently deleted.",
      })
    },
    onError: (err) => {
      toast.error("Failed to delete member", {
        description: (err as Error).message || "Unable to delete member.",
      })
    },
  })

  const batchRevokeMutation = useMutation({
    mutationFn: async (memberIds: number[]) => {
      return batchRevokeMemberRecords(memberIds)
    },
    onSuccess: (_, memberIds) => {
      const nowIso = new Date().toISOString()
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) =>
          old?.map((m) =>
            memberIds.includes(m.id) ? { ...m, revoked_at: nowIso } : m
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      toast.success("Members revoked", {
        description: `${memberIds.length} collaborators have been revoked.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to batch revoke", {
        description: (err as Error).message || "Unable to revoke members.",
      })
    },
  })

  const batchRestoreMutation = useMutation({
    mutationFn: async (memberIds: number[]) => {
      return batchRestoreMemberRecords(memberIds)
    },
    onSuccess: (_, memberIds) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) =>
          old?.map((m) =>
            memberIds.includes(m.id) ? { ...m, revoked_at: null } : m
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      toast.success("Members restored", {
        description: `${memberIds.length} collaborators have been restored.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to batch restore", {
        description: (err as Error).message || "Unable to restore members.",
      })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (memberIds: number[]) => {
      return batchDeleteMemberRecords(memberIds)
    },
    onSuccess: (_, memberIds) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        memberKeys.list(workspaceId),
        (old) => old?.filter((m) => !memberIds.includes(m.id)) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(workspaceId),
      })
      toast.success("Members deleted", {
        description: `${memberIds.length} collaborators permanently deleted.`,
      })
    },
    onError: (err) => {
      toast.error("Failed to batch delete", {
        description: (err as Error).message || "Unable to delete members.",
      })
    },
  })

  // Format owner + collaborators using workspace_members.profile & Clerk (memoized for referential stability)
  const membersWithProfiles: WorkspaceMemberProfile[] = useMemo(() => {
    const list: WorkspaceMemberProfile[] = []

    // Check if owner is already present in rawMembers
    const ownerMemberInRaw = rawMembers.find(
      (m) => activeWorkspace && m.user_id === activeWorkspace.owner_id
    )

    // Add synthesized Owner entry if owner row is not yet in rawMembers
    if (activeWorkspace && !ownerMemberInRaw) {
      const isCurrentUserOwner = Boolean(
        user && activeWorkspace.owner_id === user.id
      )

      const ownerName = isCurrentUserOwner
        ? user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          "You (Workspace Owner)"
        : "Workspace Owner"

      const ownerEmail = isCurrentUserOwner
        ? user?.primaryEmailAddress?.emailAddress || "owner@kaizen.app"
        : "owner@kaizen.app"

      const ownerAvatar = isCurrentUserOwner ? user?.imageUrl : undefined

      const ownerInitials =
        isCurrentUserOwner && user?.firstName
          ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
          : "OW"

      list.push({
        id: -1,
        workspaceId: activeWorkspace.id,
        userId: activeWorkspace.owner_id,
        displayName: ownerName,
        email: ownerEmail,
        avatarUrl: ownerAvatar,
        initials: ownerInitials,
        role: "Owner",
        permissions: OWNER_PERMISSIONS,
        createdAt: activeWorkspace.created_at,
        updatedAt: activeWorkspace.updated_at,
        revokedAt: null,
        isCurrentUser: isCurrentUserOwner,
      })
    }

    // Add members from rawMembers, populating profile directly from m.profile
    for (const m of rawMembers) {
      const isOwner = Boolean(activeWorkspace && m.user_id === activeWorkspace.owner_id)
      const isCurrentUser = Boolean(user && m.user_id === user.id)
      const memberStoredProfile = m.profile as MemberProfileData | undefined

      const displayName = isCurrentUser
        ? user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          (isOwner ? "You (Workspace Owner)" : "You")
        : memberStoredProfile?.displayName ||
          (isOwner ? "Workspace Owner" : `User ${m.user_id.slice(-6)}`)

      const email = isCurrentUser
        ? user?.primaryEmailAddress?.emailAddress ||
          (isOwner ? "owner@kaizen.app" : "collaborator@kaizen.app")
        : memberStoredProfile?.email ||
          (isOwner ? "owner@kaizen.app" : `user-${m.user_id.slice(-6)}@kaizen.app`)

      const avatarUrl = isCurrentUser
        ? user?.imageUrl
        : memberStoredProfile?.avatarUrl

      const computedMemberInitials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")

      const initials =
        isCurrentUser && user?.firstName
          ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
          : memberStoredProfile?.initials ||
            computedMemberInitials ||
            m.user_id.slice(-2).toUpperCase()

      list.push({
        id: isOwner ? -1 : m.id,
        workspaceId: m.workspace_id,
        userId: m.user_id,
        displayName,
        email,
        avatarUrl,
        initials,
        role: isOwner ? "Owner" : "Member",
        permissions: isOwner ? OWNER_PERMISSIONS : m.permissions,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        revokedAt: m.revoked_at,
        isCurrentUser,
      })
    }

    return list
  }, [activeWorkspace, user, rawMembers])

  // Map of userId -> profile for external consumer components
  const memberProfilesMap = useMemo<Record<string, MemberProfileData>>(() => {
    const map: Record<string, MemberProfileData> = {}
    for (const m of membersWithProfiles) {
      map[m.userId] = {
        displayName: m.displayName,
        email: m.email,
        avatarUrl: m.avatarUrl,
        initials: m.initials,
      }
    }
    return map
  }, [membersWithProfiles])

  return {
    members: membersWithProfiles,
    rawMembers,
    activeWorkspace,
    isLoading,
    error: error ? (error as Error).message : null,
    updatePermissions: (memberId: number, permissions: WorkspacePermissions) =>
      updatePermissionsMutation.mutateAsync({ memberId, permissions }),
    revokeMember: (memberId: number) =>
      revokeMemberMutation.mutateAsync(memberId),
    restoreMember: (memberId: number) =>
      restoreMemberMutation.mutateAsync(memberId),
    deleteMember: (memberId: number) =>
      deleteMemberMutation.mutateAsync(memberId),
    batchRevokeMembers: (memberIds: number[]) =>
      batchRevokeMutation.mutateAsync(memberIds),
    batchRestoreMembers: (memberIds: number[]) =>
      batchRestoreMutation.mutateAsync(memberIds),
    batchDeleteMembers: (memberIds: number[]) =>
      batchDeleteMutation.mutateAsync(memberIds),
    isUpdating: updatePermissionsMutation.isPending,
    isRevoking: revokeMemberMutation.isPending,
    isRestoring: restoreMemberMutation.isPending,
    isDeleting: deleteMemberMutation.isPending,
    isBatchOperating:
      batchRevokeMutation.isPending ||
      batchRestoreMutation.isPending ||
      batchDeleteMutation.isPending,
    refreshMembers,
    memberProfiles: memberProfilesMap,
  }
}

/**
 * Lightweight hook to get resolved member profiles for the active workspace.
 * Backed by TanStack React Query cache (0ms lookup).
 */
export function useWorkspaceMemberProfiles(): Record<string, MemberProfileData> {
  const { memberProfiles } = useWorkspaceMembers()
  return memberProfiles
}
