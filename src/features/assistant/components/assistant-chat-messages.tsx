import { useEffect, useRef, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  BotMessageSquare,
  Check,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useActiveWorkspace } from "@/stores/workspace-store"
import { useWorkspaceMemberProfiles } from "@/features/members/hooks/use-workspace-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AiMessage } from "@/types/assistant"

export const STARTER_PROMPTS = [
  "How can I apply the 1% Kaizen rule to my work today?",
  "Help me structure a focused 25-minute sprint",
  "How to break down an overwhelming project into micro-tasks?",
  "Suggest ideas for improving daily momentum",
]

export interface AssistantChatMessagesProps {
  messages: AiMessage[]
  isStreaming: boolean
  streamedContent: string
  onSelectPrompt: (prompt: string) => void
  modelName?: string
  userName?: string
  userImageUrl?: string
}

export function AssistantChatMessages({
  messages,
  isStreaming,
  streamedContent,
  onSelectPrompt,
  modelName,
  userImageUrl,
}: AssistantChatMessagesProps) {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceProfiles = useWorkspaceMemberProfiles()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<number | string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamedContent, isStreaming])

  const handleCopy = async (id: number | string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.warn("Failed to copy message:", err)
    }
  }

  // Resolve sender display info based on owner_id and workspace profiles
  const getSenderDetails = (message: AiMessage) => {
    const isAssistant = message.role === "assistant"
    if (isAssistant) {
      return {
        isAssistant: true,
        isCurrentUser: false,
        name: "Kaizen Assistant",
        avatarUrl: undefined,
        initials: "AI",
        isOwner: false,
      }
    }

    const isCurrentUser = Boolean(user && message.owner_id === user.id)
    if (isCurrentUser) {
      const first = user?.firstName?.[0]
      const last = user?.lastName?.[0]
      const initials =
        first && last
          ? `${first}${last}`.toUpperCase()
          : first
            ? first.toUpperCase()
            : user?.username?.slice(0, 2).toUpperCase() || "U"

      return {
        isAssistant: false,
        isCurrentUser: true,
        name: "You",
        avatarUrl: user?.imageUrl || userImageUrl,
        initials,
        isOwner: Boolean(
          activeWorkspace && user && activeWorkspace.owner_id === user.id
        ),
      }
    }

    // Collaborator message (another workspace member)
    const profile = message.owner_id
      ? workspaceProfiles[message.owner_id]
      : undefined
    const metadataName =
      typeof message.metadata?.sender_name === "string"
        ? message.metadata.sender_name
        : undefined
    const metadataAvatar =
      typeof message.metadata?.sender_avatar === "string"
        ? message.metadata.sender_avatar
        : undefined

    const name = profile?.displayName || metadataName || "Collaborator"
    const avatarUrl = profile?.avatarUrl || metadataAvatar

    const initials = (() => {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return parts[0]?.slice(0, 2).toUpperCase() || "CB"
    })()

    return {
      isAssistant: false,
      isCurrentUser: false,
      name,
      avatarUrl,
      initials,
      isOwner: Boolean(
        activeWorkspace &&
          message.owner_id &&
          activeWorkspace.owner_id === message.owner_id
      ),
    }
  }

  const hasMessages = messages.length > 0 || isStreaming

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      {/* If Thread is empty: show Welcome Greeting & Starter Prompts */}
      {!hasMessages && (
        <div className="my-auto flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
            <Sparkles className="size-6" />
          </div>

          <h3 className="text-base font-semibold tracking-tight text-foreground">
            What can we improve today?
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            I embody the Kaizen philosophy of continuous 1% compounding progress.
            Ask for advice on task planning, time management, or sprint focus.
          </p>

          <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-left text-xs text-foreground/90 transition-all hover:border-primary/40 hover:bg-muted/80 hover:text-foreground"
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render Message History */}
      {hasMessages && (
        <div className="flex flex-col gap-5">
          {messages.map((message) => {
            const sender = getSenderDetails(message)
            const formattedTime = (() => {
              try {
                return formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                })
              } catch {
                return ""
              }
            })()

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 text-sm",
                  sender.isCurrentUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Author Avatar */}
                {sender.isAssistant ? (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-2xs select-none">
                    <BotMessageSquare className="size-3.5" />
                  </div>
                ) : (
                  <Avatar className="size-7 shrink-0 shadow-2xs select-none">
                    {sender.avatarUrl ? (
                      <AvatarImage src={sender.avatarUrl} alt={sender.name} />
                    ) : null}
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold uppercase leading-none",
                        sender.isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {sender.initials}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message Content Container */}
                <div
                  className={cn(
                    "flex flex-col",
                    sender.isCurrentUser ? "items-end" : "items-start",
                    "max-w-[85%] sm:max-w-[78%]"
                  )}
                >
                  {/* Sender Header Meta */}
                  <div
                    className={cn(
                      "mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground select-none",
                      sender.isCurrentUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        sender.isCurrentUser
                          ? "text-primary-foreground/90 dark:text-foreground"
                          : "text-foreground"
                      )}
                    >
                      {sender.name}
                    </span>

                    {sender.isAssistant && modelName && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-medium text-primary">
                        {modelName}
                      </span>
                    )}

                    {!sender.isAssistant && !sender.isCurrentUser && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[9px] font-medium",
                          sender.isOwner
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {sender.isOwner ? "Owner" : "Member"}
                      </span>
                    )}

                    {formattedTime && (
                      <span className="text-[10px] text-muted-foreground/75">
                        • {formattedTime}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "group relative w-full rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs shadow-2xs",
                      sender.isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : sender.isAssistant
                          ? "border border-border/60 bg-card text-foreground"
                          : "border border-border/80 bg-muted/65 text-foreground"
                    )}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>

                    {/* Footer / Copy Action */}
                    <div
                      className={cn(
                        "mt-1.5 flex items-center gap-2 text-[10px]",
                        sender.isCurrentUser
                          ? "justify-end text-primary-foreground/75"
                          : "justify-between text-muted-foreground"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, message.content)}
                        className={cn(
                          "flex cursor-pointer items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                          sender.isCurrentUser
                            ? "hover:text-primary-foreground"
                            : "hover:text-foreground"
                        )}
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Active Streaming Message Bubble */}
          {isStreaming && (
            <div className="flex items-start gap-3 text-sm">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-2xs select-none">
                <BotMessageSquare className="size-3.5" />
              </div>

              <div className="flex max-w-[85%] flex-col items-start sm:max-w-[78%]">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground select-none">
                  <span className="font-medium text-foreground">
                    Kaizen Assistant
                  </span>
                  {modelName && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-medium text-primary">
                      {modelName}
                    </span>
                  )}
                </div>

                <div className="w-full rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 leading-relaxed text-xs text-foreground shadow-2xs">
                  {streamedContent ? (
                    <div className="whitespace-pre-wrap break-words">
                      {streamedContent}
                      <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-0.5 text-xs italic text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}

export default AssistantChatMessages
