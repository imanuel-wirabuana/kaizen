import { useState, useEffect } from "react"
import { Building2, Save, Lock, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { toast } from "@/components/ui/toast"
import type { Workspace, WorkspaceSettings } from "@/types/workspace"

export interface GeneralSettingsPanelProps {
  workspace: Workspace | null
  canUpdate: boolean
  onUpdateWorkspace: (
    id: number,
    updates: Partial<Workspace>
  ) => Promise<Workspace | void>
}

const COMMON_TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
]

const DEFAULT_VIEWS = [
  { value: "boards", label: "Kanban Boards" },
  { value: "calendars", label: "Calendars & Schedule" },
  { value: "zenbox", label: "Zenbox (Inbox)" },
  { value: "assistant", label: "AI Assistant" },
]

export function GeneralSettingsPanel({
  workspace,
  canUpdate,
  onUpdateWorkspace,
}: GeneralSettingsPanelProps) {
  const [name, setName] = useState(workspace?.name || "")
  const [description, setDescription] = useState(workspace?.description || "")
  const [defaultView, setDefaultView] = useState<string>(
    (workspace?.settings?.default_view as string) || "boards"
  )
  const [timezone, setTimezone] = useState<string>(
    (workspace?.settings?.timezone as string) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "Asia/Jakarta"
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setDescription(workspace.description || "")
      setDefaultView((workspace.settings?.default_view as string) || "boards")
      setTimezone(
        (workspace.settings?.timezone as string) ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "Asia/Jakarta"
      )
    }
  }, [workspace])

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-xs text-muted-foreground">
        No active workspace selected.
      </div>
    )
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim() || !canUpdate || isSaving) return

    try {
      setIsSaving(true)
      setIsSaved(false)

      const updatedSettings: WorkspaceSettings = {
        ...(workspace.settings || {}),
        default_view: defaultView,
        timezone,
      }

      await onUpdateWorkspace(workspace.id, {
        name: name.trim(),
        description: description.trim() || null,
        settings: updatedSettings,
      })

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      toast.error("Failed to save settings", {
        description: (err as Error).message || "Could not update workspace settings.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 flex min-h-12 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 px-4 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
          <h2 className="text-sm font-semibold text-foreground">General Settings</h2>
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
              onClick={() => handleSave()}
              disabled={isSaving || !name.trim()}
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

      {/* Main Form Body (Scrollable) */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {/* Card: Basic Identity */}
          <Card className="p-5 flex flex-col gap-4 shadow-2xs border-border/80">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Workspace Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure the public name and description for this workspace.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ws-name"
                  className="text-xs font-medium text-foreground"
                >
                  Workspace Name
                </label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Studio, Kaizen Core"
                  className="text-xs bg-background"
                  disabled={!canUpdate || isSaving}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="ws-desc"
                  className="text-xs font-medium text-foreground"
                >
                  Description
                </label>
                <Textarea
                  id="ws-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this workspace's purpose..."
                  className="text-xs min-h-[75px] bg-background resize-none"
                  disabled={!canUpdate || isSaving}
                />
              </div>
            </form>
          </Card>

          {/* Card: Workspace Properties (workspace.settings) */}
          <Card className="p-5 flex flex-col gap-4 shadow-2xs border-border/80">
            <div className="border-b border-border/50 pb-3">
              <h3 className="text-sm font-semibold">Default Configuration</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                These options populate and customize <code>workspace.settings</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Default View */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Default Landing View
                </label>
                <Select
                  value={defaultView}
                  onValueChange={(val) => {
                    if (val) setDefaultView(val)
                  }}
                  disabled={!canUpdate || isSaving}
                >
                  <SelectTrigger className="w-full text-xs bg-background">
                    <SelectValue placeholder="Select landing view" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_VIEWS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Default section opened when collaborators switch to this workspace.
                </p>
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Workspace Timezone
                </label>
                <Select
                  value={timezone}
                  onValueChange={(val) => {
                    if (val) setTimezone(val)
                  }}
                  disabled={!canUpdate || isSaving}
                >
                  <SelectTrigger className="w-full text-xs bg-background">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {!COMMON_TIMEZONES.includes(timezone) && (
                      <SelectItem value={timezone}>{timezone} (System)</SelectItem>
                    )}
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Used for calendar scheduling and date calculations.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
