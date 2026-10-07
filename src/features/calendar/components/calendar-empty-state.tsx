import { Calendar, ArchiveX, Search } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { CalendarFolder } from "@/types/calendar"

interface CalendarEmptyStateProps {
  isSearch?: boolean
  activeFolder?: CalendarFolder
}

export function CalendarEmptyState({
  isSearch = false,
  activeFolder = "calendars",
}: CalendarEmptyStateProps) {
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
            <Calendar className="size-6 text-primary" />
          )}
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-base font-semibold">
            {isSearch
              ? "No calendars found"
              : isArchived
                ? "No archived calendars"
                : "Calendars Zero"}
          </EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground text-balance">
            {isSearch
              ? "No calendars match your search query. Try typing something else."
              : isArchived
                ? "Calendars that have been archived will appear here."
                : "All caught up! Use the button above to create and organize schedules."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

export default CalendarEmptyState
