import { supabase } from "@/services/supabase/client"
import type { WorkspaceMember, WorkspacePermissions } from "@/types/member"
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
  userId: string
  displayName: string
  email: string
  avatarUrl?: string
}

/**
 * Synchronize user profile (name, email, avatar) to workspace settings and member records.
 * This allows all collaborators and owners to see real names and avatars across the workspace.
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

  const userProfile: UserProfileData = {
    userId: user.id,
    displayName,
    email,
    avatarUrl,
  }

  try {
    // 1. Fetch current workspace settings
    const { data: wsData } = await supabase
      .from("workspaces")
      .select("settings, owner_id")
      .eq("id", workspaceId)
      .maybeSingle()

    if (wsData) {
      const currentSettings = (wsData.settings as Record<string, unknown>) || {}
      const existingProfiles =
        (currentSettings.profiles as Record<string, UserProfileData>) || {}
      const existingProfile = existingProfiles[user.id]

      const needsProfileUpdate =
        !existingProfile ||
        existingProfile.displayName !== displayName ||
        existingProfile.email !== email ||
        existingProfile.avatarUrl !== avatarUrl

      if (needsProfileUpdate) {
        const nextSettings: Record<string, unknown> = {
          ...currentSettings,
          profiles: {
            ...existingProfiles,
            [user.id]: userProfile,
          },
        }

        if (isOwner || wsData.owner_id === user.id) {
          nextSettings.owner_profile = userProfile
        }

        await supabase
          .from("workspaces")
          .update({ settings: nextSettings })
          .eq("id", workspaceId)
      }
    }

    // 2. If member, also sync into workspace_members.permissions._profile
    if (!isOwner) {
      const { data: memberRow } = await supabase
        .from("workspace_members")
        .select("id, permissions")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle()

      if (memberRow) {
        const currentPerms = (memberRow.permissions as Record<string, unknown>) || {}
        const currentStoredProfile = currentPerms._profile as
          | UserProfileData
          | undefined
        if (
          !currentStoredProfile ||
          currentStoredProfile.displayName !== displayName ||
          currentStoredProfile.email !== email ||
          currentStoredProfile.avatarUrl !== avatarUrl
        ) {
          await supabase
            .from("workspace_members")
            .update({
              permissions: {
                ...currentPerms,
                _profile: userProfile,
              },
            })
            .eq("id", memberRow.id)
        }
      }
    }
  } catch (err) {
    console.warn("Could not sync user profile to workspace:", err)
  }
}

