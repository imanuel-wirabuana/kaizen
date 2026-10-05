import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences, appearance, and workspace options.
        </p>
      </div>

      {/* Appearance Section */}
      <Card className="p-5 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Appearance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize the look and feel of your Kaizen workspace.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Press <kbd>d</kbd> to toggle
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
            className="flex items-center justify-center gap-2 h-10 text-xs"
          >
            <Sun className="size-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
            className="flex items-center justify-center gap-2 h-10 text-xs"
          >
            <Moon className="size-4" />
            Dark
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            onClick={() => setTheme("system")}
            className="flex items-center justify-center gap-2 h-10 text-xs"
          >
            <Monitor className="size-4" />
            System
          </Button>
        </div>
      </Card>

      {/* Keyboard Shortcuts Reference */}
      <Card className="p-5 flex flex-col gap-3 shadow-2xs">
        <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
        <div className="divide-y divide-border/50 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Toggle Light / Dark theme</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">d</kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Navigate to Inbox</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">g then i</kbd>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Quick Action Command Menu</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">Cmd + K</kbd>
          </div>
        </div>
      </Card>

      {/* Workspace Info */}
      <Card className="p-5 flex flex-col gap-3 shadow-2xs">
        <h3 className="text-sm font-semibold">Workspace Details</h3>
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-medium">Kaizen Workspace</p>
            <p className="text-muted-foreground">Version 1.0.0 &bull; Standard Tier</p>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
