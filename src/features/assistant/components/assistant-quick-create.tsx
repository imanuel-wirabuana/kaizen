import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AiThread } from "@/types/assistant"

export interface AssistantQuickCreateProps {
  onCreate?: (title?: string) => Promise<AiThread | void>
  disabled?: boolean
  className?: string
}

export function AssistantQuickCreate({
  onCreate,
  disabled = false,
  className,
}: AssistantQuickCreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, setLocation] = useLocation()

  const handleClick = async () => {
    if (disabled || isSubmitting) return

    try {
      setIsSubmitting(true)
      const result = await onCreate?.("new convo")
      if (result && typeof result === "object" && "id" in result) {
        setLocation(`/assistant/${result.id}`)
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
      <span>New Convo</span>
    </Button>
  )
}

export default AssistantQuickCreate
