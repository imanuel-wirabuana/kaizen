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
  subscribeToMemberChanges,
  syncWorkspaceUserProfile,
  type UserProfileData,
} from "@/features/members/services/member-service"
import { memberKeys } from "@/features/members/services/member-keys"
import {
  OWNER_PERMISSIONS,
  type WorkspaceMember,
  type WorkspaceMemberProfile,
  type WorkspacePermissions,
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

  // Auto-sync current user's profile to workspace settings in background
  useEffect(() => {
    if (!workspaceId || !user) return
    const isOwner = Boolean(
      activeWorkspace && activeWorkspace.owner_id === user.id
    )
    void syncWorkspaceUserProfile({ workspaceId, user, isOwner })
  }, [workspaceId, user, activeWorkspace])

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

  // Format owner + collaborators (memoized for referential stability)
  const membersWithProfiles: WorkspaceMemberProfile[] = useMemo(() => {
    const list: WorkspaceMemberProfile[] = []

    // Add Owner entry
    if (activeWorkspace) {
      const isCurrentUserOwner = Boolean(
        user && activeWorkspace.owner_id === user.id
      )
      const settings = (activeWorkspace.settings as Record<string, unknown>) || {}
      const profiles =
        (settings.profiles as Record<string, UserProfileData>) || {}
      const ownerStoredProfile =
        (settings.owner_profile as UserProfileData | undefined) ||
        profiles[activeWorkspace.owner_id]

      const ownerName = isCurrentUserOwner
        ? user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          "You (Workspace Owner)"
        : ownerStoredProfile?.displayName || "Workspace Owner"

      const ownerEmail = isCurrentUserOwner
        ? user?.primaryEmailAddress?.emailAddress || "owner@kaizen.app"
        : ownerStoredProfile?.email || "owner@kaizen.app"

      const ownerAvatar = isCurrentUserOwner
        ? user?.imageUrl
        : ownerStoredProfile?.avatarUrl

      const computedOwnerInitials = ownerName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")

      const ownerInitials =
        isCurrentUserOwner && user?.firstName
          ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
          : computedOwnerInitials || "OW"

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

    // Add Member rows
    for (const m of rawMembers) {
      const isCurrentUser = Boolean(user && m.user_id === user.id)
      const settings = (activeWorkspace?.settings as Record<string, unknown>) || {}
      const profiles =
        (settings.profiles as Record<string, UserProfileData>) || {}
      const perms = (m.permissions as unknown as Record<string, unknown>) || {}
      const memberStoredProfile =
        (perms._profile as UserProfileData | undefined) || profiles[m.user_id]

      const displayName = isCurrentUser
        ? user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          "You"
        : memberStoredProfile?.displayName || `User ${m.user_id.slice(-6)}`

      const email = isCurrentUser
        ? user?.primaryEmailAddress?.emailAddress || "collaborator@kaizen.app"
        : memberStoredProfile?.email || `user-${m.user_id.slice(-6)}@kaizen.app`

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
          : computedMemberInitials || m.user_id.slice(-2).toUpperCase()

      list.push({
        id: m.id,
        workspaceId: m.workspace_id,
        userId: m.user_id,
        displayName,
        email,
        avatarUrl,
        initials,
        role: "Member",
        permissions: m.permissions,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        revokedAt: m.revoked_at,
        isCurrentUser,
      })
    }

    return list
  }, [activeWorkspace, user, rawMembers])

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
    isUpdating: updatePermissionsMutation.isPending,
    isRevoking: revokeMemberMutation.isPending,
    refreshMembers,
  }
}
