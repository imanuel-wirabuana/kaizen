import { useCalendars } from "@/features/calendar/hooks/use-calendars"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { CalendarSidebar } from "@/features/calendar/components/calendar-sidebar"
import { CalendarDetail } from "@/features/calendar/components/calendar-detail"

export function CalendarPage() {
  const { canRead, canCreate, canDelete, isLoading: isPermsLoading } =
    useWorkspacePermissions()

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

  // 1. calendars.read guard
  if (!isPermsLoading && !canRead("calendars")) {
    return (
      <AccessDeniedState
        resource="Calendars"
        description="You do not have permission to access calendars in this workspace."
      />
    )
  }

  const hasCreate = canCreate("calendars")
  const hasDelete = canDelete("calendars")

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <CalendarSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          allCount={allCount}
          archivedCount={archivedCount}
          canCreate={hasCreate}
          onCreateCalendar={hasCreate ? createCalendar : undefined}
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
          onBatchArchive={hasDelete ? batchArchiveCalendars : undefined}
          onBatchRestore={hasDelete ? batchRestoreCalendars : undefined}
          onBatchDelete={hasDelete ? batchDeleteCalendars : undefined}
        />
      }
    >
      <CalendarDetail
        calendar={selectedCalendar}
        isLoading={isLoading}
        selectedCalendarId={selectedCalendarId}
        onArchive={hasDelete ? archiveCalendar : undefined}
        onRestore={hasDelete ? restoreCalendar : undefined}
        onDelete={hasDelete ? deleteCalendar : undefined}
        onBackToCalendars={() => setSelectedCalendarId(null)}
      />
    </PageSidebarLayout>
  )
}

export default CalendarPage
