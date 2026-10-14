import { useState, useEffect } from "react"
import {
  Building2,
  Save,
  Lock,
  Loader2,
  Check,
  Sliders,
  LayoutGrid,
  Calendar,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { toast } from "@/components/ui/toast"
import { formatDistanceToNow } from "date-fns"
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
    (workspace?.settings?.general?.default_view as string) ||
      (workspace?.settings?.default_view as string) ||
      "boards"
  )
  const [timezone, setTimezone] = useState<string>(
    (workspace?.settings?.general?.timezone as string) ||
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
      setDefaultView(
        (workspace.settings?.general?.default_view as string) ||
          (workspace.settings?.default_view as string) ||
          "boards"
      )
      setTimezone(
        (workspace.settings?.general?.timezone as string) ||
          (workspace.settings?.timezone as string) ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "Asia/Jakarta"
      )
    }
  }, [workspace])

  if (!workspace) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
        <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-xs text-muted-foreground">
          No active workspace selected.
        </div>
      </div>
    )
  }

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(workspace.created_at), {
        addSuffix: true,
      })
    } catch {
      return "recently"
    }
  })()

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
        general: {
          ...(workspace.settings?.general || {}),
          default_view: defaultView,
          timezone,
        },
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
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
          <Separator orientation="vertical" />
          <Sliders className="size-3.5 text-primary" />
          <span className="font-semibold text-xs text-foreground">General Settings</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Workspace Profile
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

      {/* Main Full-Width Body with Row-by-Row Layout */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full p-4 sm:p-6 pb-16">
          <div className="flex w-full flex-col gap-6">
            {/* Section 1: Workspace Profile Card */}
            <Card className="p-5 flex flex-col gap-0 shadow-2xs border-border/80">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Workspace Profile</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure the identity and public metadata for this workspace.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row: Workspace Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <label htmlFor="ws-name" className="text-xs font-semibold text-foreground">
                    Workspace Name
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    The public display name for your team or organization workspace.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
                  <Input
                    id="ws-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Studio, Kaizen Core"
                    className="text-xs bg-background w-full"
                    disabled={!canUpdate || isSaving}
                    required
                  />
                </div>
              </div>

              {/* Row: Workspace Description */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <label htmlFor="ws-desc" className="text-xs font-semibold text-foreground">
                    Description
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    A brief description of this workspace&apos;s scope, purpose, and objectives.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
                  <Textarea
                    id="ws-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this workspace..."
                    className="text-xs min-h-[85px] bg-background resize-none w-full"
                    disabled={!canUpdate || isSaving}
                  />
                </div>
              </div>

              {/* Row: Workspace Identifier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="size-3 text-muted-foreground" />
                    <span>Workspace Identifier</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Unique numerical identifier assigned to this workspace database record.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0 flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
                    #{workspace.id}
                  </Badge>
                </div>
              </div>

              {/* Row: Created Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>Created At</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Initial creation date of this workspace.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
                  <span className="text-xs text-foreground font-medium">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </Card>

            {/* Section 2: Default Configuration Card */}
            <Card className="p-5 flex flex-col gap-0 shadow-2xs border-border/80">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <LayoutGrid className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Default Configuration</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Preferences that govern navigation defaults and regional context.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row: Landing View */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <label className="text-xs font-semibold text-foreground">
                    Default Landing View
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    The initial section opened when collaborators switch to this workspace.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
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
                </div>
              </div>

              {/* Row: Timezone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <label className="text-xs font-semibold text-foreground">
                    Workspace Timezone
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Used for calendar events, automated scheduling, and date calculations.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
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
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneralSettingsPanel
