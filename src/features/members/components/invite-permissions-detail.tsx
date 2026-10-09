import { useState, useEffect, useRef } from "react"
import {
  Shield,
  Copy,
  Check,
  Link2,
  Trash2,
  KeyRound,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { toast } from "@/components/ui/toast"
import { RbacMatrixTable } from "@/features/members/components/rbac-matrix-table"
import type { WorkspaceInvite, WorkspacePermissions } from "@/types/member"
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

export interface InvitePermissionsDetailProps {
  invite: WorkspaceInvite
  canUpdate: boolean
  canDelete: boolean
  isUpdating: boolean
  onUpdateInvite: (params: {
    inviteId: number
    permissions?: WorkspacePermissions
    maxUses?: number
    expiredAt?: string | null
  }) => Promise<unknown>
  onRevokeInvite?: (inviteId: number) => Promise<unknown>
  onRestoreInvite?: (inviteId: number) => Promise<unknown>
  onDeleteInvite?: (inviteId: number) => Promise<unknown>
}

export function InvitePermissionsDetail({
  invite,
  canUpdate,
  canDelete,
  isUpdating,
  onUpdateInvite,
  onRevokeInvite,
  onRestoreInvite,
  onDeleteInvite,
}: InvitePermissionsDetailProps) {
  const [permissions, setPermissions] = useState<WorkspacePermissions>(() =>
    parsePermissions(invite.permissions)
  )
  const [maxUses, setMaxUses] = useState<number>(() => invite.max_uses)
  const [expiryOption, setExpiryOption] = useState<string>(() =>
    invite.expired_at ? "keep" : "never"
  )
  const [expiredAt, setExpiredAt] = useState<string | null>(() => invite.expired_at)
  const [hasCopiedCode, setHasCopiedCode] = useState(false)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [referenceTime] = useState(() => Date.now())

  const initializedInviteIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (initializedInviteIdRef.current !== invite.id) {
      initializedInviteIdRef.current = invite.id
      setPermissions(parsePermissions(invite.permissions))
      setMaxUses(invite.max_uses)
      setExpiredAt(invite.expired_at)
      setExpiryOption(invite.expired_at ? "keep" : "never")
    }
  }, [invite.id, invite.permissions, invite.max_uses, invite.expired_at])

  const isRevoked = Boolean(invite.revoked_at)
  const isExpired =
    Boolean(invite.expired_at) &&
    new Date(invite.expired_at!).getTime() < referenceTime
  const isExhausted =
    invite.max_uses > 0 && invite.use_count >= invite.max_uses

  const isInactive = isRevoked || isExpired || isExhausted

  // Realtime auto-save on matrix change
  const handlePermissionsChange = async (newPermissions: WorkspacePermissions) => {
    setPermissions(newPermissions)
    if (isInactive || !canUpdate) return

    try {
      setIsSaving(true)
      await onUpdateInvite({
        inviteId: invite.id,
        permissions: newPermissions,
        maxUses,
        expiredAt,
      })
    } catch (err) {
      toast.error("Failed to update permissions", {
        description: (err as Error).message || "Could not auto-save changes.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Realtime auto-save on max uses change
  const handleMaxUsesChange = async (val: string | null) => {
    if (!val) return
    const newMaxUses = Number(val)
    setMaxUses(newMaxUses)
    if (isInactive || !canUpdate) return

    try {
      setIsSaving(true)
      await onUpdateInvite({
        inviteId: invite.id,
        permissions,
        maxUses: newMaxUses,
        expiredAt,
      })
    } catch (err) {
      toast.error("Failed to update usage limit", {
        description: (err as Error).message || "Could not save setting.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Realtime auto-save on expiry option change
  const handleExpiryChange = async (val: string | null) => {
    if (!val) return
    setExpiryOption(val)
    let nextExpiredAt: string | null = null

    if (val === "keep") {
      nextExpiredAt = invite.expired_at
    } else if (val === "never") {
      nextExpiredAt = null
    } else if (val === "1day") {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      nextExpiredAt = d.toISOString()
    } else if (val === "7days") {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      nextExpiredAt = d.toISOString()
    } else if (val === "30days") {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      nextExpiredAt = d.toISOString()
    }

    setExpiredAt(nextExpiredAt)
    if (isInactive || !canUpdate) return

    try {
      setIsSaving(true)
      await onUpdateInvite({
        inviteId: invite.id,
        permissions,
        maxUses,
        expiredAt: nextExpiredAt,
      })
    } catch (err) {
      toast.error("Failed to update expiration", {
        description: (err as Error).message || "Could not save setting.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmPermanentDelete = async () => {
    if (!onDeleteInvite || isDeleting) return
    try {
      setIsDeleting(true)
      await onDeleteInvite(invite.id)
      setIsConfirmDeleteOpen(false)
    } catch (err) {
      toast.error("Failed to delete invite", {
        description: (err as Error).message || "Could not delete invite code.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(invite.code)
      setHasCopiedCode(true)
      toast.success("Code copied", {
        description: `Invite code ${invite.code} copied to clipboard.`,
      })
      setTimeout(() => setHasCopiedCode(false), 2000)
    } catch {
      toast.error("Failed to copy code")
    }
  }

  const handleCopyLink = async () => {
    try {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://kaizen.app"
      const url = `${origin}/join/${invite.code}`
      await navigator.clipboard.writeText(url)
      setHasCopiedLink(true)
      toast.success("Invite link copied", {
        description: "Sharable invitation link copied to clipboard.",
      })
      setTimeout(() => setHasCopiedLink(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const readOnlyReason = isRevoked
    ? "This invite code has been revoked and cannot be modified."
    : isExpired
      ? "This invite code has expired."
      : isExhausted
        ? "This invite code has reached its maximum usage limit."
        : !canUpdate
          ? "You do not have permission to edit invite permissions."
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
          <KeyRound className="size-3.5" />
          <span className="font-mono font-medium text-foreground">
            {invite.code}
          </span>

          {isRevoked ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              Revoked
            </span>
          ) : isExpired ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Expired
            </span>
          ) : isExhausted ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Limit Reached
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          )}
        </div>

        {/* Realtime Save Status & Quick Actions */}
        <div className="flex items-center gap-2">
          {!isInactive && canUpdate && (
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Copy invite code"
          >
            {hasCopiedCode ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className="hidden sm:inline">Copy Code</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Copy full invite URL"
          >
            {hasCopiedLink ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Link2 className="size-3.5" />
            )}
            <span className="hidden sm:inline">Share Link</span>
          </Button>
        </div>
      </div>

      {/* Main 2-Column Responsive Body (Scrollable) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 pb-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Left Column: RBAC Matrix Setup */}
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Invite Code Permissions Matrix
                  </h2>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Any collaborator joining via this invite code will receive the permissions configured below. All changes auto-save in realtime.
              </p>

              <RbacMatrixTable
                permissions={permissions}
                onChange={handlePermissionsChange}
                disabled={isInactive || !canUpdate || isSaving || isUpdating}
                readOnlyReason={readOnlyReason}
                className="mt-1"
              />
            </div>

            {/* Right Column: Code Info, Shadcn Settings, and Actions */}
            <div className="flex flex-col gap-4">
              {/* Code Info Card */}
              <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-lg border border-blue-500/20">
                    <KeyRound className="size-6" />
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <span className="font-mono text-base font-bold tracking-wider text-foreground">
                      {invite.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(invite.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Shadcn Select: Usage Limit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Maximum Uses
                  </label>
                  <Select
                    value={String(maxUses)}
                    onValueChange={handleMaxUsesChange}
                    disabled={isInactive || !canUpdate || isSaving || isUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select usage limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 use (single-use)</SelectItem>
                      <SelectItem value="5">5 uses</SelectItem>
                      <SelectItem value="10">10 uses</SelectItem>
                      <SelectItem value="25">25 uses</SelectItem>
                      <SelectItem value="50">50 uses</SelectItem>
                      <SelectItem value="100">100 uses</SelectItem>
                      <SelectItem value="0">Unlimited</SelectItem>
                      {![1, 5, 10, 25, 50, 100, 0].includes(invite.max_uses) && (
                        <SelectItem value={String(invite.max_uses)}>
                          {invite.max_uses} uses (current)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shadcn Select: Expiration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Expiration Date
                  </label>
                  <Select
                    value={expiryOption}
                    onValueChange={handleExpiryChange}
                    disabled={isInactive || !canUpdate || isSaving || isUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select expiration" />
                    </SelectTrigger>
                    <SelectContent>
                      {invite.expired_at && (
                        <SelectItem value="keep">
                          {`Current (${new Date(invite.expired_at).toLocaleDateString()})`}
                        </SelectItem>
                      )}
                      <SelectItem value="never">Never expires</SelectItem>
                      <SelectItem value="1day">1 day from now</SelectItem>
                      <SelectItem value="7days">7 days from now</SelectItem>
                      <SelectItem value="30days">30 days from now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Usage Summary */}
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50">
                  <span>Usage Count</span>
                  <strong className="text-foreground font-semibold">
                    {invite.use_count} / {maxUses === 0 ? "∞" : maxUses}
                  </strong>
                </div>
              </div>

              {/* Actions Card */}
              <div className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                <h3 className="text-xs font-semibold text-foreground">
                  Invite Code Status
                </h3>

                {!isRevoked ? (
                  canDelete && onRevokeInvite && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRevokeInvite(invite.id)}
                      className="w-full cursor-pointer justify-start gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Revoke Invite Code</span>
                    </Button>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    {canUpdate && onRestoreInvite && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRestoreInvite(invite.id)}
                        className="w-full cursor-pointer justify-start gap-2 text-xs font-medium"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Restore Invite Code</span>
                      </Button>
                    )}

                    {canDelete && onDeleteInvite && (
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
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Permanent Delete */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete invite {invite.code}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invitation record from your workspace. This action cannot be undone.
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

export default InvitePermissionsDetail
