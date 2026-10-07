import { useCallback, useEffect } from "react"
import { useLocation, useRoute } from "wouter"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  useBoardStore,
  useFilteredBoards,
  useBoardCounts,
} from "@/stores/board-store"
import {
  fetchWorkspaceBoards,
  createBoardRecord,
  updateBoardRecord,
  archiveBoardRecord,
  restoreBoardRecord,
  deleteBoardRecord,
  batchArchiveBoardRecords,
  batchRestoreBoardRecords,
  batchDeleteBoardRecords,
  subscribeToBoardChanges,
} from "@/features/boards/services/board-service"
import { boardKeys } from "@/features/boards/services/board-keys"
import type { Board, BoardFolder, UpdateBoardInput } from "@/types/board"

const EMPTY_BOARDS: Board[] = []

export function useBoards() {
  const [, setLocation] = useLocation()
  const [isBoardIdRoute, boardParams] = useRoute<{ id: string }>("/boards/:id")

  const rawRouteId = isBoardIdRoute ? boardParams?.id : null
  const parsedId = rawRouteId ? Number.parseInt(rawRouteId, 10) : null
  const selectedBoardId =
    parsedId !== null && !Number.isNaN(parsedId) ? parsedId : null

  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. TanStack React Query: Cached Server State
  const {
    data: queryBoards,
    isLoading: isQueryLoading,
    refetch: refreshBoards,
  } = useQuery({
    queryKey: boardKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceBoards(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // Synchronize Zustand client store with React Query cache
  const setBoards = useBoardStore((state) => state.setBoards)
  const resetStore = useBoardStore((state) => state.reset)
  const upsertBoard = useBoardStore((state) => state.upsertBoard)
  const removeBoard = useBoardStore((state) => state.removeBoard)

  useEffect(() => {
    if (!workspaceId) {
      resetStore()
      return
    }
    if (queryBoards !== undefined) {
      setBoards(queryBoards)
    }
  }, [queryBoards, workspaceId, setBoards, resetStore])

  // Synchronize URL route with Zustand selectedBoardId
  useEffect(() => {
    if (selectedBoardId !== useBoardStore.getState().selectedBoardId) {
      useBoardStore.setState({ selectedBoardId })
    }
  }, [selectedBoardId])

  // UI state from Zustand & React Query
  const storeBoards = useBoardStore((state) => state.boards)
  const boards = queryBoards ?? storeBoards ?? EMPTY_BOARDS
  const filteredBoards = useFilteredBoards()
  const activeFolder = useBoardStore((state) => state.activeFolder)
  const { allCount, archivedCount } = useBoardCounts()
  const searchQuery = useBoardStore((state) => state.searchQuery)
  const selectedBatchIds = useBoardStore((state) => state.selectedBatchIds)
  const toggleBatchSelect = useBoardStore((state) => state.toggleBatchSelect)
  const selectAllBatch = useBoardStore((state) => state.selectAllBatch)
  const clearBatchSelect = useBoardStore((state) => state.clearBatchSelect)
  const setActiveFolder = useBoardStore((state) => state.setActiveFolder)
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery)

  const selectedBoard = selectedBoardId
    ? boards.find((b) => b.id === selectedBoardId) ?? null
    : null

  // 2. Realtime Subscriptions: Update React Query Cache directly (0ms latency)
  useEffect(() => {
    if (!workspaceId) return

    const unsubscribe = subscribeToBoardChanges(workspaceId, {
      onInsert: (board) => {
        queryClient.setQueryData<Board[]>(
          boardKeys.list(workspaceId),
          (old) => {
            if (!old) return [board]
            if (old.some((item) => item.id === board.id)) return old
            return [board, ...old]
          }
        )
        upsertBoard(board)
      },
      onUpdate: (board) => {
        queryClient.setQueryData<Board[]>(
          boardKeys.list(workspaceId),
          (old) => old?.map((item) => (item.id === board.id ? board : item)) ?? [board]
        )
        upsertBoard(board)
      },
      onDelete: (id) => {
        queryClient.setQueryData<Board[]>(
          boardKeys.list(workspaceId),
          (old) => old?.filter((item) => item.id !== id) ?? []
        )
        removeBoard(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, upsertBoard, removeBoard])

  // 3. React Query Mutations
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string
      description?: string
    }) => {
      if (!workspaceId) throw new Error("No active workspace selected")

      return createBoardRecord({
        workspaceId,
        ownerId: user?.id ?? null,
        name,
        description,
      })
    },
    onSuccess: (newBoard) => {
      if (!workspaceId) return
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) => (old ? [newBoard, ...old] : [newBoard])
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      upsertBoard(newBoard)
      setLocation(`/boards/${newBoard.id}`)
      toast.success("Board created", {
        description: `"${newBoard.name}" has been created successfully.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create board", {
        description: (error as Error).message || "An unexpected error occurred.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number
      updates: UpdateBoardInput
    }) => {
      return updateBoardRecord(id, updates)
    },
    onSuccess: (updatedBoard) => {
      if (!workspaceId) return
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) => old?.map((item) => (item.id === updatedBoard.id ? updatedBoard : item)) ?? [updatedBoard]
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      upsertBoard(updatedBoard)
      toast.success("Board updated", {
        description: `"${updatedBoard.name}" has been updated.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update board", {
        description: (error as Error).message || "An unexpected error occurred.",
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      return archiveBoardRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      const archivedAt = new Date().toISOString()
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === id ? { ...item, archived_at: archivedAt } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      const item = boards.find((b) => b.id === id)
      if (item) upsertBoard({ ...item, archived_at: archivedAt })
      toast.success("Board archived", {
        description: "Board moved to the archived section.",
      })
    },
    onError: (error) => {
      toast.error("Failed to archive board", {
        description: (error as Error).message || "Unable to archive board.",
      })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      return restoreBoardRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === id ? { ...item, archived_at: null } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      const item = boards.find((b) => b.id === id)
      if (item) upsertBoard({ ...item, archived_at: null })
      toast.success("Board restored", {
        description: "Board returned to active boards.",
      })
    },
    onError: (error) => {
      toast.error("Failed to restore board", {
        description: (error as Error).message || "Unable to restore board.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const target = boards.find((b) => b.id === id)
      if (target && !target.archived_at) {
        throw new Error(
          "Board must be archived before it can be permanently deleted"
        )
      }
      return deleteBoardRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) => old?.filter((item) => item.id !== id) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      removeBoard(id)
      toast.success("Board deleted", {
        description: "Board has been permanently removed.",
      })
      if (selectedBoardId === id) {
        setLocation("/boards")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete board", {
        description: (error as Error).message || "Unable to delete board.",
      })
    },
  })

  const batchArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchArchiveBoardRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      const archivedAt = new Date().toISOString()
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: archivedAt } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      for (const id of ids) {
        const item = boards.find((b) => b.id === id)
        if (item) upsertBoard({ ...item, archived_at: archivedAt })
      }
      clearBatchSelect()
      toast.success("Boards archived", {
        description: `${ids.length} ${ids.length === 1 ? "board" : "boards"} moved to archived.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to archive boards", {
        description:
          (error as Error).message || "Unable to archive selected boards.",
      })
    },
  })

  const batchRestoreMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchRestoreBoardRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: null } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      for (const id of ids) {
        const item = boards.find((b) => b.id === id)
        if (item) upsertBoard({ ...item, archived_at: null })
      }
      clearBatchSelect()
      toast.success("Boards restored", {
        description: `${ids.length} ${ids.length === 1 ? "board" : "boards"} restored to active boards.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to restore boards", {
        description:
          (error as Error).message || "Unable to restore selected boards.",
      })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      const nonArchived = boards.filter(
        (b) => ids.includes(b.id) && !b.archived_at
      )
      if (nonArchived.length > 0) {
        throw new Error(
          "Boards must be archived before they can be permanently deleted"
        )
      }
      return batchDeleteBoardRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Board[]>(
        boardKeys.list(workspaceId),
        (old) => old?.filter((item) => !ids.includes(item.id)) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: boardKeys.list(workspaceId),
      })
      for (const id of ids) {
        removeBoard(id)
      }
      clearBatchSelect()
      toast.success("Boards deleted", {
        description: `${ids.length} ${ids.length === 1 ? "board" : "boards"} permanently deleted.`,
      })
      if (selectedBoardId !== null && ids.includes(selectedBoardId)) {
        setLocation("/boards")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete boards", {
        description:
          (error as Error).message || "Unable to delete selected boards.",
      })
    },
  })

  const createBoard = async (
    name: string = "Untitled Board",
    description?: string
  ): Promise<Board> => {
    return createMutation.mutateAsync({ name, description })
  }

  const updateBoard = async (
    id: number,
    updates: UpdateBoardInput
  ): Promise<Board> => {
    return updateMutation.mutateAsync({ id, updates })
  }

  const archiveBoard = async (id: number): Promise<boolean> => {
    return archiveMutation.mutateAsync(id)
  }

  const restoreBoard = async (id: number): Promise<boolean> => {
    return restoreMutation.mutateAsync(id)
  }

  const deleteBoard = async (id: number): Promise<boolean> => {
    return deleteMutation.mutateAsync(id)
  }

    const handleSelectFolder = useCallback(
    (folder: BoardFolder) => {
      setActiveFolder(folder)
      if (selectedBoard) {
        const isStillVisible =
          folder === "boards"
            ? !selectedBoard.archived_at
            : Boolean(selectedBoard.archived_at)
        if (!isStillVisible) {
          setLocation("/boards")
        }
      }
    },
    [selectedBoard, setActiveFolder, setLocation]
  )

  return {
    boards,
    filteredBoards,
    selectedBoard,
    selectedBoardId,
    activeFolder,
    allCount,
    archivedCount,
    searchQuery,
    isLoading: isQueryLoading,
    selectedBatchIds,
    toggleBatchSelect,
    selectAllBatch,
    clearBatchSelect,
    createBoard,
    updateBoard,
    archiveBoard,
    restoreBoard,
    deleteBoard,
    batchArchiveBoards: (ids: number[]) => batchArchiveMutation.mutateAsync(ids),
    batchRestoreBoards: (ids: number[]) => batchRestoreMutation.mutateAsync(ids),
    batchDeleteBoards: (ids: number[]) => batchDeleteMutation.mutateAsync(ids),
    refreshBoards,
    setSelectedBoardId: (id: number | null) => {
      if (id) {
        setLocation(`/boards/${id}`)
      } else {
        setLocation("/boards")
      }
    },
    setActiveFolder: handleSelectFolder,
    setSearchQuery,
  }
}
