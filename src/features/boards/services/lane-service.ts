import { supabase } from "@/services/supabase/client"
import type {
  Lane,
  CreateLaneInput,
  UpdateLaneInput,
  LanePositionUpdate,
} from "@/types/lane"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface LaneRealtimeHandlers {
  onInsert: (lane: Lane) => void
  onUpdate: (lane: Lane) => void
  onDelete: (id: number) => void
}

/**
 * Fetch all active lanes for a given board ordered by position ascending.
 */
export async function fetchBoardLanes(boardId: number): Promise<Lane[]> {
  if (!boardId) return []

  const { data, error } = await supabase
    .from("lanes")
    .select("*")
    .eq("board_id", boardId)
    .is("archived_at", null)
    .order("position", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch lanes: ${error.message}`)
  }

  return (data as Lane[]) || []
}

/**
 * Insert a new Lane record.
 */
export async function createLaneRecord({
  boardId,
  ownerId,
  name,
  description,
  settings = {},
  position = 0,
}: CreateLaneInput): Promise<Lane> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Lane name cannot be empty")
  }

  const { data, error } = await supabase
    .from("lanes")
    .insert({
      board_id: boardId,
      owner_id: ownerId,
      name: trimmedName,
      description: description?.trim() || null,
      settings,
      position,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create lane: ${error.message}`)
  }

  return data as Lane
}

/**
 * Update an existing Lane record.
 */
export async function updateLaneRecord(
  id: number,
  updates: UpdateLaneInput
): Promise<Lane> {
  if (!id) {
    throw new Error("Lane ID is required")
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim()
    if (!trimmed) {
      throw new Error("Lane name cannot be empty")
    }
    payload.name = trimmed
  }

  if (updates.description !== undefined) {
    payload.description = updates.description?.trim() || null
  }

  if (updates.settings !== undefined) {
    payload.settings = updates.settings
  }

  if (updates.position !== undefined) {
    payload.position = updates.position
  }

  const { data, error } = await supabase
    .from("lanes")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update lane: ${error.message}`)
  }

  return data as Lane
}

/**
 * Batch update lane positions (after drag-and-drop column reordering).
 */
export async function batchUpdateLanePositions(
  updates: LanePositionUpdate[]
): Promise<boolean> {
  if (updates.length === 0) return true

  const promises = updates.map((item) =>
    supabase
      .from("lanes")
      .update({
        position: item.position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
  )

  const results = await Promise.all(promises)
  for (const res of results) {
    if (res.error) {
      throw new Error(`Failed to persist column position: ${res.error.message}`)
    }
  }

  return true
}

/**
 * Archive a Lane record (soft delete).
 */
export async function archiveLaneRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase
    .from("lanes")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to archive lane: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete a Lane record.
 */
export async function deleteLaneRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase.from("lanes").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete lane: ${error.message}`)
  }

  return true
}

let activeChannel: RealtimeChannel | null = null
let currentBoardId: number | null = null
const activeHandlers = new Set<LaneRealtimeHandlers>()

/**
 * Realtime subscription for board lanes.
 */
export function subscribeToLaneChanges(
  boardId: number,
  handlers: LaneRealtimeHandlers
): () => void {
  activeHandlers.add(handlers)

  if (activeChannel && currentBoardId === boardId) {
    return () => {
      activeHandlers.delete(handlers)
      if (activeHandlers.size === 0 && activeChannel) {
        void supabase.removeChannel(activeChannel)
        activeChannel = null
        currentBoardId = null
      }
    }
  }

  if (activeChannel) {
    void supabase.removeChannel(activeChannel)
    activeChannel = null
  }

  currentBoardId = boardId

  const staleChannels = supabase
    .getChannels()
    .filter((c) => c.topic === `realtime:lanes:${boardId}`)
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`lanes:${boardId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "lanes",
        filter: `board_id=eq.${boardId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newLane = payload.new as Lane
          for (const h of activeHandlers) {
            h.onInsert(newLane)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedLane = payload.new as Lane
          for (const h of activeHandlers) {
            h.onUpdate(updatedLane)
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
      currentBoardId = null
    }
  }
}
