import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation } from "wouter"
import { useUser } from "@clerk/clerk-react"
import { NavUser } from "@/components/layout/nav-user"
import { Header } from "@/components/layout/header"
import { Brand } from "@/components/layout/brand"
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import { WorkspaceCommandDialog } from "@/features/workspaces/components/workspace-command-dialog"
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog"
import { WorkspaceEmptyState } from "@/features/workspaces/components/workspace-empty-state"
import { SearchCommandDialog } from "@/features/search/components/search-command-dialog"
import { AssistantRightSidebar } from "@/features/assistant/components/assistant-right-sidebar"
import { JoinWorkspaceDialog } from "@/features/members/components/join-workspace-dialog"
import { AcceptInviteDialog } from "@/features/members/components/accept-invite-dialog"
import { useAssistantStore } from "@/stores/assistant-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { supabase } from "@/services/supabase/client"
import { queryClient } from "@/lib/query-client"
import { toast } from "@/components/ui/toast"
import { workspaceKeys } from "@/features/workspaces/services/workspace-keys"
import { memberKeys } from "@/features/members/services/member-keys"
import { syncWorkspaceUserProfile } from "@/features/members/services/member-service"
import type { WorkspaceMember } from "@/types/member"
import {
  BotMessageSquare,
  Calendar,
  Home,
  Inbox,
  Info,
  KanbanSquare,
  Loader2,
  Settings,
  Users,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface NavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
}

