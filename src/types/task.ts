import type { Zen } from "@/types/zen"

export interface Task {
  id: number
  zen_id: number
  lane_id: number
  position: number
  created_at: string
  updated_at?: string | null
  archived_at?: string | null
}

export interface TaskWithZen extends Task {
  zen: Zen
}

export interface CreateTaskInput {
  workspaceId: number
  laneId: number
  ownerId: string
  title: string
  description?: string | null
  position?: number
  settings?: Record<string, unknown>
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  laneId?: number
  position?: number
  settings?: Record<string, unknown>
}

export interface TaskPositionUpdate {
  id: number
  lane_id: number
  position: number
}
