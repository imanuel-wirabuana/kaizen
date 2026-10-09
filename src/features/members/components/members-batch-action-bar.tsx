import { useState, useEffect } from "react"
import { Trash2, X, Loader2, RotateCcw, UserX, KeyRound } from "lucide-react"
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

export interface MembersBatchActionBarProps {
  selectedIds: number[]
  totalItemsCount: number
  entityName: "member" | "invite"
  hasActiveSelected: boolean
  hasRevokedSelected: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onBatchRevoke: (ids: number[]) => Promise<unknown>
  onBatchRestore: (ids: number[]) => Promise<unknown>
  onBatchDelete: (ids: number[]) => Promise<unknown>
  className?: string
}

export function MembersBatchActionBar({
  selectedIds,
  totalItemsCount,
  entityName,
  hasActiveSelected,
  hasRevokedSelected,
  onSelectAll,
  onClearSelection,
  onBatchRevoke,
  onBatchRestore,
  onBatchDelete,
  className,
}: MembersBatchActionBarProps) {
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

  const handleRevoke = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      await onBatchRevoke(selectedIds)
      onClearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      await onBatchRestore(selectedIds)
      onClearSelection()
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
      onClearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const labelPlural =
    entityName === "member"
      ? selectedIds.length === 1
        ? "member"
        : "members"
      : selectedIds.length === 1
        ? "invite"
        : "invites"

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
                  title={`Select all ${totalItemsCount} ${entityName}s`}
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
        <div className="flex w-full items-center gap-1.5">
          {hasActiveSelected && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRevoke}
              disabled={isProcessing}
              className="h-8 flex-1 cursor-pointer gap-1.5 px-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive shadow-2xs"
              title={`Revoke selected ${labelPlural}`}
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : entityName === "member" ? (
                <UserX className="size-3.5" />
              ) : (
                <KeyRound className="size-3.5" />
              )}
              <span>Revoke</span>
            </Button>
          )}

          {hasRevokedSelected && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestore}
              disabled={isProcessing}
              className="h-8 flex-1 cursor-pointer gap-1.5 px-2 text-xs font-medium shadow-2xs"
              title={`Restore selected ${labelPlural}`}
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              <span>Restore</span>
            </Button>
          )}

          {hasRevokedSelected && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isProcessing}
              className="h-8 flex-1 cursor-pointer gap-1.5 px-2 text-xs font-medium shadow-2xs"
              title={`Permanently delete selected revoked ${labelPlural}`}
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Batch Operations */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete {selectedIds.length} {labelPlural}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected {selectedIds.length}{" "}
              {labelPlural} from your workspace. This action cannot be undone.
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
                Delete {selectedIds.length} {labelPlural}
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default MembersBatchActionBar
