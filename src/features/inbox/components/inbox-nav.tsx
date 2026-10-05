import { ArchiveX, File, Inbox } from "lucide-react"
import { cn } from "cn"
import type { InboxFolder } from "@/stores/zen-store"

interface InboxNavProps {
  activeFolder: InboxFolder
  onSelectFolder: (folder: InboxFolder) => void
  inboxCount: number
  archivedCount: number
  allCount: number
}

const NAV_ITEMS = [
  {
    id: "inbox" as const,
    title: "Inbox",
    icon: Inbox,
  },
  {
    id: "all" as const,
    title: "All Items",
    icon: File,
  },
  {
    id: "archived" as const,
    title: "Archived",
    icon: ArchiveX,
  },
]

export function InboxNav({
  activeFolder,
  onSelectFolder,
  inboxCount,
  archivedCount,
  allCount,
}: InboxNavProps) {
  const getCount = (id: InboxFolder) => {
    switch (id) {
      case "inbox":
        return inboxCount
      case "archived":
        return archivedCount
      case "all":
        return allCount
    }
  }

  return (
    <div className="flex flex-col gap-1 p-2 w-48 shrink-0 border-r border-border bg-sidebar/50">
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Mailbox
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeFolder === item.id
          const count = getCount(item.id)

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFolder(item.id)}
              className={cn(
                "flex items-center justify-between gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer text-left",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>

              {count > 0 && (
                <span
                  className={cn(
                    "ml-auto text-[10px] rounded-full px-1.5 py-0.2",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground bg-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
