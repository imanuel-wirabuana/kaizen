import { Kanban, ArchiveX, Search } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { BoardFolder } from "@/types/board"

interface BoardEmptyStateProps {
  isSearch?: boolean
  activeFolder?: BoardFolder
}

export function BoardEmptyState({
  isSearch = false,
  activeFolder = "boards",
}: BoardEmptyStateProps) {
  const isArchived = activeFolder === "archived"

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Empty className="max-w-sm border border-dashed border-border/80 bg-card/40 p-8 shadow-xs">
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-xl bg-primary/10 text-primary"
        >
          {isSearch ? (
            <Search className="size-6 text-muted-foreground" />
          ) : isArchived ? (
            <ArchiveX className="size-6 text-muted-foreground" />
          ) : (
            <Kanban className="size-6 text-primary" />
          )}
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-base font-semibold">
            {isSearch
              ? "No boards found"
              : isArchived
                ? "No archived boards"
                : "Boards Zero"}
          </EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground text-balance">
            {isSearch
              ? "No boards match your search query. Try typing something else."
              : isArchived
                ? "Boards that have been archived will appear here."
                : "All caught up! Use the button above to create and organize project boards."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

export default BoardEmptyState
