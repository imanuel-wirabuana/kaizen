import { useState } from "react"
import { Kanban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BoardDetailHeader } from "@/features/boards/components/board-detail-header"
import { BoardCanvas } from "@/features/boards/components/board-canvas"
import type { Board } from "@/types/board"

export interface BoardDetailProps {
  board: Board | null
  isLoading?: boolean
  selectedBoardId?: number | null
  onArchive?: (id: number) => Promise<boolean>
  onRestore?: (id: number) => Promise<boolean>
  onDelete?: (id: number) => Promise<boolean>
  onBackToBoards?: () => void
}

export function BoardDetail({
  board,
  isLoading = false,
  selectedBoardId = null,
  onArchive,
  onRestore,
  onDelete,
  onBackToBoards,
}: BoardDetailProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAddingLane, setIsAddingLane] = useState(false)

  const handleToggleArchive = async () => {
    if (!board || isProcessing) return
    try {
      setIsProcessing(true)
      if (board.archived_at && onRestore) {
        await onRestore(board.id)
      } else if (!board.archived_at && onArchive) {
        await onArchive(board.id)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!board || isProcessing || !onDelete) return
    try {
      setIsProcessing(true)
      await onDelete(board.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Fixed Top Action & Detail Bar */}
      <BoardDetailHeader
        board={board}
        isProcessing={isProcessing}
        onToggleArchive={
          board && (board.archived_at ? onRestore : onArchive)
            ? handleToggleArchive
            : undefined
        }
        onDelete={board && onDelete ? handleDelete : undefined}
        onAddColumn={
          board && !board.archived_at ? () => setIsAddingLane(true) : undefined
        }
      />

      {/* Main Detail Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* If a board ID was specified in URL and is still loading */}
        {isLoading && selectedBoardId !== null ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading board details...</p>
          </div>
        ) : selectedBoardId !== null && !board ? (
          /* If a board ID was specified in URL but not found */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Kanban className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Board not found</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              This board does not exist or may have been permanently deleted.
            </p>
            {onBackToBoards && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToBoards}
                className="mt-4 cursor-pointer text-xs"
              >
                Back to Boards
              </Button>
            )}
          </div>
        ) : !board ? (
          /* Default empty state when on /boards with no board selected */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <Kanban className="size-6" />
            </div>
            <p className="text-sm font-medium">Select a board to view</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              Choose a board from the list on the left to read its details, edit
              columns, or manage its status.
            </p>
          </div>
        ) : (
          /* Active Board Canvas */
          <BoardCanvas
            board={board}
            isAddingLane={isAddingLane}
            onIsAddingLaneChange={setIsAddingLane}
          />
        )}
      </div>
    </div>
  )
}

export default BoardDetail

