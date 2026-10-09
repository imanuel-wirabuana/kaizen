import { useUser } from "@clerk/clerk-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Board } from "@/types/board"
import type { MemberProfileData } from "@/types/member"

interface BoardItemRowProps {
  board: Board
  isSelected: boolean
  isBatchSelected: boolean
  isBatchMode: boolean
  profiles?: Record<string, MemberProfileData>
  onToggleBatch: (id: number) => void
  onClick: (id: number) => void
}

export function BoardItemRow({
  board,
  isSelected,
  isBatchSelected,
  isBatchMode,
  profiles,
  onToggleBatch,
  onClick,
}: BoardItemRowProps) {
  const { user } = useUser()

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(board.created_at), {
        addSuffix: true,
      })
    } catch {
      return "recently"
    }
  })()

  const isCurrentUser = Boolean(user && board.owner_id === user.id)
  const creatorProfile = board.owner_id && profiles ? profiles[board.owner_id] : undefined

  const ownerName = isCurrentUser
    ? "You"
    : creatorProfile?.displayName ||
      (typeof board.settings?.owner_name === "string" &&
        board.settings.owner_name) ||
      "Collaborator"

  const ownerFullName = isCurrentUser
    ? user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      "You"
    : creatorProfile?.displayName ||
      (typeof board.settings?.owner_name === "string" &&
        board.settings.owner_name) ||
      "Collaborator"

  const ownerImageUrl = isCurrentUser
    ? user?.imageUrl
    : creatorProfile?.avatarUrl ||
      (typeof board.settings?.owner_image === "string" &&
        board.settings.owner_image) ||
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
    if (creatorProfile?.displayName) {
      const parts = creatorProfile.displayName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return parts[0].slice(0, 2).toUpperCase()
    }
    const nameStr =
      (typeof board.settings?.owner_name === "string" &&
        board.settings.owner_name) ||
      ""
    if (nameStr.trim()) {
      const parts = nameStr.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return parts[0].slice(0, 2).toUpperCase()
    }
    return "CB"
  })()

  return (
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
          onToggleBatch(board.id)
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            onToggleBatch(board.id)
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
          aria-label={`Select ${board.name}`}
        />
      </div>

      {/* Clickable Item Content */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onToggleBatch(board.id)
            return
          }
          onClick(board.id)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick(board.id)
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 text-left outline-none"
      >
        {/* Top line: Board name & formatted timestamp */}
        <div className="flex w-full items-center gap-2">
          <span className="flex-1 truncate text-xs font-semibold text-foreground">
            {board.name}
          </span>
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        {/* Middle line: Description preview */}
        {board.description?.trim() ? (
          <span className="line-clamp-2 text-xs whitespace-break-spaces text-muted-foreground">
            {board.description}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">
            No notes or description provided.
          </span>
        )}

        {/* Bottom line: Creator Avatar + Name & optional archived indicator */}
        <div className="flex w-full items-center justify-between pt-1">
          <div
            className="flex items-center gap-1.5 text-muted-foreground"
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

          {Boolean(board.archived_at) && (
            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-medium text-amber-600 dark:text-amber-400">
              Archived
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default BoardItemRow
