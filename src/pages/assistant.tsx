import { useState } from "react"
import { CornerDownLeft, Sparkles, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  role: "assistant" | "user"
  text: string
  timestamp: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Hello! I am your Kaizen AI Assistant. How can I help you optimize your daily routine, summarize notes, or break down goals today?",
    timestamp: "10:00 AM",
  },
]

const QUICK_PROMPTS = [
  "Summarize today's inbox tasks",
  "Generate a 3-step action plan for my goals",
  "Review my habits and suggest 1% improvements",
]

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMessageId = `u-${crypto.randomUUID()}`
    const assistantMessageId = `a-${crypto.randomUUID()}`

    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      text: query,
      timestamp: "Just now",
    }

    const assistantResponse: Message = {
      id: assistantMessageId,
      role: "assistant",
      text: `Here is an actionable Kaizen recommendation for "${query}":\n\n1. Break the task down into micro-actions under 15 minutes.\n2. Eliminate friction points in your environment.\n3. Track daily completion streaks to build compound momentum.`,
      timestamp: "Just now",
    }

    setMessages((prev) => [...prev, userMessage, assistantResponse])
    setInput("")
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Your personal Kaizen co-pilot for continuous workflow and productivity optimization.
        </p>
      </div>

      {/* Messages Thread */}
      <Card className="flex flex-col min-h-[450px] p-4 bg-card/60 backdrop-blur-sm shadow-xs justify-between">
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[420px] p-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 text-sm ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <Sparkles className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>

              <div
                className={`rounded-xl p-3.5 max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground text-xs"
                    : "bg-muted/60 text-foreground text-xs"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Prompts & Input Area */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-border/50 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[11px] bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kaizen assistant anything..."
              className="h-9 text-xs"
            />
            <Button type="submit" size="sm" className="h-9 px-3 shrink-0">
              <CornerDownLeft className="size-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default AssistantPage
