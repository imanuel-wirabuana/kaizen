import { useState } from "react"
import { useLocation } from "wouter"
import {
  Mail,
  MoreVertical,
  SlidersHorizontal,
  UserX,
  Shield,
  Search,
  Calendar,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  WorkspaceMemberProfile,
  WorkspacePermissions,
} from "@/types/member"

export interface MembersTableProps {
  members: WorkspaceMemberProfile[]
  searchQuery: string
  onClearSearch?: () => void
  canUpdate?: boolean
  canDelete?: boolean
  onUpdatePermissions?: (
    memberId: number,
    permissions: WorkspacePermissions
  ) => Promise<void>
  onRevokeMember: (memberId: number) => Promise<boolean>
}

export function MembersTable({
  members,
  searchQuery,
  onClearSearch,
  canUpdate = false,
  canDelete = false,
  onRevokeMember,
}: MembersTableProps) {
  const [, setLocation] = useLocation()
  const [memberToRevoke, setMemberToRevoke] =
    useState<WorkspaceMemberProfile | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      m.displayName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.userId.toLowerCase().includes(q)
    )
  })

  const handleOpenPermissions = (member: WorkspaceMemberProfile) => {
    if (!canUpdate || member.role === "Owner" || member.revokedAt) return
    setLocation(`/members/${member.id}`)
  }

  const handleRevoke = (member: WorkspaceMemberProfile) => {
    setMemberToRevoke(member)
  }

  // Count active accessible features for the preview pills
  const getPermissionSummary = (permissions: WorkspacePermissions) => {
    const activeResources: string[] = []
    if (permissions.boards?.read) activeResources.push("Boards")
    if (permissions.zenbox?.read) activeResources.push("Zenbox")
    if (permissions.calendars?.read) activeResources.push("Zenbox")
    if (permissions.assistant?.read) activeResources.push("Assistant")
    if (permissions.workspace?.read) activeResources.push("Settings")
    return activeResources
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <Search className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {searchQuery
              ? `No collaborators match "${searchQuery}"`
              : "No collaborators found"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {searchQuery
              ? "Try adjusting your search terms or filters."
              : "Generate an invite link to invite team members to this workspace."}
          </p>
        </div>
        {searchQuery && onClearSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="text-xs mt-1 cursor-pointer"
          >
            Clear Search
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-border/40">
        {filteredMembers.map((member) => {
          const isOwner = member.role === "Owner"
          const isRevoked = Boolean(member.revokedAt)
          const permissionSummary = getPermissionSummary(member.permissions)

          const formattedJoinDate = member.createdAt
            ? new Date(member.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null

          const isClickable = canUpdate && !isOwner && !isRevoked

          return (
            <div
              key={`${member.userId}-${member.id}`}
              onClick={() => {
                if (isClickable) handleOpenPermissions(member)
              }}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 transition-colors ${
                isClickable
                  ? "cursor-pointer hover:bg-muted/40"
                  : "hover:bg-muted/20"
              }`}
            >
              {/* Left: User Avatar & Information */}
              <div className="flex items-center gap-3 min-w-0">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="size-9 sm:size-10 rounded-full object-cover shrink-0 border border-border shadow-2xs"
                  />
                ) : (
                  <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 border border-primary/20 shadow-2xs">
                    {member.initials}
                  </div>
                )}

                <div className="flex flex-col min-w-0 gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {member.displayName}
                    </span>

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
                        <span>Owner</span>
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

                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 shrink-0 text-muted-foreground/70" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {formattedJoinDate && (
                      <>
                        <span className="text-muted-foreground/40">&bull;</span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                          <Calendar className="size-3 text-muted-foreground/70" />
                          <span>Joined {formattedJoinDate}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Permissions Preview & Menu Actions */}
              <div
                className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Permissions tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isOwner ? (
                    <span className="text-[11px] text-primary/90 font-medium inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      <Sparkles className="size-3" />
                      <span>Full Access</span>
                    </span>
                  ) : isRevoked ? (
                    <span className="text-[11px] text-muted-foreground/70 italic">
                      Revoked
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {permissionSummary.slice(0, 2).map((res) => (
                        <span
                          key={res}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50 font-medium"
                        >
                          {res}
                        </span>
                      ))}
                      {permissionSummary.length > 2 && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-muted/40 text-muted-foreground text-[10px]">
                          +{permissionSummary.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Permissions button shortcut on hover / desktop */}
                {!isOwner && canUpdate && !isRevoked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenPermissions(member)}
                    className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer hidden md:inline-flex"
                    title="Manage Permissions"
                  >
                    <SlidersHorizontal className="size-3" />
                    <span>Permissions</span>
                  </Button>
                )}

                {/* Dropdown Options for Collaborators */}
                {!isOwner && (canUpdate || canDelete) && !isRevoked && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                          title="Collaborator options"
                        />
                      }
                    >
                      <MoreVertical className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {canUpdate && (
                        <DropdownMenuItem
                          onClick={() => handleOpenPermissions(member)}
                          className="cursor-pointer gap-2 text-xs"
                        >
                          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                          <span>Manage Permissions</span>
                        </DropdownMenuItem>
                      )}
                      {canUpdate && canDelete && <DropdownMenuSeparator />}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleRevoke(member)}
                          className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                        >
                          <UserX className="size-3.5" />
                          <span>Revoke Access</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {isClickable && (
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-foreground transition-colors hidden sm:block" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog
        open={Boolean(memberToRevoke)}
        onOpenChange={(open) => {
          if (!open && !isRevoking) setMemberToRevoke(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Member Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke workspace access for{" "}
              <span className="font-semibold text-foreground">
                "{memberToRevoke?.displayName}"
              </span>
              ? They will be immediately evicted and lose access to this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRevoking}
              onClick={() => setMemberToRevoke(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRevoking}
              onClick={async () => {
                if (!memberToRevoke) return
                try {
                  setIsRevoking(true)
                  await onRevokeMember(memberToRevoke.id)
                } finally {
                  setIsRevoking(false)
                  setMemberToRevoke(null)
                }
              }}
            >
              {isRevoking ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default MembersTable
