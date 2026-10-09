import { supabase } from "@/services/supabase/client"
import type {
  WorkspaceInvite,
  CreateInviteInput,
  WorkspaceMember,
  WorkspacePermissions,
} from "@/types/member"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface InviteRealtimeHandlers {
  onInsert: (invite: WorkspaceInvite) => void
  onUpdate: (invite: WorkspaceInvite) => void
  onDelete: (id: number) => void
}

export interface VerifiedInviteResult {
  invite: WorkspaceInvite
  workspace: {
    id: number
    name: string
    description: string | null
    owner_id: string
  }
  isAlreadyMember?: boolean
  isAlreadyOwner?: boolean
}

/**
 * Generate a clean, random uppercase alphanumeric invite code.
 * Format: KZ-XXXX-YYYY (e.g., KZ-8H2K-9P4W)
 */
export function generateRandomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing chars 0, O, 1, I
  let part1 = ""
  let part2 = ""
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `KZ-${part1}-${part2}`
}

/**
 * Extract clean invite code from raw code or full URL string.
 */
export function extractInviteCode(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""

  // Case 1: Full URL with ?invite= or /join/ or /invite/
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed)
      const queryCode =
        url.searchParams.get("code") || url.searchParams.get("invite")
      if (queryCode) return queryCode.trim()

      const pathSegments = url.pathname.split("/").filter(Boolean)
      const joinIndex = pathSegments.findIndex((p) => p === "join" || p === "invite")
      if (joinIndex >= 0 && pathSegments[joinIndex + 1]) {
        return pathSegments[joinIndex + 1].trim()
      }
    }
  } catch {
    // Not a valid URL, treat as raw code
  }

  // Case 2: Raw code
  return trimmed
}

/**
 * Fetch all invites for a given workspace.
 */
export async function fetchWorkspaceInvites(
  workspaceId: number
): Promise<WorkspaceInvite[]> {
  if (!workspaceId) return []

  const { data, error } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch workspace invites: ${error.message}`)
  }

  return (data as WorkspaceInvite[]) || []
}

/**
 * Create a new workspace invite record.
 */
export async function createWorkspaceInviteRecord(
  input: CreateInviteInput
): Promise<WorkspaceInvite> {
  const code = generateRandomInviteCode()

  const { data, error } = await supabase
    .from("workspace_invites")
    .insert({
      workspace_id: input.workspaceId,
      owner_id: input.ownerId,
      code,
      permissions: input.permissions,
      max_uses: input.maxUses ?? 1,
      use_count: 0,
      expired_at: input.expiredAt || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create workspace invite: ${error.message}`)
  }

  return data as WorkspaceInvite
}

/**
 * Verify an invite code and retrieve its workspace information.
 */
export async function verifyInviteCode(
  rawCode: string,
  currentUserId?: string
): Promise<VerifiedInviteResult> {
  const code = extractInviteCode(rawCode)
  if (!code) {
    throw new Error("Please enter an invite code.")
  }

  // 1. Fetch invite
  const { data: inviteData, error: inviteError } = await supabase
    .from("workspace_invites")
    .select("*, workspace:workspaces(id, name, description, owner_id)")
    .eq("code", code)
    .maybeSingle()

  if (inviteError || !inviteData) {
    throw new Error("Invite code not found or invalid.")
  }

  const invite = inviteData as unknown as WorkspaceInvite & {
    workspace: {
      id: number
      name: string
      description: string | null
      owner_id: string
    }
  }

  // 2. Check if revoked
  if (invite.revoked_at) {
    throw new Error("This invite code has been revoked by the workspace owner.")
  }

  // 3. Check expiration
  if (invite.expired_at) {
    const expiresAt = new Date(invite.expired_at).getTime()
    if (expiresAt < Date.now()) {
      throw new Error("This invite code has expired.")
    }
  }

  // 4. Check if current user is already the owner or active member
  let isAlreadyOwner = false
  let isAlreadyMember = false

  if (currentUserId) {
    if (invite.workspace.owner_id === currentUserId) {
      isAlreadyOwner = true
      isAlreadyMember = true
    } else {
      const { data: memberRow } = await supabase
        .from("workspace_members")
        .select("id, revoked_at")
        .eq("workspace_id", invite.workspace_id)
        .eq("user_id", currentUserId)
        .maybeSingle()

      if (memberRow && !memberRow.revoked_at) {
        isAlreadyMember = true
      }
    }
  }

  // 5. Check max uses ONLY if the user is not already an active member or owner
  const maxUsesNum = Number(invite.max_uses) || 0
  const useCountNum = Number(invite.use_count) || 0
  if (!isAlreadyMember && maxUsesNum > 0 && useCountNum >= maxUsesNum) {
    throw new Error("This invite code has reached its maximum usage limit.")
  }

  return {
    invite: {
      id: invite.id,
      workspace_id: invite.workspace_id,
      owner_id: invite.owner_id,
      code: invite.code,
      permissions: invite.permissions,
      max_uses: maxUsesNum,
      use_count: useCountNum,
      created_at: invite.created_at,
      expired_at: invite.expired_at,
      revoked_at: invite.revoked_at,
    },
    workspace: invite.workspace,
    isAlreadyMember,
    isAlreadyOwner,
  }
}

