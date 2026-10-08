import { useQuery } from "@tanstack/react-query"
import { assistantKeys } from "@/features/assistant/services/assistant-keys"
import {
  fetchAiModels,
  DEFAULT_AI_MODELS,
} from "@/features/assistant/services/ai-client"
import { useAssistantStore } from "@/stores/assistant-store"
import type { AiModel } from "@/types/assistant"

export function useAiModels() {
  const modelName = useAssistantStore((state) => state.modelName)
  const setModelName = useAssistantStore((state) => state.setModelName)

  const {
    data: models = DEFAULT_AI_MODELS,
    isLoading,
    error,
  } = useQuery({
    queryKey: assistantKeys.models(),
    queryFn: fetchAiModels,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  })

  const currentModel: AiModel | undefined =
    models.find((m) => m.id === modelName) ??
    DEFAULT_AI_MODELS.find((m) => m.id === modelName) ?? {
      id: modelName,
      object: "model",
    }

  return {
    models,
    isLoading,
    error,
    modelName,
    currentModel,
    setModelName,
  }
}
