import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useUser } from "@clerk/clerk-react"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import { useZenStore } from "@/stores/zen-store"
import { boardKeys } from "@/features/boards/services/board-keys"
import { zenKeys } from "@/features/inbox/services/zen-keys"
import { subscribeToZenChanges } from "@/features/inbox/services/zen-service"
import {
  fetchBoardLanes,
  createLaneRecord,
  updateLaneRecord,
  batchUpdateLanePositions,
  deleteLaneRecord,
  subscribeToLaneChanges,
} from "@/features/boards/services/lane-service"
import {
  fetchBoardTasks,
  createTaskRecord,
  updateTaskRecord,
  batchUpdateTaskPositions,
  deleteTaskRecord,
  subscribeToTaskChanges,
} from "@/features/boards/services/task-service"
import { move } from "@dnd-kit/helpers"
import type { Board } from "@/types/board"
import type { Lane, LanePositionUpdate } from "@/types/lane"
import type { TaskWithZen, TaskPositionUpdate } from "@/types/task"
import type { Zen } from "@/types/zen"

export interface UseBoardCanvasOptions {
  board: Board | null
}

export function useBoardCanvas({ board }: UseBoardCanvasOptions) {
  const boardId = board?.id ?? null
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. TanStack React Query for Lanes
  const {
    data: rawLanes = [],
    isLoading: isLanesLoading,
    refetch: refetchLanes,
  } = useQuery({
    queryKey: boardKeys.lanes(boardId),
    queryFn: () => (boardId ? fetchBoardLanes(boardId) : Promise.resolve([])),
    enabled: Boolean(boardId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // 2. TanStack React Query for Tasks (with attached Zen)
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: boardKeys.tasks(boardId),
    queryFn: () => (boardId ? fetchBoardTasks(boardId) : Promise.resolve([])),
    enabled: Boolean(boardId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // Sort lanes by native position column
  const sortedLanes = useMemo(() => {
    return [...rawLanes].sort((a, b) => a.position - b.position)
  }, [rawLanes])

  // 3. Column Order State (for column sorting)
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const previousColumnOrderRef = useRef<string[]>([])

  // 4. Normalized DnD state: Record<laneId, taskId[]>
  const [itemsByLane, setItemsByLane] = useState<Record<string, number[]>>({})
  const isDraggingRef = useRef(false)
  const previousItemsRef = useRef<Record<string, number[]>>({})

  // Sync columnOrder and itemsByLane when query data changes and not actively dragging
  useEffect(() => {
    if (isDraggingRef.current) return

    setColumnOrder(sortedLanes.map((l) => String(l.id)))

    const initialItems: Record<string, number[]> = {}
    for (const lane of sortedLanes) {
      initialItems[String(lane.id)] = []
    }

    const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)
    for (const task of sortedTasks) {
      const laneKey = String(task.lane_id)
      if (!initialItems[laneKey]) {
        initialItems[laneKey] = []
      }
      initialItems[laneKey].push(task.id)
    }

    setItemsByLane(initialItems)
  }, [sortedLanes, tasks])

  // Map of lanes by laneId for 0(1) lookup
  const lanesMap = useMemo(() => {
    const map = new Map<number, Lane>()
    for (const lane of rawLanes) {
      map.set(lane.id, lane)
    }
    return map
  }, [rawLanes])

  // Map of tasks by taskId for 0(1) lookup
  const tasksMap = useMemo(() => {
    const map = new Map<number, TaskWithZen>()
    for (const task of tasks) {
      map.set(task.id, task)
    }
    return map
  }, [tasks])

  // 5. Supabase Realtime Subscriptions
  useEffect(() => {
    if (!boardId) return

    const unsubLanes = subscribeToLaneChanges(boardId, {
      onInsert: (newLane) => {
        queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) => {
          if (!old) return [newLane]
          if (old.some((l) => l.id === newLane.id)) return old
          return [...old, newLane]
        })
      },
      onUpdate: (updatedLane) => {
        queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) =>
          old?.map((l) => (l.id === updatedLane.id ? updatedLane : l)) ?? [updatedLane]
        )
      },
      onDelete: (deletedId) => {
        queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) =>
          old?.filter((l) => l.id !== deletedId) ?? []
        )
      },
    })

    const unsubTasks = subscribeToTaskChanges(boardId, {
      onInsert: () => {
        void queryClient.invalidateQueries({ queryKey: boardKeys.tasks(boardId) })
      },
      onUpdate: () => {
        void queryClient.invalidateQueries({ queryKey: boardKeys.tasks(boardId) })
      },
      onDelete: (deletedId) => {
        queryClient.setQueryData<TaskWithZen[]>(boardKeys.tasks(boardId), (old) =>
          old?.filter((t) => t.id !== deletedId) ?? []
        )
      },
    })

    // Listen to Zen changes (from Zenbox or other sources) to update tasks on the board
    const unsubZens = workspaceId
      ? subscribeToZenChanges(workspaceId, {
          onInsert: (newZen) => {
            queryClient.setQueryData<TaskWithZen[]>(
              boardKeys.tasks(boardId),
              (old) =>
                old?.map((t) =>
                  t.zen_id === newZen.id ? { ...t, zen: newZen } : t
                ) ?? []
            )
          },
          onUpdate: (updatedZen) => {
            queryClient.setQueryData<TaskWithZen[]>(
              boardKeys.tasks(boardId),
              (old) => {
                if (!old) return old
                // If the zen was archived, remove its task card from the active board
                if (updatedZen.archived_at) {
                  return old.filter((t) => t.zen_id !== updatedZen.id)
                }
                return old.map((t) =>
                  t.zen_id === updatedZen.id ? { ...t, zen: updatedZen } : t
                )
              }
            )
          },
          onDelete: (deletedZenId) => {
            queryClient.setQueryData<TaskWithZen[]>(
              boardKeys.tasks(boardId),
              (old) => old?.filter((t) => t.zen_id !== deletedZenId) ?? []
            )
          },
        })
      : () => {}

    return () => {
      unsubLanes()
      unsubTasks()
      unsubZens()
    }
  }, [boardId, workspaceId])

  // 6. Mutations: Lanes
  const createLaneMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string
      description?: string
    }) => {
      if (!boardId || !user?.id) {
        throw new Error("Missing board or user session")
      }
      const nextPosition = rawLanes.length
      return createLaneRecord({
        boardId,
        ownerId: user.id,
        name,
        description,
        position: nextPosition,
      })
    },
    onSuccess: (newLane) => {
      queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) =>
        old ? [...old, newLane] : [newLane]
      )
      setColumnOrder((prev) => [...prev, String(newLane.id)])
      setItemsByLane((prev) => ({
        ...prev,
        [String(newLane.id)]: [],
      }))

      toast.success("Column created", {
        description: `Column "${newLane.name}" added to the board.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create column", {
        description: (error as Error).message || "An error occurred.",
      })
    },
  })

  const updateLaneMutation = useMutation({
    mutationFn: async ({
      laneId,
      name,
      description,
    }: {
      laneId: number
      name?: string
      description?: string
    }) => {
      return updateLaneRecord(laneId, { name, description })
    },
    onSuccess: (updatedLane) => {
      queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) =>
        old?.map((l) => (l.id === updatedLane.id ? updatedLane : l)) ?? [updatedLane]
      )
      toast.success("Column updated", {
        description: `Column "${updatedLane.name}" has been updated.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update column", {
        description: (error as Error).message || "An error occurred.",
      })
    },
  })

  const deleteLaneMutation = useMutation({
    mutationFn: async (laneId: number) => {
      return deleteLaneRecord(laneId)
    },
    onSuccess: (_, laneId) => {
      queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) =>
        old?.filter((l) => l.id !== laneId) ?? []
      )
      queryClient.setQueryData<TaskWithZen[]>(boardKeys.tasks(boardId), (old) =>
        old?.filter((t) => t.lane_id !== laneId) ?? []
      )
      setColumnOrder((prev) => prev.filter((id) => id !== String(laneId)))
      setItemsByLane((prev) => {
        const next = { ...prev }
        delete next[String(laneId)]
        return next
      })

      toast.success("Column deleted", {
        description: "Column and its zens have been removed.",
      })
    },
    onError: (error) => {
      toast.error("Failed to delete column", {
        description: (error as Error).message || "An error occurred.",
      })
    },
  })

  // 7. Mutations: Tasks (attached to Zen lifecycle)
  const createTaskMutation = useMutation({
    mutationFn: async ({
      laneId,
      title,
      description,
    }: {
      laneId: number
      title: string
      description?: string
    }) => {
      if (!workspaceId || !user?.id) {
        throw new Error("Missing active workspace or user session")
      }
      const currentLaneItems = itemsByLane[String(laneId)] || []
      const nextPosition = currentLaneItems.length

      return createTaskRecord({
        workspaceId,
        laneId,
        ownerId: user.id,
        title,
        description,
        position: nextPosition,
      })
    },
    onSuccess: (newTask) => {
      // 1. Update Board Query Cache
      queryClient.setQueryData<TaskWithZen[]>(boardKeys.tasks(boardId), (old) =>
        old ? [...old, newTask] : [newTask]
      )
      setItemsByLane((prev) => {
        const laneKey = String(newTask.lane_id)
        const current = prev[laneKey] || []
        if (current.includes(newTask.id)) return prev
        return {
          ...prev,
          [laneKey]: [...current, newTask.id],
        }
      })

      // 2. Realtime Zenbox synchronization: Immediately push newly created Zen into Zenbox cache
      if (workspaceId) {
        queryClient.setQueryData<Zen[]>(zenKeys.list(workspaceId), (old) => {
          if (!old) return [newTask.zen]
          if (old.some((item) => item.id === newTask.zen.id)) return old
          return [newTask.zen, ...old]
        })
        useZenStore.getState().upsertZen(newTask.zen)
        void queryClient.invalidateQueries({
          queryKey: zenKeys.list(workspaceId),
        })
      }

      toast.success("Zen created", {
        description: `"${newTask.zen.name}" has been created.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create zen", {
        description: (error as Error).message || "An error occurred.",
      })
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      zenId,
      title,
      description,
      laneId,
      position,
    }: {
      taskId: number
      zenId: number
      title?: string
      description?: string
      laneId?: number
      position?: number
    }) => {
      return updateTaskRecord(taskId, zenId, {
        title,
        description,
        laneId,
        position,
      })
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskWithZen[]>(boardKeys.tasks(boardId), (old) =>
        old?.map((t) => (t.id === updatedTask.id ? updatedTask : t)) ?? [updatedTask]
      )
      if (workspaceId) {
        queryClient.setQueryData<Zen[]>(zenKeys.list(workspaceId), (old) =>
          old?.map((z) => (z.id === updatedTask.zen.id ? updatedTask.zen : z)) ?? [updatedTask.zen]
        )
        useZenStore.getState().upsertZen(updatedTask.zen)
      }
      toast.success("Zen updated", {
        description: `"${updatedTask.zen.name}" updated successfully.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update zen", {
        description: (error as Error).message || "An error occurred.",
      })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      zenId,
    }: {
      taskId: number
      zenId: number
    }) => {
      return deleteTaskRecord(taskId, zenId)
    },
    onSuccess: (_, { taskId, zenId }) => {
      queryClient.setQueryData<TaskWithZen[]>(boardKeys.tasks(boardId), (old) =>
        old?.filter((t) => t.id !== taskId) ?? []
      )
      setItemsByLane((prev) => {
        const next: Record<string, number[]> = {}
        for (const [k, v] of Object.entries(prev)) {
          next[k] = v.filter((id) => id !== taskId)
        }
        return next
      })

      // Sync removal with Zenbox
      if (workspaceId) {
        queryClient.setQueryData<Zen[]>(zenKeys.list(workspaceId), (old) =>
          old?.filter((z) => z.id !== zenId) ?? []
        )
        useZenStore.getState().removeZen(zenId)
      }

      toast.success("Zen deleted", {
        description: "Zen item has been permanently removed.",
      })
    },
    onError: (error) => {
      toast.error("Failed to delete zen", {
        description: (error as Error).message || "An error occurred.",
      })
    },
  })

  // 8. Drag and Drop Handlers for @dnd-kit/react
  const handleDragStart = () => {
    isDraggingRef.current = true
    previousItemsRef.current = itemsByLane
    previousColumnOrderRef.current = columnOrder
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragOver = (event: any) => {
    const { source } = event.operation
    if (source?.type === "column") return

    setItemsByLane((prev) => move(prev, event))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = async (event: any) => {
    isDraggingRef.current = false
    const { source } = event.operation

    if (event.canceled) {
      if (source?.type === "item") {
        setItemsByLane(previousItemsRef.current)
      }
      if (source?.type === "column") {
        setColumnOrder(previousColumnOrderRef.current)
      }
      return
    }

    // Handle column reordering using native lane position column
    if (source?.type === "column") {
      const nextColumns = move(columnOrder, event) as string[]
      setColumnOrder(nextColumns)

      const laneUpdates: LanePositionUpdate[] = []
      nextColumns.forEach((laneIdStr, index) => {
        const laneId = Number.parseInt(laneIdStr, 10)
        const existing = lanesMap.get(laneId)
        if (existing && existing.position !== index) {
          laneUpdates.push({ id: laneId, position: index })
        }
      })

      if (laneUpdates.length > 0) {
        queryClient.setQueryData<Lane[]>(boardKeys.lanes(boardId), (old) => {
          if (!old) return old
          const map = new Map(old.map((l) => [l.id, l]))
          for (const u of laneUpdates) {
            const current = map.get(u.id)
            if (current) {
              map.set(u.id, { ...current, position: u.position })
            }
          }
          return Array.from(map.values()).sort((a, b) => a.position - b.position)
        })

        try {
          await batchUpdateLanePositions(laneUpdates)
        } catch {
          toast.error("Failed to save column order", {
            description: "Unable to persist column arrangement.",
          })
          setColumnOrder(previousColumnOrderRef.current)
          void refetchLanes()
        }
      }
      return
    }

    // Handle task / item reordering
    const updates: TaskPositionUpdate[] = []
    const updatedTasksCache: TaskWithZen[] = []

    for (const [laneKey, taskIds] of Object.entries(itemsByLane)) {
      const laneIdNum = Number.parseInt(laneKey, 10)
      taskIds.forEach((taskId, index) => {
        const existingTask = tasksMap.get(taskId)
        if (existingTask) {
          if (
            existingTask.lane_id !== laneIdNum ||
            existingTask.position !== index
          ) {
            updates.push({
              id: taskId,
              lane_id: laneIdNum,
              position: index,
            })
            updatedTasksCache.push({
              ...existingTask,
              lane_id: laneIdNum,
              position: index,
            })
          } else {
            updatedTasksCache.push(existingTask)
          }
        }
      })
    }

    if (updates.length > 0) {
      queryClient.setQueryData<TaskWithZen[]>(
        boardKeys.tasks(boardId),
        (old) => {
          if (!old) return old
          const map = new Map<number, TaskWithZen>()
          for (const item of old) map.set(item.id, item)
          for (const u of updates) {
            const current = map.get(u.id)
            if (current) {
              map.set(u.id, {
                ...current,
                lane_id: u.lane_id,
                position: u.position,
              })
            }
          }
          return Array.from(map.values())
        }
      )

      try {
        await batchUpdateTaskPositions(updates)
      } catch (err) {
        toast.error("Failed to save zen positions", {
          description: (err as Error).message || "Rolling back positions.",
        })
        setItemsByLane(previousItemsRef.current)
        void refetchTasks()
      }
    }
  }

  // Quick helper to seed default Kanban columns
  const createDefaultLanes = async () => {
    if (!boardId || !user?.id) return
    const defaults = ["To Do", "In Progress", "Done"]
    try {
      for (let i = 0; i < defaults.length; i++) {
        await createLaneRecord({
          boardId,
          ownerId: user.id,
          name: defaults[i],
          position: i,
        })
      }
      await refetchLanes()
      toast.success("Default columns created", {
        description: 'Created "To Do", "In Progress", and "Done" columns.',
      })
    } catch (err) {
      toast.error("Failed to create default columns", {
        description: (err as Error).message,
      })
    }
  }

  return {
    lanes: sortedLanes,
    lanesMap,
    columnOrder,
    tasks,
    tasksMap,
    itemsByLane,
    isLoading: isLanesLoading || isTasksLoading,
    createLane: (name: string, description?: string) =>
      createLaneMutation.mutateAsync({ name, description }),
    updateLane: (laneId: number, name?: string, description?: string) =>
      updateLaneMutation.mutateAsync({ laneId, name, description }),
    deleteLane: (laneId: number) => deleteLaneMutation.mutateAsync(laneId),
    createTask: (laneId: number, title: string, description?: string) =>
      createTaskMutation.mutateAsync({ laneId, title, description }),
    updateTask: (
      taskId: number,
      zenId: number,
      updates: { title?: string; description?: string; laneId?: number; position?: number }
    ) => updateTaskMutation.mutateAsync({ taskId, zenId, ...updates }),
    deleteTask: (taskId: number, zenId: number) =>
      deleteTaskMutation.mutateAsync({ taskId, zenId }),
    createDefaultLanes,
    dndHandlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
    },
  }
}
