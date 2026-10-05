export interface Zen {
  id: number
  workspace_id: number
  owner_id: string
  name: string
  description?: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at?: string | null
  archived_at?: string | null
}

export interface CreateZenInput {
  workspaceId: number
  ownerId: string
  name: string
  description?: string | null
  settings?: Record<string, unknown>
}

export interface UpdateZenInput {
  name?: string
  description?: string | null
  settings?: Record<string, unknown>
}
