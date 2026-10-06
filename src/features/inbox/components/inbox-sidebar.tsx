import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar"

import { InboxNav } from "@/features/inbox/components/inbox-nav"
import { InboxItemList } from "@/features/inbox/components/inbox-item-list"
import { InboxQuickCapture } from "@/features/inbox/components/inbox-quick-capture"
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
  onCapture: (name: string) => Promise<void>
  zens: Zen[]
  selectedZenId: number | null
  onSelectZen: (id: number) => void
  isLoading: boolean
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
}: InboxSidebarProps) {
  return (
    <>
      {/* Sidebar Header: Infused Folder Nav + Collapse Button + Search/Filter + Quick Capture */}
      <SidebarHeader className="flex shrink-0 flex-col gap-3.5 border-b border-border bg-sidebar/30 p-3.5">
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

      {/* Sidebar Menu: Zen Items List */}
      <SidebarContent className="flex flex-1 flex-col overflow-y-auto p-0">
        <InboxItemList
          zens={zens}
          selectedZenId={selectedZenId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSelectZen={onSelectZen}
        />
      </SidebarContent>
    </>
  )
}

export { InboxSidebar as ZenboxSidebar }
