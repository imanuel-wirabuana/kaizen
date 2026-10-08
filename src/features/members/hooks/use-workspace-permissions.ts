import { useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/services/supabase/client"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import { fetchMyMemberRecord } from "@/features/members/services/member-service"
import { memberKeys } from "@/features/members/services/member-keys"
import {
  OWNER_PERMISSIONS,
  type PermissionAction,
  type PermissionResource,
  type WorkspaceMember,
  type WorkspacePermissions,
} from "@/types/member"

const NO_PERMISSIONS: WorkspacePermissions = {
  workspace: { read: false, update: false },
  zenbox: { read: false, create: false, update: false, delete: false },
  boards: { read: false, create: false, update: false, delete: false },
  calendars: { read: false, create: false, update: false, delete: false },
  assistant: { read: false, create: false, update: false, delete: false },
  members: { read: false, create: false, update: false, delete: false },
}

export function useWorkspacePermissions(explicitWorkspaceId?: number | null) {
  const { user, isLoaded: isUserLoaded } = useUser()
  const activeWorkspace = useActiveWorkspace()

  const workspaceId = explicitWorkspaceId ?? activeWorkspace?.id ?? null
  const isOwner = Boolean(
    activeWorkspace && user && activeWorkspace.owner_id === user.id
  )

  const {
    data: memberRecord,
    isLoading: isMemberLoading,
    error: memberError,
  } = useQuery({
    queryKey: memberKeys.myPermissions(workspaceId, user?.id),
    queryFn: () => fetchMyMemberRecord(workspaceId!, user!.id),
    enabled: Boolean(
      isUserLoaded &&
        user &&
        workspaceId &&
        !isOwner // Skip DB query if user is already verified owner
    ),
    staleTime: 1000 * 60 * 5, // 5 minutes warm cache
  })

  // Realtime subscription for instantaneous permission updates
  useEffect(() => {
    if (!workspaceId || !user?.id || isOwner) return

    const channelTopic = `user_permissions:${workspaceId}:${user.id}`
    const staleChannels = supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:${channelTopic}`)
    for (const stale of staleChannels) {
      void supabase.removeChannel(stale)
    }

    const channel = supabase
      .channel(channelTopic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as WorkspaceMember
            if (updated.workspace_id === workspaceId) {
              queryClient.setQueryData<WorkspaceMember | null>(
                memberKeys.myPermissions(workspaceId, user.id),
                updated
              )
              void queryClient.invalidateQueries({
                queryKey: memberKeys.myPermissions(workspaceId, user.id),
              })
            }
          } else if (payload.eventType === "DELETE") {
            queryClient.setQueryData<WorkspaceMember | null>(
              memberKeys.myPermissions(workspaceId, user.id),
              null
            )
            void queryClient.invalidateQueries({
              queryKey: memberKeys.myPermissions(workspaceId, user.id),
            })
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [workspaceId, user?.id, isOwner])

  const isMember = Boolean(
    isOwner || (memberRecord && !memberRecord.revoked_at)
  )

  const permissions: WorkspacePermissions = isOwner
    ? OWNER_PERMISSIONS
    : memberRecord && !memberRecord.revoked_at
      ? memberRecord.permissions
      : NO_PERMISSIONS

  const can = <T extends PermissionResource>(
    resource: T,
    action: PermissionAction<T>
  ): boolean => {
    if (!user || !workspaceId) return false
    if (isOwner) return true

    const resourcePerms = permissions[resource]
    if (!resourcePerms) return false

    // Action check
    return Boolean((resourcePerms as unknown as Record<string, boolean>)[action])
  }

  return {
    isOwner,
    isMember,
    permissions,
    can,
    canRead: (resource: PermissionResource): boolean => {
      if (!user || !workspaceId) return false
      if (isOwner) return true
      return Boolean(permissions[resource]?.read)
    },
    canCreate: (resource: Exclude<PermissionResource, "workspace">): boolean => {
      if (!user || !workspaceId) return false
      if (isOwner) return true
      return Boolean(permissions[resource]?.create)
    },
    canUpdate: (resource: PermissionResource): boolean => {
      if (!user || !workspaceId) return false
      if (isOwner) return true
      return Boolean(permissions[resource]?.update)
    },
    canDelete: (resource: Exclude<PermissionResource, "workspace">): boolean => {
      if (!user || !workspaceId) return false
      if (isOwner) return true
      return Boolean(permissions[resource]?.delete)
    },
    isLoading: !isUserLoaded || (!isOwner && isMemberLoading),
    error: memberError ? (memberError as Error).message : null,
  }
}