/**
 * Accept an invite code and join the workspace.
 */
export async function acceptWorkspaceInviteRecord(
  rawCode: string,
  userId: string
): Promise<{ success: boolean; workspaceId: number; member: WorkspaceMember }> {
  if (!userId) {
    throw new Error("You must be logged in to join a workspace.")
  }

  // 1. Verify invite with userId
  const { invite, workspace, isAlreadyOwner } =
    await verifyInviteCode(rawCode, userId)

  // 2. Check if user is already the owner
  if (workspace.owner_id === userId || isAlreadyOwner) {
    throw new Error("You are already the owner of this workspace.")
  }

  // 3. Check if user is already an active member
  const { data: existingMember, error: checkError } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", userId)
    .maybeSingle()

  if (checkError) {
    throw new Error(`Failed to verify membership: ${checkError.message}`)
  }

  let finalMember: WorkspaceMember

  if (existingMember) {
    if (!existingMember.revoked_at) {
      // Already an active member
      return {
        success: true,
        workspaceId: invite.workspace_id,
        member: existingMember as WorkspaceMember,
      }
    }

    // Re-activate previously revoked member with invite's permissions
    const { data: updatedMember, error: updateError } = await supabase
      .from("workspace_members")
      .update({
        permissions: invite.permissions,
        revoked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingMember.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to restore membership: ${updateError.message}`)
    }
    finalMember = updatedMember as WorkspaceMember
  } else {
    // Insert new member row
    const { data: newMember, error: insertError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        permissions: invite.permissions,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to join workspace: ${insertError.message}`)
    }
    finalMember = newMember as WorkspaceMember
  }

  // 4. Increment invite use_count
  const nextCount = (Number(invite.use_count) || 0) + 1
  await supabase
    .from("workspace_invites")
    .update({
      use_count: nextCount,
    })
    .eq("id", invite.id)

  return {
    success: true,
    workspaceId: invite.workspace_id,
    member: finalMember,
  }
}

/**
 * Revoke an active invite code.
 */
export async function revokeInviteRecord(inviteId: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_invites")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq("id", inviteId)

  if (error) {
    throw new Error(`Failed to revoke invite: ${error.message}`)
  }

  return true
}

/**
 * Update permissions configured for an invite code.
 */
export async function updateInvitePermissionsRecord(
  inviteId: number,
  permissions: WorkspacePermissions
): Promise<WorkspaceInvite> {
  return updateInviteRecord(inviteId, { permissions })
}

/**
 * Update invite settings and permissions.
 */
