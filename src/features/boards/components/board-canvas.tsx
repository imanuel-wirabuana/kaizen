import { useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"
import { Plus, Kanban, Sparkles, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { BoardLane } from "@/features/boards/components/board-lane"
import { useBoardCanvas } from "@/features/boards/hooks/use-board-canvas"
import type { Board } from "@/types/board"

export interface BoardCanvasProps {
  board: Board
  isAddingLane?: boolean
  onIsAddingLaneChange?: (adding: boolean) => void
}

export function BoardCanvas({
  board,
  isAddingLane: externalIsAddingLane,
  onIsAddingLaneChange,
}: BoardCanvasProps) {
  const {
    lanes,
    lanesMap,
    columnOrder,
    tasksMap,
    itemsByLane,
    isLoading,
    createLane,
    updateLane,
    deleteLane,
    createTask,
    deleteTask,
    createDefaultLanes,
    dndHandlers,
  } = useBoardCanvas({ board })

  // Column creation state
  const [internalAddingLane, setInternalAddingLane] = useState(false)
  const isAddingLane = externalIsAddingLane ?? internalAddingLane
  const setIsAddingLane = (adding: boolean) => {
    setInternalAddingLane(adding)
    onIsAddingLaneChange?.(adding)
  }

  const [newLaneName, setNewLaneName] = useState("")
  const [isCreatingLane, setIsCreatingLane] = useState(false)

  const handleCreateLane = async () => {
    const trimmed = newLaneName.trim()
    if (!trimmed || isCreatingLane) return
    try {
      setIsCreatingLane(true)
      await createLane(trimmed)
      setNewLaneName("")
      setIsAddingLane(false)
    } finally {
      setIsCreatingLane(false)
    }
  }

  if (isLoading && lanes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center text-muted-foreground">
        <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
        <p className="text-xs">Loading board columns and zens...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">

      {/* Main Kanban Board Scroll Area */}
      {lanes.length === 0 ? (
        /* Empty Board State */
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <Kanban className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No columns on this board yet
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Start by adding custom columns or generate standard Kanban workflow
            columns (To Do, In Progress, Done).
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={createDefaultLanes}
              className="gap-1.5 text-xs cursor-pointer shadow-2xs"
            >
              <Sparkles className="size-3.5" />
              Create Standard Columns
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingLane(true)}
              className="gap-1.5 text-xs cursor-pointer shadow-2xs"
            >
              <Plus className="size-3.5" />
              Custom Column
            </Button>
          </div>

          {/* Quick inline custom column form in empty state */}
          {isAddingLane && (
            <div className="mt-4 flex w-full max-w-xs items-center gap-1.5 rounded-lg border border-border bg-card p-2 shadow-xs">
              <Input
                value={newLaneName}
                onChange={(e) => setNewLaneName(e.target.value)}
                placeholder="Column name (e.g. Backlog)"
                autoFocus
                disabled={isCreatingLane}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateLane()
                  if (e.key === "Escape") setIsAddingLane(false)
                }}
              />
              <Button
                size="sm"
                onClick={handleCreateLane}
                disabled={!newLaneName.trim() || isCreatingLane}
                className="h-8 px-3 text-xs"
              >
                Create
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsAddingLane(false)}
                className="size-8 text-muted-foreground"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Horizontal Lanes Container */
        <DragDropProvider
          onDragStart={dndHandlers.onDragStart}
          onDragOver={dndHandlers.onDragOver}
          onDragEnd={dndHandlers.onDragEnd}
        >
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4 sm:p-6">
            {columnOrder.map((laneIdStr, columnIndex) => {
              const laneId = Number.parseInt(laneIdStr, 10)
              const lane = lanesMap.get(laneId)
              if (!lane) return null
              const taskIds = itemsByLane[laneIdStr] || []
              return (
                <BoardLane
                  key={lane.id}
                  lane={lane}
                  index={columnIndex}
                  taskIds={taskIds}
                  tasksMap={tasksMap}
                  onAddZen={createTask}
                  onRenameLane={(id, name) => updateLane(id, name)}
                  onDeleteLane={deleteLane}
                  onDeleteZen={deleteTask}
                />
              )
            })}

            {/* Add Column Card at the end of the lanes */}
            <div className="w-72 shrink-0 sm:w-80">
              {isAddingLane ? (
                <Card className="gap-2 border-border bg-muted/30 p-3 shadow-xs">
                  <Input
                    value={newLaneName}
                    onChange={(e) => setNewLaneName(e.target.value)}
                    placeholder="Column name..."
                    autoFocus
                    disabled={isCreatingLane}
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateLane()
                      if (e.key === "Escape") setIsAddingLane(false)
                    }}
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingLane(false)
                        setNewLaneName("")
                      }}
                      disabled={isCreatingLane}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateLane}
                      disabled={!newLaneName.trim() || isCreatingLane}
                      className="h-7 gap-1 px-3 text-xs"
                    >
                      <Check className="size-3.5" />
                      Add Column
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card
                  onClick={() => setIsAddingLane(true)}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-1.5 border-dashed border-border/80 bg-muted/20 text-xs font-medium text-muted-foreground shadow-none ring-0 transition-colors hover:border-primary/50 hover:bg-muted/40 hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                  Add another column
                </Card>
              )}
            </div>
          </div>
        </DragDropProvider>
      )}
    </div>
  )
}
