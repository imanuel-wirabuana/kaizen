import { useInboxZens } from "@/features/inbox/hooks/use-inbox-zens"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { InboxSidebar } from "@/features/inbox/components/inbox-sidebar"
import { InboxItemDetail } from "@/features/inbox/components/inbox-item-detail"

export function InboxPage() {
  const { canRead, canCreate, canUpdate, canDelete, isLoading: isPermsLoading } =
    useWorkspacePermissions()

  const {
    zens,
    filteredZens,
    selectedZen,
    selectedZenId,
    activeFolder,
    searchQuery,
    isLoading,
    createZen,
    updateZen,
    archiveZen,
    restoreZen,
    deleteZen,
    batchArchiveZens,
    batchRestoreZens,
    batchDeleteZens,
    batchArchiveAndDeleteZens,
    selectedBatchIds,
    selectAllBatch,
    clearBatchSelect,
    setSelectedZenId,
    setActiveFolder,
  } = useInboxZens()

  // 1. zenbox.read guard: show AccessDeniedState if cannot read zenbox
  if (!isPermsLoading && !canRead("zenbox")) {
    return (
      <AccessDeniedState
        resource="Zenbox"
        description="You do not have permission to access Zenbox in this workspace."
      />
    )
  }

  const hasCreate = canCreate("zenbox")
  const hasUpdate = canUpdate("zenbox")
  const hasDelete = canDelete("zenbox")

  const zenboxCount = zens.filter((z) => !z.archived_at).length
  const archivedCount = zens.filter((z) => Boolean(z.archived_at)).length

  const handleCapture = async (name: string = "Untitled") => {
    if (!hasCreate) return
    return createZen(name || "Untitled")
  }

  const handleUpdate = async (
    id: number,
    updates: { name: string; description?: string }
  ) => {
    if (!hasUpdate) return
    await updateZen(id, updates)
  }

  const handleArchive = async (id: number) => {
    if (!hasDelete) return
    await archiveZen(id)
  }

  const handleRestore = async (id: number) => {
    if (!hasDelete) return
    await restoreZen(id)
  }

  const handleDelete = async (id: number) => {
    if (!hasDelete) return
    await deleteZen(id)
  }

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <InboxSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          zenboxCount={zenboxCount}
          archivedCount={archivedCount}
          searchQuery={searchQuery}
          canCreate={hasCreate}
          onCapture={hasCreate ? handleCapture : undefined}
          zens={filteredZens}
          selectedZenId={selectedZenId}
          onSelectZen={setSelectedZenId}
          isLoading={isLoading}
          selectedBatchIds={selectedBatchIds}
          onSelectAllBatch={() => selectAllBatch(filteredZens.map((z) => z.id))}
          onClearBatchSelect={clearBatchSelect}
          onBatchArchive={hasDelete ? batchArchiveZens : undefined}
          onBatchRestore={hasDelete ? batchRestoreZens : undefined}
          onBatchDelete={hasDelete ? batchDeleteZens : undefined}
          onBatchArchiveAndDelete={hasDelete ? batchArchiveAndDeleteZens : undefined}
        />
      }
    >
      <InboxItemDetail
        zen={selectedZen}
        isLoading={isLoading}
        selectedZenId={selectedZenId}
        onUpdate={hasUpdate ? handleUpdate : (async () => {})}
        onArchive={hasDelete ? handleArchive : undefined}
        onRestore={hasDelete ? handleRestore : undefined}
        onDelete={hasDelete ? handleDelete : undefined}
        onBackToZenbox={() => setSelectedZenId(null)}
        isReadOnly={!hasUpdate}
      />
    </PageSidebarLayout>
  )
}

export { InboxPage as ZenboxPage }
export default InboxPage
