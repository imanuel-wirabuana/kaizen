import { useState, useEffect, useRef } from "react"
import {
  Shield,
  UserX,
  Clock,
  Loader2,
  RotateCcw,
  Trash2,
  Check,
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

        {/* Realtime Save State Indicator */}
        <div className="flex items-center gap-2">
          {!isOwner && !isRevoked && canUpdate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isSaving || isUpdating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span className="text-[11px] text-muted-foreground">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">Saved</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Body (Scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 pb-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Left Column: RBAC Matrix Table */}
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Role & Permissions Matrix
                  </h2>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure granular CRUD permissions for each feature module in this workspace. All modifications auto-save in realtime.
              </p>

              <RbacMatrixTable
                permissions={permissions}
                onChange={handlePermissionsChange}
                disabled={isOwner || isRevoked || !canUpdate || isSaving || isUpdating}
                readOnlyReason={readOnlyReason}
                className="mt-1"
              />
            </div>

            {/* Right Column: Member Info Card & Quick Actions */}
            <div className="flex flex-col gap-4">
              {/* Member Profile Card */}
              <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-base border border-primary/20">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="size-full rounded-xl object-cover"
                      />
                    ) : (
                      <span>{member.initials}</span>
                    )}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-background",
                        isRevoked ? "bg-destructive" : "bg-emerald-500"
                      )}
                    />
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <h1 className="truncate text-sm font-bold tracking-tight text-foreground">
                      {member.displayName}
                    </h1>
                    <span className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Metadata Summary */}
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        isOwner
                          ? "bg-primary/10 text-primary"
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

              {/* Actions Card */}
              {!isOwner && (
                <div className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                  <h3 className="text-xs font-semibold text-foreground">
                    Collaborator Access
                  </h3>

                  {!isRevoked ? (
                    canDelete && onRevokeMember && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRevokeMember(member.id)}
                        className="w-full cursor-pointer justify-start gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <UserX className="size-3.5" />
                        <span>Revoke Access</span>
                      </Button>
                    )
                  ) : (
                    <div className="flex flex-col gap-2">
                      {canUpdate && onRestoreMember && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRestoreMember(member.id)}
                          className="w-full cursor-pointer justify-start gap-2 text-xs font-medium"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Restore Access</span>
                        </Button>
                      )}

                      {canDelete && onDeleteMember && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setIsConfirmDeleteOpen(true)}
                          className="w-full cursor-pointer justify-start gap-2 text-xs font-medium"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete Permanently</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
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
