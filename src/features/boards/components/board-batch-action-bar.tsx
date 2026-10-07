import { useState, useEffect } from "react"
import { Archive, ArchiveRestore, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import type { BoardFolder } from "@/types/board"

export interface BoardBatchActionBarProps {
  selectedIds: number[]
  totalItemsCount: number
  activeFolder: BoardFolder
  onSelectAll: () => void
  onClearSelection: () => void
  onBatchArchive: (ids: number[]) => Promise<unknown>
  onBatchRestore: (ids: number[]) => Promise<unknown>
  onBatchDelete: (ids: number[]) => Promise<unknown>
  className?: string
}

export function BoardBatchActionBar({
  selectedIds,
  totalItemsCount,
  activeFolder,
  onSelectAll,
  onClearSelection,
  onBatchArchive,
  onBatchRestore,
  onBatchDelete,
  className,
}: BoardBatchActionBarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Listen for Escape key to quickly clear selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirmOpen) {
        onClearSelection()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClearSelection, isConfirmOpen])

  if (selectedIds.length === 0) {
    return null
  }

  const isAllSelected =
    totalItemsCount > 0 && selectedIds.length === totalItemsCount

  const handleMasterCheckboxChange = () => {
    if (isAllSelected) {
      onClearSelection()
    } else {
      onSelectAll()
    }
  }

  const handleArchive = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      await onBatchArchive(selectedIds)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      await onBatchRestore(selectedIds)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      await onBatchDelete(selectedIds)
      setIsConfirmOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex w-full animate-in flex-col gap-2 duration-150 fade-in-50",
          className
        )}
      >
        {/* Tier 1: Selection Status & Master Controls */}
        <div className="flex h-7 items-center justify-between px-1">
          <div className="flex min-w-0 items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleMasterCheckboxChange}
              aria-label={isAllSelected ? "Deselect all" : "Select all"}
              className="size-3.5 cursor-pointer border border-primary"
            />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs font-semibold text-foreground">
                {selectedIds.length} selected
              </span>
              {totalItemsCount > 0 && selectedIds.length < totalItemsCount && (
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="cursor-pointer text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  title={`Select all ${totalItemsCount} boards`}
                >
                  (All {totalItemsCount})
                </button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="h-6 cursor-pointer gap-1 px-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            title="Clear selection (Esc)"
          >
            <X className="size-3.5" />
            <span>Done</span>
          </Button>
        </div>

        {/* Tier 2: Dedicated Batch Actions Grid */}
        <div className="w-full">
          {activeFolder !== "archived" ? (
            /* Active folder: Delete forbidden - must archive first */
            <Button
              size="sm"
              onClick={handleArchive}
              disabled={isProcessing}
              className="h-8 w-full cursor-pointer gap-1.5 px-2 text-xs font-medium shadow-2xs"
              title={`Archive ${selectedIds.length} boards`}
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Archive className="size-3.5" />
              )}
              <span>Archive</span>
            </Button>
          ) : (
            /* Archived folder: Restore or Permanent Delete allowed */
            <div className="grid w-full grid-cols-2 gap-1.5">
              {/* Batch Restore */}
              <Button
                size="sm"
                onClick={handleRestore}
                disabled={isProcessing}
                className="h-8 cursor-pointer gap-1.5 px-2 text-xs font-medium shadow-2xs"
                title={`Restore ${selectedIds.length} boards`}
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ArchiveRestore className="size-3.5" />
                )}
                <span>Restore</span>
              </Button>

              {/* Batch Permanent Delete */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isProcessing}
                className="h-8 cursor-pointer gap-1.5 border-destructive/20 px-2 text-xs font-medium text-destructive shadow-2xs hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                title={`Delete ${selectedIds.length} boards`}
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Batch Operations */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "board" : "boards"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "board" : "boards"} from your workspace.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
              <span>
                Delete {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "board" : "boards"}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default BoardBatchActionBar
