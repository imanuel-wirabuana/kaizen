import { Sparkles, Layers, ShieldCheck, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AboutPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">About Kaizen</h1>
        <p className="text-sm text-muted-foreground">
          Continuous improvement through small, compounding positive changes.
        </p>
      </div>

      {/* Philosophy Card */}
      <Card className="p-6 flex flex-col gap-3 bg-gradient-to-br from-card to-muted/30 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
            <Sparkles className="size-4" />
          </div>
          <h3 className="font-semibold text-base">The Kaizen Philosophy</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          &ldquo;Kaizen&rdquo; (改善) is the Japanese concept of continuous improvement. By focusing on small,
          consistent daily actions rather than overwhelming overhauls, massive compound growth becomes inevitable.
        </p>
      </Card>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-muted text-primary">
            <Zap className="size-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs">Inbox & Daily Triage</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quickly capture tasks, ideas, and reminders without friction.
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-muted text-primary">
            <Layers className="size-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs">Kanban Sprint Boards</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualize work across stages and eliminate bottlenecks.
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-muted text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs">Clerk Authentication</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Secure enterprise-grade user management and sessions.
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-md bg-muted text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs">Kaizen AI Assistant</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Intelligent daily coaching and goal breakdown.
            </p>
          </div>
        </Card>
      </div>

      {/* Tech Stack Info */}
      <Card className="p-5 flex flex-col gap-3 shadow-2xs">
        <h3 className="text-sm font-semibold">Technical Stack</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">React 19</Badge>
          <Badge variant="secondary">Vite 8</Badge>
          <Badge variant="secondary">Wouter</Badge>
          <Badge variant="secondary">Tailwind CSS v4</Badge>
          <Badge variant="secondary">shadcn / Base UI</Badge>
          <Badge variant="secondary">Clerk Auth</Badge>
        </div>
      </Card>
    </div>
  )
}

export default AboutPage
