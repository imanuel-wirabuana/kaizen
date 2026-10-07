import { supabase } from "@/services/supabase/client"
import type {
  Calendar,
  CreateCalendarInput,
  UpdateCalendarInput,
} from "@/types/calendar"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface CalendarRealtimeHandlers {
  onInsert: (calendar: Calendar) => void
  onUpdate: (calendar: Calendar) => void
  onDelete: (id: number) => void
}

/**
 * Fetch all Calendars for a given workspace.
 */
export async function fetchWorkspaceCalendars(
  workspaceId: number
): Promise<Calendar[]> {
  if (!workspaceId) return []

  const { data, error } = await supabase
    .from("calendars")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch calendars: ${error.message}`)
  }

  return (data as Calendar[]) || []
}

/**
 * Insert a new Calendar record.
 */
export async function createCalendarRecord({
  workspaceId,
  ownerId,
  name,
  description,
  settings = {},
}: CreateCalendarInput): Promise<Calendar> {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Calendar name cannot be empty")
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required")
  }

  if (!ownerId) {
    throw new Error("Owner ID is required")
  }

  const { data, error } = await supabase
    .from("calendars")
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
    throw new Error(`Failed to create calendar: ${error.message}`)
  }

  return data as Calendar
}

/**
 * Update an existing Calendar record.
 */
export async function updateCalendarRecord(
  id: number,
  updates: UpdateCalendarInput
): Promise<Calendar> {
  if (!id) {
    throw new Error("Calendar ID is required")
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim()
    if (!trimmed) {
      throw new Error("Calendar name cannot be empty")
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
    .from("calendars")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update calendar: ${error.message}`)
  }

  return data as Calendar
}

/**
 * Soft-delete a Calendar by setting its archived_at timestamp.
 */
export async function archiveCalendarRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase
    .from("calendars")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to archive calendar: ${error.message}`)
  }

  return true
}

/**
 * Restore an archived Calendar by resetting its archived_at timestamp to null.
 */
export async function restoreCalendarRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase
    .from("calendars")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to restore calendar: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete a Calendar record from Supabase.
 */
export async function deleteCalendarRecord(id: number): Promise<boolean> {
  if (!id) return false

  const { error } = await supabase.from("calendars").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete calendar: ${error.message}`)
  }

  return true
}

/**
 * Batch archive multiple Calendar records.
 */
export async function batchArchiveCalendarRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("calendars")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch archive calendars: ${error.message}`)
  }

  return true
}

/**
 * Batch restore multiple archived Calendar records.
 */
export async function batchRestoreCalendarRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase
    .from("calendars")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)

  if (error) {
    throw new Error(`Failed to batch restore calendars: ${error.message}`)
  }

  return true
}

/**
 * Permanently delete multiple Calendar records.
 */
export async function batchDeleteCalendarRecords(
  ids: number[]
): Promise<boolean> {
  if (ids.length === 0) return true

  const { error } = await supabase.from("calendars").delete().in("id", ids)

  if (error) {
    throw new Error(`Failed to batch delete calendars: ${error.message}`)
  }

  return true
}

let activeChannel: RealtimeChannel | null = null
let currentWorkspaceId: number | null = null
const activeHandlers = new Set<CalendarRealtimeHandlers>()

/**
 * Idempotent, reference-counted Realtime subscription for workspace calendars.
 * Reuses the single active channel across multiple components.
 */
export function subscribeToCalendarChanges(
  workspaceId: number,
  handlers: CalendarRealtimeHandlers
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
    .filter((c) => c.topic === `realtime:calendars:${workspaceId}`)
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`calendars:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "calendars",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newCalendar = payload.new as Calendar
          for (const h of activeHandlers) {
            h.onInsert(newCalendar)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedCalendar = payload.new as Calendar
          for (const h of activeHandlers) {
            h.onUpdate(updatedCalendar)
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
