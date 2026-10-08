import { useState, useRef, useEffect } from "react"
import { CornerDownLeft, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AssistantModelSelect } from "@/features/assistant/components/assistant-model-select"
import { cn } from "@/lib/utils"

export interface AssistantChatInputProps {
  onSendMessage: (content: string) => Promise<void>
  onStop: () => void
  isStreaming: boolean
  modelName: string
  onModelChange: (model: string) => void | Promise<unknown>
  isArchived?: boolean
  placeholder?: string
  initialValue?: string
  className?: string
}

export function AssistantChatInput({
  onSendMessage,
  onStop,
  isStreaming,
  modelName,
  onModelChange,
  isArchived = false,
  placeholder = "Ask assistant anything...",
  initialValue = "",
  className,
}: AssistantChatInputProps) {
  const [input, setInput] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue)
    }
  }, [initialValue])

  // Focus textarea on mount or when thread changes
  useEffect(() => {
    if (!isArchived && !isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isArchived, isStreaming])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || isArchived) return

    setInput("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await onSendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-adjust height up to max 160px
    const target = e.target
    target.style.height = "auto"
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`
  }

  if (isArchived) {
    return (
      <div className="border-t border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
        This conversation is archived. Restore it to send messages.
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-t border-border/50 bg-background/50 p-1 backdrop-blur-xs",
        className
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSend()
        }}
        className="relative flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2 shadow-2xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isStreaming}
          className="max-h-[160px] min-h-[38px] resize-none border-0 bg-transparent p-1 text-xs shadow-none focus-visible:ring-0"
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <AssistantModelSelect
              modelName={modelName}
              onModelChange={onModelChange}
              disabled={isStreaming}
            />

            <span className="hidden text-[10px] text-muted-foreground/75 select-none sm:inline">
              <span className="font-medium text-foreground/70">Enter</span> to
              send •{" "}
              <span className="font-medium text-foreground/70">
                Shift + Enter
              </span>{" "}
              newline
            </span>
          </div>

          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="h-7 cursor-pointer gap-1 px-2.5 text-xs font-medium"
            >
              <Square className="size-3 fill-current" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="h-7 cursor-pointer gap-1 px-2.5 text-xs font-medium"
            >
              <span>Send</span>
              <CornerDownLeft className="size-3" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default AssistantChatInput
