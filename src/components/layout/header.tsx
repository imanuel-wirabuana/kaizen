import type { ComponentProps } from "react"
import { useLocation } from "wouter"
import { Bot, ChevronDown, Search, UserPlus } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useWorkspaceStore, useActiveWorkspace } from "@/stores/workspace-store"

export interface HeaderProps extends ComponentProps<"header"> {
  /** Optional custom workspace name override */
  workspaceName?: string
  /** Callback triggered when clicking the workspace section */
  onWorkspaceClick?: () => void
  /** Callback triggered when clicking the search button; defaults to navigating to /search */
  onSearchClick?: () => void
  /** Callback triggered when clicking the assistant button */
  onAssistantClick?: () => void
  /** Callback triggered when clicking the join workspace button */
  onJoinClick?: () => void
  /** Whether the assistant right sidebar is currently open */
  isAssistantOpen?: boolean
  /** Whether user can access assistant */
  canAccessAssistant?: boolean
}

export function Header({
  className,
  workspaceName,
  onWorkspaceClick,
  onSearchClick,
  onAssistantClick,
  onJoinClick,
  isAssistantOpen = false,
  canAccessAssistant = true,
  children,
  ...props
}: HeaderProps) {
  const [, setLocation] = useLocation()
  const activeWorkspace = useActiveWorkspace()
  const hasWorkspaces = useWorkspaceStore(
    (state) => state.workspaces.length > 0
  )

  const resolvedWorkspaceName =
    workspaceName !== undefined
      ? workspaceName
      : hasWorkspaces && activeWorkspace?.name
        ? activeWorkspace.name
        : "None"

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick()
    } else {
      setLocation("/search")
    }
  }

  return (
    <header
      className={cn(
        "relative sticky top-0 z-50 flex h-7 shrink-0 items-center justify-between border-b border-border bg-sidebar px-2.5 text-xs text-muted-foreground select-none",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {/* Left: Workspace */}
          <div className="flex min-w-0 items-center gap-1">
            <span className="shrink-0 font-medium text-muted-foreground/80">
              Workspace:
            </span>
            {onWorkspaceClick ? (
              <button
                type="button"
                onClick={onWorkspaceClick}
                className="group inline-flex max-w-[160px] cursor-pointer items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:max-w-[220px]"
                title={`Current workspace: ${resolvedWorkspaceName}`}
              >
                <span className="truncate">{resolvedWorkspaceName}</span>
                <ChevronDown className="size-3 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:text-foreground" />
              </button>
            ) : (
              <span
                className="max-w-[160px] truncate text-xs font-semibold text-foreground sm:max-w-[220px]"
                title={resolvedWorkspaceName}
              >
                {resolvedWorkspaceName}
              </span>
            )}
          </div>

          {/* Middle: Brand Title (Optically centered) */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold tracking-tight text-foreground/90">
            Kaizen
          </div>

          {/* Right: Join Workspace, Search & Assistant buttons */}
          <div className="flex shrink-0 items-center justify-end gap-1">
            {onJoinClick && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onJoinClick}
                className="cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Join Workspace with Code"
                aria-label="Join Workspace with Code"
              >
                <UserPlus className="size-3.5" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleSearchClick}
              className="cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Search (⌘K)"
              aria-label="Search (⌘K)"
            >
              <Search className="size-3.5" />
            </Button>

            {onAssistantClick && canAccessAssistant && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onAssistantClick}
                className={cn(
                  "cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground",
                  isAssistantOpen && "bg-accent font-medium text-primary"
                )}
                title="AI Assistant"
                aria-label="Toggle AI Assistant"
              >
                <Bot className="size-3.5" />
              </Button>
            )}
          </div>
        </>
      )}
    </header>
  )
}

export default Header
