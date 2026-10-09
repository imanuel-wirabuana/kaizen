import { useState } from "react"
import { Users, KeyRound, Plus, Loader2 } from "lucide-react"
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MembersBatchActionBar } from "@/features/members/components/members-batch-action-bar"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { WorkspaceMemberProfile, WorkspaceInvite } from "@/types/member"

export type MembersSidebarTab = "members" | "invite_codes"

export interface MembersSidebarProps {
  activeTab: MembersSidebarTab
  onTabChange: (tab: MembersSidebarTab) => void
  members: WorkspaceMemberProfile[]
  invites: WorkspaceInvite[]
  selectedMemberId?: string | null
  selectedInviteId?: string | null
  onSelectMember: (id: string | number) => void
  onSelectInvite: (id: string | number) => void
  canCreate?: boolean
  onInviteClick?: () => void
  isCreating?: boolean
  isLoadingMembers?: boolean
  isLoadingInvites?: boolean
  onBatchRevokeMembers?: (ids: number[]) => Promise<unknown>
  onBatchRestoreMembers?: (ids: number[]) => Promise<unknown>
  onBatchDeleteMembers?: (ids: number[]) => Promise<unknown>
  onBatchRevokeInvites?: (ids: number[]) => Promise<unknown>
  onBatchRestoreInvites?: (ids: number[]) => Promise<unknown>
  onBatchDeleteInvites?: (ids: number[]) => Promise<unknown>
}

