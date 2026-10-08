import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { BotMessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssistantDetailHeader } from "@/features/assistant/components/assistant-detail-header"
import { AssistantChatMessages } from "@/features/assistant/components/assistant-chat-messages"
import { AssistantChatInput } from "@/features/assistant/components/assistant-chat-input"
import { useAiChat } from "@/features/assistant/hooks/use-ai-chat"
import type { AiThread } from "@/types/assistant"

export interface AssistantDetailProps {
  thread: AiThread | null
  isLoading?: boolean
  selectedThreadId?: number | null
  modelName: string
  onModelChange: (model: string) => Promise<unknown> | void
  canCreate?: boolean
  onArchive?: (id: number) => Promise<unknown>
  onRestore?: (id: number) => Promise<unknown>
  onDelete?: (id: number) => Promise<unknown>
  onBackToAssistant?: () => void
}

export function AssistantDetail({
  thread,
  isLoading = false,
  selectedThreadId = null,
  modelName,
  onModelChange,
  canCreate = true,
  onArchive,
  onRestore,
  onDelete,
  onBackToAssistant,
}: AssistantDetailProps) {
  const { user } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const effectiveModel = (thread?.settings?.model as string) || modelName

  const {
    messages,
    isLoadingMessages,
    isStreaming,
    streamedContent,
    sendMessage,
    stopGeneration,
    clearMessages,
  } = useAiChat({
    threadId: thread?.id ?? null,
    thread,
  })

  const handleToggleArchive = async () => {
    if (!thread || isProcessing) return
    try {
      setIsProcessing(true)
      if (thread.archived_at && onRestore) {
        await onRestore(thread.id)
      } else if (!thread.archived_at && onArchive) {
        await onArchive(thread.id)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!thread || isProcessing || !onDelete) return
    try {
      setIsProcessing(true)
      await onDelete(thread.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Fixed Top Action & Detail Bar (Matching BoardDetailHeader and CalendarDetailHeader) */}
      <AssistantDetailHeader
        thread={thread}
        isProcessing={isProcessing}
        onToggleArchive={
          thread && (thread.archived_at ? onRestore : onArchive)
            ? handleToggleArchive
            : undefined
        }
        onClearMessages={thread ? clearMessages : undefined}
        onDelete={thread && onDelete ? handleDelete : undefined}
      />

      {/* Main Detail Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* If a thread ID was specified in URL and is still loading */}
        {isLoading && selectedThreadId !== null ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Loading conversation details...
            </p>
          </div>
        ) : selectedThreadId !== null && !thread ? (
          /* If a thread ID was specified in URL but not found */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <BotMessageSquare className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Conversation not found
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              This conversation does not exist or may have been permanently
              deleted.
            </p>
            {onBackToAssistant && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToAssistant}
                className="mt-4 cursor-pointer text-xs"
              >
                Back to Conversations
              </Button>
            )}
          </div>
        ) : !thread ? (
          /* Default empty state when on /assistant with no conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <BotMessageSquare className="size-6" />
            </div>
            <p className="text-sm font-medium">Select a conversation to view</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              Choose a conversation from the list on the left to read messages,
              continue chatting, or manage its status.
            </p>
          </div>
        ) : (
          /* Active Conversation Canvas */
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {/* Messages Stream Body */}
            {isLoadingMessages ? (
              <div className="flex flex-1 items-center justify-center p-12 text-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AssistantChatMessages
                messages={messages}
                isStreaming={isStreaming}
                streamedContent={streamedContent}
                onSelectPrompt={(prompt) => void sendMessage(prompt)}
                modelName={effectiveModel}
                userName={user?.fullName || "You"}
                userImageUrl={user?.imageUrl}
              />
            )}

            {/* Bottom Chat Input Box */}
            <AssistantChatInput
              onSendMessage={sendMessage}
              onStop={stopGeneration}
              isStreaming={isStreaming}
              modelName={effectiveModel}
              onModelChange={onModelChange}
              isArchived={Boolean(thread.archived_at)}
              disabled={!canCreate}
              placeholder={`Message ${effectiveModel || "assistant"}...`}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default AssistantDetail
