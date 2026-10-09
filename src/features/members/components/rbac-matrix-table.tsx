import React from "react"
import {
  Kanban,
  Inbox,
  Calendar,
  Bot,
  Users,
  Settings,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DEFAULT_MEMBER_PERMISSIONS,
  OWNER_PERMISSIONS,
  type WorkspacePermissions,
} from "@/types/member"

export interface RbacMatrixModuleDef {
  id: keyof WorkspacePermissions
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  supportsCreate: boolean
  supportsRead: boolean
  supportsUpdate: boolean
  supportsDelete: boolean
  tooltips: {
    create?: string
    read?: string
    update?: string
    delete?: string
  }
}

export const RBAC_MODULES: RbacMatrixModuleDef[] = [
  {
    id: "boards",
    name: "Boards (Kanban)",
    description: "Manage agile task boards, cards, and stages",
    icon: Kanban,
    supportsCreate: true,
    supportsRead: true,
    supportsUpdate: true,
    supportsDelete: true,
    tooltips: {
      create: "Create new boards, columns, and cards",
      read: "View task boards, column lists, and details",
      update: "Edit card content, due dates, and move stages",
      delete: "Archive or delete cards and boards",
    },
  },
  {
    id: "zenbox",
    name: "Zenbox (Notes & Tasks)",
    description: "Quick-capture notes, thoughts, and inbox tasks",
    icon: Inbox,
    supportsCreate: true,
    supportsRead: true,
    supportsUpdate: true,
    supportsDelete: true,
    tooltips: {
      create: "Create new thoughts and inbox notes",
      read: "Access and view notes and captured items",
      update: "Edit note content, folders, and completion",
      delete: "Delete or archive thoughts and notes",
    },
  },
  {
    id: "calendars",
    name: "Calendars & Scheduling",
    description: "Schedule events, deadlines, and timeline views",
    icon: Calendar,
    supportsCreate: true,
    supportsRead: true,
    supportsUpdate: true,
    supportsDelete: true,
    tooltips: {
      create: "Create new calendar events and meetings",
      read: "View calendar events and schedules",
      update: "Edit event timings, details, and attendees",
      delete: "Cancel and delete scheduled events",
    },
  },
  {
    id: "assistant",
    name: "AI Assistant",
    description: "Workspace intelligence and AI chat threads",
    icon: Bot,
    supportsCreate: true,
    supportsRead: true,
    supportsUpdate: true,
    supportsDelete: true,
    tooltips: {
      create: "Send AI prompts and start new threads",
      read: "Access AI assistant and view chat history",
      update: "Configure AI models and regenerate responses",
      delete: "Delete AI conversation threads",
    },
  },
  {
    id: "members",
    name: "Team & Invites",
    description: "Collaborators directory, invite codes, and permissions",
    icon: Users,
    supportsCreate: true,
    supportsRead: true,
    supportsUpdate: true,
    supportsDelete: true,
    tooltips: {
      create: "Generate and share new workspace invite codes",
      read: "View workspace members and invitation codes",
      update: "Configure permissions for other collaborators",
      delete: "Revoke invite codes and remove collaborators",
    },
  },
  {
    id: "workspace",
    name: "Workspace Settings",
    description: "General configuration, branding, and metadata",
    icon: Settings,
    supportsCreate: false,
    supportsRead: true,
    supportsUpdate: true,
    supportsDelete: false,
    tooltips: {
      read: "View workspace details and preferences",
      update: "Edit workspace name, branding, and configuration",
    },
  },
]

export interface RbacMatrixTableProps {
  permissions: WorkspacePermissions
  onChange: (nextPermissions: WorkspacePermissions) => void
  disabled?: boolean
  readOnlyReason?: string
  className?: string
}

