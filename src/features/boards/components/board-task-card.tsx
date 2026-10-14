import { useLocation } from "wouter"
import { useSortable } from "@dnd-kit/react/sortable"
import { GripVertical, MoreHorizontal, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "cn"
import type { TaskWithZen } from "@/types/task"

export interface BoardTaskCardProps {
  task: TaskWithZen
  index: number
  laneId: number
  onDelete: (taskId: number, zenId: number) => void
}

export function BoardTaskCard({
  task,
  index,
  laneId,
  onDelete,
}: BoardTaskCardProps) {
  const [, setLocation] = useLocation()

  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    type: "item",
    accept: "item",
    group: String(laneId),
  })

  const title = task.zen?.name || "Untitled Zen"
  const description = task.zen?.description?.trim()

  const handleOpenZenbox = () => {
    setLocation(`/zenbox/${task.zen_id}`)
  }

  return (
    <Card
      ref={ref}
      data-dragging={isDragging}
      onClick={handleOpenZenbox}
      className={cn(
        "group relative cursor-pointer gap-1.5 border border-border/80 bg-background p-3 text-left shadow-xs transition-all duration-150 select-none",
        "hover:border-primary/50 hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40 ring-2 ring-primary/40 shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/80 cursor-grab" />
          <span className="truncate text-xs font-medium text-foreground">
            {title}
          </span>
        </div>

        {/* Card actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-5 shrink-0 text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-foreground"
              >
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">Zen actions</span>
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-36 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={handleOpenZenbox}
              className="gap-2 cursor-pointer text-xs"
            >
              <ExternalLink className="size-3.5 text-muted-foreground" />
              <span>Open in Zenbox</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id, task.zen_id)}
              className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Zen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {description && (
        <p className="line-clamp-2 pl-5 text-[11px] leading-relaxed text-muted-foreground/80">
          {description}
        </p>
      )}
    </Card>
  )
}