export async function updateInviteRecord(
  inviteId: number,
  updates: {
    permissions?: WorkspacePermissions
    maxUses?: number
    expiredAt?: string | null
  }
): Promise<WorkspaceInvite> {
  const updatePayload: Record<string, unknown> = {}
  if (updates.permissions !== undefined) {
    updatePayload.permissions = updates.permissions
  }
  if (updates.maxUses !== undefined) {
    updatePayload.max_uses = updates.maxUses
  }
  if (updates.expiredAt !== undefined) {
    updatePayload.expired_at = updates.expiredAt
  }

  const { data, error } = await supabase
    .from("workspace_invites")
    .update(updatePayload)
    .eq("id", inviteId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update invite: ${error.message}`)
  }

  return data as WorkspaceInvite
}

let activeInviteChannel: RealtimeChannel | null = null
let currentInviteWorkspaceId: number | null = null
const activeInviteHandlers = new Set<InviteRealtimeHandlers>()

/**
 * Subscribe to realtime Postgres changes on workspace_invites for a workspace.
 */
export function subscribeToInviteChanges(
  workspaceId: number,
  handlers: InviteRealtimeHandlers
): () => void {
  activeInviteHandlers.add(handlers)

  if (activeInviteChannel && currentInviteWorkspaceId === workspaceId) {
    return () => {
      activeInviteHandlers.delete(handlers)
      if (activeInviteHandlers.size === 0 && activeInviteChannel) {
        void supabase.removeChannel(activeInviteChannel)
        activeInviteChannel = null
        currentInviteWorkspaceId = null
      }
    }
  }

  if (activeInviteChannel) {
    void supabase.removeChannel(activeInviteChannel)
    activeInviteChannel = null
  }

  currentInviteWorkspaceId = workspaceId

  const staleChannels = supabase.getChannels().filter(
    (c) => c.topic === `realtime:workspace_invites:${workspaceId}`
  )
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`workspace_invites:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspace_invites",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newInvite = payload.new as WorkspaceInvite
          for (const h of activeInviteHandlers) {
            h.onInsert(newInvite)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedInvite = payload.new as WorkspaceInvite
          for (const h of activeInviteHandlers) {
            h.onUpdate(updatedInvite)
          }
        } else if (payload.eventType === "DELETE") {
          const oldRecord = payload.old as { id: number }
          for (const h of activeInviteHandlers) {
            h.onDelete(oldRecord.id)
          }
        }
      }
    )
    .subscribe()

  activeInviteChannel = channel

  return () => {
    activeInviteHandlers.delete(handlers)
    if (activeInviteHandlers.size === 0 && activeInviteChannel) {
      void supabase.removeChannel(activeInviteChannel)
      activeInviteChannel = null
      currentInviteWorkspaceId = null
    }
  }
}

/**
 * Restore a revoked invite record.
 */
export async function restoreInviteRecord(inviteId: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_invites")
    .update({
      revoked_at: null,
    })
    .eq("id", inviteId)

  if (error) {
    throw new Error(`Failed to restore invite: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete an invite record that has already been revoked.
 */
export async function deleteInviteRecord(inviteId: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId)
    .not("revoked_at", "is", null)

  if (error) {
    throw new Error(`Failed to delete invite: ${error.message}`)
  }

  return true
}

/**
 * Revoke multiple invite records in batch.
 */
export async function batchRevokeInviteRecords(
  inviteIds: number[]
): Promise<boolean> {
  if (inviteIds.length === 0) return true

  const { error } = await supabase
    .from("workspace_invites")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .in("id", inviteIds)

  if (error) {
    throw new Error(`Failed to batch revoke invites: ${error.message}`)
  }

  return true
}

/**
 * Restore multiple revoked invite records in batch.
 */
export async function batchRestoreInviteRecords(
  inviteIds: number[]
): Promise<boolean> {
  if (inviteIds.length === 0) return true

  const { error } = await supabase
    .from("workspace_invites")
    .update({
      revoked_at: null,
    })
    .in("id", inviteIds)

  if (error) {
    throw new Error(`Failed to batch restore invites: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete multiple invite records that have already been revoked.
 */
export async function batchDeleteInviteRecords(
  inviteIds: number[]
): Promise<boolean> {
  if (inviteIds.length === 0) return true

  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .in("id", inviteIds)
    .not("revoked_at", "is", null)

  if (error) {
    throw new Error(`Failed to batch delete invites: ${error.message}`)
  }

  return true
}
