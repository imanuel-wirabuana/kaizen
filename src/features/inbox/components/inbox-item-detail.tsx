import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Zen } from "@/types/zen"
import { InboxItemDetailHeader } from "@/features/inbox/components/inbox-item-detail-header"
import { InboxItemDetailForm } from "@/features/inbox/components/inbox-item-detail-form"

interface InboxItemDetailProps {
  zen: Zen | null
  isLoading?: boolean
  selectedZenId?: number | null
  onUpdate: (
    id: number,
    updates: { name: string; description?: string }
  ) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onBackToZenbox?: () => void
}

export function InboxItemDetail({
  zen,
  isLoading = false,
  selectedZenId = null,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
  onBackToZenbox,
}: InboxItemDetailProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleToggleArchive = async () => {
    if (!zen || isProcessing) return
    try {
      setIsProcessing(true)
      if (zen.archived_at) {
        await onRestore(zen.id)
      } else {
        await onArchive(zen.id)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!zen || isProcessing) return
    try {
      setIsProcessing(true)
      await onDelete(zen.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Fixed Top Action & Detail Bar */}
      <InboxItemDetailHeader
        zen={zen}
        saveStatus={saveStatus}
        isProcessing={isProcessing}
        onToggleArchive={zen ? handleToggleArchive : undefined}
        onDelete={zen ? handleDelete : undefined}
      />

      {/* Main Detail Body (Scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* If an item ID was specified in the URL and items are still loading */}
        {isLoading && selectedZenId !== null ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading item details...</p>
          </div>
        ) : selectedZenId !== null && !zen ? (
          /* If an item ID was specified in the URL but not found in the workspace */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <FileText className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Item not found</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              This zen item does not exist or may have been permanently deleted.
            </p>
            {onBackToZenbox && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToZenbox}
                className="mt-4 cursor-pointer text-xs"
              >
                Back to Zenbox
              </Button>
            )}
          </div>
        ) : !zen ? (
          /* Default empty state when on /zenbox with no item selected */
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <FileText className="size-6" />
            </div>
            <p className="text-sm font-medium">Select an item to view</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              Choose an item from the list on the left to read its details, edit
              notes, or manage its status.
            </p>
          </div>
        ) : (
          /* Active Item Notion-like Inline Editor */
          <InboxItemDetailForm
            key={zen.id}
            zen={zen}
            onUpdate={onUpdate}
            onSaveStatusChange={setSaveStatus}
          />
        )}
      </div>
    </div>
  )
}

export { InboxItemDetail as ZenboxItemDetail }
export default InboxItemDetail
