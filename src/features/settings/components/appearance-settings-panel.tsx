import { useUser } from "@clerk/clerk-react"
import { Moon, Sun, Monitor, Check, Palette, Keyboard, User } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"

export function AppearanceSettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { user } = useUser()

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 flex min-h-12 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 px-4 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
          <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        </div>
      </div>

      {/* Main Body (Scrollable) */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {/* Card: Theme Mode */}
          <Card className="p-5 flex flex-col gap-4 shadow-2xs border-border/80">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Palette className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Theme Preference</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select how Kaizen appears across your device.
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Press <kbd className="font-semibold">d</kbd> to cycle
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="flex items-center justify-between h-11 px-3.5 text-xs font-medium cursor-pointer shadow-none"
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="size-4" />
                  <span>Light</span>
                </div>
                {theme === "light" && <Check className="size-3.5" />}
              </Button>

              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="flex items-center justify-between h-11 px-3.5 text-xs font-medium cursor-pointer shadow-none"
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="size-4" />
                  <span>Dark</span>
                </div>
                {theme === "dark" && <Check className="size-3.5" />}
              </Button>

              <Button
                type="button"
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="flex items-center justify-between h-11 px-3.5 text-xs font-medium cursor-pointer shadow-none"
              >
                <div className="flex items-center gap-2.5">
                  <Monitor className="size-4" />
                  <span>System</span>
                </div>
                {theme === "system" && <Check className="size-3.5" />}
              </Button>
            </div>
          </Card>

          {/* Card: Keyboard Shortcuts */}
          <Card className="p-5 flex flex-col gap-3 shadow-2xs border-border/80">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Keyboard className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Global navigation and shortcut hotkeys.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/50 text-xs pt-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Command Search Palette</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Cmd + K / Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Toggle Theme (Light / Dark)</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  d
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Jump to Zenbox</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  g then z
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Dismiss Modal / Dialog</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  Esc
                </kbd>
              </div>
            </div>
          </Card>

          {/* Card: User Account Info */}
          <Card className="p-5 flex flex-col gap-3 shadow-2xs border-border/80">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <User className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Account Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your authenticated session credentials.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <p className="font-medium text-foreground">
                  {user?.fullName || user?.username || "Authenticated User"}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {user?.primaryEmailAddress?.emailAddress || "user@kaizen.app"}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Clerk Authenticated
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
