import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

import { InboxNav } from "@/features/inbox/components/inbox-nav"
import { InboxItemList } from "@/features/inbox/components/inbox-item-list"
import { InboxQuickCapture } from "@/features/inbox/components/inbox-quick-capture"
import { InboxBatchActionBar } from "@/features/inbox/components/inbox-batch-action-bar"
import type { Zen } from "@/types/zen"
import type { ZenboxFolder } from "@/stores/zen-store"

export interface InboxSidebarProps {
  activeFolder: ZenboxFolder
  onSelectFolder: (folder: ZenboxFolder) => void
  zenboxCount: number
  archivedCount: number
  searchQuery: string
  onSearchChange: (query: string) => void
  showUnreadOnly: boolean
  onToggleUnread: (show: boolean) => void
  onCapture: (name?: string) => Promise<Zen | void>
  zens: Zen[]
  selectedZenId: number | null
  onSelectZen: (id: number) => void
  isLoading: boolean
  selectedBatchIds?: number[]
  onSelectAllBatch?: () => void
  onClearBatchSelect?: () => void
  onBatchArchive?: (ids: number[]) => Promise<unknown>
  onBatchRestore?: (ids: number[]) => Promise<unknown>
  onBatchDelete?: (ids: number[]) => Promise<unknown>
  onBatchArchiveAndDelete?: (ids: number[]) => Promise<unknown>
}

export function InboxSidebar({
  activeFolder,
  onSelectFolder,
  zenboxCount,
  archivedCount,
  searchQuery,

  onCapture,
  zens,
  selectedZenId,
  onSelectZen,
  isLoading,
  selectedBatchIds = [],
  onSelectAllBatch,
  onClearBatchSelect,
  onBatchArchive,
  onBatchRestore,
  onBatchDelete,
  onBatchArchiveAndDelete,
}: InboxSidebarProps) {
  return (
    <>
      {/* Sidebar Header: Infused Folder Nav + Collapse Button + Search/Filter + Quick Capture */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar/30 p-2">
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <InboxNav
              activeFolder={activeFolder}
              onSelectFolder={onSelectFolder}
              zenboxCount={zenboxCount}
              archivedCount={archivedCount}
            />
          </div>
        </div>

        <InboxQuickCapture onCapture={onCapture} />
      </SidebarHeader>

      {/* Batch Action Bar: Displayed when 1+ items are selected */}
      {selectedBatchIds.length > 0 && (
        <InboxBatchActionBar
          selectedIds={selectedBatchIds}
          totalItemsCount={zens.length}
          activeFolder={activeFolder}
          onSelectAll={onSelectAllBatch ?? (() => {})}
          onClearSelection={onClearBatchSelect ?? (() => {})}
          onBatchArchive={onBatchArchive ?? (async () => {})}
          onBatchRestore={onBatchRestore ?? (async () => {})}
          onBatchDelete={onBatchDelete ?? (async () => {})}
          onBatchArchiveAndDelete={onBatchArchiveAndDelete ?? (async () => {})}
        />
      )}

      {/* Sidebar Menu: Zen Items List */}
      <SidebarContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <InboxItemList
            zens={zens}
            selectedZenId={selectedZenId}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSelectZen={onSelectZen}
          />
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

export { InboxSidebar as ZenboxSidebar }
