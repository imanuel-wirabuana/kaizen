import { useInboxZens } from "@/features/inbox/hooks/use-inbox-zens"
import { PageSidebarLayout } from "@/components/layout/page-sidebar-layout"
import { InboxSidebar } from "@/features/inbox/components/inbox-sidebar"
import { InboxItemDetail } from "@/features/inbox/components/inbox-item-detail"

export function InboxPage() {
  const {
    zens,
    filteredZens,
    selectedZen,
    selectedZenId,
    activeFolder,
    showUnreadOnly,
    searchQuery,
    isLoading,
    createZen,
    updateZen,
    archiveZen,
    restoreZen,
    deleteZen,
    setSelectedZenId,
    setActiveFolder,
    setShowUnreadOnly,
    setSearchQuery,
  } = useInboxZens()

  const zenboxCount = zens.filter((z) => !z.archived_at).length
  const archivedCount = zens.filter((z) => Boolean(z.archived_at)).length

  const handleCapture = async (name: string) => {
    await createZen(name)
  }

  const handleUpdate = async (
    id: number,
    updates: { name: string; description?: string }
  ) => {
    await updateZen(id, updates)
  }

  const handleArchive = async (id: number) => {
    await archiveZen(id)
  }

  const handleRestore = async (id: number) => {
    await restoreZen(id)
  }

  const handleDelete = async (id: number) => {
    await deleteZen(id)
  }

  return (
    <PageSidebarLayout
      sidebar={
        <InboxSidebar
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          zenboxCount={zenboxCount}
          archivedCount={archivedCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showUnreadOnly={showUnreadOnly}
          onToggleUnread={setShowUnreadOnly}
          onCapture={handleCapture}
          zens={filteredZens}
          selectedZenId={selectedZenId}
          onSelectZen={setSelectedZenId}
          isLoading={isLoading}
        />
      }
    >
      {
        <InboxItemDetail
          zen={selectedZen}
          isLoading={isLoading}
          selectedZenId={selectedZenId}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDelete={handleDelete}
          onBackToZenbox={() => setSelectedZenId(null)}
        />
      }
    </PageSidebarLayout>
  )
}

export { InboxPage as ZenboxPage }
export default InboxPage
