import { useState } from "react"
import {
  Plus,
  Search,
  UserCheck,
  Users,
  Link2,
  Building2,
  X,
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWorkspaceMembers } from "@/features/members/hooks/use-workspace-members"
import { useWorkspaceInvites } from "@/features/members/hooks/use-workspace-invites"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { MembersTable } from "@/features/members/components/members-table"
import { InvitesTable } from "@/features/members/components/invites-table"
import { GenerateInviteDialog } from "@/features/members/components/generate-invite-dialog"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"

export function MembersPage() {
  const {
    members,
    activeWorkspace,
    isLoading: isMembersLoading,
    revokeMember,
    refreshMembers,
  } = useWorkspaceMembers()

  const {
    invites,
    isLoading: isInvitesLoading,
    createInvite,
    revokeInvite,
    isCreating,
    refreshInvites,
  } = useWorkspaceInvites()

  const { canRead, canCreate, canUpdate, canDelete, isLoading: isPermsLoading } =
    useWorkspacePermissions()

  const [searchQuery, setSearchQuery] = useState("")
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [referenceTime] = useState(() => Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Route Access Guard: If user cannot read members
  if (!isPermsLoading && !canRead("members")) {
    return (
      <AccessDeniedState
        resource="Team Members"
        description="You do not have permission to view members and invitations in this workspace."
      />
    )
  }

  const activeMembersCount = members.filter((m) => !m.revokedAt).length
  const activeInvitesCount = invites.filter(
    (i) =>
      !i.revoked_at &&
      (!i.expired_at || new Date(i.expired_at).getTime() > referenceTime) &&
      (i.max_uses === 0 || i.use_count < i.max_uses)
  ).length

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshMembers(), refreshInvites()])
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] font-normal gap-1.5 px-2 py-0.5 bg-muted/40 border-border/70 text-muted-foreground"
            >
              <Building2 className="size-3 text-muted-foreground/80" />
              <span className="font-medium text-foreground">
                {activeWorkspace?.name || "Kaizen Workspace"}
              </span>
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Team & Collaborators
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your workspace members, assign granular permissions, and track active invitation links.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isMembersLoading || isInvitesLoading}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            title="Refresh member data"
          >
            <RotateCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          {canCreate("members") && (
            <Button
              onClick={() => setGenerateDialogOpen(true)}
              className="gap-2 cursor-pointer shadow-xs font-medium"
              size="sm"
            >
              <Plus className="size-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Members */}
        <Card className="p-4 flex items-center justify-between border-border/70 bg-card shadow-2xs hover:border-border transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Members
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                {members.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                in workspace
              </span>
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="size-5" />
          </div>
        </Card>

        {/* Active Collaborators */}
        <Card className="p-4 flex items-center justify-between border-border/70 bg-card shadow-2xs hover:border-border transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Active Access
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                {activeMembersCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <UserCheck className="size-5" />
          </div>
        </Card>

        {/* Active Invites */}
        <Card className="p-4 flex items-center justify-between border-border/70 bg-card shadow-2xs hover:border-border transition-all">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Active Invites
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                {activeInvitesCount}
              </span>
              <span className="text-[11px] text-muted-foreground">
                pending use
              </span>
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
            <Link2 className="size-5" />
          </div>
        </Card>
      </div>

      {/* 2-Column Responsive Layout (No Tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Team Members (8 cols on lg, 7 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <Card className="overflow-hidden border-border/80 shadow-2xs bg-card">
            {/* Column Header with Title & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3.5 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Workspace Members
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground"
                >
                  {members.length}
                </Badge>
              </div>

              {/* Search Member */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="pl-8 pr-7 h-8 text-xs bg-background border-border/70"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Members List */}
            {isMembersLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Loading team members...
              </div>
            ) : (
              <MembersTable
                members={members}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery("")}
                canUpdate={canUpdate("members")}
                canDelete={canDelete("members")}
                onRevokeMember={async (memberId) => {
                  return revokeMember(memberId)
                }}
              />
            )}
          </Card>
        </div>

        {/* Right Column: Invitations (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <Card className="overflow-hidden border-border/80 shadow-2xs bg-card">
            {/* Column Header */}
            <div className="flex items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3.5 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  Invitations
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground"
                >
                  {invites.length}
                </Badge>
              </div>

              {canCreate("members") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGenerateDialogOpen(true)}
                  className="h-7 text-xs px-2 gap-1 cursor-pointer hover:bg-muted"
                >
                  <Plus className="size-3" />
                  <span>Invite</span>
                </Button>
              )}
            </div>

            {/* Invites List */}
            {isInvitesLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Loading workspace invites...
              </div>
            ) : (
              <InvitesTable
                invites={invites}
                canRevoke={canDelete("members")}
                onRevoke={async (inviteId) => {
                  return revokeInvite(inviteId)
                }}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Generate Invite Dialog */}
      <GenerateInviteDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        workspaceName={activeWorkspace?.name}
        onGenerate={createInvite}
        isGenerating={isCreating}
      />
    </div>
  )
}

export default MembersPage
