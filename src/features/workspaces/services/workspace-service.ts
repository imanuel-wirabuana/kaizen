import { supabase } from "@/services/supabase/client"
import type { Workspace, WorkspaceSettings } from "@/types/workspace"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface CreateWorkspaceParams {
  name: string
  description?: string
  ownerId: string
  settings?: WorkspaceSettings
}

export interface WorkspaceRealtimeHandlers {
  onInsert: (workspace: Workspace) => void
  onUpdate: (workspace: Workspace) => void
  onDelete: (id: number) => void
}

const DEFAULT_TIMEZONE = "Asia/Jakarta"
const DEFAULT_VIEW = "boards"

/**
 * Fetch all unarchived workspaces owned by the given user.
 */
export async function fetchActiveWorkspaces(ownerId: string): Promise<Workspace[]> {
  if (!ownerId) {
    return []
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", ownerId)
    .is("archived_at", null)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch workspaces: ${error.message}`)
  }

  return (data as Workspace[]) || []
}

/**
 * Insert a new workspace into Supabase.
 */
export async function createWorkspaceRecord({
  name,
  description,
  ownerId,
  settings = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE,
    default_view: DEFAULT_VIEW,
  },
}: CreateWorkspaceParams): Promise<Workspace> {
  if (!ownerId) {
    throw new Error("Owner ID is required to create a workspace")
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Workspace name cannot be empty")
  }

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name: trimmedName,
      description: description?.trim() || null,
      owner_id: ownerId,
      settings,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create workspace: ${error.message}`)
  }

  return data as Workspace
}

/**
 * Update an existing workspace record.
 */
export async function updateWorkspaceRecord(
  id: number,
  updates: Partial<Workspace>
): Promise<Workspace> {
  const { data, error } = await supabase
    .from("workspaces")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update workspace: ${error.message}`)
  }

  return data as Workspace
}

/**
 * Soft-delete (archive) a workspace.
 */
export async function archiveWorkspaceRecord(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("workspaces")
    .update({
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to archive workspace: ${error.message}`)
  }

  return true
}

let activeChannel: RealtimeChannel | null = null
let currentOwnerId: string | null = null
const activeHandlers = new Set<WorkspaceRealtimeHandlers>()

/**
 * Subscribe to realtime Postgres changes on the workspaces table for a given owner.
 * Reuses the single active channel across multiple components and React StrictMode mounts.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToWorkspaceChanges(
  ownerId: string,
  handlers: WorkspaceRealtimeHandlers
): () => void {
  activeHandlers.add(handlers)

  // If a channel is already active for this owner, attach handlers and return unregister
  if (activeChannel && currentOwnerId === ownerId) {
    return () => {
      activeHandlers.delete(handlers)
      if (activeHandlers.size === 0 && activeChannel) {
        void supabase.removeChannel(activeChannel)
        activeChannel = null
        currentOwnerId = null
      }
    }
  }

  // Clean up any existing channel for a previous owner
  if (activeChannel) {
    void supabase.removeChannel(activeChannel)
    activeChannel = null
  }

  currentOwnerId = ownerId

  // Clean up any stale channels with matching topic from Supabase client
  const staleChannels = supabase.getChannels().filter(
    (c) => c.topic === `realtime:workspaces:${ownerId}`
  )
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`workspaces:${ownerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workspaces",
        filter: `owner_id=eq.${ownerId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newWorkspace = payload.new as Workspace
          if (!newWorkspace.archived_at) {
            for (const h of activeHandlers) {
              h.onInsert(newWorkspace)
            }
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedWorkspace = payload.new as Workspace
          for (const h of activeHandlers) {
            h.onUpdate(updatedWorkspace)
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
      currentOwnerId = null
    }
  }
}
