import { useState, useRef, useCallback } from "react"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import { useAssistantStore } from "@/stores/assistant-store"
import {
  fetchThreadMessages,
  createMessageRecord,
  clearThreadMessages,
  updateThreadRecord,
} from "@/features/assistant/services/assistant-service"
import { assistantKeys } from "@/features/assistant/services/assistant-keys"
import {
  streamAssistantChat,
  generateThreadSummary,
  type ChatMessage,
} from "@/features/assistant/services/ai-client"
import type { AiMessage, AiThread } from "@/types/assistant"

const SYSTEM_PROMPT =
  "You are Kaizen Assistant, a friendly, intelligent, and highly practical AI coach embedded inside the Kaizen productivity platform. You embody the philosophy of Kaizen (continuous, compounding 1% improvement). Keep answers clear, well-structured, formatted with markdown where helpful, and immediately actionable."

export interface UseAiChatProps {
  threadId: number | null
  thread: AiThread | null
}

export function useAiChat({ threadId, thread }: UseAiChatProps) {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id
  const modelName = useAssistantStore((state) => state.modelName)
  const upsertThread = useAssistantStore((state) => state.upsertThread)
  const effectiveModel = (thread?.settings?.model as string) || modelName

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)

  // React Query: Cached Messages
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refreshMessages,
  } = useQuery({
    queryKey: assistantKeys.messages(threadId),
    queryFn: () => fetchThreadMessages(threadId!),
    enabled: Boolean(threadId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  })

  // Check if thread title should be smartly auto-updated
  const shouldAutoUpdateTitle = useCallback(
    (currentMessages: AiMessage[]) => {
      if (!thread) return false
      const lowerTitle = thread.title.trim().toLowerCase()
      const isDefaultTitle =
        lowerTitle === "new convo" ||
        lowerTitle === "new conversation" ||
        lowerTitle === "untitled" ||
        lowerTitle === ""
      const isFirstTurn = currentMessages.length <= 1
      return isDefaultTitle || isFirstTurn
    },
    [thread]
  )

  // Stop Generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [])

  // Send Message Mutation & Stream Orchestration
  const sendMessage = useCallback(
    async (rawContent: string) => {
      const content = rawContent.trim()
      if (!content || !threadId || !user?.id || isStreaming) return

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      setIsStreaming(true)
      setStreamedContent("")

      // 1. Optimistic User Message
      const tempUserMsg: AiMessage = {
        id: -Date.now(),
        thread_id: threadId,
        owner_id: user.id,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      }

      const existingMessages = [...messages]
      queryClient.setQueryData<AiMessage[]>(
        assistantKeys.messages(threadId),
        (old) => (old ? [...old, tempUserMsg] : [tempUserMsg])
      )

      try {
        // 2. Persist User Message to DB
        const savedUserMsg = await createMessageRecord({
          threadId,
          ownerId: user.id,
          role: "user",
          content,
        })

        // Replace optimistic ID with DB ID
        queryClient.setQueryData<AiMessage[]>(
          assistantKeys.messages(threadId),
          (old) =>
            old?.map((m) => (m.id === tempUserMsg.id ? savedUserMsg : m)) ?? [
              savedUserMsg,
            ]
        )

        // 3. Smart Title & Description Generation (Fire in background if needed)
        if (shouldAutoUpdateTitle(existingMessages)) {
          void (async () => {
            try {
              const summary = await generateThreadSummary(content, effectiveModel)
              if (summary.title) {
                const updated = await updateThreadRecord(threadId, {
                  title: summary.title,
                  description: summary.description,
                })
                // Update React Query caches
                if (workspaceId) {
                  queryClient.setQueryData<AiThread[]>(
                    assistantKeys.threadList(workspaceId),
                    (old) =>
                      old?.map((t) => (t.id === threadId ? updated : t)) ?? [
                        updated,
                      ]
                  )
                  void queryClient.invalidateQueries({
                    queryKey: assistantKeys.threadList(workspaceId),
                  })
                }
                upsertThread(updated)
              }
            } catch (err) {
              console.warn("Smart title update failed silently:", err)
            }
          })()
        }

        // 4. Prepare History for AI Streaming
        const apiMessages: ChatMessage[] = [
          ...existingMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: "user",
            content,
          },
        ]

        // 5. Stream Response from AI Provider
        const result = streamAssistantChat({
          modelName: effectiveModel,
          messages: apiMessages,
          systemPrompt: SYSTEM_PROMPT,
          abortSignal: abortController.signal,
        })

        let accumulated = ""
        for await (const chunk of result.textStream) {
          accumulated += chunk
          setStreamedContent(accumulated)
        }

        // 6. Persist Assistant Response to DB
        if (accumulated.trim()) {
          const savedAssistantMsg = await createMessageRecord({
            threadId,
            ownerId: user.id,
            role: "assistant",
            content: accumulated,
          })

          queryClient.setQueryData<AiMessage[]>(
            assistantKeys.messages(threadId),
            (old) => (old ? [...old, savedAssistantMsg] : [savedAssistantMsg])
          )
        }
      } catch (err: unknown) {
        if (
          abortController.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate AI response"
        toast.error("Model request error", {
          description: errorMessage,
        })

        // Insert error placeholder if desired
        if (user?.id) {
          try {
            const errorMsg = await createMessageRecord({
              threadId,
              ownerId: user.id,
              role: "assistant",
              content: `⚠️ Failed to respond: ${errorMessage}. Please check model connection and try again.`,
            })
            queryClient.setQueryData<AiMessage[]>(
              assistantKeys.messages(threadId),
              (old) => (old ? [...old, errorMsg] : [errorMsg])
            )
          } catch {
            // Ignore secondary error
          }
        }
      } finally {
        setIsStreaming(false)
        setStreamedContent("")
        abortControllerRef.current = null
      }
    },
    [
      threadId,
      user,
      isStreaming,
      messages,
      shouldAutoUpdateTitle,
      effectiveModel,
      workspaceId,
      upsertThread,
    ]
  )

  // Clear Messages Mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!threadId) throw new Error("No thread selected")
      return clearThreadMessages(threadId)
    },
    onSuccess: () => {
      if (!threadId) return
      queryClient.setQueryData<AiMessage[]>(
        assistantKeys.messages(threadId),
        []
      )
      toast.success("Conversation cleared", {
        description: "All messages in this thread have been removed.",
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to clear messages", {
        description: err.message,
      })
    },
  })

  return {
    messages,
    isLoadingMessages,
    isStreaming,
    streamedContent,
    sendMessage,
    stopGeneration,
    clearMessages: clearMutation.mutateAsync,
    isClearing: clearMutation.isPending,
    refreshMessages,
  }
}
