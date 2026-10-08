import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BoardNav } from "@/features/boards/components/board-nav"
import { BoardQuickCreate } from "@/features/boards/components/board-quick-create"
import { BoardItemList } from "@/features/boards/components/board-item-list"
import { BoardBatchActionBar } from "@/features/boards/components/board-batch-action-bar"
import {
  useBoardStore,
  useBoardBatchSelectedIds,
} from "@/stores/board-store"
import type { Board, BoardFolder } from "@/types/board"

export interface BoardSidebarProps {
  activeFolder: BoardFolder
  onSelectFolder: (folder: BoardFolder) => void
  allCount: number
  archivedCount: number
  canCreate?: boolean
  onCreateBoard?: (name?: string) => Promise<Board | void>
  boards: Board[]
  selectedBoardId: number | null
  onSelectBoard: (id: number) => void
  isLoading: boolean
  searchQuery?: string
  selectedBatchIds?: number[]
  onSelectAllBatch?: () => void
  onClearBatchSelect?: () => void
  onBatchArchive?: (ids: number[]) => Promise<unknown>
  onBatchRestore?: (ids: number[]) => Promise<unknown>
  onBatchDelete?: (ids: number[]) => Promise<unknown>
}

export function BoardSidebar({
  activeFolder,
  onSelectFolder,
  allCount,
  archivedCount,
  canCreate = true,
  onCreateBoard,
  boards,
  selectedBoardId,
  onSelectBoard,
  isLoading,
  searchQuery = "",
  selectedBatchIds = [],
  onSelectAllBatch,
  onClearBatchSelect,
  onBatchArchive,
  onBatchRestore,
  onBatchDelete,
}: BoardSidebarProps) {
  const storeBatchIds = useBoardBatchSelectedIds()
  const selectAll = useBoardStore((state) => state.selectAllBatch)
  const clearBatch = useBoardStore((state) => state.clearBatchSelect)
  const effectiveBatchIds =
    selectedBatchIds && selectedBatchIds.length > 0
      ? selectedBatchIds
      : storeBatchIds

  return (
    <>
      {/* Sidebar Header: Tab Switcher (Boards / Archived) + Add New Board Button or Batch Action Bar */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar/30 p-2">
        {effectiveBatchIds.length > 0 ? (
          <BoardBatchActionBar
            selectedIds={effectiveBatchIds}
            totalItemsCount={boards.length}
            activeFolder={activeFolder}
            onSelectAll={
              onSelectAllBatch ?? (() => selectAll(boards.map((b) => b.id)))
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
                <BoardNav
                  activeFolder={activeFolder}
                  onSelectFolder={onSelectFolder}
                  allCount={allCount}
                  archivedCount={archivedCount}
                />
              </div>
            </div>

            {canCreate !== false && onCreateBoard && (
              <BoardQuickCreate onCreate={onCreateBoard} />
            )}
          </>
        )}
      </SidebarHeader>

      {/* Sidebar Body: List of Boards */}
      <SidebarContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <BoardItemList
            boards={boards}
            selectedBoardId={selectedBoardId}
            isLoading={isLoading}
            activeFolder={activeFolder}
            searchQuery={searchQuery}
            onSelectBoard={onSelectBoard}
          />
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

export default BoardSidebar
