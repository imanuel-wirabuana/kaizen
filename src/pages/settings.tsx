import { useState, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { Moon, Sun, Monitor, Check, Save, Lock } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const { activeWorkspace, updateWorkspace } = useWorkspaces()
  const { canRead, canUpdate, isLoading: isPermsLoading } = useWorkspacePermissions()

  const [name, setName] = useState(activeWorkspace?.name || "")
  const [description, setDescription] = useState(activeWorkspace?.description || "")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name)
      setDescription(activeWorkspace.description || "")
    }
  }, [activeWorkspace])

  // 1. workspace.read guard
  if (!isPermsLoading && !canRead("workspace")) {
    return (
      <AccessDeniedState
        resource="Settings"
        description="You do not have permission to view workspace settings."
      />
    )
  }

  const hasUpdate = canUpdate("workspace")

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !name.trim() || !hasUpdate) return

    try {
      setIsSaving(true)
      await updateWorkspace(activeWorkspace.id, {
        name: name.trim(),
        description: description.trim() || null,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences, appearance, and workspace options.
        </p>
      </div>

      {/* Workspace Details & Edit Form */}
      <Card className="p-5 flex flex-col gap-4 shadow-2xs border-border/80">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div>
            <h3 className="text-sm font-semibold">Active Workspace</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure name and details for this workspace.
            </p>
          </div>
          {!hasUpdate ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Lock className="size-3" />
              <span>Read-only</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Standard Tier
            </Badge>
          )}
        </div>

        <form onSubmit={handleSaveWorkspace} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ws-name" className="text-xs font-medium text-foreground">
              Workspace Name
            </label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Studio, Kaizen Core"
              className="text-xs bg-card"
              disabled={!hasUpdate || isSaving}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ws-desc" className="text-xs font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workspace's purpose..."
              className="text-xs min-h-[70px] bg-card resize-none"
              disabled={!hasUpdate || isSaving}
            />
          </div>

          {hasUpdate ? (
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || !name.trim()}
                className="gap-1.5 cursor-pointer"
              >
                <Save className="size-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Lock className="size-3" />
              <span>You have read-only access to this workspace&apos;s settings.</span>
            </div>
          )}
        </form>
      </Card>

      {/* Appearance Section */}
      <Card className="p-5 flex flex-col gap-4 shadow-2xs border-border/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Appearance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize the look and feel of your Kaizen workspace.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Press <kbd className="font-semibold">d</kbd> to toggle
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
            className="flex items-center justify-center gap-2 h-10 text-xs cursor-pointer"
          >
            <Sun className="size-4" />
            Light
            {theme === "light" && <Check className="size-3.5 ml-auto" />}
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
            className="flex items-center justify-center gap-2 h-10 text-xs cursor-pointer"
          >
            <Moon className="size-4" />
            Dark
            {theme === "dark" && <Check className="size-3.5 ml-auto" />}
          </Button>
          <Button
            type="button"
            variant={theme === "system" ? "default" : "outline"}
            onClick={() => setTheme("system")}
            className="flex items-center justify-center gap-2 h-10 text-xs cursor-pointer"
          >
            <Monitor className="size-4" />
            System
            {theme === "system" && <Check className="size-3.5 ml-auto" />}
          </Button>
        </div>
      </Card>

      {/* Keyboard Shortcuts Reference */}
      <Card className="p-5 flex flex-col gap-3 shadow-2xs border-border/80">
        <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
        <div className="divide-y divide-border/50 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Quick Action Command Palette</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              Cmd + K / Ctrl + K
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Toggle Light / Dark theme</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              d
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Navigate to Zenbox</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              g then z
            </kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Close modals and dialogs</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              Esc
            </kbd>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-5 flex flex-col gap-3 shadow-2xs border-border/80">
        <h3 className="text-sm font-semibold">Account Profile</h3>
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-medium text-foreground">
              {user?.fullName || user?.username || "Authenticated User"}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {user?.primaryEmailAddress?.emailAddress || "user@kaizen.app"}
            </p>
          </div>
          <Badge variant="outline">Clerk Authenticated</Badge>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
