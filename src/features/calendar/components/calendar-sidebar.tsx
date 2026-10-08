import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarNav } from "@/features/calendar/components/calendar-nav"
import { CalendarQuickCreate } from "@/features/calendar/components/calendar-quick-create"
import { CalendarItemList } from "@/features/calendar/components/calendar-item-list"
import { CalendarBatchActionBar } from "@/features/calendar/components/calendar-batch-action-bar"
import {
  useCalendarStore,
  useCalendarBatchSelectedIds,
} from "@/stores/calendar-store"
import type { Calendar, CalendarFolder } from "@/types/calendar"

export interface CalendarSidebarProps {
  activeFolder: CalendarFolder
  onSelectFolder: (folder: CalendarFolder) => void
  allCount: number
  archivedCount: number
  canCreate?: boolean
  onCreateCalendar?: (name?: string) => Promise<Calendar | void>
  calendars: Calendar[]
  selectedCalendarId: number | null
  onSelectCalendar: (id: number) => void
  isLoading: boolean
  searchQuery?: string
  selectedBatchIds?: number[]
  onSelectAllBatch?: () => void
  onClearBatchSelect?: () => void
  onBatchArchive?: (ids: number[]) => Promise<unknown>
  onBatchRestore?: (ids: number[]) => Promise<unknown>
  onBatchDelete?: (ids: number[]) => Promise<unknown>
}

export function CalendarSidebar({
  activeFolder,
  onSelectFolder,
  allCount,
  archivedCount,
  canCreate = true,
  onCreateCalendar,
  calendars,
  selectedCalendarId,
  onSelectCalendar,
  isLoading,
  searchQuery = "",
  selectedBatchIds = [],
  onSelectAllBatch,
  onClearBatchSelect,
  onBatchArchive,
  onBatchRestore,
  onBatchDelete,
}: CalendarSidebarProps) {
  const storeBatchIds = useCalendarBatchSelectedIds()
  const selectAll = useCalendarStore((state) => state.selectAllBatch)
  const clearBatch = useCalendarStore((state) => state.clearBatchSelect)
  const effectiveBatchIds =
    selectedBatchIds && selectedBatchIds.length > 0
      ? selectedBatchIds
      : storeBatchIds

  return (
    <>
      {/* Sidebar Header: Tab Switcher (Calendars / Archived) + Add New Calendar Button or Batch Action Bar */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar/30 p-2">
        {effectiveBatchIds.length > 0 ? (
          <CalendarBatchActionBar
            selectedIds={effectiveBatchIds}
            totalItemsCount={calendars.length}
            activeFolder={activeFolder}
            onSelectAll={
              onSelectAllBatch ?? (() => selectAll(calendars.map((c) => c.id)))
            }
            onClearSelection={onClearBatchSelect ?? clearBatch}
            onBatchArchive={onBatchArchive ?? (async () => {})}
            onBatchRestore={onBatchRestore ?? (async () => {})}
            onBatchDelete={onBatchDelete ?? (async () => {})}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <CalendarNav
                  activeFolder={activeFolder}
                  onSelectFolder={onSelectFolder}
                  allCount={allCount}
                  archivedCount={archivedCount}
                />
              </div>
            </div>

            {canCreate !== false && onCreateCalendar && (
              <CalendarQuickCreate onCreate={onCreateCalendar} />
            )}
          </>
        )}
      </SidebarHeader>

      {/* Sidebar Body: List of Calendars */}
      <SidebarContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <CalendarItemList
            calendars={calendars}
            selectedCalendarId={selectedCalendarId}
            isLoading={isLoading}
            activeFolder={activeFolder}
            searchQuery={searchQuery}
            onSelectCalendar={onSelectCalendar}
          />
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

export default CalendarSidebar
