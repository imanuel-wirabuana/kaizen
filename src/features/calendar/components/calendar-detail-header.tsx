import { useState } from "react"
import { Archive, ArchiveRestore, Clock, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Calendar } from "@/types/calendar"

export interface CalendarDetailHeaderProps {
  calendar: Calendar | null
  isProcessing?: boolean
  onToggleArchive?: () => Promise<void>
  onDelete?: () => Promise<void>
  className?: string
}

export function CalendarDetailHeader({
  calendar,
  isProcessing = false,
  onToggleArchive,
  onDelete,
  className,
}: CalendarDetailHeaderProps) {
  const isArchived = Boolean(calendar?.archived_at)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!onDelete || isProcessing || isDeleting) return
    try {
      setIsDeleting(true)
      await onDelete()
      setIsConfirmOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const formattedDate = (() => {
    const timestamp = calendar?.updated_at || calendar?.created_at
    if (!timestamp) return ""
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return "recently"
    }
  })()

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs",
          className
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />

          {calendar && (
            <>
              <Separator orientation="vertical" />
              <Clock className="size-3.5" />
              <span>Updated {formattedDate}</span>

              {isArchived && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  Archived
                </span>
              )}
            </>
          )}
        </div>

        {calendar && (
          <div className="flex items-center gap-1.5">
            {onToggleArchive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleArchive}
                disabled={isProcessing || isDeleting}
                className="h-8 cursor-pointer gap-1.5 text-xs"
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isArchived ? (
                  <>
                    <ArchiveRestore className="size-3.5" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="size-3.5" />
                    <span>Archive</span>
                  </>
                )}
              </Button>
            )}

            {/* Delete action is only available once the item has been archived */}
            {isArchived && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isProcessing || isDeleting}
                className="h-8 cursor-pointer gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Permanent Deletion */}
      {calendar && isArchived && onDelete && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{calendar?.name}"?
              All events, schedules, and data inside this calendar will be
              permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Delete Calendar</span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
  </>
)
}

export default CalendarDetailHeader
