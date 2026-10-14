export interface Lane {
  id: number
  board_id: number
  owner_id: string
  name: string
  description?: string | null
  settings: Record<string, unknown>
  position: number
  created_at: string
  updated_at?: string | null
  archived_at?: string | null
}

export interface CreateLaneInput {
  boardId: number
  ownerId: string
  name: string
  description?: string | null
  settings?: Record<string, unknown>
  position?: number
}

export interface UpdateLaneInput {
  name?: string
  description?: string | null
  settings?: Record<string, unknown>
  position?: number
}

export interface LanePositionUpdate {
  id: number
  position: number
}
