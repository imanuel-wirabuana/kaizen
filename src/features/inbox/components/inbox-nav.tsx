import { ArchiveX, Inbox } from "lucide-react"
import type { ZenboxFolder } from "@/stores/zen-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InboxNavProps {
  activeFolder: ZenboxFolder
  onSelectFolder: (folder: ZenboxFolder) => void
  zenboxCount: number
  archivedCount: number
}

const NAV_ITEMS = [
  {
    id: "zenbox" as const,
    title: "Zenbox",
    icon: Inbox,
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
  zenboxCount,
  archivedCount,
}: InboxNavProps) {
  const getCount = (id: ZenboxFolder) => {
    switch (id) {
      case "zenbox":
        return zenboxCount
      case "archived":
        return archivedCount
    }
  }

  return (
    <Select
      value={activeFolder}
      onValueChange={(val) => {
        if (val) {
          onSelectFolder(val as ZenboxFolder)
        }
      }}
    >
      <SelectTrigger className="h-8 w-full bg-card text-xs">
        <SelectValue>
          {() => {
            const item = NAV_ITEMS.find((n) => n.id === activeFolder)
            if (!item) return "Select folder..."
            const Icon = item.icon
            const count = getCount(item.id)

            return (
              <span className="flex items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-primary" />
                <span className="font-semibold text-foreground">{item.title}</span>
                {count > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                    {count}
                  </span>
                )}
              </span>
            )
          }}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="w-(--anchor-width) min-w-44">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const count = getCount(item.id)

          return (
            <SelectItem key={item.id} value={item.id} className="cursor-pointer pr-7">
              <span className="flex flex-1 items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{item.title}</span>
                {count > 0 && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                    {count}
                  </span>
                )}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export { InboxNav as ZenboxNav }

