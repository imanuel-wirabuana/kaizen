import { useState } from "react"
import { Plus, MoreHorizontal, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  tag: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To Do",
    tasks: [
      {
        id: "t1",
        title: "Implement auth token refresh interceptor",
        tag: "Backend",
        priority: "High",
        dueDate: "Today",
      },
      {
        id: "t2",
        title: "Draft Kaizen user onboarding checklist",
        tag: "Product",
        priority: "Medium",
        dueDate: "Tomorrow",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    tasks: [
      {
        id: "t3",
        title: "Design responsive sidebar navigation for desktop and tablet",
        tag: "Design",
        priority: "High",
        dueDate: "Oct 6",
      },
      {
        id: "t4",
        title: "Add dark mode shader palette for gradient waves",
        tag: "Frontend",
        priority: "Low",
        dueDate: "Oct 7",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: "t5",
        title: "Setup Clerk authentication and theme provider",
        tag: "Security",
        priority: "High",
        dueDate: "Yesterday",
      },
      {
        id: "t6",
        title: "Configure Tailwind CSS v4 design tokens",
        tag: "Core",
        priority: "Medium",
        dueDate: "Oct 4",
      },
    ],
  },
]

export function BoardPage() {
  const [columns] = useState<Column[]>(INITIAL_COLUMNS)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-sm text-muted-foreground">
            Manage your sprint tasks and visualize your work in progress.
          </p>
        </div>

        <Button className="gap-2 self-start sm:self-auto">
          <Plus className="size-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">
                  {column.title}
                </h3>
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
                  {column.tasks.length}
                </span>
              </div>
              <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {column.tasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-3.5 bg-card hover:border-border transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <span className="text-xs font-medium leading-snug block mb-2 text-foreground">
                    {task.title}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1.5 font-normal">
                      {task.tag}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px]">
                      <Clock className="size-3" />
                      <span>{task.dueDate}</span>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60"
              >
                <Plus className="size-3.5 mr-1" />
                Add card
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BoardPage
