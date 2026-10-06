import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { InboxEmptyState } from "@/features/inbox/components/inbox-empty-state"
import type { Zen } from "@/types/zen"
import { cn } from "cn"
import { formatDistanceToNow } from "date-fns"

interface InboxItemListProps {
  zens: Zen[]
  selectedZenId: number | null
  isLoading: boolean
  searchQuery?: string
  onSelectZen: (id: number) => void
}

export function InboxItemList({
  zens,
  selectedZenId,
  isLoading,
  searchQuery = "",
  onSelectZen,
}: InboxItemListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
        Loading items...
      </div>
    )
  }

  if (zens.length === 0) {
    return <InboxEmptyState isSearch={Boolean(searchQuery.trim())} />
  }

  return (
    <SidebarMenu className="gap-0 p-0">
      {zens.map((zen) => {
        const isSelected = selectedZenId === zen.id

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
          <SidebarMenuItem
            key={zen.id}
            className="p-0 border-b border-border/50 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onSelectZen(zen.id)}
              className={cn(
                "flex flex-col items-start gap-1.5 p-3.5 text-left text-sm leading-tight transition-colors cursor-pointer w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isSelected &&
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <div className="flex w-full items-center gap-2">
                <span className="font-semibold text-xs text-foreground truncate">
                  {zen.name}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                  {formattedDate}
                </span>
              </div>

              {zen.description ? (
                <span className="line-clamp-2 text-xs text-muted-foreground whitespace-break-spaces">
                  {zen.description}
                </span>
              ) : (
                <span className="text-xs italic text-muted-foreground/60">
                  No notes or description provided.
                </span>
              )}
            </button>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