export function MembersSidebar({
  activeTab,
  onTabChange,
  members,
  invites,
  selectedMemberId,
  selectedInviteId,
  onSelectMember,
  onSelectInvite,
  canCreate = true,
  onInviteClick,
  isCreating = false,
  isLoadingMembers = false,
  isLoadingInvites = false,
  onBatchRevokeMembers,
  onBatchRestoreMembers,
  onBatchDeleteMembers,
  onBatchRevokeInvites,
  onBatchRestoreInvites,
  onBatchDeleteInvites,
}: MembersSidebarProps) {
  const [referenceTime] = useState(() => Date.now())
  const [selectedMemberBatchIds, setSelectedMemberBatchIds] = useState<number[]>([])
  const [selectedInviteBatchIds, setSelectedInviteBatchIds] = useState<number[]>([])

  const toggleMemberBatch = (id: number) => {
    setSelectedMemberBatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleInviteBatch = (id: number) => {
    setSelectedInviteBatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleTabChange = (tab: MembersSidebarTab) => {
    setSelectedMemberBatchIds([])
    setSelectedInviteBatchIds([])
    onTabChange(tab)
  }

  const eligibleMembers = members.filter(
    (m) => m.role !== "Owner" && m.id > 0
  )

  return (
    <>
      {/* Sidebar Header: 2 Tabs (Members / Invites) + Quick Action or Batch Action Bar */}
      <SidebarHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar/30 p-2">
        {activeTab === "members" && selectedMemberBatchIds.length > 0 ? (
          <MembersBatchActionBar
            selectedIds={selectedMemberBatchIds}
            totalItemsCount={eligibleMembers.length}
            entityName="member"
            hasActiveSelected={selectedMemberBatchIds.some(
              (id) => !members.find((m) => m.id === id)?.revokedAt
            )}
            hasRevokedSelected={selectedMemberBatchIds.some((id) =>
              Boolean(members.find((m) => m.id === id)?.revokedAt)
            )}
            onSelectAll={() =>
              setSelectedMemberBatchIds(eligibleMembers.map((m) => m.id))
            }
            onClearSelection={() => setSelectedMemberBatchIds([])}
            onBatchRevoke={onBatchRevokeMembers ?? (async () => {})}
            onBatchRestore={onBatchRestoreMembers ?? (async () => {})}
            onBatchDelete={onBatchDeleteMembers ?? (async () => {})}
          />
        ) : activeTab === "invite_codes" && selectedInviteBatchIds.length > 0 ? (
          <MembersBatchActionBar
            selectedIds={selectedInviteBatchIds}
            totalItemsCount={invites.length}
            entityName="invite"
            hasActiveSelected={selectedInviteBatchIds.some(
              (id) => !invites.find((i) => i.id === id)?.revoked_at
            )}
            hasRevokedSelected={selectedInviteBatchIds.some((id) =>
              Boolean(invites.find((i) => i.id === id)?.revoked_at)
            )}
            onSelectAll={() =>
              setSelectedInviteBatchIds(invites.map((i) => i.id))
            }
            onClearSelection={() => setSelectedInviteBatchIds([])}
            onBatchRevoke={onBatchRevokeInvites ?? (async () => {})}
            onBatchRestore={onBatchRestoreInvites ?? (async () => {})}
            onBatchDelete={onBatchDeleteInvites ?? (async () => {})}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("members")}
                    className={cn(
                      "flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 px-2 text-xs transition-all",
                      activeTab === "members"
                        ? "bg-card font-semibold text-foreground shadow-2xs hover:bg-card"
                        : "font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    <Users
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        activeTab === "members"
                          ? "text-primary"
                          : "text-muted-foreground/70"
                      )}
                    />
                    <span className="truncate">Members</span>
                    {members.length > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-semibold leading-tight",
                          activeTab === "members"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted-foreground/15 text-muted-foreground"
                        )}
                      >
                        {members.length}
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("invite_codes")}
                    className={cn(
                      "flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 px-2 text-xs transition-all",
                      activeTab === "invite_codes"
                        ? "bg-card font-semibold text-foreground shadow-2xs hover:bg-card"
                        : "font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    <KeyRound
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        activeTab === "invite_codes"
                          ? "text-primary"
                          : "text-muted-foreground/70"
                      )}
                    />
                    <span className="truncate">Invites</span>
                    {invites.length > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-semibold leading-tight",
                          activeTab === "invite_codes"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted-foreground/15 text-muted-foreground"
                        )}
                      >
                        {invites.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {canCreate && onInviteClick && (
              <Button
                type="button"
                onClick={onInviteClick}
                disabled={isCreating}
                className="h-8 w-full cursor-pointer justify-center gap-2 text-xs font-medium shadow-xs transition-all"
              >
                {isCreating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                <span>
                  {isCreating
                    ? "Creating..."
                    : activeTab === "members"
                      ? "Invite Member"
                      : "New Invite Code"}
                </span>
              </Button>
            )}
          </>
        )}
      </SidebarHeader>

      {/* Sidebar Content: List using standard SidebarMenu & SidebarMenuItem */}
      <SidebarContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <SidebarMenu className="gap-0 p-0">
            {activeTab === "members" ? (
              isLoadingMembers ? (
                <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                  <Users className="mb-2 size-6 text-muted-foreground/40" />
                  <p>No members in workspace</p>
                </div>
              ) : (
                members.map((member) => {
                  const isSelected =
                    String(selectedMemberId) === String(member.id) ||
                    selectedMemberId === member.userId
                  const isOwner = member.role === "Owner"
                  const isRevoked = Boolean(member.revokedAt)
                  const isBatchSelected = selectedMemberBatchIds.includes(member.id)
                  const isBatchMode = selectedMemberBatchIds.length > 0

                  const formattedDate = (() => {
                    try {
                      return formatDistanceToNow(new Date(member.createdAt), {
                        addSuffix: true,
                      })
                    } catch {
                      return "recently"
                    }
                  })()

                  return (
                    <SidebarMenuItem
                      key={member.id}
                      className="group/item border-b border-border/50 p-0 last:border-b-0"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey) {
                            if (!isOwner && member.id > 0) {
                              e.preventDefault()
                              toggleMemberBatch(member.id)
                              return
                            }
                          }
                          onSelectMember(member.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onSelectMember(member.id)
                          }
                        }}
                        className={cn(
                          "group relative flex w-full cursor-pointer items-start gap-2.5 p-2.5 text-left text-sm leading-tight transition-colors select-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none",
                          isSelected &&
                            "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        )}
                      >
                        {/* Batch Selection Checkbox */}
                        {!isOwner && member.id > 0 && (
                          <div
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMemberBatch(member.id)
                            }}
                            className={cn(
                              "mt-1 flex size-4 cursor-pointer items-center justify-center transition-opacity shrink-0",
                              isBatchMode || isBatchSelected
                                ? "opacity-100"
                                : "opacity-0 group-hover/item:opacity-100"
                            )}
                          >
                            <Checkbox
                              checked={isBatchSelected}
                              tabIndex={-1}
                              className="size-3.5 pointer-events-none border-primary"
                              aria-label={`Select ${member.displayName}`}
                            />
                          </div>
                        )}

                        {/* Avatar */}
                        <div className="relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.displayName}
                              className="size-full rounded-lg object-cover"
                            />
                          ) : (
                            <span>{member.initials}</span>
                          )}
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background",
                              isRevoked ? "bg-destructive" : "bg-emerald-500"
                            )}
                          />
                        </div>

                        {/* Text Content */}
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                          <div className="flex w-full items-center gap-2">
                            <span className="flex-1 truncate text-xs font-semibold text-foreground">
                              {member.displayName}
                            </span>
                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                              {formattedDate}
                            </span>
                          </div>

                          <div className="flex w-full items-center justify-between gap-1 text-[11px] text-muted-foreground">
                            <span className="truncate">{member.email}</span>
                            <span
                              className={cn(
                                "text-[10px] px-1 py-0 rounded font-normal shrink-0",
                                isOwner
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground bg-muted"
                              )}
                            >
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </SidebarMenuItem>
                  )
                })
              )
            ) : isLoadingInvites ? (
              <div className="flex flex-1 items-center justify-center p-8 text-xs text-muted-foreground">
                Loading invite codes...
              </div>
            ) : invites.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                <KeyRound className="mb-2 size-6 text-muted-foreground/40" />
                <p>No invite codes created</p>
              </div>
            ) : (
              invites.map((invite) => {
                const isSelected =
                  String(selectedInviteId) === String(invite.id)
                const isRevoked = Boolean(invite.revoked_at)
                const isExpired =
                  Boolean(invite.expired_at) &&
                  new Date(invite.expired_at!).getTime() < referenceTime
                const isExhausted =
                  invite.max_uses > 0 && invite.use_count >= invite.max_uses
                const isBatchSelected = selectedInviteBatchIds.includes(invite.id)
                const isBatchMode = selectedInviteBatchIds.length > 0

                const formattedDate = (() => {
                  try {
                    return formatDistanceToNow(new Date(invite.created_at), {
                      addSuffix: true,
                    })
                  } catch {
                    return "recently"
                  }
                })()

                return (
                  <SidebarMenuItem
                    key={invite.id}
                    className="group/item border-b border-border/50 p-0 last:border-b-0"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                          e.preventDefault()
                          toggleInviteBatch(invite.id)
                          return
                        }
                        onSelectInvite(invite.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onSelectInvite(invite.id)
                        }
                      }}
                      className={cn(
                        "group relative flex w-full cursor-pointer items-start gap-2.5 p-2.5 text-left text-sm leading-tight transition-colors select-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none",
                        isSelected &&
                          "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      {/* Batch Selection Checkbox */}
                      <div
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleInviteBatch(invite.id)
                        }}
                        className={cn(
                          "mt-1 flex size-4 cursor-pointer items-center justify-center transition-opacity shrink-0",
                          isBatchMode || isBatchSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover/item:opacity-100"
                        )}
                      >
                        <Checkbox
                          checked={isBatchSelected}
                          tabIndex={-1}
                          className="size-3.5 pointer-events-none border-primary"
                          aria-label={`Select ${invite.code}`}
                        />
                      </div>

                      {/* Code Icon */}
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <KeyRound className="size-3.5" />
                      </div>

                      {/* Text Content */}
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        <div className="flex w-full items-center gap-2">
                          <span className="font-mono flex-1 truncate text-xs font-semibold text-foreground tracking-wide">
                            {invite.code}
                          </span>
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                            {formattedDate}
                          </span>
                        </div>

                        <div className="flex w-full items-center justify-between gap-1 text-[11px] text-muted-foreground">
                          <span>
                            {invite.use_count} / {invite.max_uses === 0 ? "∞" : invite.max_uses} uses
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1 py-0 rounded font-normal shrink-0",
                              isRevoked
                                ? "bg-destructive/10 text-destructive"
                                : isExpired || isExhausted
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                            )}
                          >
                            {isRevoked
                              ? "Revoked"
                              : isExpired
                                ? "Expired"
                                : isExhausted
                                  ? "Limit"
                                  : "Active"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SidebarMenuItem>
                )
              })
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

export default MembersSidebar
