import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { AssistantEmptyState } from "@/features/assistant/components/assistant-empty-state"
import { AssistantItemRow } from "@/features/assistant/components/assistant-item-row"
import { useWorkspaceMemberProfiles } from "@/features/members/hooks/use-workspace-members"
import {
  useAssistantStore,
  useAssistantBatchSelectedIds,
} from "@/stores/assistant-store"
import type { AiThread, AssistantFolder } from "@/types/assistant"

export interface AssistantItemListProps {
  threads: AiThread[]
  selectedThreadId: number | null
  isLoading: boolean
  activeFolder: AssistantFolder
  searchQuery?: string
  onSelectThread: (id: number) => void
}

export function AssistantItemList({
  threads,
  selectedThreadId,
  isLoading,
  activeFolder,
  searchQuery = "",
  onSelectThread,
}: AssistantItemListProps) {
  const selectedBatchIds = useAssistantBatchSelectedIds()
  const toggleBatchSelect = useAssistantStore((state) => state.toggleBatchSelect)
  const isBatchMode = selectedBatchIds.length > 0
  const memberProfiles = useWorkspaceMemberProfiles()

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
        Loading conversations...
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <AssistantEmptyState
        isSearch={Boolean(searchQuery.trim())}
        activeFolder={activeFolder}
      />
    )
  }

  return (
    <SidebarMenu className="gap-0 p-0">
      {threads.map((thread) => {
        const isSelected = selectedThreadId === thread.id
        const isBatchSelected = selectedBatchIds.includes(thread.id)

        return (
          <SidebarMenuItem
            key={thread.id}
            className="group/item border-b border-border/50 p-0 last:border-b-0"
          >
            <AssistantItemRow
              thread={thread}
              isSelected={isSelected}
              isBatchSelected={isBatchSelected}
              isBatchMode={isBatchMode}
              profiles={memberProfiles}
              onToggleBatch={toggleBatchSelect}
              onClick={onSelectThread}
            />
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export { AssistantItemList as AssistantThreadList }
export default AssistantItemList
