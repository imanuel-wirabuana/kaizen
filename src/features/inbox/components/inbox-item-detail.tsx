import { useState } from "react"
import { Archive, ArchiveRestore, Clock, FileText, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Zen } from "@/types/zen"
import { formatDistanceToNow } from "date-fns"

interface InboxItemDetailProps {
  zen: Zen | null
  onUpdate: (id: number, updates: { name: string; description?: string }) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

interface InnerDetailFormProps {
  zen: Zen
  onUpdate: (id: number, updates: { name: string; description?: string }) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

function InnerDetailForm({
  zen,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
}: InnerDetailFormProps) {
  const [name, setName] = useState(zen.name)
  const [description, setDescription] = useState(zen.description || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const isArchived = Boolean(zen.archived_at)

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(zen.created_at), { addSuffix: true })
    } catch {
      return "recently"
    }
  })()

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || isSaving) return

    try {
      setIsSaving(true)
      await onUpdate(zen.id, {
        name: trimmed,
        description: description.trim() || undefined,
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleArchive = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      if (isArchived) {
        await onRestore(zen.id)
      } else {
        await onArchive(zen.id)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (isProcessing) return
    try {
      setIsProcessing(true)
      await onDelete(zen.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-card overflow-y-auto">
      {/* Detail Toolbar */}
      <div className="flex items-center justify-between border-b border-border p-3.5 shrink-0 bg-sidebar/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>Created {formattedDate}</span>
          {isArchived && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Archived
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleArchive}
            disabled={isProcessing}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : isArchived ? (
              <>
                <ArchiveRestore className="size-3.5" />
                <span>Restore</span>
              </>
            ) : (
              <>
                <Archive className="size-3.5" />
                <span>Archive</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isProcessing}
            className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 text-xs cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Detail Body */}
      <div className="flex flex-col gap-5 p-6 flex-1 max-w-2xl">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base font-semibold"
              placeholder="Item title"
              autoFocus
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or checklists..."
              rows={8}
              className="text-xs leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving && <Loader2 className="size-3 animate-spin mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground leading-snug">
                {zen.name}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 text-xs shrink-0 cursor-pointer"
              >
                Edit
              </Button>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/50 p-4 text-xs/relaxed text-muted-foreground whitespace-pre-wrap min-h-[120px]">
              {zen.description ? (
                zen.description
              ) : (
                <span className="italic text-muted-foreground/60">
                  No description or notes provided. Click Edit to add context.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function InboxItemDetail({
  zen,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
}: InboxItemDetailProps) {
  if (!zen) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-12 text-center text-muted-foreground bg-card">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground mb-3">
          <FileText className="size-6" />
        </div>
        <p className="text-sm font-medium">Select an item to view</p>
        <p className="text-xs text-muted-foreground/80 mt-1 max-w-xs">
          Choose an item from the list on the left to read its details, edit notes, or manage its status.
        </p>
      </div>
    )
  }

  return (
    <InnerDetailForm
      key={zen.id}
      zen={zen}
      onUpdate={onUpdate}
      onArchive={onArchive}
      onRestore={onRestore}
      onDelete={onDelete}
    />
  )
}
