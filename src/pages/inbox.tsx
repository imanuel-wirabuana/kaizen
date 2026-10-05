import { useState } from "react"
import {
  CheckCircle2,
  Circle,
  Clock,
  Inbox as InboxIcon,
  Plus,
  Search,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface InboxItem {
  id: string
  title: string
  category: "task" | "idea" | "reminder"
  priority: "high" | "medium" | "low"
  time: string
  completed: boolean
  starred: boolean
}

const INITIAL_ITEMS: InboxItem[] = [
  {
    id: "1",
    title: "Review quarterly sprint goals and backlog priorities",
    category: "task",
    priority: "high",
    time: "Today, 10:00 AM",
    completed: false,
    starred: true,
  },
  {
    id: "2",
    title: "Document new design tokens in Tailwind configuration",
    category: "task",
    priority: "medium",
    time: "Today, 2:30 PM",
    completed: false,
    starred: false,
  },
  {
    id: "3",
    title: "Idea: Introduce automated habit tracking streaks",
    category: "idea",
    priority: "low",
    time: "Yesterday",
    completed: false,
    starred: true,
  },
  {
    id: "4",
    title: "Weekly team retrospective & workflow optimization",
    category: "reminder",
    priority: "medium",
    time: "Oct 8, 9:00 AM",
    completed: true,
    starred: false,
  },
]

export function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>(INITIAL_ITEMS)
  const [filter, setFilter] = useState<"all" | "pending" | "starred">("all")
  const [search, setSearch] = useState("")

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const toggleStar = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    )
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === "pending") return !item.completed
    if (filter === "starred") return item.starred
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Capture, organize, and triage your incoming thoughts and tasks.
          </p>
        </div>

        <Button className="gap-2 self-start sm:self-auto">
          <Plus className="size-4" />
          <span>New Item</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search inbox..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="xs"
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            All ({items.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "ghost"}
            size="xs"
            onClick={() => setFilter("pending")}
            className="text-xs"
          >
            Active ({items.filter((i) => !i.completed).length})
          </Button>
          <Button
            variant={filter === "starred" ? "default" : "ghost"}
            size="xs"
            onClick={() => setFilter("starred")}
            className="text-xs"
          >
            Starred ({items.filter((i) => i.starred).length})
          </Button>
        </div>
      </div>

      {/* Item List */}
      <div className="flex flex-col gap-2">
        {filteredItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <InboxIcon className="size-8 text-muted-foreground/60 mb-3" />
            <h3 className="font-semibold text-sm">No items found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your inbox is clear or no items matched your filter.
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`flex items-center justify-between p-3.5 transition-all hover:shadow-xs ${
                item.completed ? "opacity-60 bg-muted/20" : "bg-card"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleComplete(item.id)}
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {item.completed ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-medium leading-snug truncate ${
                      item.completed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {item.time}
                    </span>
                    <span>&bull;</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 capitalize">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  type="button"
                  onClick={() => toggleStar(item.id)}
                  className="text-muted-foreground hover:text-yellow-500 transition-colors"
                >
                  <Star
                    className={`size-4 ${
                      item.starred ? "fill-yellow-500 text-yellow-500" : ""
                    }`}
                  />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default InboxPage
