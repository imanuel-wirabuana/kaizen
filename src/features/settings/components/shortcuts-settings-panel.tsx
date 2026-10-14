import { useState, useEffect } from "react"
import {
  Keyboard,
  Save,
  Loader2,
  Check,
  Lock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { toast } from "@/components/ui/toast"
import type { Workspace, WorkspaceSettings } from "@/types/workspace"

export interface ShortcutsSettingsPanelProps {
  workspace?: Workspace | null
  canUpdate?: boolean
  onUpdateWorkspace?: (
    id: number,
    updates: Partial<Workspace>
  ) => Promise<Workspace | void>
}

export function ShortcutsSettingsPanel({
  workspace,
  canUpdate = true,
  onUpdateWorkspace,
}: ShortcutsSettingsPanelProps) {
  const [enableQuickKeys, setEnableQuickKeys] = useState<boolean>(
    workspace?.settings?.shortcuts?.enable_quick_keys !== false
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (workspace?.settings?.shortcuts) {
      setEnableQuickKeys(
        workspace.settings.shortcuts.enable_quick_keys !== false
      )
    }
  }, [workspace])

  const handleToggleQuickKeys = async (checked: boolean) => {
    setEnableQuickKeys(checked)
    if (!workspace || !onUpdateWorkspace || !canUpdate) return

    try {
      setIsSaving(true)
      setIsSaved(false)

      const updatedSettings: WorkspaceSettings = {
        ...(workspace.settings || {}),
        shortcuts: {
          ...(workspace.settings?.shortcuts || {}),
          enable_quick_keys: checked,
        },
      }

      await onUpdateWorkspace(workspace.id, {
        settings: updatedSettings,
      })

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (err) {
      toast.error("Failed to update shortcut preferences", {
        description: (err as Error).message || "Could not auto-save changes.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async () => {
    if (!workspace || !onUpdateWorkspace || !canUpdate || isSaving) return

    try {
      setIsSaving(true)
      setIsSaved(false)

      const updatedSettings: WorkspaceSettings = {
        ...(workspace.settings || {}),
        shortcuts: {
          ...(workspace.settings?.shortcuts || {}),
          enable_quick_keys: enableQuickKeys,
        },
      }

      await onUpdateWorkspace(workspace.id, {
        settings: updatedSettings,
      })

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      toast.error("Failed to save shortcut settings", {
        description: (err as Error).message || "Could not save preferences.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
          <Separator orientation="vertical" />
          <Keyboard className="size-3.5 text-primary" />
          <span className="font-semibold text-xs text-foreground">Shortcuts</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Hotkeys & Navigation
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!canUpdate ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Lock className="size-3" />
              <span>Read-only</span>
            </Badge>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isSaved ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>{isSaving ? "Saving..." : isSaved ? "Saved" : "Save Changes"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Full-Width Body with Row-by-Row Layout */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full p-4 sm:p-6 pb-16">
          <div className="flex w-full flex-col gap-6">
            {/* Keyboard Shortcuts Card */}
            <Card className="p-5 flex flex-col gap-0 shadow-2xs border-border/80">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Keyboard className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Navigation & Keybindings</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure quick keys and view global shortcuts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 1: Single-Key Shortcuts Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground">
                    Single-Key Hotkeys
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Allow quick single-letter navigation like &apos;d&apos; for theme or &apos;g+z&apos; for Zenbox.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <Switch
                    checked={enableQuickKeys}
                    onCheckedChange={handleToggleQuickKeys}
                    disabled={!canUpdate || isSaving}
                    aria-label="Toggle single-key hotkeys"
                  />
                </div>
              </div>

              {/* Row 2: Command Search Palette */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground">
                    Command Search Palette
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Open universal search to jump to boards, tasks, calendars, and actions.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground shadow-2xs">
                    Cmd / Ctrl + K
                  </kbd>
                </div>
              </div>

              {/* Row 3: Jump to Zenbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground">
                    Jump to Zenbox
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Direct two-key navigation sequence to open your Zenbox inbox.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground shadow-2xs">
                    g then z
                  </kbd>
                </div>
              </div>

              {/* Row 4: Toggle Theme */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground">
                    Cycle Theme Mode
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Instant toggle between light and dark display modes.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground shadow-2xs">
                    d
                  </kbd>
                </div>
              </div>

              {/* Row 5: Dismiss Dialog */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground">
                    Dismiss Modal or Dialog
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Close any open modal dialog, command palette, or slide-over drawer.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center justify-start sm:justify-end">
                  <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground shadow-2xs">
                    Esc
                  </kbd>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsSettingsPanel
