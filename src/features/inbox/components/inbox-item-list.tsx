import { useUser } from "@clerk/clerk-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { InboxEmptyState } from "@/features/inbox/components/inbox-empty-state"
import { useBatchSelectedIds, useZenStore } from "@/stores/zen-store"
import type { Zen } from "@/types/zen"
import { cn } from "cn"
import { formatDistanceToNow } from "date-fns"
import { stripHtml } from "@/lib/formatters"

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
  const { user } = useUser()
  const selectedBatchIds = useBatchSelectedIds()
  const toggleBatchSelect = useZenStore((state) => state.toggleBatchSelect)
  const isBatchMode = selectedBatchIds.length > 0

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
        const isBatchSelected = selectedBatchIds.includes(zen.id)

        const formattedDate = (() => {
          try {
            return formatDistanceToNow(new Date(zen.created_at), {
              addSuffix: true,
            })
          } catch {
            return "recently"
          }
        })()

        const isCurrentUser = Boolean(user && zen.owner_id === user.id)

        const ownerName = isCurrentUser
          ? "You"
          : (typeof zen.settings?.owner_name === "string" &&
              zen.settings.owner_name) ||
            "Member"

        const ownerFullName = isCurrentUser
          ? user?.fullName ||
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            user?.username ||
            "You"
          : (typeof zen.settings?.owner_name === "string" &&
              zen.settings.owner_name) ||
            "Member"

        const ownerImageUrl = isCurrentUser
          ? user?.imageUrl
          : (typeof zen.settings?.owner_image === "string" &&
              zen.settings.owner_image) ||
            undefined

        const initials = (() => {
          if (isCurrentUser) {
            const first = user?.firstName?.[0]
            const last = user?.lastName?.[0]
            if (first && last) return `${first}${last}`.toUpperCase()
            if (first) return first.toUpperCase()
            if (user?.username) return user.username.slice(0, 2).toUpperCase()
            return "U"
          }
          const nameStr =
            (typeof zen.settings?.owner_name === "string" &&
              zen.settings.owner_name) ||
            ""
          if (nameStr.trim()) {
            const parts = nameStr.trim().split(/\s+/)
            if (parts.length >= 2) {
              return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            }
            return parts[0].slice(0, 2).toUpperCase()
          }
          return "M"
        })()

        return (
          <SidebarMenuItem
            key={zen.id}
            className="group/item border-b border-border/50 p-0 last:border-b-0"
          >
            <div
              className={cn(
                "group relative flex w-full items-start gap-2 p-2.5 text-left text-sm leading-tight transition-colors select-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isSelected &&
                  "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                isBatchSelected &&
                  "bg-sidebar-accent/60 ring-1 ring-primary/30 ring-inset"
              )}
            >
              {/* Standalone Checkbox Area */}
              <div
                role="checkbox"
                tabIndex={0}
                aria-checked={isBatchSelected}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleBatchSelect(zen.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleBatchSelect(zen.id)
                  }
                }}
                className={cn(
                  "mt-0.5 flex size-4 cursor-pointer items-center justify-center transition-opacity",
                  isBatchMode || isBatchSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                <Checkbox
                  checked={isBatchSelected}
                  tabIndex={-1}
                  className="size-3.5 pointer-events-none border-primary"
                  aria-label={`Select ${zen.name}`}
                />
              </div>

              {/* Clickable Item Content */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) {
                    e.preventDefault()
                    toggleBatchSelect(zen.id)
                    return
                  }
                  onSelectZen(zen.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectZen(zen.id)
                  }
                }}
                className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 text-left outline-none"
              >
                <div className="flex w-full items-center gap-2">
                  <span className="flex-1 truncate text-xs font-semibold text-foreground">
                    {zen.name}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {formattedDate}
                  </span>
                </div>

                {stripHtml(zen.description) ? (
                  <span className="line-clamp-2 text-xs whitespace-break-spaces text-muted-foreground">
                    {stripHtml(zen.description)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/60 italic">
                    No notes or description provided.
                  </span>
                )}

                <div
                  className="flex w-full items-center gap-1.5 pt-1 text-muted-foreground"
                  title={`Created by ${ownerFullName}`}
                >
                  <Avatar className="size-4 shrink-0">
                    {ownerImageUrl ? (
                      <AvatarImage src={ownerImageUrl} alt={ownerFullName} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-[8px] leading-none font-semibold text-muted-foreground uppercase">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[11px] font-normal">
                    {ownerName}
                  </span>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