export function RbacMatrixTable({
  permissions,
  onChange,
  disabled = false,
  readOnlyReason,
  className,
}: RbacMatrixTableProps) {
  // Toggle single cell
  const handleToggle = (
    moduleId: keyof WorkspacePermissions,
    action: "create" | "read" | "update" | "delete"
  ) => {
    if (disabled) return

    const currentMod = (permissions[moduleId] || {}) as Record<string, boolean>
    const nextValue = !currentMod[action]

    onChange({
      ...permissions,
      [moduleId]: {
        ...currentMod,
        [action]: nextValue,
      },
    })
  }

  // Toggle all actions in a single row/module
  const handleToggleRow = (moduleDef: RbacMatrixModuleDef) => {
    if (disabled) return

    const currentMod = (permissions[moduleDef.id] || {}) as Record<string, boolean>
    const applicableActions: ("create" | "read" | "update" | "delete")[] = []
    if (moduleDef.supportsCreate) applicableActions.push("create")
    if (moduleDef.supportsRead) applicableActions.push("read")
    if (moduleDef.supportsUpdate) applicableActions.push("update")
    if (moduleDef.supportsDelete) applicableActions.push("delete")

    const allActive = applicableActions.every((act) => Boolean(currentMod[act]))
    const targetState = !allActive

    const updated = { ...currentMod }
    for (const act of applicableActions) {
      updated[act] = targetState
    }

    onChange({
      ...permissions,
      [moduleDef.id]: updated,
    })
  }

  // Preset Handlers
  const handleApplyPreset = (preset: "full" | "readOnly" | "default" | "none") => {
    if (disabled) return

    if (preset === "full") {
      onChange(OWNER_PERMISSIONS)
    } else if (preset === "readOnly") {
      onChange({
        boards: { create: false, read: true, update: false, delete: false },
        zenbox: { create: false, read: true, update: false, delete: false },
        calendars: { create: false, read: true, update: false, delete: false },
        assistant: { create: false, read: true, update: false, delete: false },
        members: { create: false, read: true, update: false, delete: false },
        workspace: { read: true, update: false },
      })
    } else if (preset === "default") {
      onChange(DEFAULT_MEMBER_PERMISSIONS)
    } else if (preset === "none") {
      onChange({
        boards: { create: false, read: false, update: false, delete: false },
        zenbox: { create: false, read: false, update: false, delete: false },
        calendars: { create: false, read: false, update: false, delete: false },
        assistant: { create: false, read: false, update: false, delete: false },
        members: { create: false, read: false, update: false, delete: false },
        workspace: { read: false, update: false },
      })
    }
  }

  // Calculate active permission count
  const activeCount = React.useMemo(() => {
    let count = 0
    for (const mod of RBAC_MODULES) {
      const res = (permissions[mod.id] || {}) as Record<string, boolean>
      if (mod.supportsCreate && res.create) count++
      if (mod.supportsRead && res.read) count++
      if (mod.supportsUpdate && res.update) count++
      if (mod.supportsDelete && res.delete) count++
    }
    return count
  }, [permissions])

  const totalPossible = 22 // 5 modules * 4 actions + workspace * 2 actions

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Top Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">Permission Presets:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => handleApplyPreset("full")}
              disabled={disabled}
              className="h-6 cursor-pointer text-[11px] font-normal hover:bg-background"
            >
              Full Access
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => handleApplyPreset("default")}
              disabled={disabled}
              className="h-6 cursor-pointer text-[11px] font-normal hover:bg-background"
            >
              Standard
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => handleApplyPreset("readOnly")}
              disabled={disabled}
              className="h-6 cursor-pointer text-[11px] font-normal hover:bg-background"
            >
              View Only
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => handleApplyPreset("none")}
              disabled={disabled}
              className="h-6 cursor-pointer text-[11px] text-muted-foreground hover:bg-background hover:text-destructive"
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Active permissions:</span>
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-medium bg-background border-border/80 text-foreground"
          >
            {activeCount} / {totalPossible}
          </Badge>
        </div>
      </div>

      {readOnlyReason && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{readOnlyReason}</span>
        </div>
      )}

      {/* RBAC Matrix Table */}
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 font-medium text-muted-foreground">
                <th className="py-2.5 px-3.5 sm:px-4 font-semibold text-foreground">
                  Module / Feature
                </th>
                <th className="w-20 sm:w-24 py-2.5 px-2 text-center font-medium">
                  <div className="flex flex-col items-center">
                    <span>Create</span>
                    <span className="text-[10px] text-muted-foreground/70 font-normal">
                      (C)
                    </span>
                  </div>
                </th>
                <th className="w-20 sm:w-24 py-2.5 px-2 text-center font-medium">
                  <div className="flex flex-col items-center">
                    <span>Read</span>
                    <span className="text-[10px] text-muted-foreground/70 font-normal">
                      (R)
                    </span>
                  </div>
                </th>
                <th className="w-20 sm:w-24 py-2.5 px-2 text-center font-medium">
                  <div className="flex flex-col items-center">
                    <span>Update</span>
                    <span className="text-[10px] text-muted-foreground/70 font-normal">
                      (U)
                    </span>
                  </div>
                </th>
                <th className="w-20 sm:w-24 py-2.5 px-2 text-center font-medium">
                  <div className="flex flex-col items-center">
                    <span>Delete</span>
                    <span className="text-[10px] text-muted-foreground/70 font-normal">
                      (D)
                    </span>
                  </div>
                </th>
                <th className="w-16 py-2.5 px-3 text-center font-medium">
                  <span className="text-[10px] text-muted-foreground/70">Row</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {RBAC_MODULES.map((mod) => {
                const Icon = mod.icon
                const currentMod = (permissions[mod.id] || {}) as Record<string, boolean>

                // Row active state check
                const applicable = [
                  mod.supportsCreate && "create",
                  mod.supportsRead && "read",
                  mod.supportsUpdate && "update",
                  mod.supportsDelete && "delete",
                ].filter(Boolean) as ("create" | "read" | "update" | "delete")[]

                const allRowActive =
                  applicable.length > 0 && applicable.every((a) => currentMod[a])
                const anyRowActive = applicable.some((a) => currentMod[a])

                return (
                  <tr
                    key={mod.id}
                    className="transition-colors hover:bg-muted/15 group"
                  >
                    {/* Left Column: Feature */}
                    <td className="py-2.5 px-3.5 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-md bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground text-xs leading-tight truncate">
                            {mod.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground leading-tight truncate hidden sm:inline">
                            {mod.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Create Cell */}
                    <td className="py-2.5 px-2 text-center align-middle">
                      {mod.supportsCreate ? (
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={Boolean(currentMod.create)}
                            onCheckedChange={() => handleToggle(mod.id, "create")}
                            disabled={disabled}
                            title={mod.tooltips.create}
                            aria-label={`${mod.name} Create permission`}
                            className="scale-90"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Read Cell */}
                    <td className="py-2.5 px-2 text-center align-middle">
                      {mod.supportsRead ? (
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={Boolean(currentMod.read)}
                            onCheckedChange={() => handleToggle(mod.id, "read")}
                            disabled={disabled}
                            title={mod.tooltips.read}
                            aria-label={`${mod.name} Read permission`}
                            className="scale-90"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Update Cell */}
                    <td className="py-2.5 px-2 text-center align-middle">
                      {mod.supportsUpdate ? (
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={Boolean(currentMod.update)}
                            onCheckedChange={() => handleToggle(mod.id, "update")}
                            disabled={disabled}
                            title={mod.tooltips.update}
                            aria-label={`${mod.name} Update permission`}
                            className="scale-90"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Delete Cell */}
                    <td className="py-2.5 px-2 text-center align-middle">
                      {mod.supportsDelete ? (
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={Boolean(currentMod.delete)}
                            onCheckedChange={() => handleToggle(mod.id, "delete")}
                            disabled={disabled}
                            title={mod.tooltips.delete}
                            aria-label={`${mod.name} Delete permission`}
                            className="scale-90"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Row Master Action */}
                    <td className="py-2.5 px-3 text-center align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleToggleRow(mod)}
                        disabled={disabled}
                        title={
                          allRowActive
                            ? `Disable all ${mod.name} permissions`
                            : `Enable all ${mod.name} permissions`
                        }
                        className={cn(
                          "cursor-pointer text-muted-foreground hover:text-foreground",
                          allRowActive && "text-primary"
                        )}
                      >
                        {allRowActive ? (
                          <CheckCircle2 className="size-3.5 text-primary" />
                        ) : anyRowActive ? (
                          <div className="size-2 rounded-full bg-primary/70" />
                        ) : (
                          <XCircle className="size-3.5 text-muted-foreground/50" />
                        )}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
