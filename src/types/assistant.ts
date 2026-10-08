export interface AiThreadSettings {
  model?: string
  owner_name?: string
  owner_image?: string
  [key: string]: unknown
}

export interface AiThread {
  id: number
  title: string
  description?: string | null
  settings: AiThreadSettings
  workspace_id: number
  owner_id: string
  created_at: string
  updated_at?: string | null
  archived_at?: string | null
}

export interface AiMessage {
  id: number
  thread_id: number
  owner_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, unknown> | null
  created_at: string
}

export type AssistantFolder = "threads" | "archived"

export interface CreateAiThreadInput {
  workspaceId: number
  ownerId: string
  title?: string
  description?: string | null
  settings?: AiThreadSettings
}

export interface UpdateAiThreadInput {
  title?: string
  description?: string | null
  settings?: AiThreadSettings
  archived_at?: string | null
}

export interface CreateAiMessageInput {
  threadId: number
  ownerId: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, unknown> | null
}

export interface AiModelCapabilities {
  vision?: boolean
  pdf?: boolean
  audioInput?: boolean
  videoInput?: boolean
  imageOutput?: boolean
  audioOutput?: boolean
  search?: boolean
  tools?: boolean
  reasoning?: boolean
  thinkingFormat?: string | null
  thinkingCanDisable?: boolean
  thinkingRange?: [number, number] | null
  contextWindow?: number
  maxOutput?: number
}

export interface AiModel {
  id: string
  object?: string
  owned_by?: string
  capabilities?: AiModelCapabilities
  context_length?: number
  max_completion_tokens?: number
}
