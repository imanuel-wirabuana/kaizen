import { useState, type ReactNode } from "react"
import { PanelLeftIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

export interface PageSidebarRenderProps {
  open: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  isCollapsed: boolean
  collapse: () => void
  expand: () => void
}

export interface PageSidebarLayoutProps {
  sidebar: ReactNode | ((props: PageSidebarRenderProps) => ReactNode)
  children: ReactNode | ((props: PageSidebarRenderProps) => ReactNode)
  defaultOpen?: boolean
  defaultCollapsed?: boolean
  open?: boolean
  isCollapsed?: boolean
  onOpenChange?: (open: boolean) => void
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
  sidebarClassName?: string
}

export function PageSidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        setOpen(!open)
        if (isMobile) {
          setOpenMobile(!openMobile)
        }
      }}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function PageSidebarLayoutInner({
  sidebar,
  children,
  sidebarClassName,
}: {
  sidebar: ReactNode | ((props: PageSidebarRenderProps) => ReactNode)
  children: ReactNode | ((props: PageSidebarRenderProps) => ReactNode)
  sidebarClassName?: string
}) {
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar()

  const toggle = () => {
    setOpen(!open)
    if (isMobile) {
      setOpenMobile(!openMobile)
    }
  }

  const renderProps: PageSidebarRenderProps = {
    open,
    toggle,
    setOpen,
    isCollapsed: !open,
    collapse: () => setOpen(false),
    expand: () => setOpen(true),
  }

  return (
    <div className="flex size-full flex-1 overflow-hidden">
      {/* Collapsible Page Sidebar */}
      <Sidebar
        collapsible="none"
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-border bg-sidebar/20 transition-all duration-200 ease-in-out",
          open
            ? "opacity-100"
            : "pointer-events-none w-0 overflow-hidden border-r-0 opacity-0",
          sidebarClassName
        )}
      >
        {typeof sidebar === "function" ? sidebar(renderProps) : sidebar}
      </Sidebar>

      {/* Main Content Area */}
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-card">
        {typeof children === "function" ? children(renderProps) : children}
      </main>
    </div>
  )
}

export function PageSidebarLayout({
  sidebar,
  children,
  defaultOpen = true,
  defaultCollapsed,
  open: controlledOpen,
  isCollapsed,
  onOpenChange,
  onCollapsedChange,
  className,
  sidebarClassName,
}: PageSidebarLayoutProps) {
  const resolvedDefaultOpen =
    defaultCollapsed !== undefined ? !defaultCollapsed : defaultOpen
  const isControlled =
    controlledOpen !== undefined || isCollapsed !== undefined

  const [uncontrolledOpen, setUncontrolledOpen] = useState(resolvedDefaultOpen)
  const open = isControlled
    ? (isCollapsed !== undefined ? !isCollapsed : controlledOpen!)
    : uncontrolledOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
    onCollapsedChange?.(!nextOpen)
  }

  return (
    <SidebarProvider
      open={open}
      onOpenChange={handleOpenChange}
      className={cn(
        "flex h-[calc(100vh-4.25rem)] min-h-0 w-full flex-1 overflow-hidden border border-border bg-card shadow-xs",
        className
      )}
    >
      <PageSidebarLayoutInner
        sidebar={sidebar}
        sidebarClassName={sidebarClassName}
      >
        {children}
      </PageSidebarLayoutInner>
    </SidebarProvider>
  )
}

export { PageSidebarTrigger as SidebarTrigger }
export default PageSidebarLayout
