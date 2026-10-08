import { Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  BotMessageSquare,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  KanbanSquare,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useActiveWorkspace } from "@/stores/workspace-store"
import { fetchWorkspaceZens } from "@/features/inbox/services/zen-service"
import { zenKeys } from "@/features/inbox/services/zen-keys"
import { fetchWorkspaceBoards } from "@/features/boards/services/board-service"
import { boardKeys } from "@/features/boards/services/board-keys"
import { fetchWorkspaceCalendars } from "@/features/calendar/services/calendar-service"
import { calendarKeys } from "@/features/calendar/services/calendar-keys"

const ACTIVITY_DATA = [
  { day: "Mon", tasks: 4, focusMinutes: 90 },
  { day: "Tue", tasks: 6, focusMinutes: 140 },
  { day: "Wed", tasks: 8, focusMinutes: 180 },
  { day: "Thu", tasks: 5, focusMinutes: 110 },
  { day: "Fri", tasks: 9, focusMinutes: 210 },
  { day: "Sat", tasks: 3, focusMinutes: 60 },
  { day: "Sun", tasks: 7, focusMinutes: 150 },
]

export function DashboardPage() {
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. Live Workspace Data via TanStack React Query
  const { data: zens = [], isLoading: isZensLoading } = useQuery({
    queryKey: zenKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceZens(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  const { data: boards = [] } = useQuery({
    queryKey: boardKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceBoards(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  const { data: calendars = [] } = useQuery({
    queryKey: calendarKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceCalendars(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
  })

  const activeZens = zens.filter((z) => !z.archived_at)
  const archivedZens = zens.filter((z) => Boolean(z.archived_at))
  const totalActive = activeZens.length
  const recentZens = activeZens.slice(0, 4)

  return (
    <div className="flex flex-col gap-6 p-4 w-full">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <Badge
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs font-normal"
            >
              <Flame className="size-3 fill-orange-500 text-orange-500" />
              <span>5 Day Streak</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeWorkspace?.name
              ? `Welcome to ${activeWorkspace.name}. Here is your daily momentum overview.`
              : "Welcome to your Kaizen workspace. Here is your daily momentum overview."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/zenbox"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "gap-1.5",
            })}
          >
            <Inbox className="size-3.5" />
            <span>Open Zenbox</span>
          </Link>
          <Link
            href="/assistant"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5",
            })}
          >
            <BotMessageSquare className="size-3.5" />
            <span>AI Co-pilot</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Zenbox Items */}
        <Link href="/zenbox" className="group">
          <Card className="flex h-full flex-col gap-2 p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Zenbox Items</span>
              <div className="rounded-md bg-muted p-1.5 text-primary transition-colors group-hover:bg-primary/10">
                <Inbox className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight">
                {totalActive}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {archivedZens.length} archived
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3" />
              <span>Live sync enabled</span>
            </div>
          </Card>
        </Link>

        {/* Active Boards */}
        <Link href="/boards" className="group">
          <Card className="flex h-full flex-col gap-2 p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Sprint Boards</span>
              <div className="rounded-md bg-muted p-1.5 text-primary transition-colors group-hover:bg-primary/10">
                <KanbanSquare className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight">
                {boards.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {boards.length > 0 ? `${boards.length} active` : "0 active"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>Kanban workflows</span>
            </div>
          </Card>
        </Link>

        {/* Calendars */}
        <Link href="/calendars" className="group">
          <Card className="flex h-full flex-col gap-2 p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Calendars</span>
              <div className="rounded-md bg-muted p-1.5 text-primary transition-colors group-hover:bg-primary/10">
                <CalendarIcon className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight">
                {calendars.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {calendars.length > 0 ? "Timeline active" : "None scheduled"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-primary">
              <Clock className="size-3" />
              <span>Schedule synced</span>
            </div>
          </Card>
        </Link>

        {/* AI Momentum */}
        <Link href="/assistant" className="group">
          <Card className="flex h-full flex-col gap-2 p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Continuous Momentum</span>
              <div className="rounded-md bg-muted p-1.5 text-primary transition-colors group-hover:bg-primary/10">
                <Sparkles className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight">+1%</span>
              <span className="text-[11px] text-muted-foreground">
                Compounding
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="font-medium text-primary">37x</span>
              <span>annual growth goal</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Weekly Momentum Chart & Quick Access */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Momentum Chart & Recent Tasks */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Weekly Productivity Momentum Chart */}
          <Card className="flex flex-col gap-4 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Focus & Execution Momentum
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Daily completed micro-tasks and focus minutes over the last 7
                  days.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                This Week
              </Badge>
            </div>

            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ACTIVITY_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="focusGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-foreground)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="focusMinutes"
                    name="Focus (mins)"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#focusGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Workspace Tasks (Quick Triage) */}
          <Card className="flex flex-col gap-3 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Recent Zenbox Tasks</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Latest items ready for triage or completion.
                </p>
              </div>
              <Link
                href="/zenbox"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>View all</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {isZensLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading tasks...
              </div>
            ) : recentZens.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                <Inbox className="mb-2 size-6 text-muted-foreground/60" />
                <p className="text-xs font-medium">No tasks in zenbox</p>
                <p className="mt-0.5 mb-3 text-[11px] text-muted-foreground">
                  Capture your thoughts, ideas, or action items.
                </p>
                <Link
                  href="/zenbox"
                  className={buttonVariants({
                    variant: "outline",
                    size: "xs",
                    className: "gap-1",
                  })}
                >
                  <Plus className="size-3" />
                  <span>Create Item</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentZens.map((zen) => {
                  const snippet = zen.description
                    ? zen.description.replace(/<[^>]+>/g, "").slice(0, 80)
                    : "No description provided"
                  return (
                    <Link
                      key={zen.id}
                      href={`/zenbox/${zen.id}`}
                      className="group flex items-center justify-between rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-colors hover:bg-muted/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-md bg-muted p-1.5 text-primary">
                          <Inbox className="size-3.5" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-xs font-semibold transition-colors group-hover:text-primary">
                            {zen.name}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            {snippet}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="ml-2 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): Quick Navigation & Kaizen Insight */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <h3 className="px-1 text-sm font-semibold">Quick Navigation</h3>

          <div className="flex flex-col gap-2">
            <Link
              href="/zenbox"
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-2xs transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2 text-primary transition-colors group-hover:bg-primary/10">
                  <Inbox className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Triage Zenbox</span>
                  <span className="text-[11px] text-muted-foreground">
                    Capture and organize incoming items
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/boards"
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-2xs transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2 text-primary transition-colors group-hover:bg-primary/10">
                  <KanbanSquare className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Sprint Boards</span>
                  <span className="text-[11px] text-muted-foreground">
                    Review task workflows and progress
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/calendars"
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-2xs transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2 text-primary transition-colors group-hover:bg-primary/10">
                  <CalendarIcon className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">
                    Calendars & Schedule
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    View upcoming events & blocks
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/assistant"
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-2xs transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2 text-primary transition-colors group-hover:bg-primary/10">
                  <BotMessageSquare className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">AI Assistant</span>
                  <span className="text-[11px] text-muted-foreground">
                    Get productivity co-pilot guidance
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Kaizen Philosophy Card */}
          <Card className="flex flex-col gap-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Kaizen Principle (改善)</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              &ldquo;Small daily disciplines compound over time into monumental
              achievements. Improve 1% today.&rdquo;
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
