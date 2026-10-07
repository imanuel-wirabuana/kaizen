import { useLocation } from "wouter"
import { useQuery } from "@tanstack/react-query"
import {
  BotMessageSquare,
  Briefcase,
  Calendar as CalendarIcon,
  Home,
  Inbox,
  Info,
  KanbanSquare,
  Moon,
  Settings,
  Sun,
  Users,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useActiveWorkspace } from "@/stores/workspace-store"
import { useTheme } from "@/components/theme-provider"
import { fetchWorkspaceZens } from "@/features/inbox/services/zen-service"
import { zenKeys } from "@/features/inbox/services/zen-keys"
import { fetchWorkspaceBoards } from "@/features/boards/services/board-service"
import { boardKeys } from "@/features/boards/services/board-keys"
import { fetchWorkspaceCalendars } from "@/features/calendar/services/calendar-service"
import { calendarKeys } from "@/features/calendar/services/calendar-keys"

export interface SearchCommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenWorkspaceDialog?: () => void
}

export function SearchCommandDialog({
  open,
  onOpenChange,
  onOpenWorkspaceDialog,
}: SearchCommandDialogProps) {
  const [, setLocation] = useLocation()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id
  const { theme, setTheme } = useTheme()

  // 1. TanStack React Query for asynchronous workspace data (cached with staleTime)
  const { data: zens = [] } = useQuery({
    queryKey: zenKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceZens(workspaceId!),
    enabled: Boolean(open && workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  const { data: boards = [] } = useQuery({
    queryKey: boardKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceBoards(workspaceId!),
    enabled: Boolean(open && workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  const { data: calendars = [] } = useQuery({
    queryKey: calendarKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceCalendars(workspaceId!),
    enabled: Boolean(open && workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  const handleNavigate = (path: string) => {
    onOpenChange(false)
    setLocation(path)
  }

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
    onOpenChange(false)
  }

  const handleOpenWorkspace = () => {
    onOpenChange(false)
    onOpenWorkspaceDialog?.()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search and Command Menu"
      description="Quickly navigate, search tasks, boards, calendars, or trigger actions"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          <CommandItem
            value="Dashboard home overview"
            onSelect={() => handleNavigate("/")}
            className="cursor-pointer"
          >
            <Home className="size-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            value="Zenbox inbox tasks notifications"
            onSelect={() => handleNavigate("/zenbox")}
            className="cursor-pointer"
          >
            <Inbox className="size-4" />
            <span>Zenbox</span>
            <CommandShortcut>G Z</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="Boards kanban sprint tasks"
            onSelect={() => handleNavigate("/boards")}
            className="cursor-pointer"
          >
            <KanbanSquare className="size-4" />
            <span>Boards</span>
          </CommandItem>
          <CommandItem
            value="Calendars schedule events planning"
            onSelect={() => handleNavigate("/calendars")}
            className="cursor-pointer"
          >
            <CalendarIcon className="size-4" />
            <span>Calendars</span>
          </CommandItem>
          <CommandItem
            value="Assistant ai chat bot help"
            onSelect={() => handleNavigate("/assistant")}
            className="cursor-pointer"
          >
            <BotMessageSquare className="size-4" />
            <span>Assistant</span>
          </CommandItem>
          <CommandItem
            value="Members team organization collaborators"
            onSelect={() => handleNavigate("/members")}
            className="cursor-pointer"
          >
            <Users className="size-4" />
            <span>Members</span>
          </CommandItem>
          <CommandItem
            value="Settings preferences workspace account"
            onSelect={() => handleNavigate("/settings")}
            className="cursor-pointer"
          >
            <Settings className="size-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem
            value="About system documentation kaizen"
            onSelect={() => handleNavigate("/about")}
            className="cursor-pointer"
          >
            <Info className="size-4" />
            <span>About</span>
          </CommandItem>
        </CommandGroup>

        {/* Workspace Tasks (Zenbox) */}
        {zens.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Zenbox Tasks">
              {zens.slice(0, 15).map((zen) => {
                const cleanSnippet = zen.description
                  ? zen.description.replace(/<[^>]+>/g, "").slice(0, 80)
                  : ""
                return (
                  <CommandItem
                    key={`zen-${zen.id}`}
                    value={`zen task ${zen.name} ${cleanSnippet}`}
                    onSelect={() => handleNavigate(`/zenbox/${zen.id}`)}
                    className="flex cursor-pointer items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Inbox className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-medium">
                          {zen.name}
                        </span>
                        {cleanSnippet && (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {cleanSnippet}
                          </span>
                        )}
                      </div>
                    </div>
                    {zen.archived_at && (
                      <span className="shrink-0 ml-2 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {/* Boards */}
        {boards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Boards">
              {boards.slice(0, 10).map((board) => (
                <CommandItem
                  key={`board-${board.id}`}
                  value={`board ${board.name} ${board.description || ""}`}
                  onSelect={() => handleNavigate(`/boards/${board.id}`)}
                  className="flex cursor-pointer items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <KanbanSquare className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-medium">
                        {board.name}
                      </span>
                      {board.description && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {board.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Calendars */}
        {calendars.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Calendars">
              {calendars.slice(0, 10).map((calendar) => (
                <CommandItem
                  key={`calendar-${calendar.id}`}
                  value={`calendar ${calendar.name} ${calendar.description || ""}`}
                  onSelect={() => handleNavigate(`/calendars/${calendar.id}`)}
                  className="flex cursor-pointer items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-medium">
                        {calendar.name}
                      </span>
                      {calendar.description && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {calendar.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Actions & Workspaces */}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {onOpenWorkspaceDialog && (
            <CommandItem
              value="switch workspace organization change"
              onSelect={handleOpenWorkspace}
              className="cursor-pointer"
            >
              <Briefcase className="size-4" />
              <span>Switch Workspace</span>
            </CommandItem>
          )}
          <CommandItem
            value="toggle theme dark light mode appearance"
            onSelect={handleToggleTheme}
            className="cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default SearchCommandDialog
