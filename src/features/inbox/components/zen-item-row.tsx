import { useState } from "react"
import { Check, Archive, Clock, MoreVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Zen } from "@/types/zen"
import { formatDistanceToNow } from "date-fns"

interface ZenItemRowProps {
  zen: Zen
  onClick: (zen: Zen) => void
  onArchive: (id: number) => Promise<void>
}

export function ZenItemRow({ zen, onClick, onArchive }: ZenItemRowProps) {
  const [isArchiving, setIsArchiving] = useState(false)

  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isArchiving) return

    try {
      setIsArchiving(true)
      await onArchive(zen.id)
    } finally {
      setIsArchiving(false)
    }
  }

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(zen.created_at), {
        addSuffix: true,
      })
    } catch {
      return "recently"
    }
  })()

  return (
    <div
      onClick={() => onClick(zen)}
      className="group relative flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-accent/40 hover:shadow-xs"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Quick Archive / Complete circle */}
        <button
          type="button"
          onClick={handleArchiveClick}
          disabled={isArchiving}
          aria-label="Archive item"
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-transparent transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {isArchiving ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <Check className="size-3 transition-opacity group-hover:opacity-40" />
          )}
        </button>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium leading-relaxed text-foreground truncate">
            {zen.name}
          </span>

          {zen.description && (
            <p className="line-clamp-2 mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {zen.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground/80">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Hover action buttons */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleArchiveClick}
          disabled={isArchiving}
          className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
          title="Archive item"
        >
          <Archive className="size-3.5" />
          <span className="sr-only">Archive</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 text-muted-foreground cursor-pointer"
          title="More options"
        >
          <MoreVertical className="size-3.5" />
          <span className="sr-only">More</span>
        </Button>
      </div>
    </div>
  )
}
