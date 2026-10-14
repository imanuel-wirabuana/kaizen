import { supabase } from "@/services/supabase/client"
import type { Zen } from "@/types/zen"
import type {
  Task,
  TaskWithZen,
  CreateTaskInput,
  UpdateTaskInput,
  TaskPositionUpdate,
} from "@/types/task"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface TaskRealtimeHandlers {
  onInsert: (task: Task) => void
  onUpdate: (task: Task) => void
  onDelete: (id: number) => void
}

/**
 * Fetch all active tasks with their attached Zen records for a board.
 */
export async function fetchBoardTasks(
  boardId: number
): Promise<TaskWithZen[]> {
  if (!boardId) return []

  // 1. Fetch lane IDs belonging to this board
  const { data: lanes, error: lanesError } = await supabase
    .from("lanes")
    .select("id")
    .eq("board_id", boardId)
    .is("archived_at", null)

  if (lanesError) {
    throw new Error(`Failed to fetch board lanes for tasks: ${lanesError.message}`)
  }

  if (!lanes || lanes.length === 0) {
    return []
  }

  const laneIds = lanes.map((l) => l.id)

  // 2. Fetch tasks in these lanes joined with their zens
  const { data, error } = await supabase
    .from("tasks")
    .select("*, zen:zens(*)")
    .in("lane_id", laneIds)
    .is("archived_at", null)
    .order("position", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return (data as TaskWithZen[]) || []
}

/**
 * Create a new task.
 * Lifecycle rule: Automatically creates the Zen first, then creates the Task attached to it.
 */
export async function createTaskRecord({
  workspaceId,
  laneId,
  ownerId,
  title,
  description,
  position = 0,
}: CreateTaskInput): Promise<TaskWithZen> {
  const trimmedTitle = title.trim()
  if (!trimmedTitle) {
    throw new Error("Task title cannot be empty")
  }

  // 1. Create Zen first
  const { data: zenData, error: zenError } = await supabase
    .from("zens")
    .insert({
      workspace_id: workspaceId,
      owner_id: ownerId,
      name: trimmedTitle,
      description: description?.trim() || null,
      settings: {},
    })
    .select()
    .single()

  if (zenError || !zenData) {
    throw new Error(
      `Failed to create zen for task: ${zenError?.message || "Unknown error"}`
    )
  }

  // 2. Create Task attached to Zen
  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .insert({
      zen_id: zenData.id,
      lane_id: laneId,
      position,
    })
    .select()
    .single()

  if (taskError || !taskData) {
    // Cleanup Zen if Task creation fails
    await supabase.from("zens").delete().eq("id", zenData.id)
    throw new Error(
      `Failed to create task: ${taskError?.message || "Unknown error"}`
    )
  }

  return {
    ...taskData,
    zen: zenData as Zen,
  } as TaskWithZen
}

/**
 * Update an existing task and/or its attached Zen.
 */
export async function updateTaskRecord(
  taskId: number,
  zenId: number,
  updates: UpdateTaskInput
): Promise<TaskWithZen> {
  if (!taskId) {
    throw new Error("Task ID is required")
  }

  // 1. Update attached Zen if title or description changed
  if (updates.title !== undefined || updates.description !== undefined) {
    const zenPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) {
      const trimmed = updates.title.trim()
      if (!trimmed) {
        throw new Error("Task title cannot be empty")
      }
      zenPayload.name = trimmed
    }

    if (updates.description !== undefined) {
      zenPayload.description = updates.description?.trim() || null
    }

    const { error: zenError } = await supabase
      .from("zens")
      .update(zenPayload)
      .eq("id", zenId)

    if (zenError) {
      throw new Error(`Failed to update task zen: ${zenError.message}`)
    }
  }

  // 2. Update Task if lane_id or position changed
  const taskPayload: Record<string, unknown> = {}
  if (updates.laneId !== undefined) {
    taskPayload.lane_id = updates.laneId
  }
  if (updates.position !== undefined) {
    taskPayload.position = updates.position
  }

  if (Object.keys(taskPayload).length > 0) {
    taskPayload.updated_at = new Date().toISOString()
    const { error: taskError } = await supabase
      .from("tasks")
      .update(taskPayload)
      .eq("id", taskId)

    if (taskError) {
      throw new Error(`Failed to update task: ${taskError.message}`)
    }
  }

  // 3. Return refreshed task with zen
  const { data, error } = await supabase
    .from("tasks")
    .select("*, zen:zens(*)")
    .eq("id", taskId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch updated task: ${error?.message}`)
  }

  return data as TaskWithZen
}

/**
 * Batch update task positions (e.g. after drag-and-drop reordering).
 */
export async function batchUpdateTaskPositions(
  updates: TaskPositionUpdate[]
): Promise<boolean> {
  if (updates.length === 0) return true

  const promises = updates.map((item) =>
    supabase
      .from("tasks")
      .update({
        lane_id: item.lane_id,
        position: item.position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
  )

  const results = await Promise.all(promises)
  for (const res of results) {
    if (res.error) {
      throw new Error(`Failed to persist task position: ${res.error.message}`)
    }
  }

  return true
}

/**
 * Permanently delete a task and its attached Zen.
 */
export async function deleteTaskRecord(
  taskId: number,
  zenId: number
): Promise<boolean> {
  if (!taskId) return false

  const { error: taskError } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)

  if (taskError) {
    throw new Error(`Failed to delete task: ${taskError.message}`)
  }

  if (zenId) {
    // Delete attached Zen
    await supabase.from("zens").delete().eq("id", zenId)
  }

  return true
}

let activeChannel: RealtimeChannel | null = null
let currentBoardId: number | null = null
const activeHandlers = new Set<TaskRealtimeHandlers>()

/**
 * Realtime subscription for tasks in a board.
 */
export function subscribeToTaskChanges(
  boardId: number,
  handlers: TaskRealtimeHandlers
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
    .filter((c) => c.topic === `realtime:tasks:${boardId}`)
  for (const stale of staleChannels) {
    void supabase.removeChannel(stale)
  }

  const channel: RealtimeChannel = supabase
    .channel(`tasks:${boardId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newTask = payload.new as Task
          for (const h of activeHandlers) {
            h.onInsert(newTask)
          }
        } else if (payload.eventType === "UPDATE") {
          const updatedTask = payload.new as Task
          for (const h of activeHandlers) {
            h.onUpdate(updatedTask)
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
