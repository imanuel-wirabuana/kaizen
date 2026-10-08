import { useState } from "react"
import { Copy, Check, Ban, Link2, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
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
import type { WorkspaceInvite } from "@/types/member"

export interface InvitesTableProps {
  invites: WorkspaceInvite[]
  onRevoke: (inviteId: number) => Promise<boolean>
  canRevoke?: boolean
}

export function InvitesTable({
  invites,
  onRevoke,
  canRevoke = true,
}: InvitesTableProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [inviteToRevoke, setInviteToRevoke] = useState<WorkspaceInvite | null>(
    null
  )
  const [referenceTime] = useState(() => Date.now())

  const handleCopyLink = (invite: WorkspaceInvite) => {
    const link = `${window.location.origin}/join?code=${invite.code}`
    void navigator.clipboard.writeText(link)
    setCopiedId(invite.id)
    toast.success("Invite link copied", {
      description: link,
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRevoke = (invite: WorkspaceInvite) => {
    setInviteToRevoke(invite)
  }

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <Link2 className="size-5" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <p className="text-sm font-medium text-foreground">
            No active invitation links
          </p>
          <p className="text-xs text-muted-foreground">
            Generate an invite link to collaborate with teammates on boards,
            zenbox, and calendars.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/40">
      {invites.map((invite) => {
        const isRevoked = Boolean(invite.revoked_at)
        const isExpired = Boolean(
          invite.expired_at &&
            new Date(invite.expired_at).getTime() < referenceTime
        )
        const isMaxedOut = Boolean(
          invite.max_uses > 0 && invite.use_count >= invite.max_uses
        )
        const isActive = !isRevoked && !isExpired && !isMaxedOut

        const formattedExpiry = invite.expired_at
          ? new Date(invite.expired_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Never"

        const usageText =
          invite.max_uses === 0
            ? `${invite.use_count} uses (Unlimited)`
            : `${invite.use_count} of ${invite.max_uses} used`

        return (
          <div
            key={invite.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
          >
            {/* Left: Code, Status & Usage Metadata */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border tracking-wider select-all">
                  {invite.code}
                </span>

                {isActive && (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-medium"
                  >
                    Active Link
                  </Badge>
                )}
                {isRevoked && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] text-destructive bg-destructive/10 border-transparent font-medium"
                  >
                    Revoked
                  </Badge>
                )}
                {!isRevoked && isExpired && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] text-muted-foreground bg-muted/60"
                  >
                    Expired
                  </Badge>
                )}
                {!isRevoked && !isExpired && isMaxedOut && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] text-amber-600 bg-amber-500/10 border-transparent"
                  >
                    Max Uses Reached
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground/70" />
                  <span>{usageText}</span>
                </div>
                <span className="text-muted-foreground/40">&bull;</span>
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground/70" />
                  <span>Expires: {formattedExpiry}</span>
                </div>
                <span className="text-muted-foreground/40">&bull;</span>
                <span className="text-[11px] text-muted-foreground/80">
                  Created{" "}
                  {new Date(invite.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(invite)}
                disabled={!isActive}
                className="gap-1.5 text-xs cursor-pointer h-8 border-border hover:bg-accent"
              >
                {copiedId === invite.id ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
                <span>{copiedId === invite.id ? "Copied" : "Copy Link"}</span>
              </Button>

              {canRevoke && isActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(invite)}
                  disabled={revokingId === invite.id}
                  className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer h-8"
                  title="Deactivate this invite link"
                >
                  <Ban className="size-3.5" />
                  <span>{revokingId === invite.id ? "Revoking..." : "Revoke"}</span>
                </Button>
              )}
            </div>
          </div>
        )
      })}

      <AlertDialog
        open={Boolean(inviteToRevoke)}
        onOpenChange={(open) => {
          if (!open && !revokingId) setInviteToRevoke(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invite Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke invite code{" "}
              <span className="font-mono font-semibold text-foreground">
                "{inviteToRevoke?.code}"
              </span>
              ? Anyone with this link or code will immediately no longer be able to
              join this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(revokingId)}
              onClick={() => setInviteToRevoke(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(revokingId)}
              onClick={async () => {
                if (!inviteToRevoke) return
                try {
                  setRevokingId(inviteToRevoke.id)
                  await onRevoke(inviteToRevoke.id)
                } finally {
                  setRevokingId(null)
                  setInviteToRevoke(null)
                }
              }}
            >
              {revokingId ? "Revoking..." : "Revoke Invite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
