import { supabase } from "@/services/supabase/client"
import type { Board, CreateBoardInput, UpdateBoardInput } from "@/types/board"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface BoardRealtimeHandlers {
  onInsert: (board: Board) => void
  onUpdate: (board: Board) => void
  onDelete: (id: number) => void
}

/**
 * Fetch all Boards for a given workspace.
 */
export async function fetchWorkspaceBoards(
  workspaceId: number
): Promise<Board[]> {
  if (!workspaceId) return []

  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch boards: ${error.message}`)
  }

  return (data as Board[]) || []
}

/**
 * Insert a new Board record.
 */
export async function createBoardRecord({
  workspaceId,
  ownerId,
  name,
  description,
  settings = {},
}: CreateBoardInput): Promise<Board> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Board name cannot be empty")
  }

  const { data, error } = await supabase
    .from("boards")
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
    throw new Error(`Failed to create board: ${error.message}`)
  }

  return data as Board
}

/**
 * Update an existing Board record.
 */
export async function updateBoardRecord(
  id: number,
  updates: UpdateBoardInput
): Promise<Board> {
  if (!id) {
    throw new Error("Board ID is required")
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim()
    if (!trimmed) {
      throw new Error("Board name cannot be empty")
    }
    payload.name = trimmed
  }

  if (updates.description !== undefined) {
    payload.description = updates.description?.trim() || null
  }

  if (updates.settings !== undefined) {
    payload.settings = updates.settings
  }

  const { data, error } = await supabase
    .from("boards")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update board: ${error.message}`)
  }

  return data as Board
}

/**
 * Soft-delete a Board by setting its archived_at timestamp.
 */
export async function archiveBoardRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase
    .from("boards")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to archive board: ${error.message}`)
  }

  return true
}

/**
 * Restore an archived Board by resetting its archived_at timestamp to null.
 */
export async function restoreBoardRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase
    .from("boards")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to restore board: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete a Board record from Supabase.
 */
export async function deleteBoardRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase.from("boards").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete board: ${error.message}`)
  }

  return true
}

/**
 * Batch archive multiple Board records.
 */
export async function batchArchiveBoardRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("boards")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch archive boards: ${error.message}`)
  }

  return true
}

/**
 * Batch restore multiple archived Board records.
 */
export async function batchRestoreBoardRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("boards")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch restore boards: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete multiple Board records.
 */
export async function batchDeleteBoardRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase.from("boards").delete().in("id", ids)

  if (error) {
    throw new Error(`Failed to batch delete boards: ${error.message}`)
  }

  return true
}

let activeChannel: RealtimeChannel | null = null
let currentWorkspaceId: number | null = null
const activeHandlers = new Set<BoardRealtimeHandlers>()

/**
 * Idempotent, reference-counted Realtime subscription for workspace boards.
 * Reuses the single active channel across multiple components.
 */
export function subscribeToBoardChanges(
  workspaceId: number,
  handlers: BoardRealtimeHandlers
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

  const staleChannels = supabase
    .getChannels()
    .filter((c) => c.topic === `realtime:boards:${workspaceId}`)
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`boards:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "boards",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newBoard = payload.new as Board
          for (const h of activeHandlers) {
            h.onInsert(newBoard)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedBoard = payload.new as Board
          for (const h of activeHandlers) {
            h.onUpdate(updatedBoard)
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
