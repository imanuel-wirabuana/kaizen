import { useState, useRef, useEffect } from "react"
import { useSortable } from "@dnd-kit/react/sortable"
import { CollisionPriority } from "@dnd-kit/abstract"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  PlusCircle,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BoardTaskCard } from "@/features/boards/components/board-task-card"
import { cn } from "cn"
import type { Lane } from "@/types/lane"
import type { TaskWithZen } from "@/types/task"

export interface BoardLaneProps {
  lane: Lane
  index: number
  taskIds: number[]
  tasksMap: Map<number, TaskWithZen>
  onAddZen: (
    laneId: number,
    title: string,
    description?: string
  ) => Promise<unknown>
  onRenameLane: (laneId: number, name: string) => Promise<unknown>
  onDeleteLane: (laneId: number) => Promise<unknown>
  onDeleteZen: (taskId: number, zenId: number) => Promise<unknown>
}

export function BoardLane({
  lane,
  index,
  taskIds,
  tasksMap,
  onAddZen,
  onRenameLane,
  onDeleteLane,
  onDeleteZen,
}: BoardLaneProps) {
  // 1. Sortable and Droppable column hook from @dnd-kit/react/sortable
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: String(lane.id),
    index,
    type: "column",
    collisionPriority: CollisionPriority.Low,
    accept: ["item", "column"],
  })

  // 2. Inline Lane Rename State
  const [isEditingName, setIsEditingName] = useState(false)
  const [laneName, setLaneName] = useState(lane.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLaneName(lane.name)
  }, [lane.name])

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [isEditingName])

  const handleSaveName = async () => {
    const trimmed = laneName.trim()
    if (!trimmed || trimmed === lane.name) {
      setIsEditingName(false)
      setLaneName(lane.name)
      return
    }
    await onRenameLane(lane.id, trimmed)
    setIsEditingName(false)
  }

  // 3. Inline Quick Zen Creation State
  const [isAddingZen, setIsAddingZen] = useState(false)
  const [newZenTitle, setNewZenTitle] = useState("")
  const [newZenDescription, setNewZenDescription] = useState("")
  const [isSubmittingZen, setIsSubmittingZen] = useState(false)

  const handleCreateZen = async () => {
    const trimmed = newZenTitle.trim()
    if (!trimmed || isSubmittingZen) return
    try {
      setIsSubmittingZen(true)
      await onAddZen(lane.id, trimmed, newZenDescription.trim() || undefined)
      setNewZenTitle("")
      setNewZenDescription("")
      setIsAddingZen(false)
    } finally {
      setIsSubmittingZen(false)
    }
  }

  const zensCount = taskIds.length

  return (
    <Card
      ref={ref}
      data-dragging={isDragging}
      className={cn(
        "h-fit w-72 shrink-0 sm:w-80 gap-0 p-0 border border-border/70 bg-muted/40 transition-all duration-150 shadow-none ring-0",
        isDropTarget && "border-primary/50 bg-primary/5 ring-1 ring-primary/30",
        isDragging && "opacity-40 shadow-lg ring-2 ring-primary/40"
      )}
    >
      {/* Column Header */}
      <CardHeader className="flex items-center justify-between gap-2 border-b border-border/60 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {/* Dedicated Column Drag Handle */}
          <div
            ref={handleRef}
            className="cursor-grab p-0.5 text-muted-foreground/40 hover:text-muted-foreground/80 active:cursor-grabbing"
            title="Drag column to reorder"
          >
            <GripVertical className="size-3.5" />
          </div>

          {isEditingName ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                ref={nameInputRef}
                value={laneName}
                onChange={(e) => setLaneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName()
                  if (e.key === "Escape") {
                    setIsEditingName(false)
                    setLaneName(lane.name)
                  }
                }}
                className="h-7 text-xs font-semibold"
              />
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleSaveName}
                className="size-6 text-foreground hover:bg-muted"
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => {
                  setIsEditingName(false)
                  setLaneName(lane.name)
                }}
                className="size-6 text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div
              className="flex min-w-0 cursor-pointer items-center gap-2 select-none"
              onDoubleClick={() => setIsEditingName(true)}
              title="Double click to rename column"
            >
              <h3 className="truncate text-xs font-semibold tracking-tight text-foreground">
                {lane.name}
              </h3>
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 text-[10px] font-medium text-muted-foreground"
              >
                {zensCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Column Header Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsAddingZen(true)}
            className="size-6 text-muted-foreground hover:text-foreground"
            title="Add zen to column"
          >
            <Plus className="size-3.5" />
            <span className="sr-only">Add Zen</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-3.5" />
                  <span className="sr-only">Column menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36 text-xs">
              <DropdownMenuItem
                onClick={() => setIsEditingName(true)}
                className="cursor-pointer gap-2 text-xs"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
                <span>Rename Column</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteLane(lane.id)}
                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Column</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Zen List / Drop Zone */}
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        {taskIds.map((taskId, itemIndex) => {
          const task = tasksMap.get(taskId)
          if (!task) return null
          return (
            <BoardTaskCard
              key={task.id}
              task={task}
              index={itemIndex}
              laneId={lane.id}
              onDelete={onDeleteZen}
            />
          )
        })}

        {/* Empty state within column */}
        {taskIds.length === 0 && !isAddingZen && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[inherit] border border-dashed border-border/50 p-6 text-center text-muted-foreground/60">
            <p className="text-xs">No zens yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingZen(true)}
              className="mt-2 h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <PlusCircle className="size-3" />
              Add first zen
            </Button>
          </div>
        )}

        {/* Inline Zen Form */}
        {isAddingZen && (
          <Card className="gap-2 border-border bg-card p-2.5 shadow-xs">
            <Input
              value={newZenTitle}
              onChange={(e) => setNewZenTitle(e.target.value)}
              placeholder="What is your zen?"
              autoFocus
              disabled={isSubmittingZen}
              className="h-8 text-xs font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleCreateZen()
                }
                if (e.key === "Escape") {
                  setIsAddingZen(false)
                }
              }}
            />
            <Textarea
              value={newZenDescription}
              onChange={(e) => setNewZenDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              disabled={isSubmittingZen}
              className="resize-none text-xs"
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingZen(false)
                  setNewZenTitle("")
                  setNewZenDescription("")
                }}
                disabled={isSubmittingZen}
                className="h-7 px-2.5 text-xs text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateZen}
                disabled={!newZenTitle.trim() || isSubmittingZen}
                className="h-7 px-3 text-xs"
              >
                Add Zen
              </Button>
            </div>
          </Card>
        )}
      </CardContent>

      {/* Quick Add Zen button at bottom if not currently adding */}
      {!isAddingZen && taskIds.length > 0 && (
        <CardFooter className="p-2 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingZen(true)}
            className="w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add zen
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
