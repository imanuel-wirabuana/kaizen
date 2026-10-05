import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SidebarInput } from "@/components/ui/sidebar"
import { InboxQuickCapture } from "@/features/inbox/components/inbox-quick-capture"
import { InboxEmptyState } from "@/features/inbox/components/inbox-empty-state"
import type { Zen } from "@/types/zen"
import type { InboxFolder } from "@/stores/zen-store"
import { cn } from "cn"
import { formatDistanceToNow } from "date-fns"

interface InboxItemListProps {
  zens: Zen[]
  selectedZenId: number | null
  activeFolder: InboxFolder
  searchQuery: string
  showUnreadOnly: boolean
  isLoading: boolean
  onSelectZen: (id: number) => void
  onSearchChange: (query: string) => void
  onToggleUnread: (checked: boolean) => void
  onCapture: (name: string) => Promise<void>
}

export function InboxItemList({
  zens,
  selectedZenId,
  activeFolder,
  searchQuery,
  showUnreadOnly,
  isLoading,
  onSelectZen,
  onSearchChange,
  onToggleUnread,
  onCapture,
}: InboxItemListProps) {
  const folderTitle =
    activeFolder === "inbox"
      ? "Inbox"
      : activeFolder === "archived"
        ? "Archived"
        : "All Items"

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 border-r border-border bg-sidebar/20">
      {/* Header matching shadcn sidebar-06 */}
      <div className="flex flex-col gap-3.5 border-b border-border p-4 shrink-0">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium text-foreground">
            {folderTitle}
          </div>
          <Label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <span>Filter</span>
            <Switch
              checked={showUnreadOnly}
              onCheckedChange={onToggleUnread}
              className="shadow-none scale-90"
            />
          </Label>
        </div>

        <SidebarInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Type to search..."
          className="bg-card text-xs h-8"
        />

        {/* Quick capture */}
        <InboxQuickCapture onCapture={onCapture} />
      </div>

      {/* Content list */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
            Loading items...
          </div>
        ) : zens.length === 0 ? (
          <InboxEmptyState isSearch={Boolean(searchQuery.trim())} />
        ) : (
          <div className="flex flex-col">
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
                <button
                  type="button"
                  key={zen.id}
                  onClick={() => onSelectZen(zen.id)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 border-b border-border/60 p-4 text-left text-sm leading-tight transition-colors last:border-b-0 cursor-pointer w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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

                  <span className="font-medium text-xs text-foreground/90 truncate w-full">
                    {zen.name}
                  </span>

                  <span className="line-clamp-2 text-xs text-muted-foreground whitespace-break-spaces">
                    {zen.description || "No notes or description provided."}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
