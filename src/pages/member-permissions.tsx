import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useLocation } from "wouter"
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Eye,
  RotateCcw,
  Save,
  Check,
  Kanban,
  Inbox,
  Calendar,
  Bot,
  Users,
  Settings,
  Mail,
  Clock,
  AlertTriangle,
  Loader2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"
import { cn } from "cn"
import { useWorkspaceMembers } from "@/features/members/hooks/use-workspace-members"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import {
  DEFAULT_MEMBER_PERMISSIONS,
  type WorkspacePermissions,
} from "@/types/member"

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

interface PermissionActionDef {
  key: string
  code: string // e.g. "board.read"
  title: string
  description: string
}

interface ModuleDef {
  id: keyof WorkspacePermissions
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  actions: PermissionActionDef[]
}

const MODULES: ModuleDef[] = [
  {
    id: "boards",
    name: "Boards (Kanban)",
    description: "Manage agile task boards, column lists, and kanban cards",
    icon: Kanban,
    actions: [
      {
        key: "read",
        code: "board.read",
        title: "View Boards",
        description: "Access the boards sidebar menu and view cards, columns, and details",
      },
      {
        key: "create",
        code: "board.create",
        title: "Create Boards & Cards",
        description: "Create new kanban boards, columns, and add tasks",
      },
      {
        key: "update",
        code: "board.update",
        title: "Edit & Move Cards",
        description: "Edit card content, assignees, due dates, and drag across stages",
      },
      {
        key: "delete",
        code: "board.delete",
        title: "Delete Boards & Cards",
        description: "Archive or permanently delete task cards, lists, and boards",
      },
    ],
  },
  {
    id: "zenbox",
    name: "Zenbox (Notes & Tasks)",
    description: "Manage quick notes, inbox items, and personal thought capture",
    icon: Inbox,
    actions: [
      {
        key: "read",
        code: "zenbox.read",
        title: "View Zenbox",
        description: "Access zenbox items, notes, and view shared thoughts",
      },
      {
        key: "create",
        code: "zenbox.create",
        title: "Create Notes & Items",
        description: "Quick-capture thoughts and create new zenbox entries",
      },
      {
        key: "update",
        code: "zenbox.update",
        title: "Edit Notes & Status",
        description: "Modify note content, organize into folders, and toggle completion",
      },
      {
        key: "delete",
        code: "zenbox.delete",
        title: "Delete Notes & Items",
        description: "Delete or archive zenbox notes and captured thoughts",
      },
    ],
  },
  {
    id: "calendars",
    name: "Calendars & Scheduling",
    description: "Schedule events, deadlines, and manage workspace calendar views",
    icon: Calendar,
    actions: [
      {
        key: "read",
        code: "calendars.read",
        title: "View Calendars",
        description: "Access calendar views and see scheduled workspace events",
      },
      {
        key: "create",
        code: "calendars.create",
        title: "Create Events",
        description: "Schedule new calendar events, meetings, and deadlines",
      },
      {
        key: "update",
        code: "calendars.update",
        title: "Edit Events",
        description: "Modify event titles, dates, attendees, and scheduling details",
      },
      {
        key: "delete",
        code: "calendars.delete",
        title: "Delete Events",
        description: "Cancel or delete scheduled calendar events",
      },
    ],
  },
  {
    id: "assistant",
    name: "AI Assistant",
    description: "Access conversational AI, prompts, and workspace intelligence",
    icon: Bot,
    actions: [
      {
        key: "read",
        code: "assistant.read",
        title: "View AI Chats",
        description: "Access AI assistant interface and view chat conversations",
      },
      {
        key: "create",
        code: "assistant.create",
        title: "Start New Chats",
        description: "Send AI prompts, query workspace data, and generate responses",
      },
      {
        key: "update",
        code: "assistant.update",
        title: "Edit Chats & Prompts",
        description: "Rename chat threads, configure prompt settings, and regenerate",
      },
      {
        key: "delete",
        code: "assistant.delete",
        title: "Delete Chats",
        description: "Delete AI conversation threads and clear chat history",
      },
    ],
  },
  {
    id: "members",
    name: "Team & Invites",
    description: "View collaborators, generate invitation codes, and manage permissions",
    icon: Users,
    actions: [
      {
        key: "read",
        code: "members.read",
        title: "View Members",
        description: "Access team directory and view list of collaborators and invites",
      },
      {
        key: "create",
        code: "members.create",
        title: "Generate Invites",
        description: "Create and share new workspace invitation codes and links",
      },
      {
        key: "update",
        code: "members.update",
        title: "Manage Permissions",
        description: "Edit granular permission rules for other team collaborators",
      },
      {
        key: "delete",
        code: "members.delete",
        title: "Revoke Access",
        description: "Revoke active invitation links and remove collaborators",
      },
    ],
  },
  {
    id: "workspace",
    name: "Workspace Settings",
    description: "Manage workspace branding, general configuration, and metadata",
    icon: Settings,
    actions: [
      {
        key: "read",
        code: "workspace.read",
        title: "View Settings",
        description: "View workspace details, general preferences, and metadata",
      },
      {
        key: "update",
        code: "workspace.update",
        title: "Edit Workspace",
        description: "Modify workspace name, branding logo, and global configuration",
      },
    ],
  },
]