function SidebarNavItem({ href, icon: Icon, title }: NavItemProps) {
  const [location] = useLocation()
  const isActive =
    href === "/"
      ? location === "/"
      : location === href || location.startsWith(`${href}/`)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={isActive}
        tooltip={title}
      >
        <Icon className="size-4" />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function RootLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation()
  const { user } = useUser()
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(
    null
  )
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)

  const isAssistantOpen = useAssistantStore((s) => s.isRightSidebarOpen)
  const toggleAssistant = useAssistantStore((s) => s.toggleRightSidebarOpen)

  const { workspaces, isLoading } = useWorkspaces()
  const { canRead } = useWorkspacePermissions()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId)
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  // 1. Auto-sync user profile for active workspace
  useEffect(() => {
    if (!activeWorkspaceId || !user) return
    const isOwner = Boolean(
      activeWorkspace && activeWorkspace.owner_id === user.id
    )
    void syncWorkspaceUserProfile({
      workspaceId: activeWorkspaceId,
      user,
      isOwner,
    })
  }, [activeWorkspaceId, user, activeWorkspace])

  // 2. Realtime listener for member revocation across the entire workspace shell
  useEffect(() => {
    if (!user?.id) return

    const staleChannels = supabase
      .getChannels()
      .filter(
        (c) => c.topic === `realtime:user_memberships_eviction:${user.id}`
      )
    for (const stale of staleChannels) {
      void supabase.removeChannel(stale)
    }

    const channel = supabase
      .channel(`user_memberships_eviction:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workspace_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as WorkspaceMember
          if (updated && updated.revoked_at) {
            void queryClient.invalidateQueries({
              queryKey: workspaceKeys.list(user.id),
            })
            void queryClient.invalidateQueries({
              queryKey: memberKeys.all,
            })

            const currentId = useWorkspaceStore.getState().activeWorkspaceId
            if (currentId === updated.workspace_id) {
              toast.error("Access revoked", {
                description:
                  "Your access to this workspace was revoked by the owner.",
              })

              const remaining = workspaces.filter(
                (w) => w.id !== updated.workspace_id && !w.archived_at
              )
              const fallback =
                remaining.find((w) => w.owner_id === user.id) ||
                remaining[0] ||
                null

              setActiveWorkspaceId(fallback?.id ?? null)
              setLocation("/")
            }
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, workspaces, setActiveWorkspaceId, setLocation])

  // Cmd+K / Ctrl+K keyboard shortcut to open Search Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchDialogOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Detect pending invite code from URL parameters, localStorage, or sessionStorage
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const urlCode = urlParams.get("invite") || urlParams.get("code")
      const localCode = localStorage.getItem("kaizen_pending_invite")
      const sessionCode = sessionStorage.getItem("kaizen_pending_invite")
      const targetCode = urlCode || localCode || sessionCode
      if (targetCode) {
        setPendingInviteCode(targetCode)
        setAcceptDialogOpen(true)
      }
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const handleInviteComplete = () => {
    try {
      localStorage.removeItem("kaizen_pending_invite")
      sessionStorage.removeItem("kaizen_pending_invite")
      const cleanPath = window.location.pathname
      window.history.replaceState({}, document.title, cleanPath)
    } catch {
      // Ignore
    }
    setPendingInviteCode(null)
  }

  const hasWorkspaces = workspaces.length > 0

  const handleHeaderButtonClick = () => {
    if (hasWorkspaces) {
      setWorkspaceDialogOpen(true)
    } else {
      setCreateDialogOpen(true)
    }
  }

  return (
    <>
      <SidebarProvider
        open={false}
        defaultOpen={false}
        onOpenChange={() => {}}
        className="h-svh max-h-svh overflow-hidden"
      >
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border/50 p-2">
            <Brand />
          </SidebarHeader>

          <SidebarContent className="p-2">
            {hasWorkspaces && (
              <>
                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarNavItem href="/" icon={Home} title="Dashboard" />
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="my-2 border-t border-sidebar-border/50 p-0" />

                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {canRead("zenbox") && (
                        <SidebarNavItem
                          href="/zenbox"
                          icon={Inbox}
                          title="Zenbox"
                        />
                      )}
                      {canRead("boards") && (
                        <SidebarNavItem
                          href="/boards"
                          icon={KanbanSquare}
                          title="Boards"
                        />
                      )}
                      {canRead("calendars") && (
                        <SidebarNavItem
                          href="/calendars"
                          icon={Calendar}
                          title="Calendars"
                        />
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="my-2 border-t border-sidebar-border/50 p-0" />

                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {canRead("assistant") && (
                        <SidebarNavItem
                          href="/assistant"
                          icon={BotMessageSquare}
                          title="Assistant"
                        />
                      )}
                      {canRead("members") && (
                        <SidebarNavItem
                          href="/members"
                          icon={Users}
                          title="Members"
                        />
                      )}
                      {canRead("workspace") && (
                        <SidebarNavItem
                          href="/settings"
                          icon={Settings}
                          title="Settings"
                        />
                      )}
                      <SidebarNavItem href="/about" icon={Info} title="About" />
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/50 p-2">
            <NavUser />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex h-svh max-h-svh min-h-0 flex-1 flex-col overflow-hidden">
          <Header
            onWorkspaceClick={handleHeaderButtonClick}
            onSearchClick={() => setSearchDialogOpen(true)}
            onAssistantClick={toggleAssistant}
            onJoinClick={() => setJoinDialogOpen(true)}
            isAssistantOpen={isAssistantOpen}
            canAccessAssistant={canRead("assistant")}
          />

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-0">
            {isLoading ? (
              <div className="flex min-h-[60vh] flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-xs">Loading workspace...</span>
                </div>
              </div>
            ) : !hasWorkspaces ? (
              <WorkspaceEmptyState
                onCreateClick={() => setCreateDialogOpen(true)}
              />
            ) : (
              children
            )}
          </main>
        </SidebarInset>

        {canRead("assistant") && <AssistantRightSidebar />}
      </SidebarProvider>

      <SearchCommandDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onOpenWorkspaceDialog={() => setWorkspaceDialogOpen(true)}
      />

      <WorkspaceCommandDialog
        open={workspaceDialogOpen}
        onOpenChange={setWorkspaceDialogOpen}
      />

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <JoinWorkspaceDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
      />

      <AcceptInviteDialog
        code={pendingInviteCode}
        open={acceptDialogOpen}
        onOpenChange={setAcceptDialogOpen}
        onComplete={handleInviteComplete}
      />
    </>
  )
}

export default RootLayout
