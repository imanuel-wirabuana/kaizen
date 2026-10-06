import { Inbox, CheckCircle2 } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface InboxEmptyStateProps {
  isSearch: boolean
}

export function InboxEmptyState({ isSearch }: InboxEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Empty className="max-w-sm border border-dashed border-border/80 bg-card/40 p-8 shadow-xs">
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-xl bg-primary/10 text-primary"
        >
          {isSearch ? (
            <Inbox className="size-6 text-muted-foreground" />
          ) : (
            <CheckCircle2 className="size-6 text-primary" />
          )}
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-base font-semibold">
            {isSearch ? "No items found" : "Zenbox Zero"}
          </EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground text-balance">
            {isSearch
              ? "No items match your search query. Try typing something else."
              : "All caught up! Use the quick capture above to collect thoughts, notes, and items."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
