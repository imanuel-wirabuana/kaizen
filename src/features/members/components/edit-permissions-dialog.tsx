import { useState, useEffect, useMemo } from "react"
import { Loader2, Sparkles, Eye, RotateCcw, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { cn } from "cn"
import {
  DEFAULT_MEMBER_PERMISSIONS,
  type WorkspaceMemberProfile,
  type WorkspacePermissions,
} from "@/types/member"

export interface EditPermissionsDialogProps {
  member: WorkspaceMemberProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (memberId: number, permissions: WorkspacePermissions) => Promise<void>
  isSaving?: boolean
}

/**
 * Safely parse permissions from object, stringified JSON, or fallback to defaults.
 */
function parsePermissions(raw: unknown): WorkspacePermissions {
  if (!raw) return DEFAULT_MEMBER_PERMISSIONS

  let parsed = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return DEFAULT_MEMBER_PERMISSIONS
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    return DEFAULT_MEMBER_PERMISSIONS
  }

  const obj = parsed as Record<string, unknown>

  const safeMerge = (
    key: string,
    defaults: Record<string, boolean>
  ): Record<string, boolean> => {
    const val = obj[key]
    if (typeof val === "object" && val !== null) {
      return { ...defaults, ...(val as Record<string, boolean>) }
    }
    return { ...defaults }
  }

  return {
    boards: safeMerge("boards", DEFAULT_MEMBER_PERMISSIONS.boards) as WorkspacePermissions["boards"],
    zenbox: safeMerge("zenbox", DEFAULT_MEMBER_PERMISSIONS.zenbox) as WorkspacePermissions["zenbox"],
    calendars: safeMerge("calendars", DEFAULT_MEMBER_PERMISSIONS.calendars) as WorkspacePermissions["calendars"],
    assistant: safeMerge("assistant", DEFAULT_MEMBER_PERMISSIONS.assistant) as WorkspacePermissions["assistant"],
    members: safeMerge("members", DEFAULT_MEMBER_PERMISSIONS.members) as WorkspacePermissions["members"],
    workspace: safeMerge("workspace", DEFAULT_MEMBER_PERMISSIONS.workspace) as WorkspacePermissions["workspace"],
  }
}

interface SectionConfig {
  id: keyof WorkspacePermissions
  label: string
  description: string
  actions: Array<"read" | "create" | "update" | "delete">
}

const SECTIONS: SectionConfig[] = [
  {
    id: "boards",
    label: "Boards (Kanban)",
    description: "Manage task boards, columns, and cards",
    actions: ["read", "create", "update", "delete"],
  },
  {
    id: "zenbox",
    label: "Zenbox (Notes & Tasks)",
    description: "Manage quick notes, inbox items, and capture",
    actions: ["read", "create", "update", "delete"],
  },
  {
    id: "calendars",
    label: "Calendars",
    description: "Schedule events and manage calendars",
    actions: ["read", "create", "update", "delete"],
  },
  {
    id: "assistant",
    label: "AI Assistant",
    description: "Access AI chat threads and assistant prompts",
    actions: ["read", "create", "update", "delete"],
  },
  {
    id: "members",
    label: "Members & Invites",
    description: "View team members and generate invite codes",
    actions: ["read", "create", "update", "delete"],
  },
  {
    id: "workspace",
    label: "Workspace Settings",
    description: "View and edit workspace name and general configuration",
    actions: ["read", "update"],
  },
]

