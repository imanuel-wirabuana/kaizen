import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Zen } from "@/types/zen"
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
  // If an item ID was specified in the URL and items are still loading
  if (isLoading && selectedZenId !== null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-card p-12 text-center text-muted-foreground">
        <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading item details...</p>
      </div>
    )
  }

  // If an item ID was specified in the URL but not found in the workspace
  if (selectedZenId !== null && !zen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-card p-12 text-center text-muted-foreground">
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
    )
  }

  // Default empty state when on /zenbox with no item selected
  if (!zen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-card p-12 text-center text-muted-foreground">
        <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <FileText className="size-6" />
        </div>
        <p className="text-sm font-medium">Select an item to view</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
          Choose an item from the list on the left to read its details, edit
          notes, or manage its status.
        </p>
      </div>
    )
  }

  return (
    <InboxItemDetailForm
      key={zen.id}
      zen={zen}
      onUpdate={onUpdate}
      onArchive={onArchive}
      onRestore={onRestore}
      onDelete={onDelete}
    />
  )
}

export { InboxItemDetail as ZenboxItemDetail }
export default InboxItemDetail
