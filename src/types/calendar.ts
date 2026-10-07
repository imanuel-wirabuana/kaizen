export type CalendarFolder = "calendars" | "archived"

export interface Calendar {
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

export interface CreateCalendarInput {
  workspaceId: number
  ownerId: string
  name: string
  description?: string | null
  settings?: Record<string, unknown>
}

export interface UpdateCalendarInput {
  name?: string
  description?: string | null
  settings?: Record<string, unknown>
}
