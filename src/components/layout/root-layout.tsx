import { useState, type ReactNode } from "react"
import { Link, useLocation } from "wouter"
import { NavUser } from "@/components/layout/nav-user"
import { Header } from "@/components/layout/header"
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces"
import { WorkspaceCommandDialog } from "@/features/workspaces/components/workspace-command-dialog"
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog"
import { WorkspaceEmptyState } from "@/features/workspaces/components/workspace-empty-state"
import {
  BotMessageSquare,
  Calendar,
  Home,
  Inbox,
  Info,
  KanbanSquare,
  Loader2,
  Plus,
  Search,
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

  const { workspaces, activeWorkspace, isLoading } = useWorkspaces()

  const hasWorkspaces = workspaces.length > 0
  const workspaceInitial = activeWorkspace?.name
    ? activeWorkspace.name.charAt(0).toUpperCase()
    : "W"

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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleHeaderButtonClick}
                  tooltip={
                    hasWorkspaces
                      ? `Workspace: ${activeWorkspace?.name}`
                      : "Create Workspace"
                  }
                  className="cursor-pointer justify-center bg-accent ring-1"
                >
                  {hasWorkspaces ? (
                    <span className="text-md font-bold text-primary">
                      {workspaceInitial}
                    </span>
                  ) : (
                    <Plus className="size-4 text-primary" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="p-2">
            {hasWorkspaces && (
              <>
                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarNavItem href="/" icon={Home} title="Dashboard" />
                      <SidebarNavItem
                        href="/search"
                        icon={Search}
                        title="Search"
                      />
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
          <Header onWorkspaceClick={handleHeaderButtonClick} />

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
      </SidebarProvider>

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
