import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  FileUp,
  FileDown,
  Sliders,
  Palette,
  AlertTriangle,
  Building2,
} from "lucide-react"

export type SettingsSection = "general" | "appearance" | "danger"

export interface SettingsSidebarProps {
  activeSection: SettingsSection
  onSelectSection: (section: SettingsSection) => void
  onImportClick: () => void
  onExportClick: () => void
  isExporting?: boolean
  workspaceName?: string
}

export function SettingsSidebar({
  activeSection,
  onSelectSection,
  onImportClick,
  onExportClick,
  isExporting = false,
  workspaceName = "Workspace",
}: SettingsSidebarProps) {
  const navItems = [
    {
      id: "general" as const,
      label: "General",
      description: "Name, description & preferences",
      icon: Sliders,
    },
    {
      id: "appearance" as const,
      label: "Appearance",
      description: "Theme & keyboard shortcuts",
      icon: Palette,
    },
    {
      id: "danger" as const,
      label: "Danger Zone",
      description: "Archive, transfer & delete",
      icon: AlertTriangle,
      isDanger: true,
    },
  ]

  return (
    <>
      {/* Sidebar Header: JSON Import & Export actions */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2.5 border-b border-border bg-sidebar/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {workspaceName}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                Settings
              </p>
            </div>
          </div>
        </div>

        {/* Buttons for Import & Export Settings (JSON) */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onImportClick}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-none border-border/80 bg-background/50 hover:bg-background"
            title="Import workspace configuration from a JSON file"
          >
            <FileUp className="size-3.5 text-muted-foreground" />
            <span>Import</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportClick}
            disabled={isExporting}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-none border-border/80 bg-background/50 hover:bg-background"
            title="Export workspace configuration as a JSON file"
          >
            <FileDown className="size-3.5 text-muted-foreground" />
            <span>Export</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Sidebar Body: Menu Items */}
      <SidebarContent className="min-h-0 flex-1 overflow-y-auto p-2">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => onSelectSection(item.id)}
                  className={`flex h-auto w-full items-start gap-3 rounded-md px-3 py-2 text-left cursor-pointer transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-2xs"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  } ${item.isDanger && !isActive ? "hover:text-destructive" : ""}`}
                >
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${
                      isActive
                        ? item.isDanger
                          ? "text-destructive"
                          : "text-primary"
                        : item.isDanger
                          ? "text-destructive/70"
                          : "text-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs ${
                        isActive
                          ? "font-semibold text-foreground"
                          : "font-medium"
                      } ${item.isDanger && isActive ? "text-destructive" : ""}`}
                    >
                      {item.label}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground/80 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  )
}
