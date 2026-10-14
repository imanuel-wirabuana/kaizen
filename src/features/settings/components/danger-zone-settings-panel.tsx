import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  Archive,
  UserCheck,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { useWorkspaceMembers } from "@/features/members/hooks/use-workspace-members"
import { toast } from "@/components/ui/toast"
import type { Workspace } from "@/types/workspace"

export interface DangerZoneSettingsPanelProps {
  workspace: Workspace | null
  onArchiveWorkspace: (id: number) => Promise<boolean>
  onTransferOwnership: (
    workspaceId: number,
    newOwnerId: string
  ) => Promise<Workspace>
  onDeleteWorkspace: (id: number) => Promise<boolean>
}

export function DangerZoneSettingsPanel({
  workspace,
  onArchiveWorkspace,
  onTransferOwnership,
  onDeleteWorkspace,
}: DangerZoneSettingsPanelProps) {
  const { user } = useUser()
  const { members, isLoading: isMembersLoading } = useWorkspaceMembers()

  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("")
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")

  const [isProcessingArchive, setIsProcessingArchive] = useState(false)
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false)
  const [isProcessingDelete, setIsProcessingDelete] = useState(false)

  if (!workspace) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
        <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-muted-foreground">
          No active workspace selected.
        </div>
      </div>
    )
  }

  const isOwner = Boolean(user && workspace.owner_id === user.id)

  // Candidate members to receive ownership (exclude current owner and revoked members)
  const eligibleCandidates = members.filter(
    (m) => m.userId !== workspace.owner_id && !m.revokedAt
  )

  const selectedCandidate = eligibleCandidates.find(
    (m) => m.userId === selectedNewOwnerId
  )

  const handleArchive = async () => {
    try {
      setIsProcessingArchive(true)
      await onArchiveWorkspace(workspace.id)
      setIsArchiveOpen(false)
    } catch (err) {
      toast.error("Failed to archive workspace", {
        description: (err as Error).message || "An unexpected error occurred.",
      })
    } finally {
      setIsProcessingArchive(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedNewOwnerId) return
    try {
      setIsProcessingTransfer(true)
      await onTransferOwnership(workspace.id, selectedNewOwnerId)
      setIsTransferOpen(false)
      setSelectedNewOwnerId("")
    } catch (err) {
      toast.error("Failed to transfer ownership", {
        description: (err as Error).message || "An unexpected error occurred.",
      })
    } finally {
      setIsProcessingTransfer(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmationText.trim() !== workspace.name.trim()) {
      toast.error("Confirmation mismatch", {
        description: "Please type the exact workspace name to confirm deletion.",
      })
      return
    }

    try {
      setIsProcessingDelete(true)
      await onDeleteWorkspace(workspace.id)
      setIsDeleteOpen(false)
      setDeleteConfirmationText("")
    } catch (err) {
      toast.error("Failed to delete workspace", {
        description: (err as Error).message || "An unexpected error occurred.",
      })
    } finally {
      setIsProcessingDelete(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
          <Separator orientation="vertical" />
          <AlertTriangle className="size-3.5 text-destructive" />
          <span className="font-semibold text-xs text-destructive">Danger Zone</span>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            Destructive Operations
          </span>
        </div>

        <div>
          {isOwner ? (
            <Badge
              variant="outline"
              className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              Workspace Owner
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Collaborator
            </Badge>
          )}
        </div>
      </div>

      {/* Main Full-Width Body with Row-by-Row Layout */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full p-4 sm:p-6 pb-16">
          <div className="flex w-full flex-col gap-6">
            {!isOwner && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-400">
                <ShieldAlert className="size-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Owner Permissions Required</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Only the workspace owner can transfer ownership or permanently delete this workspace.
                  </p>
                </div>
              </div>
            )}

            {/* Danger Zone Actions Card */}
            <Card className="p-5 flex flex-col gap-0 shadow-2xs border-destructive/30 bg-destructive/2">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-destructive">Destructive Operations</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Actions that affect workspace accessibility, administrative authority, or data persistence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 1: Archive Workspace */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <div className="flex items-center gap-1.5">
                    <Archive className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Archive Workspace
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Soft-deletes this workspace. It will be hidden from the active list and can be restored later.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsArchiveOpen(true)}
                    className="cursor-pointer text-xs h-8"
                  >
                    Archive Workspace
                  </Button>
                </div>
              </div>

              {/* Row 2: Transfer Ownership */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="size-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-foreground">
                      Transfer Ownership
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Transfer primary administrative ownership to another active team collaborator.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedNewOwnerId}
                      onValueChange={(val) => {
                        if (val) setSelectedNewOwnerId(val)
                      }}
                      disabled={!isOwner || isMembersLoading || eligibleCandidates.length === 0}
                    >
                      <SelectTrigger className="w-full text-xs bg-background h-8">
                        <SelectValue
                          placeholder={
                            isMembersLoading
                              ? "Loading members..."
                              : eligibleCandidates.length === 0
                                ? "No other members"
                                : "Select new owner"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleCandidates.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.displayName} ({m.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTransferOpen(true)}
                    disabled={!isOwner || !selectedNewOwnerId}
                    className="cursor-pointer text-xs h-8 shrink-0"
                  >
                    Transfer
                  </Button>
                </div>
              </div>

              {/* Row 3: Permanently Delete Workspace */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <div className="flex items-center gap-1.5">
                    <Trash2 className="size-3.5 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">
                      Permanently Delete Workspace
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Irreversibly delete this workspace, including all kanban boards, calendars, tasks, and notes.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={!isOwner}
                    className="cursor-pointer text-xs h-8"
                  >
                    Delete Workspace Permanently
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* AlertDialog: Archive Confirmation */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="size-5 text-amber-500" />
              <span>Archive &quot;{workspace.name}&quot;?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This workspace will be removed from your active list and sidebar. Collaborators will no longer see it until restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingArchive}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isProcessingArchive}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {isProcessingArchive && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isProcessingArchive ? "Archiving..." : "Archive Workspace"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Transfer Ownership Confirmation */}
      <AlertDialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-amber-500" />
              <span>Transfer Ownership?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <p>
                Are you sure you want to transfer ownership of &quot;{workspace.name}&quot; to{" "}
                <strong>{selectedCandidate?.displayName || "the selected collaborator"}</strong>?
              </p>
              <p className="text-muted-foreground">
                You will surrender owner administrative control and become a standard member in this workspace.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingTransfer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={isProcessingTransfer}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {isProcessingTransfer && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isProcessingTransfer ? "Transferring..." : "Confirm Transfer"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Delete Confirmation (Requires typing workspace name) */}
      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmationText("")
          setIsDeleteOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              <span>Permanently Delete Workspace?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-3">
              <p>
                This action <strong>cannot be undone</strong>. All data associated with &quot;
                <strong>{workspace.name}</strong>&quot; will be permanently erased.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-[11px] text-foreground font-medium">
                  Please type <strong>{workspace.name}</strong> to confirm:
                </label>
                <Input
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder={workspace.name}
                  className="text-xs"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                isProcessingDelete ||
                deleteConfirmationText.trim() !== workspace.name.trim()
              }
              className="bg-destructive hover:bg-destructive/90 text-white gap-1.5"
            >
              {isProcessingDelete && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isProcessingDelete ? "Deleting..." : "Delete Permanently"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DangerZoneSettingsPanel
