export interface WorkspaceGeneralSettings {
  default_view?: "boards" | "calendars" | "zenbox" | "inbox" | "assistant" | "members" | string
  timezone?: string
  [key: string]: unknown
}

export interface WorkspaceAppearanceSettings {
  theme?: "light" | "dark" | "system"
  font_size?: "compact" | "normal" | "large"
  density?: "comfortable" | "compact"
  [key: string]: unknown
}

export interface WorkspaceShortcutsSettings {
  enable_quick_keys?: boolean
  [key: string]: unknown
}

export interface WorkspaceSettings {
  general?: WorkspaceGeneralSettings
  appearance?: WorkspaceAppearanceSettings
  shortcuts?: WorkspaceShortcutsSettings
  zenbox?: Record<string, unknown>
  boards?: Record<string, unknown>
  calendars?: Record<string, unknown>
  assistant?: Record<string, unknown>
  members?: Record<string, unknown>

  // Top-level fallbacks for backward compatibility
  timezone?: string
  default_view?: "boards" | "calendars" | "zenbox" | "inbox" | string
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
