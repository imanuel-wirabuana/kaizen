import { useState, useRef, useCallback, useEffect } from "react"
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
  subscribeToThreadMessages,
} from "@/features/assistant/services/assistant-service"
import { assistantKeys } from "@/features/assistant/services/assistant-keys"
import {
  streamAssistantChat,
  generateThreadSummary,
  type ChatMessage,
} from "@/features/assistant/services/ai-client"
import type { AiMessage, AiThread } from "@/types/assistant"
import {
  buildAssistantSystemPrompt,
  DEFAULT_BASE_SYSTEM_PROMPT,
  type AssistantKnowledgeContext,
  type AssistantCurrentUserContext,
} from "@/features/assistant/services/system-prompt"
import { useAssistantKnowledge } from "@/features/assistant/hooks/use-assistant-knowledge"

export {
  buildAssistantSystemPrompt,
  DEFAULT_BASE_SYSTEM_PROMPT,
  type AssistantKnowledgeContext,
  type AssistantCurrentUserContext,
}

export interface UseAiChatProps {
  threadId: number | null
  thread: AiThread | null
  systemPromptOverride?: string
  customInstructions?: string | null
}

export function useAiChat({
  threadId,
  thread,
  systemPromptOverride,
  customInstructions,
}: UseAiChatProps) {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id
  const modelName = useAssistantStore((state) => state.modelName)
  const upsertThread = useAssistantStore((state) => state.upsertThread)
  const effectiveModel = (thread?.settings?.model as string) || modelName

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)

  // Live workspace knowledge context & dynamic system prompt
  const { systemPrompt: dynamicSystemPrompt, knowledgeContext } =
    useAssistantKnowledge({
      thread,
      customInstructions,
    })

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

  // Realtime subscription on thread messages for instantaneous multi-user chat
  useEffect(() => {
    if (!threadId) return

    const unsubscribe = subscribeToThreadMessages(threadId, {
      onInsertMessage: (newMessage) => {
        queryClient.setQueryData<AiMessage[]>(
          assistantKeys.messages(threadId),
          (old) => {
            if (!old) return [newMessage]
            if (old.some((m) => m.id === newMessage.id)) return old
            // Check if there is an optimistic temp message matching this new message from the sender
            const hasOptimisticMatch = old.some(
              (m) =>
                m.id < 0 &&
                m.owner_id === newMessage.owner_id &&
                m.content === newMessage.content
            )
            if (hasOptimisticMatch) {
              return old.map((m) =>
                m.id < 0 &&
                m.owner_id === newMessage.owner_id &&
                m.content === newMessage.content
                  ? newMessage
                  : m
              )
            }
            return [...old, newMessage]
          }
        )
      },
      onDeleteMessage: (deletedId) => {
        queryClient.setQueryData<AiMessage[]>(
          assistantKeys.messages(threadId),
          (old) => old?.filter((m) => m.id !== deletedId) ?? []
        )
      },
    })

    return () => {
      unsubscribe()
    }
  }, [threadId])

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

      const senderName =
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "Team Member"

      const messageMetadata: Record<string, unknown> = {
        sender_name: senderName,
        sender_avatar: user.imageUrl || null,
      }

      // 1. Optimistic User Message
      const tempUserMsg: AiMessage = {
        id: -Date.now(),
        thread_id: threadId,
        owner_id: user.id,
        role: "user",
        content,
        metadata: messageMetadata,
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
          metadata: messageMetadata,
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

        // 4. Prepare History for AI Streaming (Multi-user context attribution)
        const workspaceProfiles = knowledgeContext.memberProfiles || {}

        const userOwnerIds = new Set(
          existingMessages
            .filter((m) => m.role === "user")
            .map((m) => m.owner_id)
        )
        userOwnerIds.add(user.id)
        const hasMultipleUsers = userOwnerIds.size > 1

        const getAuthorName = (
          ownerId: string,
          metadata?: Record<string, unknown> | null
        ) => {
          if (ownerId === user.id) {
            return senderName
          }
          const prof = workspaceProfiles[ownerId]
          const metaName =
            typeof metadata?.sender_name === "string"
              ? metadata.sender_name
              : undefined
          return prof?.displayName || metaName || "Collaborator"
        }

        const apiMessages: ChatMessage[] = [
          ...existingMessages.map((m) => {
            if (m.role === "user" && hasMultipleUsers) {
              const author = getAuthorName(m.owner_id, m.metadata)
              return {
                role: m.role,
                content: `[${author}]: ${m.content}`,
              }
            }
            return {
              role: m.role,
              content: m.content,
            }
          }),
          {
            role: "user",
            content: hasMultipleUsers ? `[${senderName}]: ${content}` : content,
          },
        ]

        const effectiveSystemPrompt =
          systemPromptOverride || dynamicSystemPrompt || DEFAULT_BASE_SYSTEM_PROMPT

        // 5. Stream Response from AI Provider
        const result = streamAssistantChat({
          modelName: effectiveModel,
          messages: apiMessages,
          systemPrompt: effectiveSystemPrompt,
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
      dynamicSystemPrompt,
      systemPromptOverride,
      knowledgeContext.memberProfiles,
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
    systemPrompt: systemPromptOverride || dynamicSystemPrompt,
    knowledgeContext,
  }
}
