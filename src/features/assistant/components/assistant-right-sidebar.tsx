import { useEffect, useMemo } from "react"
import { useUser } from "@clerk/clerk-react"
import { Plus, X, BotMessageSquare, Loader2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AssistantChatMessages } from "@/features/assistant/components/assistant-chat-messages"
import { AssistantChatInput } from "@/features/assistant/components/assistant-chat-input"
import { useAssistant } from "@/features/assistant/hooks/use-assistant"
import { useAiChat } from "@/features/assistant/hooks/use-ai-chat"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { useAssistantStore } from "@/stores/assistant-store"

export interface AssistantRightSidebarProps {
  className?: string
}

export function AssistantRightSidebar({
  className,
}: AssistantRightSidebarProps) {
  const { user } = useUser()
  const { canCreate: canCreatePerm } = useWorkspacePermissions()
  const canCreateAssistant = canCreatePerm("assistant")
  const isOpen = useAssistantStore((state) => state.isRightSidebarOpen)
  const setIsOpen = useAssistantStore((state) => state.setRightSidebarOpen)

  const {
    threads,
    selectedThread,
    selectedThreadId,
    setSelectedThreadId,
    createThread,
    isCreating,
    modelName,
    changeModel,
    isLoading: isThreadsLoading,
  } = useAssistant({ syncUrl: false })

  const activeThreads = useMemo(() => {
    return threads.filter((t) => !t.archived_at)
  }, [threads])

  const threadItems = useMemo(() => {
    return activeThreads.map((t) => ({
      value: String(t.id),
      label: t.title,
    }))
  }, [activeThreads])

  // When opening sidebar, auto-select most recent thread if none selected
  useEffect(() => {
    if (isOpen && selectedThreadId === null && activeThreads.length > 0) {
      setSelectedThreadId(activeThreads[0].id)
    }
  }, [isOpen, selectedThreadId, activeThreads, setSelectedThreadId])

  const {
    messages,
    isLoadingMessages,
    isStreaming,
    streamedContent,
    sendMessage,
    stopGeneration,
  } = useAiChat({
    threadId: selectedThread?.id ?? null,
    thread: selectedThread,
  })

  const effectiveModel =
    (selectedThread?.settings?.model as string) || modelName

  return (
    <SidebarProvider
      open={isOpen}
      onOpenChange={setIsOpen}
      disableShortcut
      className="!min-h-0 !w-auto flex-none"
      style={
        {
          "--sidebar-width": "420px",
        } as React.CSSProperties
      }
    >
      <Sidebar
        side="right"
        variant="sidebar"
        collapsible="offcanvas"
        className={className}
      >
        {/* Header: Select thread option + New Convo button + Close */}
        <SidebarHeader className="border-b border-sidebar-border/50 p-2">
          <div className="flex w-full items-center justify-between gap-1.5">
            {/* Thread Select Option */}
            <div className="min-w-0 flex-1">
              <Select
                items={threadItems}
                value={selectedThreadId ? String(selectedThreadId) : null}
                onValueChange={(val) => {
                  setSelectedThreadId(val ? Number(val) : null)
                }}
              >
                <SelectTrigger
                  className="h-7 w-full cursor-pointer border-0 bg-transparent px-2 text-xs shadow-none hover:bg-accent/60"
                  title="Select active conversation"
                >
                  <SelectValue placeholder="Select conversation">
                    {(val) =>
                      activeThreads.find((t) => String(t.id) === String(val))
                        ?.title ??
                      selectedThread?.title ??
                      (val ? String(val) : "Select conversation")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {activeThreads.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No conversations
                    </SelectItem>
                  ) : (
                    activeThreads.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Button to Create New Convo */}
            {canCreateAssistant && (
              <Button
                size="sm"
                onClick={() => void createThread()}
                disabled={isCreating}
                className="h-7 shrink-0 cursor-pointer gap-1 px-2 text-xs font-medium"
                title="Create new conversation"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New Convo</span>
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsOpen(false)}
              className="size-7 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Close assistant"
              aria-label="Close assistant"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </SidebarHeader>

        {/* Body: Chat messages */}
        <SidebarContent className="flex flex-1 flex-col overflow-hidden bg-background/50 p-0">
          {isThreadsLoading ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeThreads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                <BotMessageSquare className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No active conversations
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Start a new conversation to brainstorm, plan tasks, or get
                advice.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void createThread()}
                disabled={isCreating}
                className="mt-4 cursor-pointer gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Start Conversation</span>
              </Button>
            </div>
          ) : !selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                <BotMessageSquare className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Select a conversation
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Choose a conversation from the header dropdown above.
              </p>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <AssistantChatMessages
                messages={messages}
                isStreaming={isStreaming}
                streamedContent={streamedContent}
                onSelectPrompt={(prompt) => void sendMessage(prompt)}
                userName={user?.fullName || "You"}
                userImageUrl={user?.imageUrl}
              />
            </div>
          )}
        </SidebarContent>

        {/* Footer: Chat input */}
        <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar">
          <AssistantChatInput
            onSendMessage={sendMessage}
            onStop={stopGeneration}
            isStreaming={isStreaming}
            modelName={effectiveModel}
            onModelChange={changeModel}
            isArchived={Boolean(selectedThread?.archived_at)}
            disabled={!canCreateAssistant}
            placeholder={`Message ${effectiveModel || "assistant"}...`}
          />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

export default AssistantRightSidebar