export function MemberPermissionsPage() {
  const { id } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()

  const {
    members,
    isLoading: isMembersLoading,
    updatePermissions,
    isUpdating,
  } = useWorkspaceMembers()

  const { canUpdate, isLoading: isPermsLoading } = useWorkspacePermissions()

  // Match member by numeric ID or by Clerk user ID
  const member = useMemo(() => {
    if (!id || !members.length) return null
    return (
      members.find((m) => String(m.id) === id || m.userId === id) || null
    )
  }, [id, members])

  const [permissions, setPermissions] = useState<WorkspacePermissions>(() =>
    parsePermissions(member?.permissions)
  )

  const initializedMemberIdRef = useRef<string | null>(null)

  // Sync permissions ONLY when navigating to a new member or first loaded
  useEffect(() => {
    if (member && initializedMemberIdRef.current !== String(member.id)) {
      initializedMemberIdRef.current = String(member.id)
      setPermissions(parsePermissions(member.permissions))
    }
  }, [member])

  // Unsaved changes check
  const isDirty = useMemo(() => {
    if (!member) return false
    const original = parsePermissions(member.permissions)
    return JSON.stringify(permissions) !== JSON.stringify(original)
  }, [member, permissions])

  // Count active permissions
  const activeCount = useMemo(() => {
    let count = 0
    for (const mod of MODULES) {
      const res = (permissions[mod.id] || {}) as Record<string, boolean>
      for (const act of mod.actions) {
        if (res[act.key]) count++
      }
    }
    return count
  }, [permissions])

  // Guard: user permission check
  if (!isPermsLoading && !canUpdate("members")) {
    return (
      <AccessDeniedState
        resource="Member Permissions"
        description="You do not have permission to modify permissions for workspace collaborators."
      />
    )
  }

  // Loading state
  if (isMembersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Loading collaborator profile...
        </span>
      </div>
    )
  }

  // Member not found
  if (!member) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-12">
        <Card className="p-8 text-center flex flex-col items-center gap-4 border-dashed border-border/80">
          <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <XCircle className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Collaborator Not Found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              The member you are looking for may have been removed or the ID is invalid.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/members")}
            className="gap-2 cursor-pointer mt-2"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Team</span>
          </Button>
        </Card>
      </div>
    )
  }

  const isOwner = member.role === "Owner"
  const isRevoked = Boolean(member.revokedAt)

  // Toggle single action
  const handleToggleAction = (
    moduleId: keyof WorkspacePermissions,
    actionKey: string,
    forcedValue?: boolean
  ) => {
    if (isOwner || isRevoked || isUpdating) return

    setPermissions((prev) => {
      const currentMod = (prev[moduleId] || {}) as Record<string, boolean>
      const nextValue =
        forcedValue !== undefined ? forcedValue : !currentMod[actionKey]

      return {
        ...prev,
        [moduleId]: {
          ...currentMod,
          [actionKey]: nextValue,
        },
      }
    })
  }

  // Section master toggle
  const handleToggleModuleAll = (moduleDef: ModuleDef) => {
    if (isOwner || isRevoked || isUpdating) return

    const currentMod = (permissions[moduleDef.id] || {}) as Record<string, boolean>
    const allActive = moduleDef.actions.every((act) => Boolean(currentMod[act.key]))
    const targetState = !allActive

    setPermissions((prev) => {
      const updated = { ...(prev[moduleDef.id] as Record<string, boolean>) }
      for (const act of moduleDef.actions) {
        updated[act.key] = targetState
      }
      return {
        ...prev,
        [moduleDef.id]: updated,
      }
    })
  }

  // Apply Presets
  const applyPreset = (preset: "full" | "readOnly" | "default" | "none") => {
    if (isOwner || isRevoked || isUpdating) return

    if (preset === "full") {
      setPermissions({
        boards: { read: true, create: true, update: true, delete: true },
        zenbox: { read: true, create: true, update: true, delete: true },
        calendars: { read: true, create: true, update: true, delete: true },
        assistant: { read: true, create: true, update: true, delete: true },
        members: { read: true, create: true, update: true, delete: true },
        workspace: { read: true, update: true },
      })
      toast.info("Applied 'Full Access' preset", {
        description: "Remember to save your changes.",
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
      toast.info("Applied 'Read Only' preset", {
        description: "Remember to save your changes.",
      })
    } else if (preset === "default") {
      setPermissions(DEFAULT_MEMBER_PERMISSIONS)
      toast.info("Applied 'Standard Collaborator' preset", {
        description: "Remember to save your changes.",
      })
    } else if (preset === "none") {
      setPermissions({
        boards: { read: false, create: false, update: false, delete: false },
        zenbox: { read: false, create: false, update: false, delete: false },
        calendars: { read: false, create: false, update: false, delete: false },
        assistant: { read: false, create: false, update: false, delete: false },
        members: { read: false, create: false, update: false, delete: false },
        workspace: { read: false, update: false },
      })
      toast.info("Applied 'No Access' preset", {
        description: "All permissions disabled.",
      })
    }
  }

  // Reset to original
  const handleReset = () => {
    setPermissions(parsePermissions(member.permissions))
    toast.info("Changes reset", {
      description: "Permissions restored to last saved state.",
    })
  }

  // Save changes
  const handleSave = async () => {
    if (!member || isOwner || isRevoked || isUpdating) return

    try {
      const existingRawPerms =
        (member.permissions as unknown as Record<string, unknown>) || {}

      const payload: WorkspacePermissions = {
        ...permissions,
        ...(existingRawPerms._profile
          ? { _profile: existingRawPerms._profile }
          : {}),
      }

      await updatePermissions(member.id, payload)
    } catch {
      // Error handled by mutation hook toast
    }
  }

  const joinDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 sm:p-6 pb-24">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/members")}
          className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="size-4" />
          <span className="text-xs font-medium">Back to Team & Collaborators</span>
        </Button>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge
              variant="outline"
              className="text-[11px] font-normal border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5"
            >
              Unsaved changes
            </Badge>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || isUpdating}
            className="cursor-pointer text-xs h-8"
          >
            Reset
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isUpdating || isOwner || isRevoked}
            className="cursor-pointer text-xs h-8 gap-1.5 shadow-2xs"
          >
            {isUpdating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Member Profile Card */}
      <Card className="p-5 border-border/70 shadow-2xs bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.displayName}
              className="size-12 rounded-full object-cover shrink-0 border border-border shadow-xs"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 border border-primary/20 shadow-xs">
              {member.initials}
            </div>
          )}

          <div className="flex flex-col min-w-0 gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground truncate">
                {member.displayName}
              </h2>

              {member.isCurrentUser && (
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 font-normal bg-muted/40 text-muted-foreground border-border/80"
                >
                  You
                </Badge>
              )}

              {isOwner ? (
                <Badge
                  variant="default"
                  className="text-[10px] py-0 px-2 font-medium gap-1 bg-primary text-primary-foreground shadow-2xs"
                >
                  <Shield className="size-2.5" />
                  <span>Workspace Owner</span>
                </Badge>
              ) : isRevoked ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 text-destructive bg-destructive/10 border-transparent font-medium"
                >
                  Revoked
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground"
                >
                  Collaborator
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="size-3 text-muted-foreground/70" />
                <span className="truncate">{member.email}</span>
              </div>

              {joinDate && (
                <>
                  <span className="text-muted-foreground/40">&bull;</span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                    <Clock className="size-3 text-muted-foreground/70" />
                    <span>Joined {joinDate}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active permissions summary counter */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-muted-foreground">Active Access</span>
            <span className="text-sm font-bold text-foreground">
              {isOwner ? "Full Administrator" : `${activeCount} / 22 permissions`}
            </span>
          </div>
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border border-primary/20">
            {isOwner ? (
              <Shield className="size-5" />
            ) : (
              `${Math.round((activeCount / 22) * 100)}%`
            )}
          </div>
        </div>
      </Card>

      {/* Owner Notice or Revoked Warning */}
      {isOwner && (
        <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground flex items-center gap-2.5">
          <Shield className="size-4 text-primary shrink-0" />
          <span>
            <strong>Administrator Access:</strong> Workspace owners always possess full, unrestricted access to all features. Permissions cannot be downgraded.
          </span>
        </div>
      )}

      {isRevoked && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2.5">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            <strong>Access Revoked:</strong> This collaborator's membership has been revoked. They currently cannot access this workspace.
          </span>
        </div>
      )}

      {/* Quick Presets Toolbar */}
      {!isOwner && !isRevoked && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              Permission Presets
            </span>
            <span className="text-[11px] text-muted-foreground">
              Quickly apply common access profiles with a single click.
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset("full")}
              disabled={isUpdating}
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
              disabled={isUpdating}
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
              disabled={isUpdating}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer hover:bg-muted"
            >
              <RotateCcw className="size-3 text-muted-foreground" />
              <span>Standard Collaborator</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset("none")}
              disabled={isUpdating}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <XCircle className="size-3 text-muted-foreground" />
              <span>No Access</span>
            </Button>
          </div>
        </div>
      )}

      {/* Granular Permission Modules */}
      <div className="flex flex-col gap-5">
        {MODULES.map((moduleDef) => {
          const currentModPerms = (permissions[moduleDef.id] || {}) as Record<
            string,
            boolean
          >
          const ModuleIcon = moduleDef.icon

          const activeInModule = moduleDef.actions.filter(
            (act) => currentModPerms[act.key]
          ).length
          const allActive = activeInModule === moduleDef.actions.length

          return (
            <Card
              key={moduleDef.id}
              className="border-border/70 shadow-2xs overflow-hidden bg-card"
            >
              {/* Module Header */}
              <div className="flex items-center justify-between gap-3 p-4 bg-muted/15 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <ModuleIcon className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {moduleDef.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 font-normal",
                          activeInModule > 0
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted/40 text-muted-foreground border-border/70"
                        )}
                      >
                        {activeInModule} / {moduleDef.actions.length} enabled
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {moduleDef.description}
                    </p>
                  </div>
                </div>

                {!isOwner && !isRevoked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleModuleAll(moduleDef)}
                    disabled={isUpdating}
                    className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  >
                    {allActive ? "Disable all" : "Enable all"}
                  </Button>
                )}
              </div>

              {/* Individual Permission Toggle Rows */}
              <div className="divide-y divide-border/40">
                {moduleDef.actions.map((act) => {
                  const isChecked = Boolean(currentModPerms[act.key])

                  return (
                    <div
                      key={act.key}
                      role="button"
                      tabIndex={isOwner || isRevoked ? -1 : 0}
                      onClick={() =>
                        handleToggleAction(moduleDef.id, act.key, !isChecked)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleToggleAction(moduleDef.id, act.key, !isChecked)
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between gap-4 p-4 transition-colors select-none",
                        isOwner || isRevoked
                          ? "opacity-75 cursor-default"
                          : "cursor-pointer hover:bg-muted/30",
                        isChecked && !isOwner && !isRevoked && "bg-primary/[0.02]"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors border",
                            isChecked
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-muted/30 border-border/60 text-muted-foreground/40"
                          )}
                        >
                          <Check
                            className={cn(
                              "size-3 transition-opacity",
                              isChecked ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>

                        <div className="flex flex-col min-w-0 gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {act.title}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0 rounded bg-muted/60 text-muted-foreground border border-border/60 font-normal">
                              {act.code}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {act.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            "text-[11px] font-medium hidden sm:inline-block",
                            isChecked
                              ? "text-primary font-semibold"
                              : "text-muted-foreground"
                          )}
                        >
                          {isChecked ? "Allowed" : "Denied"}
                        </span>

                        <Switch
                          checked={isChecked}
                          onCheckedChange={(val) =>
                            handleToggleAction(moduleDef.id, act.key, val)
                          }
                          disabled={isOwner || isRevoked || isUpdating}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Floating Save Footer when Dirty */}
      {isDirty && !isOwner && !isRevoked && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Card className="p-3 shadow-xl border-primary/30 bg-background/95 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 pl-1">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-foreground truncate">
                You have unsaved permission changes
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isUpdating}
                className="cursor-pointer text-xs h-8"
              >
                Reset
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="cursor-pointer text-xs h-8 gap-1.5 shadow-xs"
              >
                {isUpdating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default MemberPermissionsPage
