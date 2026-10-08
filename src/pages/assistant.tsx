import { useAssistant } from "@/features/assistant/hooks/use-assistant"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { AssistantSidebar } from "@/features/assistant/components/assistant-sidebar"
import { AssistantDetail } from "@/features/assistant/components/assistant-detail"

export function AssistantPage() {
  const {
    filteredThreads,
    selectedThread,
    selectedThreadId,
    activeFolder,
    activeCount,
    archivedCount,
    searchQuery,
    isLoading,
    selectedBatchIds,
    selectAllBatch,
    clearBatchSelect,
    createThread,
    archiveThread,
    restoreThread,
    deleteThread,
    batchArchiveThreads,
    batchRestoreThreads,
    batchDeleteThreads,
    setSelectedThreadId,
    setActiveFolder,
    modelName,
    changeModel,
  } = useAssistant({ syncUrl: true })

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <AssistantSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          activeCount={activeCount}
          archivedCount={archivedCount}
          onCreateThread={createThread}
          threads={filteredThreads}
          selectedThreadId={selectedThreadId}
          onSelectThread={setSelectedThreadId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          selectedBatchIds={selectedBatchIds}
          onSelectAllBatch={() =>
            selectAllBatch(filteredThreads.map((t) => t.id))
          }
          onClearBatchSelect={clearBatchSelect}
          onBatchArchive={batchArchiveThreads}
          onBatchRestore={batchRestoreThreads}
          onBatchDelete={batchDeleteThreads}
        />
      }
    >
      <AssistantDetail
        thread={selectedThread}
        isLoading={isLoading}
        selectedThreadId={selectedThreadId}
        modelName={selectedThread?.settings?.model || modelName}
        onModelChange={changeModel}
        onArchive={archiveThread}
        onRestore={restoreThread}
        onDelete={deleteThread}
        onBackToAssistant={() => setSelectedThreadId(null)}
      />
    </PageSidebarLayout>
  )
}

export default AssistantPage
