export type BoardFolder = "boards" | "archived"

export interface Board {
  id: number
  workspace_id?: number | null
  owner_id?: string | null
  name: string
  description?: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at?: string | null
  archived_at?: string | null
}

export interface CreateBoardInput {
  workspaceId?: number | null
  ownerId?: string | null
  name: string
  description?: string | null
  settings?: Record<string, unknown>
}

export interface UpdateBoardInput {
  name?: string
  description?: string | null
  settings?: Record<string, unknown>
}
