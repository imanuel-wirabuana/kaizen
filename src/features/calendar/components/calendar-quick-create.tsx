import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Calendar } from "@/types/calendar"

export interface CalendarQuickCreateProps {
  onCreate?: (name?: string) => Promise<Calendar | void>
  disabled?: boolean
  className?: string
}

export function CalendarQuickCreate({
  onCreate,
  disabled = false,
  className,
}: CalendarQuickCreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setLocation] = useLocation()

  const handleClick = async () => {
    if (disabled || isSubmitting) return

    try {
      setIsSubmitting(true)
      const result = await onCreate?.("Untitled Calendar")
      if (result && typeof result === "object" && "id" in result) {
        setLocation(`/calendars/${result.id}`)
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
      <span>New Calendar</span>
    </Button>
  )
}

export default CalendarQuickCreate
