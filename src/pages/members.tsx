import { useState, useEffect } from "react"
import { useRoute, useLocation } from "wouter"
import { Users, KeyRound, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageSidebarLayout, PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { useWorkspaceMembers } from "@/features/members/hooks/use-workspace-members"
import { useWorkspaceInvites } from "@/features/members/hooks/use-workspace-invites"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { MembersSidebar, type MembersSidebarTab } from "@/features/members/components/members-sidebar"
import { MemberPermissionsDetail } from "@/features/members/components/member-permissions-detail"
import { InvitePermissionsDetail } from "@/features/members/components/invite-permissions-detail"
import { AccessDeniedState } from "@/features/members/components/access-denied-state"
import { DEFAULT_MEMBER_PERMISSIONS } from "@/types/member"

export function MembersPage() {
  const [, setLocation] = useLocation()
  const [matchInvite, inviteParams] = useRoute("/members/invite/:id")
  const [matchMember, memberParams] = useRoute("/members/:id")

  const {
    members,
    isLoading: isMembersLoading,
    updatePermissions: updateMemberPermissions,
    revokeMember,
    restoreMember,
    deleteMember,
    batchRevokeMembers,
    batchRestoreMembers,
    batchDeleteMembers,
    isUpdating: isUpdatingMember,
  } = useWorkspaceMembers()

  const {
    invites,
    isLoading: isInvitesLoading,
    createInvite,
    revokeInvite,
    restoreInvite,
    deleteInvite,
    updateInvite,
    batchRevokeInvites,
    batchRestoreInvites,
    batchDeleteInvites,
    isCreating,
    isUpdating: isUpdatingInvite,
  } = useWorkspaceInvites()

  const {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    isLoading: isPermsLoading,
  } = useWorkspacePermissions()

  const handleDeleteMember = async (memberId: number) => {
    await deleteMember(memberId)
    setLocation("/members")
  }

  const handleDeleteInvite = async (inviteId: number) => {
    await deleteInvite(inviteId)
    setLocation("/members")
  }

  const handleQuickCreateInvite = async () => {
    try {
      const newInvite = await createInvite({
        permissions: DEFAULT_MEMBER_PERMISSIONS,
        maxUses: 1,
        expiredAt: null,
      })
      if (newInvite?.id) {
        setLocation(`/members/invite/${newInvite.id}`)
      }
    } catch {
      // Toast notification is handled by the mutation in useWorkspaceInvites
    }
  }

  // Route determinations
  const isInviteRoute = Boolean(matchInvite && inviteParams?.id)
  const isMemberRoute = Boolean(
    !matchInvite &&
      matchMember &&
      memberParams?.id &&
      memberParams.id !== "invite"
  )

  // Sidebar Tab state
  const [activeTab, setActiveTab] = useState<MembersSidebarTab>(() => {
    if (isInviteRoute) return "invite_codes"
    return "members"
  })

  // Synchronize tab state with current route when location changes
  useEffect(() => {
    if (isInviteRoute) {
      setActiveTab("invite_codes")
    } else if (isMemberRoute) {
      setActiveTab("members")
    }
  }, [isInviteRoute, isMemberRoute])

  // Selected entities based on current route params
  const currentMember =
    isMemberRoute && memberParams?.id
      ? members.find(
          (m) =>
            String(m.id) === memberParams.id || m.userId === memberParams.id
        ) ?? null
      : null

  const currentInvite =
    isInviteRoute && inviteParams?.id
      ? invites.find((i) => String(i.id) === inviteParams.id) ?? null
      : null

  // Route Access Guard: If user cannot read members
  if (!isPermsLoading && !canRead("members")) {
    return (
      <AccessDeniedState
        resource="Team Members"
        description="You do not have permission to view members and invitations in this workspace."
      />
    )
  }

  return (
    <PageSidebarLayout
      className="bg-card"
      sidebar={
        <MembersSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          members={members}
          invites={invites}
          selectedMemberId={isMemberRoute ? memberParams?.id : null}
          selectedInviteId={isInviteRoute ? inviteParams?.id : null}
          onSelectMember={(id) => setLocation(`/members/${id}`)}
          onSelectInvite={(id) => setLocation(`/members/invite/${id}`)}
          canCreate={canCreate("members")}
          onInviteClick={handleQuickCreateInvite}
          isCreating={isCreating}
          isLoadingMembers={isMembersLoading}
          isLoadingInvites={isInvitesLoading}
          onBatchRevokeMembers={canDelete("members") ? batchRevokeMembers : undefined}
          onBatchRestoreMembers={canUpdate("members") ? batchRestoreMembers : undefined}
          onBatchDeleteMembers={canDelete("members") ? batchDeleteMembers : undefined}
          onBatchRevokeInvites={canDelete("members") ? batchRevokeInvites : undefined}
          onBatchRestoreInvites={canUpdate("members") ? batchRestoreInvites : undefined}
          onBatchDeleteInvites={canDelete("members") ? batchDeleteInvites : undefined}
        />
      }
    >
      {isMemberRoute ? (
        isMembersLoading ? (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
            <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
              <PageSidebarTrigger
                className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Toggle sidebar"
              />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Loading collaborator details...
              </p>
            </div>
          </div>
        ) : currentMember ? (
          <MemberPermissionsDetail
            member={currentMember}
            canUpdate={canUpdate("members")}
            canDelete={canDelete("members")}
            isUpdating={isUpdatingMember}
            onUpdatePermissions={updateMemberPermissions}
            onRevokeMember={revokeMember}
            onRestoreMember={restoreMember}
            onDeleteMember={handleDeleteMember}
          />
        ) : (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
            <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
              <PageSidebarTrigger
                className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Toggle sidebar"
              />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <XCircle className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Collaborator not found
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
                This collaborator does not exist or has been removed from this workspace.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/members")}
                className="mt-4 cursor-pointer text-xs"
              >
                Back to Members
              </Button>
            </div>
          </div>
        )
      ) : isInviteRoute ? (
        isInvitesLoading ? (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
            <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
              <PageSidebarTrigger
                className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Toggle sidebar"
              />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Loading invite code details...
              </p>
            </div>
          </div>
        ) : currentInvite ? (
          <InvitePermissionsDetail
            invite={currentInvite}
            canUpdate={canUpdate("members")}
            canDelete={canDelete("members")}
            isUpdating={isUpdatingInvite}
            onUpdateInvite={updateInvite}
            onRevokeInvite={revokeInvite}
            onRestoreInvite={restoreInvite}
            onDeleteInvite={handleDeleteInvite}
          />
        ) : (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
            <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
              <PageSidebarTrigger
                className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Toggle sidebar"
              />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <KeyRound className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Invite code not found
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
                This invite code does not exist or may have been deactivated.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/members")}
                className="mt-4 cursor-pointer text-xs"
              >
                Back to Invites
              </Button>
            </div>
          </div>
        )
      ) : (
        /* Default empty state when on /members with no member or invite selected */
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PageSidebarTrigger
                className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Toggle sidebar"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Select a member or invite code
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
              Choose a collaborator or invite code from the list on the left to view details and manage permissions.
            </p>
          </div>
        </div>
      )}
    </PageSidebarLayout>
  )
}

export default MembersPage
