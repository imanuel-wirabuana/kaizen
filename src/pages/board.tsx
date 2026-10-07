import { useBoards } from "@/features/boards/hooks/use-boards"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { BoardSidebar } from "@/features/boards/components/board-sidebar"
import { BoardDetail } from "@/features/boards/components/board-detail"

export function BoardPage() {
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

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <BoardSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          allCount={allCount}
          archivedCount={archivedCount}
          onCreateBoard={createBoard}
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
          onBatchArchive={batchArchiveBoards}
          onBatchRestore={batchRestoreBoards}
          onBatchDelete={batchDeleteBoards}
        />
      }
    >
      <BoardDetail
        board={selectedBoard}
        isLoading={isLoading}
        selectedBoardId={selectedBoardId}
        onArchive={archiveBoard}
        onRestore={restoreBoard}
        onDelete={deleteBoard}
        onBackToBoards={() => setSelectedBoardId(null)}
      />
    </PageSidebarLayout>
  )
}

export default BoardPage
