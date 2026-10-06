import { useState } from "react"
import {
  Archive,
  ArchiveRestore,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { formatDistanceToNow } from "date-fns"
import type { Zen } from "@/types/zen"

export interface InboxItemDetailFormProps {
  zen: Zen
  onUpdate: (
    id: number,
    updates: { name: string; description?: string }
  ) => Promise<void>
  onArchive: (id: number) => Promise<void>
  onRestore: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function InboxItemDetailForm({
  zen,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
}: InboxItemDetailFormProps) {
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
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-card">
      {/* Detail Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-sidebar/10 p-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Expand sidebar"
          />
          <Separator orientation="vertical" />
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
            className="h-8 cursor-pointer gap-1.5 text-xs"
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
            className="h-8 cursor-pointer gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Detail Body */}
      <div className="flex max-w-2xl flex-1 flex-col gap-5 p-6">
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
                {isSaving && <Loader2 className="mr-1 size-3 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg leading-snug font-bold tracking-tight text-foreground">
                {zen.name}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 shrink-0 cursor-pointer text-xs"
              >
                Edit
              </Button>
            </div>

            <div className="min-h-[120px] rounded-lg border border-border/50 bg-background/50 p-4 text-xs/relaxed whitespace-pre-wrap text-muted-foreground">
              {zen.description ? (
                zen.description
              ) : (
                <span className="text-muted-foreground/60 italic">
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

export { InboxItemDetailForm as ZenboxItemDetailForm }
export default InboxItemDetailForm
