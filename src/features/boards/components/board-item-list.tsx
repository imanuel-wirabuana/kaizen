import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { BoardEmptyState } from "@/features/boards/components/board-empty-state"
import { BoardItemRow } from "@/features/boards/components/board-item-row"
import { useWorkspaceMemberProfiles } from "@/features/members/hooks/use-workspace-members"
import {
  useBoardStore,
  useBoardBatchSelectedIds,
} from "@/stores/board-store"
import type { Board, BoardFolder } from "@/types/board"

interface BoardItemListProps {
  boards: Board[]
  selectedBoardId: number | null
  isLoading: boolean
  activeFolder: BoardFolder
  searchQuery?: string
  onSelectBoard: (id: number) => void
}

export function BoardItemList({
  boards,
  selectedBoardId,
  isLoading,
  activeFolder,
  searchQuery = "",
  onSelectBoard,
}: BoardItemListProps) {
  const selectedBatchIds = useBoardBatchSelectedIds()
  const toggleBatchSelect = useBoardStore((state) => state.toggleBatchSelect)
  const isBatchMode = selectedBatchIds.length > 0
  const memberProfiles = useWorkspaceMemberProfiles()

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
        Loading boards...
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <BoardEmptyState
        isSearch={Boolean(searchQuery.trim())}
        activeFolder={activeFolder}
      />
    )
  }

  return (
    <SidebarMenu className="gap-0 p-0">
      {boards.map((board) => {
        const isSelected = selectedBoardId === board.id
        const isBatchSelected = selectedBatchIds.includes(board.id)

        return (
          <SidebarMenuItem
            key={board.id}
            className="group/item border-b border-border/50 p-0 last:border-b-0"
          >
            <BoardItemRow
              board={board}
              isSelected={isSelected}
              isBatchSelected={isBatchSelected}
              isBatchMode={isBatchMode}
              profiles={memberProfiles}
              onToggleBatch={toggleBatchSelect}
              onClick={onSelectBoard}
            />
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export default BoardItemList
