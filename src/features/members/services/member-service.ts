import { supabase } from "@/services/supabase/client"
import type {
  WorkspaceMember,
  WorkspacePermissions,
  MemberProfileData,
} from "@/types/member"
import { OWNER_PERMISSIONS } from "@/types/member"
import { queryClient } from "@/lib/query-client"
import { memberKeys } from "@/features/members/services/member-keys"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface MemberRealtimeHandlers {
  onInsert: (member: WorkspaceMember) => void
  onUpdate: (member: WorkspaceMember) => void
  onDelete: (id: number) => void
}

/**
 * Fetch all members for a given workspace.
 */
export async function fetchWorkspaceMembers(
  workspaceId: number
): Promise<WorkspaceMember[]> {
  if (!workspaceId) return []

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch workspace members: ${error.message}`)
  }

  return (data as WorkspaceMember[]) || []
}

/**
 * Fetch a specific user's active membership record in a workspace.
 */
export async function fetchMyMemberRecord(
  workspaceId: number,
  userId: string
): Promise<WorkspaceMember | null> {
  if (!workspaceId || !userId) return null

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch member permissions: ${error.message}`)
  }

  return (data as WorkspaceMember) || null
}

/**
 * Update a member's granular permissions.
 */
export async function updateMemberPermissionsRecord(
  memberId: number,
  permissions: WorkspacePermissions
): Promise<WorkspaceMember> {
  const { data, error } = await supabase
    .from("workspace_members")
    .update({
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update member permissions: ${error.message}`)
  }

  return data as WorkspaceMember
}

/**
 * Revoke a member's access (soft delete via revoked_at).
 */
export async function revokeMemberRecord(memberId: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_members")
    .update({
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)

  if (error) {
    throw new Error(`Failed to revoke member: ${error.message}`)
  }

  return true
}

let activeChannel: RealtimeChannel | null = null
let currentWorkspaceId: number | null = null
const activeHandlers = new Set<MemberRealtimeHandlers>()

/**
 * Subscribe to realtime Postgres changes on workspace_members for a workspace.
 */
export function subscribeToMemberChanges(
  workspaceId: number,
  handlers: MemberRealtimeHandlers
): () => void {
  activeHandlers.add(handlers)

  if (activeChannel && currentWorkspaceId === workspaceId) {
    return () => {
      activeHandlers.delete(handlers)
      if (activeHandlers.size === 0 && activeChannel) {
        void supabase.removeChannel(activeChannel)
        activeChannel = null
        currentWorkspaceId = null
      }
    }
  }

  if (activeChannel) {
    void supabase.removeChannel(activeChannel)
    activeChannel = null
  }

  currentWorkspaceId = workspaceId

  const staleChannels = supabase.getChannels().filter(
    (c) => c.topic === `realtime:workspace_members:${workspaceId}`
  )
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`workspace_members:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspace_members",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newMember = payload.new as WorkspaceMember
          for (const h of activeHandlers) {
            h.onInsert(newMember)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedMember = payload.new as WorkspaceMember
          for (const h of activeHandlers) {
            h.onUpdate(updatedMember)
          }
        } else if (payload.eventType === "DELETE") {
          const oldRecord = payload.old as { id: number }
          for (const h of activeHandlers) {
            h.onDelete(oldRecord.id)
          }
        }
      }
    )
    .subscribe()

  activeChannel = channel

  return () => {
    activeHandlers.delete(handlers)
    if (activeHandlers.size === 0 && activeChannel) {
      void supabase.removeChannel(activeChannel)
      activeChannel = null
      currentWorkspaceId = null
    }
  }
}

export interface UserProfileData {
  userId?: string
  displayName: string
  email: string
  avatarUrl?: string
  initials?: string
  lastSeenAt?: string
}

/**
 * Silently synchronize user profile (name, email, avatar) to workspace_members.profile.
 * Ensures the member and owner profiles are always fresh and up-to-date with Clerk.
 */
