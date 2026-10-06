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
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { Building2, Loader2 } from "lucide-react"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VIEW_OPTIONS = [
  { id: "boards", label: "Boards" },
  { id: "calendars", label: "Calendars" },
  { id: "zenbox", label: "Zenbox" },
] as const

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const { createWorkspace } = useWorkspaces()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [defaultView, setDefaultView] = useState<string>("boards")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage("Workspace name is required")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta"

      await createWorkspace(trimmedName, description, {
        timezone,
        default_view: defaultView,
      })

      setName("")
      setDescription("")
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create workspace"
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Create Workspace
              </DialogTitle>
            </div>
            <DialogDescription>
              Create a new workspace to organize boards, calendars, and team tasks.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 py-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-name" className="text-xs font-medium">
                Workspace Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Studio, Kaizen Core"
                autoFocus
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-description" className="text-xs font-medium">
                Description
              </Label>
              <Textarea
                id="ws-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace used for?"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-view" className="text-xs font-medium">
                Default View
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {VIEW_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDefaultView(item.id)}
                    className={`flex items-center justify-center rounded-md border p-1.5 text-xs font-medium transition-colors ${
                      defaultView === item.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-input/20 text-muted-foreground hover:bg-input/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
