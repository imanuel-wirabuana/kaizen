export interface WorkspaceSettings {
  timezone?: string
  default_view?: "boards" | "calendars" | "inbox" | string
  [key: string]: unknown
}

export interface Workspace {
  id: number
  name: string
  description?: string | null
  owner_id: string
  settings: WorkspaceSettings
  created_at: string
  updated_at: string
  archived_at?: string | null
}
