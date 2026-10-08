import { useEffect, useRef, useState } from "react"
import { Building, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useJoinWorkspace } from "@/features/members/hooks/use-join-workspace"
import { useWorkspaceStore } from "@/stores/workspace-store"
import type { VerifiedInviteResult } from "@/features/members/services/invite-service"

export interface AcceptInviteDialogProps {
  code: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function AcceptInviteDialog({
  code,
  open,
  onOpenChange,
  onComplete,
}: AcceptInviteDialogProps) {
  const [inviteResult, setInviteResult] = useState<VerifiedInviteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const lastVerifiedCodeRef = useRef<string | null>(null)

  const { verifyCode, joinWorkspace, isJoining } = useJoinWorkspace()
  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId
  )

  useEffect(() => {
    if (!open || !code) {
      setInviteResult(null)
      setErrorMessage(null)
      lastVerifiedCodeRef.current = null
      return
    }

    if (lastVerifiedCodeRef.current === code) {
      return
    }

    lastVerifiedCodeRef.current = code
    let isMounted = true
    setLoading(true)
    setErrorMessage(null)

    verifyCode(code)
      .then((res) => {
        if (isMounted) {
          setInviteResult(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage((err as Error).message || "Invalid invite code.")
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [code, open, verifyCode])

  const handleAccept = async () => {
    if (!code) return
    try {
      await joinWorkspace(code)
      onComplete()
      onOpenChange(false)
    } catch {
      // Error handled by hook toast
    }
  }

  const handleOpenWorkspace = () => {
    if (inviteResult?.workspace?.id) {
      setActiveWorkspaceId(inviteResult.workspace.id)
    }
    onComplete()
    onOpenChange(false)
  }

  const handleDecline = () => {
    onComplete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="size-4 text-primary" />
            <span>Workspace Invitation</span>
          </DialogTitle>
          <DialogDescription>
            You have been invited to collaborate on a Kaizen workspace.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs">Verifying invitation...</span>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Unable to Join Workspace
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {errorMessage}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="mt-2 cursor-pointer"
            >
              Close
            </Button>
          </div>
        ) : inviteResult ? (
          inviteResult.isAlreadyMember ? (
            <div className="flex flex-col gap-4 py-2">
              <Card className="p-4 border-primary/30 bg-primary/5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                    <Building className="size-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {inviteResult.workspace.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-primary border-primary/30"
                      >
                        {inviteResult.isAlreadyOwner ? "Owner" : "Current Member"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You already have active access to collaborate on this workspace.
                    </p>
                  </div>
                </div>
              </Card>

              <DialogFooter className="pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="cursor-pointer"
                >
                  Dismiss
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenWorkspace}
                  className="cursor-pointer gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Go to Workspace</span>
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <Card className="p-4 border-primary/30 bg-primary/5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                    <Building className="size-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">
                      {inviteResult.workspace.name}
                    </h3>
                    {inviteResult.workspace.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {inviteResult.workspace.description}
                      </p>
                    )}
                    <span className="text-[11px] text-muted-foreground font-mono mt-1">
                      Invite Code: {inviteResult.invite.code}
                    </span>
                  </div>
                </div>

                {/* Permissions Highlights */}
                <div className="pt-2 border-t border-border/40 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Granted Permissions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(inviteResult.invite.permissions).map(
                      ([key, val]) => {
                        const hasAccess =
                          typeof val === "object" && val !== null && "read" in val
                            ? (val as { read: boolean }).read
                            : false
                        if (!hasAccess) return null
                        return (
                          <Badge
                            key={key}
                            variant="secondary"
                            className="capitalize text-[10px] py-0"
                          >
                            {key}
                          </Badge>
                        )
                      }
                    )}
                  </div>
                </div>
              </Card>

              <DialogFooter className="pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  disabled={isJoining}
                  className="cursor-pointer"
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAccept}
                  disabled={isJoining}
                  className="cursor-pointer gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>
                    {isJoining ? "Joining..." : "Accept & Join Workspace"}
                  </span>
                </Button>
              </DialogFooter>
            </div>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
