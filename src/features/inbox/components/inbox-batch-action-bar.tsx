import { useState } from "react"
import {
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  Loader2,
} from "lucide-react"
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
import type { ZenboxFolder } from "@/stores/zen-store"

export interface InboxBatchActionBarProps {
  selectedIds: number[]
  totalItemsCount: number
  activeFolder: ZenboxFolder
  onSelectAll: () => void
  onClearSelection: () => void
  onBatchArchive: (ids: number[]) => Promise<unknown>
  onBatchRestore: (ids: number[]) => Promise<unknown>
  onBatchDelete: (ids: number[]) => Promise<unknown>
  onBatchArchiveAndDelete: (ids: number[]) => Promise<unknown>
}

export function InboxBatchActionBar({
  selectedIds,
  totalItemsCount,
  activeFolder,
  onSelectAll,
  onClearSelection,
  onBatchArchive,
  onBatchRestore,
  onBatchDelete,
  onBatchArchiveAndDelete,
}: InboxBatchActionBarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

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
      if (activeFolder === "zenbox") {
        await onBatchArchiveAndDelete(selectedIds)
      } else {
        await onBatchDelete(selectedIds)
      }
      setIsConfirmOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-sidebar-accent/90 px-3 py-2 text-xs transition-colors backdrop-blur-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleMasterCheckboxChange}
            aria-label={isAllSelected ? "Deselect all" : "Select all"}
            className="size-3.5 cursor-pointer"
          />
          <span className="font-semibold text-xs text-foreground truncate">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeFolder === "zenbox" ? (
            <>
              {/* Batch Archive */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                disabled={isProcessing}
                className="h-7 gap-1 px-2 text-xs hover:bg-background/80"
                title={`Archive ${selectedIds.length} items`}
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Archive className="size-3.5" />
                )}
                <span>Archive</span>
              </Button>

              {/* Batch Archive & Delete */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isProcessing}
                className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                title={`Archive & Delete ${selectedIds.length} items`}
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            </>
          ) : (
            <>
              {/* Batch Restore */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestore}
                disabled={isProcessing}
                className="h-7 gap-1 px-2 text-xs hover:bg-background/80"
                title={`Restore ${selectedIds.length} items`}
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
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isProcessing}
                className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                title={`Delete ${selectedIds.length} items`}
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            </>
          )}

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="size-7 text-muted-foreground hover:bg-background/80 hover:text-foreground"
            title="Clear selection"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Batch Operations */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "item" : "items"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeFolder === "zenbox"
                ? `This will archive and permanently remove the selected ${selectedIds.length} ${
                    selectedIds.length === 1 ? "item" : "items"
                  } from your workspace. This action cannot be undone.`
                : `This will permanently remove the selected ${selectedIds.length} ${
                    selectedIds.length === 1 ? "item" : "items"
                  } from your workspace. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
              <span>
                Delete {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "item" : "items"}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default InboxBatchActionBar
