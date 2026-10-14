import { useState, useEffect } from "react"
import {
  Moon,
  Sun,
  Monitor,
  Check,
  Palette,
  Type,
  LayoutTemplate,
  Save,
  Loader2,
  Lock,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import type { Workspace, WorkspaceSettings } from "@/types/workspace"

export interface AppearanceSettingsPanelProps {
  workspace?: Workspace | null
  canUpdate?: boolean
  onUpdateWorkspace?: (
    id: number,
    updates: Partial<Workspace>
  ) => Promise<Workspace | void>
}

const FONT_SIZE_OPTIONS = [
  { value: "compact", label: "Compact (13px)" },
  { value: "normal", label: "Standard (14px)" },
  { value: "large", label: "Large (15px)" },
]

const DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comfortable (Default)" },
  { value: "compact", label: "Compact" },
]

export function AppearanceSettingsPanel({
  workspace,
  canUpdate = true,
  onUpdateWorkspace,
}: AppearanceSettingsPanelProps) {
  const { theme, setTheme } = useTheme()

  const [fontSize, setFontSize] = useState<string>(
    (workspace?.settings?.appearance?.font_size as string) || "normal"
  )
  const [density, setDensity] = useState<string>(
    (workspace?.settings?.appearance?.density as string) || "comfortable"
  )

  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (workspace?.settings?.appearance) {
      setFontSize(
        (workspace.settings.appearance.font_size as string) || "normal"
      )
      setDensity(
        (workspace.settings.appearance.density as string) || "comfortable"
      )
    }
  }, [workspace])

  const themeOptions = [
    {
      id: "light" as const,
      label: "Light",
      icon: Sun,
    },
    {
      id: "dark" as const,
      label: "Dark",
      icon: Moon,
    },
    {
      id: "system" as const,
      label: "System",
      icon: Monitor,
    },
  ]

  const handleSave = async () => {
    if (!workspace || !onUpdateWorkspace || !canUpdate || isSaving) return

    try {
      setIsSaving(true)
      setIsSaved(false)

      const updatedSettings: WorkspaceSettings = {
        ...(workspace.settings || {}),
        appearance: {
          ...(workspace.settings?.appearance || {}),
          theme,
          font_size: fontSize as "compact" | "normal" | "large",
          density: density as "comfortable" | "compact",
        },
      }

      await onUpdateWorkspace(workspace.id, {
        settings: updatedSettings,
      })

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      toast.error("Failed to save appearance settings", {
        description: (err as Error).message || "Could not update appearance preferences.",
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
          <Palette className="size-3.5 text-primary" />
          <span className="font-semibold text-xs text-foreground">Appearance</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Theme & Display
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!canUpdate ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Lock className="size-3" />
              <span>Read-only</span>
            </Badge>
          ) : onUpdateWorkspace ? (
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
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
          ) : (
            <span className="capitalize rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {theme} mode
            </span>
          )}
        </div>
      </div>

      {/* Main Full-Width Body with Row-by-Row Layout */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full p-4 sm:p-6 pb-16">
          <div className="flex w-full flex-col gap-6">
            {/* Appearance Preferences Card */}
            <Card className="p-5 flex flex-col gap-0 shadow-2xs border-border/80">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Palette className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Interface Appearance</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tailor color modes, typography scale, and layout density.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 1: Theme Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <span className="text-xs font-semibold text-foreground">
                    Theme Mode
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Select between light and dark aesthetics or sync with your system OS.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
                  <div className="grid grid-cols-3 gap-2">
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon
                      const isSelected = theme === opt.id

                      return (
                        <Button
                          key={opt.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setTheme(opt.id)
                          }}
                          className={cn(
                            "h-9 gap-2 text-xs font-medium cursor-pointer shadow-none justify-center",
                            !isSelected && "bg-background hover:bg-muted/50"
                          )}
                        >
                          <Icon className="size-3.5" />
                          <span>{opt.label}</span>
                          {isSelected && <Check className="size-3 ml-0.5" />}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Font Size Scale */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 border-b border-border/40">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <div className="flex items-center gap-1.5">
                    <Type className="size-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Font Size Scale
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Scale interface typography for enhanced readability.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
                  <Select
                    value={fontSize}
                    onValueChange={(val) => {
                      if (val) setFontSize(val)
                    }}
                    disabled={!canUpdate || isSaving}
                  >
                    <SelectTrigger className="w-full text-xs bg-background">
                      <SelectValue placeholder="Select font scale" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Interface Density */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5">
                <div className="flex flex-col gap-0.5 sm:max-w-md">
                  <div className="flex items-center gap-1.5">
                    <LayoutTemplate className="size-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Layout Density
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Adjust compact spacing across tables, lists, and task columns.
                  </p>
                </div>
                <div className="w-full sm:max-w-md shrink-0">
                  <Select
                    value={density}
                    onValueChange={(val) => {
                      if (val) setDensity(val)
                    }}
                    disabled={!canUpdate || isSaving}
                  >
                    <SelectTrigger className="w-full text-xs bg-background">
                      <SelectValue placeholder="Select layout density" />
                    </SelectTrigger>
                    <SelectContent>
                      {DENSITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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

export default AppearanceSettingsPanel
