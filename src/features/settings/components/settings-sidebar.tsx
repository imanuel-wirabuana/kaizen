import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  FileUp,
  FileDown,
  Sliders,
  Palette,
  Keyboard,
  Inbox,
  Kanban,
  Calendar,
  Sparkles,
  Users,
  AlertTriangle,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type SettingsSection =
  | "general"
  | "appearance"
  | "shortcuts"
  | "zenbox"
  | "boards"
  | "calendars"
  | "assistant"
  | "members"
  | "danger"

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
      description: "Profile, default view & timezone",
      tag: "Config",
      badge: "Workspace",
      icon: Sliders,
    },
    {
      id: "appearance" as const,
      label: "Appearance",
      description: "Theme, font scale & density",
      tag: "Theme",
      badge: "Display",
      icon: Palette,
    },
    {
      id: "shortcuts" as const,
      label: "Shortcuts",
      description: "Global hotkeys & navigation",
      tag: "Hotkeys",
      badge: "Navigation",
      icon: Keyboard,
    },
    {
      id: "zenbox" as const,
      label: "Zenbox",
      description: "Tasks & capture preferences",
      tag: "Tasks",
      badge: "Feature",
      icon: Inbox,
    },
    {
      id: "boards" as const,
      label: "Boards",
      description: "Task boards & workflow",
      tag: "Workflow",
      badge: "Feature",
      icon: Kanban,
    },
    {
      id: "calendars" as const,
      label: "Calendars",
      description: "Schedule & calendar preferences",
      tag: "Schedule",
      badge: "Feature",
      icon: Calendar,
    },
    {
      id: "assistant" as const,
      label: "Assistant",
      description: "AI model & interaction",
      tag: "AI",
      badge: "Feature",
      icon: Sparkles,
    },
    {
      id: "members" as const,
      label: "Members",
      description: "Member permissions & invites",
      tag: "Access",
      badge: "Feature",
      icon: Users,
    },
    {
      id: "danger" as const,
      label: "Danger Zone",
      description: "Archive, transfer or erase data",
      tag: "Destructive",
      badge: "Admin",
      icon: AlertTriangle,
      isDanger: true,
    },
  ]

  return (
    <>
      {/* Sidebar Header: Workspace identity and JSON Import/Export */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar/30 p-2">
        <div className="flex items-center gap-2 px-1 py-0.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
            <Building2 className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {workspaceName}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              Workspace Settings
            </p>
          </div>
        </div>

        {/* Buttons for Import & Export Settings (JSON) */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onImportClick}
            className="h-8 w-full cursor-pointer justify-center gap-1.5 text-xs font-medium border-border/80 bg-background/50 hover:bg-background shadow-none"
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
            className="h-8 w-full cursor-pointer justify-center gap-1.5 text-xs font-medium border-border/80 bg-background/50 hover:bg-background shadow-none"
            title="Export workspace configuration as a JSON file"
          >
            <FileDown className="size-3.5 text-muted-foreground" />
            <span>Export</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Sidebar Content: Navigation Menu matching Kaizen item row pattern */}
      <SidebarContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <SidebarMenu className="gap-0 p-0">
            {navItems.map((item) => {
              const Icon = item.icon
              const isSelected = activeSection === item.id

              return (
                <SidebarMenuItem
                  key={item.id}
                  className="group/item border-b border-border/50 p-0 last:border-b-0"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectSection(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelectSection(item.id)
                      }
                    }}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-start gap-2.5 p-2.5 text-left text-sm leading-tight transition-colors select-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none",
                      isSelected &&
                        "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    )}
                  >
                    {/* Leading Icon Box matching Members/Boards/Calendar avatar box */}
                    <div
                      className={cn(
                        "relative flex size-7 shrink-0 items-center justify-center rounded-lg font-semibold text-xs border transition-colors",
                        item.isDanger
                          ? isSelected
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : "bg-destructive/10 text-destructive/80 border-destructive/20"
                          : isSelected
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-primary/10 text-primary border-primary/20"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>

                    {/* Content: 2-line structure identical to other features */}
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <div className="flex w-full items-center gap-2">
                        <span
                          className={cn(
                            "flex-1 truncate text-xs font-semibold text-foreground",
                            item.isDanger && isSelected && "text-destructive"
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                          {item.tag}
                        </span>
                      </div>

                      <div className="flex w-full items-center justify-between gap-1 text-[11px] text-muted-foreground">
                        <span className="truncate">{item.description}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0 rounded font-normal shrink-0",
                            item.isDanger
                              ? "bg-destructive/10 text-destructive font-medium"
                              : isSelected
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground bg-muted"
                          )}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

export default SettingsSidebar
