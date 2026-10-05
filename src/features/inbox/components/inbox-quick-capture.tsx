import React, { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InboxQuickCaptureProps {
  onCapture: (name: string) => Promise<void>
  disabled?: boolean
}

export function InboxQuickCapture({
  onCapture,
  disabled = false,
}: InboxQuickCaptureProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || isSubmitting) return

    try {
      setIsSubmitting(true)
      await onCapture(trimmed)
      setName("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-xs transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
        <Plus className="size-4" />
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Capture a thought, note, or item into inbox..."
        disabled={disabled || isSubmitting}
        className="h-8 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 md:text-xs"
      />

      <Button
        type="submit"
        size="sm"
        disabled={disabled || isSubmitting || !name.trim()}
        className="h-7 shrink-0 gap-1.5 px-3 text-xs cursor-pointer"
      >
        {isSubmitting ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <span>Capture</span>
        )}
      </Button>
    </form>
  )
}
