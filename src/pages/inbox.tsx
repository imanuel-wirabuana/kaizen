import { useInboxZens } from "@/features/inbox/hooks/use-inbox-zens"
import { InboxNav } from "@/features/inbox/components/inbox-nav"
import { InboxItemList } from "@/features/inbox/components/inbox-item-list"
import { InboxItemDetail } from "@/features/inbox/components/inbox-item-detail"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

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

  const inboxCount = zens.filter((z) => !z.archived_at).length
  const archivedCount = zens.filter((z) => Boolean(z.archived_at)).length
  const allCount = zens.length

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
    <div className="flex flex-1 h-[calc(100vh-4.25rem)] rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* Mailbox Sub-navigation */}
      <InboxNav
        activeFolder={activeFolder}
        onSelectFolder={setActiveFolder}
        inboxCount={inboxCount}
        archivedCount={archivedCount}
        allCount={allCount}
      />

      {/* Resizable panels for mail list and reading pane */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={42} minSize={28}>
          <InboxItemList
            zens={filteredZens}
            selectedZenId={selectedZenId}
            activeFolder={activeFolder}
            searchQuery={searchQuery}
            showUnreadOnly={showUnreadOnly}
            isLoading={isLoading}
            onSelectZen={setSelectedZenId}
            onSearchChange={setSearchQuery}
            onToggleUnread={setShowUnreadOnly}
            onCapture={handleCapture}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={58} minSize={32}>
          <InboxItemDetail
            zen={selectedZen}
            onUpdate={handleUpdate}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default InboxPage
