import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation } from "wouter"
import { NavUser } from "@/components/layout/nav-user"
import { Header } from "@/components/layout/header"
import { Brand } from "@/components/layout/brand"
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { WorkspaceCommandDialog } from "@/features/workspaces/components/workspace-command-dialog"
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog"
import { WorkspaceEmptyState } from "@/features/workspaces/components/workspace-empty-state"
import { SearchCommandDialog } from "@/features/search/components/search-command-dialog"
import { AssistantRightSidebar } from "@/features/assistant/components/assistant-right-sidebar"
import { useAssistantStore } from "@/stores/assistant-store"
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
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)

  const isAssistantOpen = useAssistantStore((s) => s.isRightSidebarOpen)
  const toggleAssistant = useAssistantStore((s) => s.toggleRightSidebarOpen)

  const { workspaces, isLoading } = useWorkspaces()

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
                      <SidebarNavItem
                        href="/zenbox"
                        icon={Inbox}
                        title="Zenbox"
                      />
                      <SidebarNavItem
                        href="/boards"
                        icon={KanbanSquare}
                        title="Boards"
                      />
                      <SidebarNavItem
                        href="/calendars"
                        icon={Calendar}
                        title="Calendars"
                      />
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="my-2 border-t border-sidebar-border/50 p-0" />

                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarNavItem
                        href="/assistant"
                        icon={BotMessageSquare}
                        title="Assistant"
                      />
                      <SidebarNavItem
                        href="/members"
                        icon={Users}
                        title="Members"
                      />
                      <SidebarNavItem
                        href="/settings"
                        icon={Settings}
                        title="Settings"
                      />
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
            isAssistantOpen={isAssistantOpen}
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

        <AssistantRightSidebar />
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
    </>
  )
}

export default RootLayout
