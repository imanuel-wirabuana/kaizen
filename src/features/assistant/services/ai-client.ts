import { createOpenAI } from "@ai-sdk/openai"
import { streamText, generateText } from "ai"
import type { AiModel } from "@/types/assistant"

export const AI_CONFIG = {
  baseURL: "https://imanuelcdw-dawra.hf.space/v1",
  apiKey: "sk-6bfffd4f7d73aaad-ya5xl7-2a4d97cf",
  defaultModel: "kaizen",
} as const

export const DEFAULT_AI_MODELS: AiModel[] = [
  {
    id: "kaizen",
    object: "model",
    owned_by: "combo",
    capabilities: {
      vision: true,
      pdf: true,
      audioInput: true,
      videoInput: true,
      imageOutput: false,
      audioOutput: false,
      search: false,
      tools: true,
      reasoning: false,
      contextWindow: 128000,
      maxOutput: 131072,
    },
  },
  {
    id: "work",
    object: "model",
    owned_by: "combo",
    capabilities: {
      vision: true,
      pdf: true,
      audioInput: true,
      videoInput: true,
      imageOutput: false,
      audioOutput: false,
      search: false,
      tools: true,
      reasoning: false,
      contextWindow: 128000,
      maxOutput: 131072,
    },
  },
  {
    id: "alva",
    object: "model",
    owned_by: "combo",
    capabilities: {
      vision: true,
      pdf: true,
      audioInput: true,
      videoInput: true,
      imageOutput: false,
      audioOutput: false,
      search: false,
      tools: true,
      reasoning: false,
      contextWindow: 128000,
      maxOutput: 131072,
    },
  },
]

/**
 * Fetches available AI models from the endpoint.
 * Returns default list on failure.
 */
export async function fetchAiModels(): Promise<AiModel[]> {
  try {
    const response = await fetch(AI_CONFIG.baseURL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`Failed to fetch models: ${response.status} ${response.statusText}`)
      return DEFAULT_AI_MODELS
    }

    const json = await response.json()
    if (json && Array.isArray(json.data) && json.data.length > 0) {
      return json.data as AiModel[]
    }
    return DEFAULT_AI_MODELS
  } catch (error) {
    console.warn("Error fetching AI models, using default list:", error)
    return DEFAULT_AI_MODELS
  }
}

/**
 * Creates and returns the custom OpenAI-compatible provider instance.
 */
export function getCustomAIProvider(
  apiKey: string = AI_CONFIG.apiKey,
  baseURL: string = AI_CONFIG.baseURL
) {
  return createOpenAI({
    apiKey,
    baseURL,
  })
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface StreamChatParams {
  modelName?: string
  messages: ChatMessage[]
  systemPrompt?: string
  abortSignal?: AbortSignal
}

/**
 * Initiates a streaming text generation using the Vercel AI SDK.
 */
export function streamAssistantChat({
  modelName,
  messages,
  systemPrompt,
  abortSignal,
}: StreamChatParams) {
  const provider = getCustomAIProvider()

  return streamText({
    model: provider(modelName || AI_CONFIG.defaultModel),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    abortSignal,
  })
}

export interface ThreadSummaryResult {
  title: string
  description: string
}

/**
 * Smartly generates a concise title (3-5 words) and 1-sentence description
 * for a new conversation based on the user's initial prompt.
 * Includes a resilient heuristic fallback in case of model timeouts or JSON parsing discrepancies.
 */
export async function generateThreadSummary(
  firstPrompt: string,
  modelName: string = AI_CONFIG.defaultModel
): Promise<ThreadSummaryResult> {
  const cleanPrompt = firstPrompt.trim()
  if (!cleanPrompt) {
    return {
      title: "New Conversation",
      description: "Discussion with Kaizen AI Assistant",
    }
  }

  // Heuristic fallback helper
  const getFallback = (): ThreadSummaryResult => {
    const firstLine = cleanPrompt.split("\n")[0].trim()
    const words = firstLine.split(/\s+/).slice(0, 6).join(" ")
    const fallbackTitle =
      words.length > 40 ? `${words.slice(0, 37)}...` : words || "New Conversation"
    const fallbackDesc =
      cleanPrompt.length > 120
        ? `${cleanPrompt.slice(0, 117)}...`
        : cleanPrompt

    return {
      title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1),
      description: fallbackDesc,
    }
  }

  try {
    const provider = getCustomAIProvider()
    const { text } = await generateText({
      model: provider(modelName || AI_CONFIG.defaultModel),
      system:
        "You are an assistant that summarizes conversations into concise titles and brief descriptions. You MUST return ONLY a valid JSON object with keys 'title' and 'description'. The 'title' should be 2 to 5 words, Title Cased, without quotes or punctuation. The 'description' should be a single short sentence (under 120 characters). Example: {\"title\": \"Task Planning Strategy\", \"description\": \"Breaking down daily goals and organizing focused sprint tasks.\"}",
      prompt: `User prompt: "${cleanPrompt}"`,
    })

    // Try parsing JSON from model output
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.title && typeof parsed.title === "string") {
        return {
          title: parsed.title.trim().replace(/^["']|["']$/g, ""),
          description:
            parsed.description && typeof parsed.description === "string"
              ? parsed.description.trim()
              : getFallback().description,
        }
      }
    }

    return getFallback()
  } catch (error) {
    console.warn("AI summary generation error, using fallback:", error)
    return getFallback()
  }
}
