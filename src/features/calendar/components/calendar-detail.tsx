import { useState } from "react"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarDetailHeader } from "@/features/calendar/components/calendar-detail-header"
import type { Calendar } from "@/types/calendar"

export interface CalendarDetailProps {
  calendar: Calendar | null
  isLoading?: boolean
  selectedCalendarId?: number | null
  onArchive: (id: number) => Promise<boolean>
  onRestore: (id: number) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
  onBackToCalendars?: () => void
}

export function CalendarDetail({
  calendar,
  isLoading = false,
  selectedCalendarId = null,
  onArchive,
  onRestore,
  onDelete,
  onBackToCalendars,
}: CalendarDetailProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleToggleArchive = async () => {
    if (!calendar || isProcessing) return
    try {
      setIsProcessing(true)
      if (calendar.archived_at) {
        await onRestore(calendar.id)
      } else {
        await onArchive(calendar.id)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!calendar || isProcessing) return
    try {
      setIsProcessing(true)
      await onDelete(calendar.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Fixed Top Action & Detail Bar */}
      <CalendarDetailHeader
        calendar={calendar}
        isProcessing={isProcessing}
        onToggleArchive={calendar ? handleToggleArchive : undefined}
        onDelete={calendar ? handleDelete : undefined}
      />

      {/* Main Detail Body (Scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* If a calendar ID was specified in URL and is still loading */}
        {isLoading && selectedCalendarId !== null ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Loading calendar details...
            </p>
          </div>
        ) : selectedCalendarId !== null && !calendar ? (
          /* If a calendar ID was specified in URL but not found */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <CalendarIcon className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Calendar not found
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              This calendar does not exist or may have been permanently deleted.
            </p>
            {onBackToCalendars && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToCalendars}
                className="mt-4 cursor-pointer text-xs"
              >
                Back to Calendars
              </Button>
            )}
          </div>
        ) : !calendar ? (
          /* Default empty state when on /calendars with no calendar selected */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <CalendarIcon className="size-6" />
            </div>
            <p className="text-sm font-medium">Select a calendar to view</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              Choose a calendar from the list on the left to read its details,
              view schedules, or manage its status.
            </p>
          </div>
        ) : (
          /* Active Calendar Canvas: Empty Placeholder State */
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-6 sm:p-8">
            <div className="flex flex-col gap-1.5 pb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {calendar.name}
              </h1>
              {calendar.description?.trim() ? (
                <p className="text-sm text-muted-foreground">
                  {calendar.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">
                  No description provided.
                </p>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                <CalendarIcon className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                This calendar is currently empty
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Events, schedules, and milestones will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarDetail
