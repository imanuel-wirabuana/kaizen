import { useState, useEffect, useRef } from "react"
import {
  UserX,
  Clock,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { toast } from "@/components/ui/toast"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { RbacMatrixTable } from "@/features/members/components/rbac-matrix-table"
import type {
  WorkspaceMemberProfile,
  WorkspacePermissions,
} from "@/types/member"
import { DEFAULT_MEMBER_PERMISSIONS } from "@/types/member"

function parsePermissions(raw: unknown): WorkspacePermissions {
  if (!raw) return DEFAULT_MEMBER_PERMISSIONS

  let parsed = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return DEFAULT_MEMBER_PERMISSIONS
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    return DEFAULT_MEMBER_PERMISSIONS
  }

  const obj = parsed as Record<string, unknown>

  const safeMerge = (
    key: string,
    defaults: Record<string, boolean>
  ): Record<string, boolean> => {
    const val = obj[key]
    if (typeof val === "object" && val !== null) {
      return { ...defaults, ...(val as Record<string, boolean>) }
    }
    return { ...defaults }
  }

  return {
    boards: safeMerge("boards", DEFAULT_MEMBER_PERMISSIONS.boards) as WorkspacePermissions["boards"],
    zenbox: safeMerge("zenbox", DEFAULT_MEMBER_PERMISSIONS.zenbox) as WorkspacePermissions["zenbox"],
    calendars: safeMerge("calendars", DEFAULT_MEMBER_PERMISSIONS.calendars) as WorkspacePermissions["calendars"],
    assistant: safeMerge("assistant", DEFAULT_MEMBER_PERMISSIONS.assistant) as WorkspacePermissions["assistant"],
    members: safeMerge("members", DEFAULT_MEMBER_PERMISSIONS.members) as WorkspacePermissions["members"],
    workspace: safeMerge("workspace", DEFAULT_MEMBER_PERMISSIONS.workspace) as WorkspacePermissions["workspace"],
  }
}

export interface MemberPermissionsDetailProps {
  member: WorkspaceMemberProfile
  canUpdate: boolean
  canDelete: boolean
  isUpdating: boolean
  onUpdatePermissions: (
    memberId: number,
    permissions: WorkspacePermissions
  ) => Promise<unknown>
  onRevokeMember?: (memberId: number) => Promise<unknown>
  onRestoreMember?: (memberId: number) => Promise<unknown>
  onDeleteMember?: (memberId: number) => Promise<unknown>
}

