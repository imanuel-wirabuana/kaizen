import { supabase } from "@/services/supabase/client"
import type { Zen, CreateZenInput, UpdateZenInput } from "@/types/zen"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface ZenRealtimeHandlers {
  onInsert: (zen: Zen) => void
  onUpdate: (zen: Zen) => void
  onDelete: (id: number) => void
}

/**
 * Fetch all Zens for a given workspace.
 */
export async function fetchWorkspaceZens(workspaceId: number): Promise<Zen[]> {
  if (!workspaceId) return []

  const { data, error } = await supabase
    .from("zens")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch zens: ${error.message}`)
  }

  return (data as Zen[]) || []
}

/**
 * Insert a new Zen record.
 */
export async function createZenRecord({
  workspaceId,
  ownerId,
  name,
  description,
  settings = {},
}: CreateZenInput): Promise<Zen> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Zen name cannot be empty")
  }

  const { data, error } = await supabase
    .from("zens")
    .insert({
      workspace_id: workspaceId,
      owner_id: ownerId,
      name: trimmedName,
      description: description?.trim() || null,
      settings,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create zen: ${error.message}`)
  }

  return data as Zen
}

/**
 * Update an existing Zen record.
 */
export async function updateZenRecord(
  id: number,
  updates: UpdateZenInput
): Promise<Zen> {
  const { data, error } = await supabase
    .from("zens")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update zen: ${error.message}`)
  }

  return data as Zen
}

/**
 * Soft-delete (archive) a Zen record.
 */
export async function archiveZenRecord(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("zens")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to archive zen: ${error.message}`)
  }

  return true
}

/**
 * Restore an archived Zen record.
 */
export async function restoreZenRecord(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("zens")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to restore zen: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete a Zen record.
 */
export async function deleteZenRecord(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("zens")
    .delete()
    .eq("id", id)
    .not("archived_at", "is", null)

  if (error) {
    throw new Error(`Failed to delete zen: ${error.message}`)
  }

  return true
}

/**
 * Soft-delete (archive) multiple Zen records in batch.
 */
export async function batchArchiveZenRecords(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("zens")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch archive zens: ${error.message}`)
  }

  return true
}

/**
 * Restore multiple archived Zen records in batch.
 */
export async function batchRestoreZenRecords(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("zens")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch restore zens: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete multiple archived Zen records in batch.
 */
export async function batchDeleteZenRecords(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("zens")
    .delete()
    .in("id", ids)
    .not("archived_at", "is", null)

  if (error) {
    throw new Error(`Failed to batch delete zens: ${error.message}`)
  }

  return true
}

/**
 * Soft-delete then permanently delete multiple Zen records.
 */
export async function batchArchiveAndDeleteZenRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true
  await batchArchiveZenRecords(ids)
  return batchDeleteZenRecords(ids)
}

let activeChannel: RealtimeChannel | null = null
let currentWorkspaceId: number | null = null
const activeHandlers = new Set<ZenRealtimeHandlers>()

/**
 * Idempotent, reference-counted Realtime subscription for workspace zens.
 * Reuses the single active channel across multiple components.
 */
export function subscribeToZenChanges(
  workspaceId: number,
  handlers: ZenRealtimeHandlers
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
    (c) => c.topic === `realtime:zens:${workspaceId}`
  )
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`zens:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "zens",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newZen = payload.new as Zen
          for (const h of activeHandlers) {
            h.onInsert(newZen)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedZen = payload.new as Zen
          for (const h of activeHandlers) {
            h.onUpdate(updatedZen)
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
