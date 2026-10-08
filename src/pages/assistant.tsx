import { useAssistant } from "@/features/assistant/hooks/use-assistant"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { AssistantSidebar } from "@/features/assistant/components/assistant-sidebar"
import { AssistantDetail } from "@/features/assistant/components/assistant-detail"

export function AssistantPage() {
  const { canRead, canCreate, canDelete, isLoading: isPermsLoading } =
    useWorkspacePermissions()

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

  // 1. assistant.read guard
  if (!isPermsLoading && !canRead("assistant")) {
    return (
      <AccessDeniedState
        resource="AI Assistant"
        description="You do not have permission to access the AI assistant in this workspace."
      />
    )
  }

  const hasCreate = canCreate("assistant")
  const hasDelete = canDelete("assistant")

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <AssistantSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          activeCount={activeCount}
          archivedCount={archivedCount}
          canCreate={hasCreate}
          onCreateThread={hasCreate ? createThread : undefined}
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
          onBatchArchive={hasDelete ? batchArchiveThreads : undefined}
          onBatchRestore={hasDelete ? batchRestoreThreads : undefined}
          onBatchDelete={hasDelete ? batchDeleteThreads : undefined}
        />
      }
    >
      <AssistantDetail
        thread={selectedThread}
        isLoading={isLoading}
        selectedThreadId={selectedThreadId}
        modelName={selectedThread?.settings?.model || modelName}
        onModelChange={changeModel}
        canCreate={hasCreate}
        onArchive={hasDelete ? archiveThread : undefined}
        onRestore={hasDelete ? restoreThread : undefined}
        onDelete={hasDelete ? deleteThread : undefined}
        onBackToAssistant={() => setSelectedThreadId(null)}
      />
    </PageSidebarLayout>
  )
}

export default AssistantPage
