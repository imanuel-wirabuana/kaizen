import { useState } from "react"
import { LogIn, Sparkles, Building, CheckCircle2 } from "lucide-react"
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
import { Card } from "@/components/ui/card"
import { useJoinWorkspace } from "@/features/members/hooks/use-join-workspace"
import { extractInviteCode, type VerifiedInviteResult } from "@/features/members/services/invite-service"

export interface JoinWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinWorkspaceDialog({
  open,
  onOpenChange,
}: JoinWorkspaceDialogProps) {
  const [inputVal, setInputVal] = useState("")
  const [verifiedResult, setVerifiedResult] = useState<VerifiedInviteResult | null>(null)

  const {
    verifyCode,
    joinWorkspace,
    isVerifying,
    isJoining,
    verifyError,
    resetVerify,
  } = useJoinWorkspace()

  const handleReset = () => {
    setInputVal("")
    setVerifiedResult(null)
    resetVerify()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset()
    }
    onOpenChange(nextOpen)
  }

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = extractInviteCode(inputVal)
    if (!cleanCode) return

    try {
      const result = await verifyCode(cleanCode)
      setVerifiedResult(result)
    } catch {
      setVerifiedResult(null)
    }
  }

  const handleJoin = async () => {
    const cleanCode = extractInviteCode(inputVal)
    if (!cleanCode) return

    try {
      await joinWorkspace(cleanCode)
      handleOpenChange(false)
    } catch {
      // Error handled by hook toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="size-4 text-primary" />
            <span>Join a Workspace</span>
          </DialogTitle>
          <DialogDescription>
            Enter an invite code or paste an invite link to collaborate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePreview} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-code-input"
              className="text-xs font-semibold text-foreground"
            >
              Invite Code or Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="invite-code-input"
                placeholder="e.g. KZ-7X9P-2K5M or full link"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value)
                  if (verifiedResult) setVerifiedResult(null)
                }}
                className="text-xs font-mono"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!inputVal.trim() || isVerifying || isJoining}
                className="cursor-pointer shrink-0"
              >
                {isVerifying ? "Checking..." : "Verify"}
              </Button>
            </div>
            {verifyError && (
              <span className="text-xs text-destructive mt-0.5">
                {verifyError}
              </span>
            )}
          </div>

          {verifiedResult && (
            <Card className="p-4 border-primary/30 bg-primary/5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
                  <Building className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {verifiedResult.workspace.name}
                    </h4>
                    <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                  </div>
                  {verifiedResult.workspace.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {verifiedResult.workspace.description}
                    </p>
                  )}
                  <span className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                    Code: {verifiedResult.invite.code}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <DialogFooter className="pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isJoining}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleJoin}
              disabled={!inputVal.trim() || isJoining}
              className="cursor-pointer gap-1.5"
            >
              <Sparkles className="size-3.5" />
              <span>{isJoining ? "Joining..." : "Join Workspace"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
