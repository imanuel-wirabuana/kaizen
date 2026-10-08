import { useBoards } from "@/features/boards/hooks/use-boards"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { BoardSidebar } from "@/features/boards/components/board-sidebar"
import { BoardDetail } from "@/features/boards/components/board-detail"

export function BoardPage() {
  const { canRead, canCreate, canDelete, isLoading: isPermsLoading } =
    useWorkspacePermissions()

  const {
    filteredBoards,
    selectedBoard,
    selectedBoardId,
    activeFolder,
    allCount,
    archivedCount,
    searchQuery,
    isLoading,
    selectedBatchIds,
    selectAllBatch,
    clearBatchSelect,
    createBoard,
    archiveBoard,
    restoreBoard,
    deleteBoard,
    batchArchiveBoards,
    batchRestoreBoards,
    batchDeleteBoards,
    setSelectedBoardId,
    setActiveFolder,
  } = useBoards()

  // 1. board.read => show sidebar menu board, and can access through url.
  if (!isPermsLoading && !canRead("boards")) {
    return (
      <AccessDeniedState
        resource="Boards"
        description="You do not have permission to view or access task boards in this workspace."
      />
    )
  }

  // 2. board.create => allow to create board.
  const hasCreate = canCreate("boards")
  // 3. board.delete => allow to delete/archive.
  const hasDelete = canDelete("boards")

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <BoardSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          allCount={allCount}
          archivedCount={archivedCount}
          canCreate={hasCreate}
          onCreateBoard={hasCreate ? createBoard : undefined}
          boards={filteredBoards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={setSelectedBoardId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          selectedBatchIds={selectedBatchIds}
          onSelectAllBatch={() =>
            selectAllBatch(filteredBoards.map((b) => b.id))
          }
          onClearBatchSelect={clearBatchSelect}
          onBatchArchive={hasDelete ? batchArchiveBoards : undefined}
          onBatchRestore={hasDelete ? batchRestoreBoards : undefined}
          onBatchDelete={hasDelete ? batchDeleteBoards : undefined}
        />
      }
    >
      <BoardDetail
        board={selectedBoard}
        isLoading={isLoading}
        selectedBoardId={selectedBoardId}
        onArchive={hasDelete ? archiveBoard : undefined}
        onRestore={hasDelete ? restoreBoard : undefined}
        onDelete={hasDelete ? deleteBoard : undefined}
        onBackToBoards={() => setSelectedBoardId(null)}
      />
    </PageSidebarLayout>
  )
}

export default BoardPage
