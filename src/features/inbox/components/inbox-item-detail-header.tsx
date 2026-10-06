import { useState } from "react"
import {
  Archive,
  ArchiveRestore,
  Check,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { formatDistanceToNow } from "date-fns"
import { cn } from "cn"
import type { Zen } from "@/types/zen"

export interface InboxItemDetailHeaderProps {
  zen: Zen | null
  saveStatus?: "idle" | "saving" | "saved"
  isProcessing?: boolean
  onToggleArchive?: () => Promise<void>
  onDelete?: () => Promise<void>
  className?: string
}

export function InboxItemDetailHeader({
  zen,
  saveStatus = "idle",
  isProcessing = false,
  onToggleArchive,
  onDelete,
  className,
}: InboxItemDetailHeaderProps) {
  const isArchived = Boolean(zen?.archived_at)
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
    if (!zen?.updated_at) return ""
    try {
      return formatDistanceToNow(new Date(zen.updated_at), { addSuffix: true })
    } catch {
      return "recently"
    }
  })()

  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <PageSidebarTrigger
          className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
          title="Toggle sidebar"
        />

        {zen && (
          <>
            <Separator orientation="vertical" />
            <Clock className="size-3.5" />
            <span>Updated {formattedDate}</span>

            {saveStatus !== "idle" && (
              <>
                <Separator orientation="vertical" />
                {saveStatus === "saving" ? (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="size-3 animate-spin text-primary" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" />
                    <span>Saved</span>
                  </span>
                )}
              </>
            )}

            {isArchived && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Archived
              </span>
            )}
          </>
        )}
      </div>

      {zen && (
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

      {/* Confirmation Dialog for Permanent Deletion */}
      {zen && isArchived && onDelete && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent size="default">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                <Trash2 className="size-4" />
              </AlertDialogMedia>
              <AlertDialogTitle>Permanently delete zen?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete &ldquo;
                {zen.name || "Untitled"}&rdquo;? This action cannot be undone
                and will permanently remove this item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing || isDeleting}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isProcessing || isDeleting}
                className="cursor-pointer gap-1.5 text-xs"
              >
                {isDeleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                <span>Delete permanently</span>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

export default InboxItemDetailHeader