export function MemberPermissionsDetail({
  member,
  canUpdate,
  canDelete,
  isUpdating,
  onUpdatePermissions,
  onRevokeMember,
  onRestoreMember,
  onDeleteMember,
}: MemberPermissionsDetailProps) {
  const [permissions, setPermissions] = useState<WorkspacePermissions>(() =>
    parsePermissions(member.permissions)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const initializedMemberIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (initializedMemberIdRef.current !== member.id) {
      initializedMemberIdRef.current = member.id
      setPermissions(parsePermissions(member.permissions))
    }
  }, [member.id, member.permissions])

  const isOwner = member.role === "Owner"
  const isRevoked = Boolean(member.revokedAt)

  // Realtime auto-save handler for RBAC Matrix toggles
  const handlePermissionsChange = async (newPermissions: WorkspacePermissions) => {
    setPermissions(newPermissions)
    if (isOwner || isRevoked || !canUpdate) return

    try {
      setIsSaving(true)
      await onUpdatePermissions(member.id, newPermissions)
    } catch (err) {
      toast.error("Failed to update permissions", {
        description: (err as Error).message || "Could not auto-save changes.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmPermanentDelete = async () => {
    if (!onDeleteMember || isDeleting) return
    try {
      setIsDeleting(true)
      await onDeleteMember(member.id)
      setIsConfirmDeleteOpen(false)
    } catch (err) {
      toast.error("Failed to delete member", {
        description: (err as Error).message || "Could not delete collaborator.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRevoke = async () => {
    if (!onRevokeMember || isRevoking) return
    try {
      setIsRevoking(true)
      await onRevokeMember(member.id)
    } catch (err) {
      toast.error("Failed to revoke member", {
        description: (err as Error).message || "Could not revoke collaborator access.",
      })
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRestore = async () => {
    if (!onRestoreMember || isRestoring) return
    try {
      setIsRestoring(true)
      await onRestoreMember(member.id)
    } catch (err) {
      toast.error("Failed to restore member", {
        description: (err as Error).message || "Could not restore collaborator access.",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(member.createdAt), {
        addSuffix: true,
      })
    } catch {
      return "recently"
    }
  })()

  const readOnlyReason = isOwner
    ? "Workspace Owners have permanent full access to all features and settings."
    : isRevoked
      ? "This collaborator's access is currently revoked. Restore membership to modify permissions."
      : !canUpdate
        ? "You do not have permission to edit collaborator permissions."
        : undefined

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Fixed Top Action Bar matching Board/Calendar/Zenbox */}
      <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />

          <Separator orientation="vertical" />
          <Clock className="size-3.5" />
          <span>Joined {formattedDate}</span>

          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {member.role}
          </span>

          {member.isCurrentUser && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
              You
            </span>
          )}

          {isRevoked ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              Revoked
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          )}
        </div>

        {/* Header Actions & Auto-Save Indicator */}
        <div className="flex items-center gap-2">
          {(isSaving || isUpdating) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Saving...</span>
            </div>
          )}

          {!isOwner && (
            <>
              {!isRevoked ? (
                canDelete && onRevokeMember && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRevoke}
                    disabled={isRevoking || isSaving || isUpdating}
                    className="h-8 cursor-pointer gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Revoke collaborator access"
                  >
                    {isRevoking ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <UserX className="size-3.5" />
                    )}
                    <span>Revoke</span>
                  </Button>
                )
              ) : (
                <>
                  {canUpdate && onRestoreMember && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRestore}
                      disabled={isRestoring || isSaving || isUpdating}
                      className="h-8 cursor-pointer gap-1.5 text-xs font-medium"
                      title="Restore collaborator access"
                    >
                      {isRestoring ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="size-3.5" />
                      )}
                      <span>Restore</span>
                    </Button>
                  )}

                  {canDelete && onDeleteMember && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      disabled={isDeleting || isSaving || isUpdating}
                      className="h-8 cursor-pointer gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Permanently delete collaborator"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      <span>Delete</span>
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Body (Scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full p-4 sm:p-6 pb-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
            {/* Left Column: RBAC Matrix Table */}
            <div className="flex min-w-0 flex-col">
              <RbacMatrixTable
                permissions={permissions}
                onChange={handlePermissionsChange}
                disabled={isOwner || isRevoked || !canUpdate || isSaving || isUpdating}
                readOnlyReason={readOnlyReason}
              />
            </div>

            {/* Right Column: Member Info Card */}
            <div className="flex flex-col gap-4">
              {/* Member Profile Card */}
              <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                {/* Centered Avatar Display */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl border border-primary/20 shadow-xs">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="size-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span>{member.initials}</span>
                    )}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-background",
                        isRevoked ? "bg-destructive" : "bg-emerald-500"
                      )}
                      title={isRevoked ? "Revoked" : "Active"}
                    />
                  </div>
                </div>

                <Separator />

                {/* Metadata & Profile Summary */}
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Name</span>
                    <span className="font-semibold text-foreground truncate text-right" title={member.displayName}>
                      {member.displayName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Email</span>
                    <span className="text-muted-foreground truncate text-right font-mono text-[11px]" title={member.email}>
                      {member.email || "No email"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        isOwner
                          ? "bg-primary/10 text-primary font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {member.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        isRevoked
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {isRevoked ? "Revoked" : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium text-foreground">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Permanent Delete */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete {member.displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collaborator's membership record from the workspace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmPermanentDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Delete Permanently</span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MemberPermissionsDetail
