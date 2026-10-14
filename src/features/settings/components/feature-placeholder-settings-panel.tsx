import type { LucideIcon } from "lucide-react"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { Separator } from "@/components/ui/separator"

export interface FeaturePlaceholderSettingsPanelProps {
  title: string
  subtitle: string
  icon: LucideIcon
  description?: string
}

export function FeaturePlaceholderSettingsPanel({
  title,
  subtitle,
  icon: Icon,
  description = `There are currently no custom ${title.toLowerCase()} settings configured for this workspace.`,
}: FeaturePlaceholderSettingsPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />
          <Separator orientation="vertical" />
          <Icon className="size-3.5 text-primary" />
          <span className="font-semibold text-xs text-foreground">{title}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Main Full-Width Body with Clean Empty Placeholder State */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="w-full p-4 sm:p-6 pb-16">
          <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground shadow-2xs">
              <Icon className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {title} Settings
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturePlaceholderSettingsPanel
