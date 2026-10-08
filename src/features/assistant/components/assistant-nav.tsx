import { ArchiveX, MessageSquare } from "lucide-react"
import type { AssistantFolder } from "@/types/assistant"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AssistantNavProps {
  activeFolder: AssistantFolder
  onSelectFolder: (folder: AssistantFolder) => void
  activeCount: number
  archivedCount: number
}

const NAV_ITEMS = [
  {
    id: "threads" as const,
    title: "Chats",
    icon: MessageSquare,
  },
  {
    id: "archived" as const,
    title: "Archived",
    icon: ArchiveX,
  },
]

export function AssistantNav({
  activeFolder,
  onSelectFolder,
  activeCount,
  archivedCount,
}: AssistantNavProps) {
  const getCount = (id: AssistantFolder) => {
    switch (id) {
      case "threads":
        return activeCount
      case "archived":
        return archivedCount
    }
  }

  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const count = getCount(item.id)
        const isActive = activeFolder === item.id

        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectFolder(item.id)}
            className={cn(
              "flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 px-2 text-xs transition-all",
              isActive
                ? "bg-card font-semibold text-foreground shadow-2xs hover:bg-card"
                : "font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-3.5 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/70"
              )}
            />
            <span className="truncate">{item.title}</span>
            {count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] leading-tight font-semibold",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

export default AssistantNav
