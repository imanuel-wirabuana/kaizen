import { useState } from "react"
import { Link } from "wouter"
import {
  BookOpenText,
  Calendar,
  Inbox,
  KanbanSquare,
  Search as SearchIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { useInboxZens } from "@/features/inbox/hooks/use-inbox-zens"

interface SearchResult {
  id: string
  title: string
  type: "zenbox" | "inbox" | "board" | "note" | "calendar"
  snippet: string
  link: string
  time: string
}

const SEARCH_DATABASE: SearchResult[] = [
  {
    id: "s1",
    title: "Review quarterly sprint goals and backlog priorities",
    type: "zenbox",
    snippet: "High priority zenbox task for upcoming quarter milestones.",
    link: "/zenbox",
    time: "Today",
  },
  {
    id: "s2",
    title: "Implement auth token refresh interceptor",
    type: "board",
    snippet: "Sprint task in To Do column for Clerk token handling.",
    link: "/board",
    time: "Sprint 4",
  },
  {
    id: "s3",
    title: "Kaizen Philosophy: The 1% Rule",
    type: "note",
    snippet: "Improving by 1% every day results in a 37x improvement over a year.",
    link: "/note",
    time: "Today",
  },
  {
    id: "s4",
    title: "Kaizen Daily Standup & Planning",
    type: "calendar",
    snippet: "Recurring 30m team focus block and agenda.",
    link: "/calendar",
    time: "09:30 AM",
  },
  {
    id: "s5",
    title: "System Architecture & Routing RFC",
    type: "note",
    snippet: "Migration to Wouter with ~1.5kB bundle size and declarative routing.",
    link: "/note",
    time: "Yesterday",
  },
]

export function SearchPage() {
  const [query, setQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const { zens } = useInboxZens()

  const liveZenResults: SearchResult[] = zens.map((z) => ({
    id: `zen-${z.id}`,
    title: z.name,
    type: "zenbox",
    snippet: z.description
      ? z.description.replace(/<[^>]+>/g, "").slice(0, 100)
      : "Zenbox item in active workspace",
    link: `/zenbox/${z.id}`,
    time: "Live item",
  }))

  const allItems = [...liveZenResults, ...SEARCH_DATABASE]

  const filteredResults = allItems.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.snippet.toLowerCase().includes(query.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    return matchesQuery && matchesType
  })

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Quickly locate tasks, notes, calendar events, and knowledge across your workspace.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything across Kaizen (e.g. tasks, 1% rule, sprint, calendar)..."
          className="pl-10 h-11 text-sm bg-card"
          autoFocus
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filterType === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          All Results
        </button>
        <button
          type="button"
          onClick={() => setFilterType("zenbox")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filterType === "zenbox"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Zenbox
        </button>
        <button
          type="button"
          onClick={() => setFilterType("board")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filterType === "board"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Board
        </button>
        <button
          type="button"
          onClick={() => setFilterType("note")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filterType === "note"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Notes
        </button>
        <button
          type="button"
          onClick={() => setFilterType("calendar")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filterType === "calendar"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          Calendar
        </button>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-2.5">
        {filteredResults.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <SearchIcon className="size-8 text-muted-foreground/60 mb-2" />
            <h3 className="font-semibold text-sm">No results found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try searching with different keywords or clearing the category filter.
            </p>
          </Card>
        ) : (
          filteredResults.map((result) => (
            <Link
              key={result.id}
              href={result.link}
              className="flex items-start justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 transition-colors shadow-2xs group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-muted text-primary shrink-0 mt-0.5">
                  {(result.type === "zenbox" || result.type === "inbox") && <Inbox className="size-4" />}
                  {result.type === "board" && <KanbanSquare className="size-4" />}
                  {result.type === "note" && <BookOpenText className="size-4" />}
                  {result.type === "calendar" && <Calendar className="size-4" />}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {result.title}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
                    {result.snippet}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {result.type}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{result.time}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default SearchPage
