import { Link } from "wouter"
import { cn } from "cn"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface BrandProps {
  className?: string
  href?: string
}

export function Brand({ className, href = "/" }: BrandProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg outline-none select-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
              "group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center",
              className
            )}
            aria-label="Kaizen Home"
          />
        }
      >
        {/* Monogram Badge (Iconic 32x32 stacked Kai / Zen tile) */}
        <div className="relative flex size-8 shrink-0 flex-col items-center justify-center rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 shadow-2xs transition-all duration-200 group-hover:border-primary/50 group-hover:bg-sidebar-accent group-hover:shadow-xs group-active:scale-95">
          {/* Subtle glowing ambient accent */}
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-primary/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          {/* Stacked Kai / Zen Monogram */}
          <div className="relative flex flex-col items-center justify-center font-black uppercase leading-[0.82]">
            <span className="text-[9px] tracking-[0.14em] text-foreground/90 transition-colors group-hover:text-foreground">
              KAI
            </span>
            <span className="text-[9px] tracking-[0.14em] text-primary transition-colors group-hover:text-primary">
              ZEN
            </span>
          </div>
        </div>

        {/* Expanded Label (Visible when sidebar is expanded, hidden in collapsed icon mode) */}
        <div className="flex flex-col min-w-0 text-left transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
          <span className="truncate text-xs font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Kaizen
          </span>
          <span className="truncate text-[10px] font-medium text-muted-foreground/80">
            Continuous Growth
          </span>
        </div>
      </TooltipTrigger>

      <TooltipContent side="right" align="center">
        Kaizen
      </TooltipContent>
    </Tooltip>
  )
}

export default Brand
