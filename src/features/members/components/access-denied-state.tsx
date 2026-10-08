import { Link } from "wouter"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"

export interface AccessDeniedStateProps {
  resource: string
  action?: string
  description?: string
}

export function AccessDeniedState({
  resource,
  action = "view",
  description,
}: AccessDeniedStateProps) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-1 items-center justify-center p-6">
      <Empty className="max-w-md border border-dashed border-border/80 bg-card/50 p-8 shadow-xs">
        <EmptyMedia variant="icon" className="size-12 rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-base font-semibold">Access Restricted</EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground mt-1">
            {description ||
              `You do not have permission to ${action} ${resource} in this workspace. Please contact the workspace owner to request access.`}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-4 flex flex-row items-center gap-2">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="gap-2 text-xs cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Go to Dashboard</span>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
