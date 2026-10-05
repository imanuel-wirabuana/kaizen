import { Building2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface WorkspaceEmptyStateProps {
  onCreateClick: () => void
}

export function WorkspaceEmptyState({ onCreateClick }: WorkspaceEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[70vh]">
      <Empty className="max-w-md border border-dashed border-border bg-card/50 p-8 shadow-xs">
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-xl bg-primary/10 text-primary"
        >
          <Building2 className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-base font-semibold">
            No workspace found
          </EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground text-balance">
            You don&apos;t have any workspaces yet. Create your first workspace to
            start organizing boards, calendars, and team tasks.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-2">
          <Button
            onClick={onCreateClick}
            size="sm"
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            Create Workspace
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
