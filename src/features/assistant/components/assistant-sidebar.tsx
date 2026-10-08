import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AssistantNav } from "@/features/assistant/components/assistant-nav"
import { AssistantQuickCreate } from "@/features/assistant/components/assistant-quick-create"
import { AssistantItemList } from "@/features/assistant/components/assistant-item-list"
import { AssistantBatchActionBar } from "@/features/assistant/components/assistant-batch-action-bar"
import {
  useAssistantStore,
  useAssistantBatchSelectedIds,
} from "@/stores/assistant-store"
import type { AiThread, AssistantFolder } from "@/types/assistant"

export interface AssistantSidebarProps {
  activeFolder: AssistantFolder
  onSelectFolder: (folder: AssistantFolder) => void
  activeCount: number
  archivedCount: number
  onCreateThread: (title?: string) => Promise<AiThread | void>
  threads: AiThread[]
  selectedThreadId: number | null
  onSelectThread: (id: number) => void
  isLoading: boolean
  searchQuery?: string
  selectedBatchIds?: number[]
  onSelectAllBatch?: () => void
  onClearBatchSelect?: () => void
  onBatchArchive?: (ids: number[]) => Promise<unknown>
  onBatchRestore?: (ids: number[]) => Promise<unknown>
  onBatchDelete?: (ids: number[]) => Promise<unknown>
}

export function AssistantSidebar({
  activeFolder,
  onSelectFolder,
  activeCount,
  archivedCount,
  onCreateThread,
  threads,
  selectedThreadId,
  onSelectThread,
  isLoading,
  searchQuery = "",
  selectedBatchIds = [],
  onSelectAllBatch,
  onClearBatchSelect,
  onBatchArchive,
  onBatchRestore,
  onBatchDelete,
}: AssistantSidebarProps) {
  const storeBatchIds = useAssistantBatchSelectedIds()
  const selectAll = useAssistantStore((state) => state.selectAllBatch)
  const clearBatch = useAssistantStore((state) => state.clearBatchSelect)
  const effectiveBatchIds =
    selectedBatchIds && selectedBatchIds.length > 0
      ? selectedBatchIds
      : storeBatchIds

  return (
    <>
      {/* Sidebar Header: Tab Switcher (Chats / Archived) + Quick Create Button or Batch Action Bar */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar/30 p-2">
        {effectiveBatchIds.length > 0 ? (
          <AssistantBatchActionBar
            selectedIds={effectiveBatchIds}
            totalItemsCount={threads.length}
            activeFolder={activeFolder}
            onSelectAll={
              onSelectAllBatch ?? (() => selectAll(threads.map((t) => t.id)))
            }
            onClearSelection={onClearBatchSelect ?? clearBatch}
            onBatchArchive={onBatchArchive ?? (async () => {})}
            onBatchRestore={onBatchRestore ?? (async () => {})}
            onBatchDelete={onBatchDelete ?? (async () => {})}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <AssistantNav
                  activeFolder={activeFolder}
                  onSelectFolder={onSelectFolder}
                  activeCount={activeCount}
                  archivedCount={archivedCount}
                />
              </div>
            </div>

            <AssistantQuickCreate onCreate={onCreateThread} />
          </>
        )}
      </SidebarHeader>

      {/* Sidebar Body: List of Conversation Threads */}
      <SidebarContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <AssistantItemList
            threads={threads}
            selectedThreadId={selectedThreadId}
            isLoading={isLoading}
            activeFolder={activeFolder}
            searchQuery={searchQuery}
            onSelectThread={onSelectThread}
          />
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

export default AssistantSidebar