export function EditPermissionsDialog({
  member,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: EditPermissionsDialogProps) {
  // Preserve last valid member during closing animation
  const [cachedMember, setCachedMember] = useState<WorkspaceMemberProfile | null>(member)

  useEffect(() => {
    if (member) {
      setCachedMember(member)
    }
  }, [member])

  const activeMember = member || cachedMember

  const [permissions, setPermissions] = useState<WorkspacePermissions>(() =>
    parsePermissions(activeMember?.permissions)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Re-sync permissions when dialog opens or active member changes
  useEffect(() => {
    if (open && activeMember) {
      setPermissions(parsePermissions(activeMember.permissions))
    }
  }, [open, activeMember])

  const isBusy = isSaving || isSubmitting

  const handleToggle = (
    resource: keyof WorkspacePermissions,
    action: string,
    forcedValue?: boolean
  ) => {
    setPermissions((prev) => {
      const currentResource = (prev[resource] || {}) as Record<string, boolean>
      const nextValue =
        forcedValue !== undefined ? forcedValue : !currentResource[action]

      return {
        ...prev,
        [resource]: {
          ...currentResource,
          [action]: nextValue,
        },
      }
    })
  }

  // Quick preset actions
  const applyPreset = (preset: "full" | "readOnly" | "default") => {
    if (preset === "full") {
      setPermissions({
        boards: { read: true, create: true, update: true, delete: true },
        zenbox: { read: true, create: true, update: true, delete: true },
        calendars: { read: true, create: true, update: true, delete: true },
        assistant: { read: true, create: true, update: true, delete: true },
        members: { read: true, create: true, update: true, delete: true },
        workspace: { read: true, update: true },
      })
    } else if (preset === "readOnly") {
      setPermissions({
        boards: { read: true, create: false, update: false, delete: false },
        zenbox: { read: true, create: false, update: false, delete: false },
        calendars: { read: true, create: false, update: false, delete: false },
        assistant: { read: true, create: false, update: false, delete: false },
        members: { read: true, create: false, update: false, delete: false },
        workspace: { read: true, update: false },
      })
    } else if (preset === "default") {
      setPermissions(DEFAULT_MEMBER_PERMISSIONS)
    }
  }

  // Section toggle all
  const toggleSectionAll = (section: SectionConfig) => {
    const currentResPerms = (permissions[section.id] || {}) as Record<string, boolean>
    const allChecked = section.actions.every((act) => Boolean(currentResPerms[act]))
    const targetState = !allChecked

    setPermissions((prev) => {
      const updatedSection = { ...(prev[section.id] as Record<string, boolean>) }
      for (const act of section.actions) {
        updatedSection[act] = targetState
      }
      return {
        ...prev,
        [section.id]: updatedSection,
      }
    })
  }

  const handleSave = async () => {
    if (!activeMember || isBusy) return
    try {
      setIsSubmitting(true)
      const existingRawPerms =
        (activeMember.permissions as unknown as Record<string, unknown>) || {}

      // Preserve member profile data if stored in permissions
      const payload: WorkspacePermissions = {
        ...permissions,
        ...(existingRawPerms._profile
          ? { _profile: existingRawPerms._profile }
          : {}),
      }

      await onSave(activeMember.id, payload)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate enabled count for display
  const totalEnabled = useMemo(() => {
    let count = 0
    for (const section of SECTIONS) {
      const res = (permissions[section.id] || {}) as Record<string, boolean>
      for (const act of section.actions) {
        if (res[act]) count++
      }
    }
    return count
  }, [permissions])

  if (!activeMember && !open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col p-5">
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold">
              Edit Member Permissions
            </DialogTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {totalEnabled} active permissions
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Configure resource access for{" "}
            <span className="font-semibold text-foreground">
              {activeMember?.displayName}
            </span>{" "}
            ({activeMember?.email}).
          </DialogDescription>

          {/* Quick Presets Bar */}
          <div className="flex items-center gap-1.5 pt-2.5 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">
              Presets:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset("full")}
              disabled={isBusy}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Full Access</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset("readOnly")}
              disabled={isBusy}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer hover:bg-muted"
            >
              <Eye className="size-3 text-muted-foreground" />
              <span>Read Only</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset("default")}
              disabled={isBusy}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer hover:bg-muted"
            >
              <RotateCcw className="size-3 text-muted-foreground" />
              <span>Default</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Permissions Form Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 flex flex-col gap-3">
          {SECTIONS.map((section) => {
            const currentResPerms = (permissions[section.id] || {}) as Record<
              string,
              boolean
            >
            const allChecked = section.actions.every((act) =>
              Boolean(currentResPerms[act])
            )

            return (
              <Card
                key={section.id}
                className="p-3.5 border-border/70 shadow-2xs flex flex-col gap-2.5 bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {section.label}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {section.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSectionAll(section)}
                    disabled={isBusy}
                    className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {allChecked ? "Disable all" : "Enable all"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40">
                  {section.actions.map((action) => {
                    const isChecked = Boolean(currentResPerms?.[action])

                    return (
                      <div
                        key={action}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggle(section.id, action, !isChecked)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleToggle(section.id, action, !isChecked)
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all",
                          isChecked
                            ? "bg-primary/10 border-primary/40 text-foreground shadow-2xs hover:bg-primary/15"
                            : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60 hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isChecked && (
                            <Check className="size-3 text-primary shrink-0" />
                          )}
                          <span
                            className={cn(
                              "capitalize text-[11px] truncate",
                              isChecked
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground font-medium"
                            )}
                          >
                            {action}
                          </span>
                        </div>

                        <Switch
                          checked={isChecked}
                          onCheckedChange={(val) =>
                            handleToggle(section.id, action, val)
                          }
                          size="sm"
                          disabled={isBusy}
                        />
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>

        <DialogFooter className="pt-3 border-t border-border/50 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isBusy}
            className="cursor-pointer gap-2"
          >
            {isBusy && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isBusy ? "Saving..." : "Save Permissions"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditPermissionsDialog
