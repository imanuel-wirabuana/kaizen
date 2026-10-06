import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Zen } from "@/types/zen"

export interface InboxQuickCaptureProps {
  onCapture?: (name?: string) => Promise<Zen | void>
  disabled?: boolean
  className?: string
}

export function InboxQuickCapture({
  onCapture,
  disabled = false,
  className,
}: InboxQuickCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setLocation] = useLocation()

  const handleClick = async () => {
    if (disabled || isSubmitting) return

    try {
      setIsSubmitting(true)
      const result = await onCapture?.("Untitled")
      if (result && typeof result === "object" && "id" in result) {
        setLocation(`/zenbox/${result.id}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      className={cn(
        "h-8 w-full cursor-pointer justify-center gap-2 text-xs font-medium shadow-xs transition-all",
        className
      )}
    >
      {isSubmitting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Plus className="size-3.5" />
      )}
      <span>New Zen</span>
    </Button>
  )
}

export default InboxQuickCapture
