import { useState } from "react"
import { Link } from "wouter"
import {
  Sparkles,
  Layers,
  Zap,
  Command,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export function AboutPage() {
  const [days, setDays] = useState(365)

  // Compound growth calculations
  const compoundGood = Math.pow(1.01, days).toFixed(2)
  const compoundNeutral = Math.pow(1.0, days).toFixed(2)
  const compoundBad = Math.pow(0.99, days).toFixed(2)

  return (
    <div className="flex flex-col gap-6 w-full p-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">About Kaizen</h1>
          <Badge variant="secondary" className="gap-1 text-xs py-0.5 px-2 font-normal">
            <Sparkles className="size-3 text-primary" />
            <span>改善</span>
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Continuous improvement through atomic, compounding positive actions.
        </p>
      </div>

      {/* Philosophy Card */}
      <Card className="p-6 flex flex-col gap-3 bg-gradient-to-br from-card to-muted/30 shadow-2xs border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
            1%
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">The 1% Rule of Kaizen</h3>
            <p className="text-xs text-muted-foreground">Japanese philosophy of continuous compounding growth</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          &ldquo;Kaizen&rdquo; (改善) posits that greatness is not born from radical, abrupt shifts, but
          through small, systematic daily habits. Getting 1% better every day yields compounding returns
          that result in a transformative 37x improvement over the course of a year.
        </p>
      </Card>

      {/* Interactive 1% Compounding Calculator */}
      <Card className="p-5 flex flex-col gap-4 shadow-2xs border-border/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Interactive Compound Growth Simulator</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulate compound outcomes over time based on daily habits.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  days === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* +1% daily */}
          <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-semibold">+1% Daily (1.01)</span>
              <TrendingUp className="size-4" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {compoundGood}x
            </span>
            <span className="text-[10px] text-muted-foreground">
              Compounded improvement after {days} days
            </span>
          </div>

          {/* 0% daily */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">0% (Status Quo)</span>
              <Minus className="size-4" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {compoundNeutral}x
            </span>
            <span className="text-[10px] text-muted-foreground">
              No change after {days} days
            </span>
          </div>

          {/* -1% daily */}
          <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-destructive">
              <span className="text-xs font-semibold">-1% Daily (0.99)</span>
              <TrendingDown className="size-4" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-destructive">
              {compoundBad}x
            </span>
            <span className="text-[10px] text-muted-foreground">
              Decline after {days} days
            </span>
          </div>
        </div>
      </Card>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/zenbox" className="group">
          <Card className="p-4 flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors h-full">
            <div className="p-2 rounded-md bg-muted text-primary group-hover:bg-primary/10 transition-colors">
              <Zap className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-semibold text-xs group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Zenbox & Daily Triage</span>
                <ArrowRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quickly capture tasks, ideas, and reminders with zero friction.
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/boards" className="group">
          <Card className="p-4 flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors h-full">
            <div className="p-2 rounded-md bg-muted text-primary group-hover:bg-primary/10 transition-colors">
              <Layers className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-semibold text-xs group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Kanban Sprint Boards</span>
                <ArrowRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visualize sprint workflows and eliminate delivery bottlenecks.
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/assistant" className="group">
          <Card className="p-4 flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors h-full">
            <div className="p-2 rounded-md bg-muted text-primary group-hover:bg-primary/10 transition-colors">
              <Sparkles className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-semibold text-xs group-hover:text-primary transition-colors flex items-center justify-between">
                <span>AI Productivity Co-pilot</span>
                <ArrowRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Context-aware coaching to break down complex goals into micro-actions.
              </p>
            </div>
          </Card>
        </Link>

        <Card className="p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-muted text-primary">
            <Command className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-semibold text-xs flex items-center gap-1.5">
              <span>Command Palette</span>
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[9px] text-muted-foreground">⌘K</kbd>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant keyboard navigation across workspaces, tasks, and actions.
            </p>
          </div>
        </Card>
      </div>

      {/* Tech Stack Info */}
      <Card className="p-5 flex flex-col gap-3 shadow-2xs border-border/80">
        <h3 className="text-sm font-semibold">Technical Architecture</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">React 19</Badge>
          <Badge variant="secondary">TanStack React Query</Badge>
          <Badge variant="secondary">Zustand</Badge>
          <Badge variant="secondary">Tailwind CSS v4 (OKLCH)</Badge>
          <Badge variant="secondary">Clerk Auth</Badge>
          <Badge variant="secondary">Supabase Realtime</Badge>
          <Badge variant="secondary">Wouter</Badge>
          <Badge variant="secondary">cmdk</Badge>
        </div>
      </Card>

      {/* Back to Home CTA */}
      <div className="flex justify-start">
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default AboutPage
