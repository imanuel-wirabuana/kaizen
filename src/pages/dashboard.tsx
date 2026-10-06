import { Link } from "wouter"
import {
  ArrowRight,
  BookOpenText,
  BotMessageSquare,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  KanbanSquare,
  Sparkles,
  TrendingUp,
  Zap,
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
  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-normal">
              <Flame className="size-3 text-orange-500 fill-orange-500" />
              <span>5 Day Streak</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Welcome to your Kaizen workspace. Here is your daily momentum overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/zenbox" className={buttonVariants({ variant: "default", size: "sm", className: "gap-1.5" })}>
            <Inbox className="size-3.5" />
            <span>Open Zenbox</span>
          </Link>
          <Link href="/assistant" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}>
            <BotMessageSquare className="size-3.5" />
            <span>AI Co-pilot</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-2 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Zenbox Items</span>
            <div className="p-1.5 rounded-md bg-muted text-primary">
              <Inbox className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">4</span>
            <span className="text-[11px] text-muted-foreground">3 uncompleted</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+2 captured today</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Sprint Tasks</span>
            <div className="p-1.5 rounded-md bg-muted text-primary">
              <KanbanSquare className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">6</span>
            <span className="text-[11px] text-muted-foreground">2 in progress</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            <span>2 done this week</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Today's Focus</span>
            <div className="p-1.5 rounded-md bg-muted text-primary">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">3.5h</span>
            <span className="text-[11px] text-muted-foreground">Goal: 4h</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-primary">
            <Zap className="size-3" />
            <span>Next: Architecture RFC</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Notes & Knowledge</span>
            <div className="p-1.5 rounded-md bg-muted text-primary">
              <BookOpenText className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">12</span>
            <span className="text-[11px] text-muted-foreground">3 updated</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            <span>1% daily rule logged</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Weekly Momentum Chart & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Weekly Productivity Momentum Chart */}
        <Card className="lg:col-span-8 p-5 flex flex-col gap-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Focus & Execution Momentum</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily completed micro-tasks and focus minutes over the last 7 days.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              This Week
            </Badge>
          </div>

          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} className="text-primary" />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} className="text-primary" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="focusMinutes"
                  name="Focus (mins)"
                  stroke="currentColor"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#focusGradient)"
                  className="text-primary"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Launch & Suggested Actions */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h3 className="font-semibold text-sm px-1">Quick Navigation</h3>

          <div className="flex flex-col gap-2">
            <Link
              href="/zenbox"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted text-primary">
                  <Inbox className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Triage Zenbox</span>
                  <span className="text-[11px] text-muted-foreground">Capture and organize incoming items in zenbox</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/board"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted text-primary">
                  <KanbanSquare className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Sprint Board</span>
                  <span className="text-[11px] text-muted-foreground">Review task workflows and progress</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/calendar"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted text-primary">
                  <Calendar className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Schedule</span>
                  <span className="text-[11px] text-muted-foreground">View upcoming events & blocks</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/note"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted text-primary">
                  <BookOpenText className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Daily Notes</span>
                  <span className="text-[11px] text-muted-foreground">Write reflections and knowledge</span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
