import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Archive, FileText, Loader2 } from "lucide-react"
import type { Zen } from "@/types/zen"

interface ZenDetailDialogProps {
  zen: Zen | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: number, updates: { name: string; description?: string }) => Promise<void>
  onArchive: (id: number) => Promise<void>
}

interface ZenDetailFormProps {
  zen: Zen
  onClose: () => void
  onSave: (id: number, updates: { name: string; description?: string }) => Promise<void>
  onArchive: (id: number) => Promise<void>
}

function ZenDetailForm({
  zen,
  onClose,
  onSave,
  onArchive,
}: ZenDetailFormProps) {
  const [name, setName] = useState(zen.name)
  const [description, setDescription] = useState(zen.description || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || isSaving) return

    try {
      setIsSaving(true)
      await onSave(zen.id, {
        name: trimmedName,
        description: description.trim() || undefined,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async () => {
    if (isArchiving) return
    try {
      setIsArchiving(true)
      await onArchive(zen.id)
      onClose()
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Edit Item
          </DialogTitle>
        </div>
        <DialogDescription>
          Update your item name and notes.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 py-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zen-name" className="text-xs font-medium">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="zen-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            disabled={isSaving || isArchiving}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zen-desc" className="text-xs font-medium">
            Description / Notes
          </Label>
          <Textarea
            id="zen-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add optional context or details..."
            rows={4}
            disabled={isSaving || isArchiving}
          />
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleArchive}
          disabled={isSaving || isArchiving}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
        >
          {isArchiving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Archive className="size-3.5" />
          )}
          Archive
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving || isArchiving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || isArchiving || !name.trim()}
            className="gap-1.5 cursor-pointer"
          >
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}

export function ZenDetailDialog({
  zen,
  open,
  onOpenChange,
  onSave,
  onArchive,
}: ZenDetailDialogProps) {
  if (!zen) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ZenDetailForm
          key={zen.id}
          zen={zen}
          onClose={() => onOpenChange(false)}
          onSave={onSave}
          onArchive={onArchive}
        />
      </DialogContent>
    </Dialog>
  )
}
