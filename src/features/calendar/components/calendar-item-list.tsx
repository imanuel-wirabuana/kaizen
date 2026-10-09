import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { CalendarEmptyState } from "@/features/calendar/components/calendar-empty-state"
import { CalendarItemRow } from "@/features/calendar/components/calendar-item-row"
import { useWorkspaceMemberProfiles } from "@/features/members/hooks/use-workspace-members"
import {
  useCalendarStore,
  useCalendarBatchSelectedIds,
} from "@/stores/calendar-store"
import type { Calendar, CalendarFolder } from "@/types/calendar"

interface CalendarItemListProps {
  calendars: Calendar[]
  selectedCalendarId: number | null
  isLoading: boolean
  activeFolder: CalendarFolder
  searchQuery?: string
  onSelectCalendar: (id: number) => void
}

export function CalendarItemList({
  calendars,
  selectedCalendarId,
  isLoading,
  activeFolder,
  searchQuery = "",
  onSelectCalendar,
}: CalendarItemListProps) {
  const selectedBatchIds = useCalendarBatchSelectedIds()
  const toggleBatchSelect = useCalendarStore((state) => state.toggleBatchSelect)
  const isBatchMode = selectedBatchIds.length > 0
  const memberProfiles = useWorkspaceMemberProfiles()

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
        Loading calendars...
      </div>
    )
  }

  if (calendars.length === 0) {
    return (
      <CalendarEmptyState
        isSearch={Boolean(searchQuery.trim())}
        activeFolder={activeFolder}
      />
    )
  }

  return (
    <SidebarMenu className="gap-0 p-0">
      {calendars.map((calendar) => {
        const isSelected = selectedCalendarId === calendar.id
        const isBatchSelected = selectedBatchIds.includes(calendar.id)

        return (
          <SidebarMenuItem
            key={calendar.id}
            className="group/item border-b border-border/50 p-0 last:border-b-0"
          >
            <CalendarItemRow
              calendar={calendar}
              isSelected={isSelected}
              isBatchSelected={isBatchSelected}
              isBatchMode={isBatchMode}
              profiles={memberProfiles}
              onToggleBatch={toggleBatchSelect}
              onClick={onSelectCalendar}
            />
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export default CalendarItemList

