import { useCalendars } from "@/features/calendar/hooks/use-calendars"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { CalendarSidebar } from "@/features/calendar/components/calendar-sidebar"
import { CalendarDetail } from "@/features/calendar/components/calendar-detail"

export function CalendarPage() {
  const {
    filteredCalendars,
    selectedCalendar,
    selectedCalendarId,
    activeFolder,
    allCount,
    archivedCount,
    searchQuery,
    isLoading,
    selectedBatchIds,
    selectAllBatch,
    clearBatchSelect,
    createCalendar,
    archiveCalendar,
    restoreCalendar,
    deleteCalendar,
    batchArchiveCalendars,
    batchRestoreCalendars,
    batchDeleteCalendars,
    setSelectedCalendarId,
    setActiveFolder,
  } = useCalendars()

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <CalendarSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          allCount={allCount}
          archivedCount={archivedCount}
          onCreateCalendar={createCalendar}
          calendars={filteredCalendars}
          selectedCalendarId={selectedCalendarId}
          onSelectCalendar={setSelectedCalendarId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          selectedBatchIds={selectedBatchIds}
          onSelectAllBatch={() =>
            selectAllBatch(filteredCalendars.map((c) => c.id))
          }
          onClearBatchSelect={clearBatchSelect}
          onBatchArchive={batchArchiveCalendars}
          onBatchRestore={batchRestoreCalendars}
          onBatchDelete={batchDeleteCalendars}
        />
      }
    >
      <CalendarDetail
        calendar={selectedCalendar}
        isLoading={isLoading}
        selectedCalendarId={selectedCalendarId}
        onArchive={archiveCalendar}
        onRestore={restoreCalendar}
        onDelete={deleteCalendar}
        onBackToCalendars={() => setSelectedCalendarId(null)}
      />
    </PageSidebarLayout>
  )
}

export default CalendarPage
