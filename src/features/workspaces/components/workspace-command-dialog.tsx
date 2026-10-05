import { useState } from "react"
import { Check, Loader2, Plus } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog"

interface WorkspaceCommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkspaceCommandDialog({
  open,
  onOpenChange,
}: WorkspaceCommandDialogProps) {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading } =
    useWorkspaces()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleSelectWorkspace = (id: number) => {
    setActiveWorkspaceId(id)
    onOpenChange(false)
  }

  const handleOpenCreateDialog = () => {
    onOpenChange(false)
    setCreateDialogOpen(true)
  }

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Switch Workspace"
        description="Search and switch between workspaces"
      >
        <CommandInput placeholder="Search workspace..." />
        <CommandList>
          {isLoading && workspaces.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Loading workspaces...</span>
            </div>
          ) : (
            <CommandEmpty>No workspace found.</CommandEmpty>
          )}

          <CommandGroup>
            <CommandItem
              onSelect={handleOpenCreateDialog}
              className="flex cursor-pointer items-center gap-2 py-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-border bg-background">
                <Plus className="size-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">Create new workspace</span>
            </CommandItem>

            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspaceId
              const initialLetter = ws.name.charAt(0).toUpperCase()
              const subLabel =
                ws.description ||
                (ws.settings?.default_view
                  ? `Default: ${ws.settings.default_view}`
                  : "Workspace")

              return (
                <CommandItem
                  key={ws.id}
                  value={`${ws.name} ${ws.description || ""}`}
                  onSelect={() => handleSelectWorkspace(ws.id)}
                  className="flex cursor-pointer items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-primary">
                      {initialLetter}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold leading-tight">
                        {ws.name}
                      </span>
                      <span className="line-clamp-1 text-[10px] text-muted-foreground">
                        {subLabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}

export default WorkspaceCommandDialog