export async function syncWorkspaceUserProfile({
  workspaceId,
  user,
  isOwner,
}: {
  workspaceId: number
  user: {
    id: string
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    imageUrl?: string | null
    primaryEmailAddress?: { emailAddress: string } | null
  }
  isOwner: boolean
}): Promise<void> {
  if (!workspaceId || !user?.id) return

  const displayName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User"
  const email = user.primaryEmailAddress?.emailAddress || ""
  const avatarUrl = user.imageUrl || undefined

  const computedInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

  const memberProfile: MemberProfileData = {
    displayName,
    email,
    avatarUrl,
    initials: computedInitials || user.id.slice(-2).toUpperCase(),
    lastSeenAt: new Date().toISOString(),
  }

  try {
    // 1. Fetch current membership record
    const { data: memberRow, error: fetchMemberError } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (fetchMemberError) {
      console.warn("Could not query workspace_members for profile sync:", fetchMemberError)
      return
    }

    if (memberRow) {
      const existing = (memberRow.profile as MemberProfileData | undefined) || {}
      const isProfileDifferent =
        existing.displayName !== memberProfile.displayName ||
        existing.email !== memberProfile.email ||
        existing.avatarUrl !== memberProfile.avatarUrl

      if (isProfileDifferent) {
        const { data: updatedMember, error: updateError } = await supabase
          .from("workspace_members")
          .update({
            profile: memberProfile,
            updated_at: new Date().toISOString(),
          })
          .eq("id", memberRow.id)
          .select()
          .single()

        if (!updateError && updatedMember) {
          queryClient.setQueryData<WorkspaceMember[]>(
            memberKeys.list(workspaceId),
            (old) =>
              old?.map((m) =>
                m.id === updatedMember.id ? (updatedMember as WorkspaceMember) : m
              ) ?? [updatedMember as WorkspaceMember]
          )
        }
      }
    } else if (isOwner) {
      // If user is workspace owner and doesn't have a membership row yet, insert one
      const { data: newOwnerMember, error: insertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          permissions: OWNER_PERMISSIONS,
          profile: memberProfile,
        })
        .select()
        .single()

      if (!insertError && newOwnerMember) {
        queryClient.setQueryData<WorkspaceMember[]>(
          memberKeys.list(workspaceId),
          (old) =>
            old
              ? [...old.filter((m) => m.id !== newOwnerMember.id), newOwnerMember as WorkspaceMember]
              : [newOwnerMember as WorkspaceMember]
        )
      }
    }

    // 2. Proactively clean legacy profiles/owner_profile from workspace.settings if present
    const { data: wsData } = await supabase
      .from("workspaces")
      .select("settings")
      .eq("id", workspaceId)
      .maybeSingle()

    if (wsData?.settings && typeof wsData.settings === "object") {
      const s = wsData.settings as Record<string, unknown>
      if ("owner_profile" in s || "profiles" in s) {
        const cleanSettings = { ...s }
        delete cleanSettings.owner_profile
        delete cleanSettings.profiles
        await supabase
          .from("workspaces")
          .update({ settings: cleanSettings })
          .eq("id", workspaceId)
      }
    }
  } catch (err) {
    console.warn("Silent background profile sync error:", err)
  }
}

/**
 * Restore a revoked member's access.
 */
export async function restoreMemberRecord(memberId: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_members")
    .update({
      revoked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)

  if (error) {
    throw new Error(`Failed to restore member: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete a member record that has already been revoked.
 */
export async function deleteMemberRecord(memberId: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .not("revoked_at", "is", null)

  if (error) {
    throw new Error(`Failed to delete member: ${error.message}`)
  }

  return true
}

/**
 * Revoke multiple members in batch.
 */
export async function batchRevokeMemberRecords(
  memberIds: number[]
): Promise<boolean> {
  if (memberIds.length === 0) return true

  const { error } = await supabase
    .from("workspace_members")
    .update({
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", memberIds)

  if (error) {
    throw new Error(`Failed to batch revoke members: ${error.message}`)
  }

  return true
}

/**
 * Restore multiple revoked members in batch.
 */
export async function batchRestoreMemberRecords(
  memberIds: number[]
): Promise<boolean> {
  if (memberIds.length === 0) return true

  const { error } = await supabase
    .from("workspace_members")
    .update({
      revoked_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", memberIds)

  if (error) {
    throw new Error(`Failed to batch restore members: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete multiple members that have already been revoked.
 */
export async function batchDeleteMemberRecords(
  memberIds: number[]
): Promise<boolean> {
  if (memberIds.length === 0) return true

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .in("id", memberIds)
    .not("revoked_at", "is", null)

  if (error) {
    throw new Error(`Failed to batch delete members: ${error.message}`)
  }

  return true
}

