import { useEffect, useRef, useState } from "react"
import {
  BotMessageSquare,
  Check,
  Copy,
  Loader2,
  Sparkles,
  User,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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
  userName?: string
  userImageUrl?: string
}

export function AssistantChatMessages({
  messages,
  isStreaming,
  streamedContent,
  onSelectPrompt,
  userImageUrl,
}: AssistantChatMessagesProps) {
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
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const isUser = message.role === "user"
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
                  "flex gap-3 text-sm",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs shadow-2xs select-none",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/70 bg-muted/60 text-muted-foreground"
                  )}
                >
                  {isUser ? (
                    userImageUrl ? (
                      <img
                        src={userImageUrl}
                        alt="User"
                        className="size-7 rounded-full object-cover"
                      />
                    ) : (
                      <User className="size-3.5" />
                    )
                  ) : (
                    <BotMessageSquare className="size-3.5 text-primary" />
                  )}
                </div>

                {/* Bubble Container */}
                <div
                  className={cn(
                    "group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs shadow-2xs sm:max-w-[78%]",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/60 bg-card text-foreground"
                  )}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* Message Footer / Copy Button */}
                  <div
                    className={cn(
                      "mt-1.5 flex items-center gap-2 text-[10px]",
                      isUser
                        ? "justify-end text-primary-foreground/75"
                        : "justify-between text-muted-foreground"
                    )}
                  >
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, message.content)}
                        className="flex cursor-pointer items-center gap-1 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        title="Copy text"
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
                    )}

                    {formattedTime && (
                      <span className="shrink-0">{formattedTime}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Active Streaming Message Bubble */}
          {isStreaming && (
            <div className="flex flex-row gap-3 text-sm">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/60 text-xs text-muted-foreground shadow-2xs">
                <BotMessageSquare className="size-3.5 text-primary" />
              </div>

              <div className="max-w-[85%] rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 leading-relaxed text-xs text-foreground shadow-2xs sm:max-w-[78%]">
                {streamedContent ? (
                  <div className="whitespace-pre-wrap break-words">
                    {streamedContent}
                    <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-primary" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground italic">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Thinking...</span>
                  </div>
                )}
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
