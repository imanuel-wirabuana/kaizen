import { useState } from "react"
import { Copy, Check, Link2, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { cn } from "cn"
import {
  DEFAULT_MEMBER_PERMISSIONS,
  type WorkspaceInvite,
  type WorkspacePermissions,
} from "@/types/member"

export interface GenerateInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName?: string
  onGenerate: (params: {
    permissions: WorkspacePermissions
    maxUses?: number
    expiredAt?: string | null
  }) => Promise<WorkspaceInvite>
  isGenerating?: boolean
}

type ExpiryOption = "1day" | "7days" | "30days" | "never"
type UsesOption = "1" | "5" | "10" | "unlimited"

export function GenerateInviteDialog({
  open,
  onOpenChange,
  workspaceName = "Workspace",
  onGenerate,
  isGenerating = false,
}: GenerateInviteDialogProps) {
  const [usesOption, setUsesOption] = useState<UsesOption>("1")
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>("7days")
  const [showCustomPerms, setShowCustomPerms] = useState(false)
  const [permissions, setPermissions] = useState<WorkspacePermissions>(
    DEFAULT_MEMBER_PERMISSIONS
  )
  const [generatedInvite, setGeneratedInvite] = useState<WorkspaceInvite | null>(
    null
  )
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const handleReset = () => {
    setGeneratedInvite(null)
    setUsesOption("1")
    setExpiryOption("7days")
    setShowCustomPerms(false)
    setPermissions(DEFAULT_MEMBER_PERMISSIONS)
    setCopiedLink(false)
    setCopiedCode(false)
  }

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset()
    }
    onOpenChange(nextOpen)
  }

  const calculateExpiryDate = (): string | null => {
    const now = new Date()
    if (expiryOption === "1day") {
      now.setDate(now.getDate() + 1)
      return now.toISOString()
    }
    if (expiryOption === "7days") {
      now.setDate(now.getDate() + 7)
      return now.toISOString()
    }
    if (expiryOption === "30days") {
      now.setDate(now.getDate() + 30)
      return now.toISOString()
    }
    return null
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    const maxUses =
      usesOption === "1"
        ? 1
        : usesOption === "5"
          ? 5
          : usesOption === "10"
            ? 10
            : 0 // 0 means unlimited

    const expiredAt = calculateExpiryDate()

    try {
      const invite = await onGenerate({
        permissions,
        maxUses,
        expiredAt,
      })
      setGeneratedInvite(invite)
    } catch {
      // Error handled by hook toast
    }
  }

  const inviteLink = generatedInvite
    ? `${window.location.origin}/join?code=${generatedInvite.code}`
    : ""

  const handleCopyLink = () => {
    if (!inviteLink) return
    void navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    toast.success("Link copied to clipboard", {
      description: "Anyone with this link can join with granted permissions.",
    })
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    if (!generatedInvite) return
    void navigator.clipboard.writeText(generatedInvite.code)
    setCopiedCode(true)
    toast.success("Invite code copied", {
      description: generatedInvite.code,
    })
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleToggle = (
    resource: keyof WorkspacePermissions,
    action: string,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: checked,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>Generate Invite Code</span>
          </DialogTitle>
          <DialogDescription>
            Create a sharable invitation link to collaborate on{" "}
            <span className="font-semibold text-foreground">{workspaceName}</span>.
          </DialogDescription>
        </DialogHeader>

        {generatedInvite ? (
          /* Result Screen */
          <div className="flex flex-col gap-4 py-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-3 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Link2 className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Invite Link Ready!
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share this code or link with your teammates.
                </p>
              </div>

              {/* Code Display */}
              <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md font-mono text-sm font-bold tracking-wider text-foreground">
                <span>{generatedInvite.code}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopyCode}
                  title="Copy code"
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {copiedCode ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>

              {/* Full URL Input */}
              <div className="w-full flex items-center gap-2 mt-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs font-mono bg-background select-all"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGeneratedInvite(null)}
                className="cursor-pointer"
              >
                Create Another
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleDialogChange(false)}
                className="cursor-pointer"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Configuration Form */
          <form onSubmit={handleGenerate} className="flex flex-col gap-4 py-2 flex-1 overflow-y-auto pr-1">
            {/* Max Uses */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Usage Limit
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ["1", "1 Use"],
                    ["5", "5 Uses"],
                    ["10", "10 Uses"],
                    ["unlimited", "Unlimited"],
                  ] as const
                ).map(([val, label]) => (
                  <Button
                    key={val}
                    type="button"
                    variant={usesOption === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsesOption(val)}
                    className="text-xs cursor-pointer h-8"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Expiration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Link Expiration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ["1day", "24 Hours"],
                    ["7days", "7 Days"],
                    ["30days", "30 Days"],
                    ["never", "Never"],
                  ] as const
                ).map(([val, label]) => (
                  <Button
                    key={val}
                    type="button"
                    variant={expiryOption === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpiryOption(val)}
                    className="text-xs cursor-pointer h-8"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Granular Permissions Toggle Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground">
                    Granted Permissions
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Collaborators joining with this link will receive these permissions.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomPerms((prev) => !prev)}
                  className="gap-1 text-xs cursor-pointer h-7"
                >
                  <span>{showCustomPerms ? "Hide" : "Customize"}</span>
                  {showCustomPerms ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </Button>
              </div>

              {showCustomPerms && (
                <div className="flex flex-col gap-2.5 mt-1">
                  {(
                    [
                      {
                        id: "boards",
                        label: "Boards",
                        actions: ["read", "create", "update", "delete"],
                      },
                      {
                        id: "zenbox",
                        label: "Zenbox",
                        actions: ["read", "create", "update", "delete"],
                      },
                      {
                        id: "calendars",
                        label: "Calendars",
                        actions: ["read", "create", "update", "delete"],
                      },
                      {
                        id: "assistant",
                        label: "Assistant",
                        actions: ["read", "create", "update", "delete"],
                      },
                      {
                        id: "members",
                        label: "Members",
                        actions: ["read", "create", "update", "delete"],
                      },
                      {
                        id: "workspace",
                        label: "Workspace Settings",
                        actions: ["read", "update"],
                      },
                    ] as const
                  ).map((section) => {
                    const currentRes = permissions[section.id] as unknown as Record<
                      string,
                      boolean
                    >
                    return (
                      <Card
                        key={section.id}
                        className="p-2.5 border-border/60 shadow-2xs flex flex-col gap-1.5 bg-muted/20"
                      >
                        <span className="text-xs font-semibold text-foreground">
                          {section.label}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40">
                          {section.actions.map((act) => {
                            const isChecked = Boolean(currentRes?.[act])
                            return (
                              <div
                                key={act}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  handleToggle(section.id, act, !isChecked)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    handleToggle(section.id, act, !isChecked)
                                  }
                                }}
                                className={cn(
                                  "flex items-center justify-between gap-1.5 p-1.5 rounded-md border text-xs cursor-pointer select-none transition-all",
                                  isChecked
                                    ? "bg-primary/10 border-primary/40 text-foreground"
                                    : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
                                )}
                              >
                                <span
                                  className={cn(
                                    "capitalize text-[11px]",
                                    isChecked
                                      ? "font-semibold text-foreground"
                                      : "font-medium text-muted-foreground"
                                  )}
                                >
                                  {act}
                                </span>
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={(val) =>
                                    handleToggle(section.id, act, val)
                                  }
                                  size="sm"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDialogChange(false)}
                disabled={isGenerating}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isGenerating}
                className="cursor-pointer gap-1.5"
              >
                <Sparkles className="size-3.5" />
                <span>{isGenerating ? "Generating..." : "Generate Invite Link"}</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
