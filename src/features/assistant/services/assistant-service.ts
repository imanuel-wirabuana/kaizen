import { supabase } from "@/services/supabase/client"
import type {
  AiThread,
  AiMessage,
  CreateAiThreadInput,
  UpdateAiThreadInput,
  CreateAiMessageInput,
} from "@/types/assistant"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface ThreadRealtimeHandlers {
  onInsertThread?: (thread: AiThread) => void
  onUpdateThread?: (thread: AiThread) => void
  onDeleteThread?: (id: number) => void
  onInsertMessage?: (message: AiMessage) => void
  onDeleteMessage?: (id: number) => void
}

/**
 * Fetch all AI threads for a given workspace.
 */
export async function fetchWorkspaceThreads(
  workspaceId: number
): Promise<AiThread[]> {
  if (!workspaceId) return []

  const { data, error } = await supabase
    .from("ai_threads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch AI threads: ${error.message}`)
  }

  return (data as AiThread[]) || []
}

/**
 * Fetch a single AI thread by ID.
 */
export async function fetchThreadById(
  threadId: number
): Promise<AiThread | null> {
  if (!threadId) return null

  const { data, error } = await supabase
    .from("ai_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch AI thread: ${error.message}`)
  }

  return (data as AiThread) || null
}

/**
 * Create a new AI thread record.
 */
export async function createThreadRecord({
  workspaceId,
  ownerId,
  title = "new convo",
  description = null,
  settings = {},
}: CreateAiThreadInput): Promise<AiThread> {
  const trimmedTitle = title.trim() || "new convo"

  const { data, error } = await supabase
    .from("ai_threads")
    .insert({
      workspace_id: workspaceId,
      owner_id: ownerId,
      title: trimmedTitle,
      description: description ? description.trim() : null,
      settings,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create AI thread: ${error.message}`)
  }

  return data as AiThread
}

/**
 * Update an existing AI thread record.
 */
export async function updateThreadRecord(
  id: number,
  updates: UpdateAiThreadInput
): Promise<AiThread> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.title !== undefined) {
    payload.title = updates.title.trim()
  }
  if (updates.description !== undefined) {
    payload.description = updates.description?.trim() || null
  }
  if (updates.settings !== undefined) {
    payload.settings = updates.settings
  }
  if (updates.archived_at !== undefined) {
    payload.archived_at = updates.archived_at
  }

  const { data, error } = await supabase
    .from("ai_threads")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update AI thread: ${error.message}`)
  }

  return data as AiThread
}

/**
 * Soft-archive an AI thread.
 */
export async function archiveThreadRecord(id: number): Promise<AiThread> {
  return updateThreadRecord(id, {
    archived_at: new Date().toISOString(),
  })
}

/**
 * Restore an archived AI thread.
 */
export async function restoreThreadRecord(id: number): Promise<AiThread> {
  return updateThreadRecord(id, {
    archived_at: null,
  })
}

/**
 * Delete an AI thread permanently (cascades to messages).
 */
export async function deleteThreadRecord(id: number): Promise<void> {
  const { error } = await supabase.from("ai_threads").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete AI thread: ${error.message}`)
  }
}

/**
 * Batch archive multiple AI threads.
 */
export async function batchArchiveThreadRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("ai_threads")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch archive AI threads: ${error.message}`)
  }

  return true
}

/**
 * Batch restore multiple archived AI threads.
 */
export async function batchRestoreThreadRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("ai_threads")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch restore AI threads: ${error.message}`)
  }

  return true
}

/**
 * Batch permanently delete multiple AI threads.
 */
export async function batchDeleteThreadRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase.from("ai_threads").delete().in("id", ids)

  if (error) {
    throw new Error(`Failed to batch delete AI threads: ${error.message}`)
  }

  return true
}

/**
 * Fetch all messages for a specific AI thread.
 */
export async function fetchThreadMessages(
  threadId: number
): Promise<AiMessage[]> {
  if (!threadId) return []

  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch AI messages: ${error.message}`)
  }

  return (data as AiMessage[]) || []
}

/**
 * Insert a new message into a thread.
 */
export async function createMessageRecord({
  threadId,
  ownerId,
  role,
  content,
  metadata = null,
}: CreateAiMessageInput): Promise<AiMessage> {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      thread_id: threadId,
      owner_id: ownerId,
      role,
      content,
      metadata,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create AI message: ${error.message}`)
  }

  // Update thread's updated_at timestamp concurrently
  void supabase
    .from("ai_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId)

  return data as AiMessage
}

/**
 * Delete all messages in a thread (clear history).
 */
export async function clearThreadMessages(threadId: number): Promise<void> {
  const { error } = await supabase
    .from("ai_messages")
    .delete()
    .eq("thread_id", threadId)

  if (error) {
    throw new Error(`Failed to clear thread messages: ${error.message}`)
  }
}

let activeChannel: RealtimeChannel | null = null
let currentWorkspaceId: number | null = null
const activeHandlers = new Set<ThreadRealtimeHandlers>()

/**
 * Subscribe to realtime changes on ai_threads and ai_messages for the workspace.
 */
export function subscribeToAssistantChanges(
  workspaceId: number,
  handlers: ThreadRealtimeHandlers
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
    .filter((c) => c.topic === `realtime:assistant:${workspaceId}`)
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`assistant:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ai_threads",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newThread = payload.new as AiThread
          for (const h of activeHandlers) {
            h.onInsertThread?.(newThread)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedThread = payload.new as AiThread
          for (const h of activeHandlers) {
            h.onUpdateThread?.(updatedThread)
          }
        } else if (payload.eventType === "DELETE") {
          const oldRecord = payload.old as { id: number }
          for (const h of activeHandlers) {
            h.onDeleteThread?.(oldRecord.id)
          }
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ai_messages",
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newMsg = payload.new as AiMessage
          for (const h of activeHandlers) {
            h.onInsertMessage?.(newMsg)
          }
        } else if (payload.eventType === "DELETE") {
          const oldRecord = payload.old as { id: number }
          for (const h of activeHandlers) {
            h.onDeleteMessage?.(oldRecord.id)
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
