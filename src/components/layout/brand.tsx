import { Link } from "wouter"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import kaizenLogo from "@/assets/kaizen-logo.svg"

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
        {/* Logo Badge (32x32) */}
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 p-1 shadow-2xs transition-all duration-200 group-hover:border-primary/50 group-hover:bg-sidebar-accent group-hover:shadow-xs group-active:scale-95 overflow-hidden">
          {/* Subtle glowing ambient accent */}
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-primary/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          {/* Kaizen Logo */}
          <img
            src={kaizenLogo}
            alt="Kaizen"
            className="size-full object-contain rounded-sm"
          />
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
