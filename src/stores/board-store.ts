import { create } from "zustand"
import type { Board, BoardFolder } from "@/types/board"

interface BoardState {
  boards: Board[]
  selectedBoardId: number | null
  selectedBatchIds: number[]
  activeFolder: BoardFolder
  searchQuery: string
  isLoading: boolean
  error: string | null

  // Actions
  setBoards: (boards: Board[]) => void
  setSelectedBoardId: (id: number | null) => void
  setActiveFolder: (folder: BoardFolder) => void
  upsertBoard: (board: Board) => void
  removeBoard: (id: number) => void
  setSearchQuery: (query: string) => void
  toggleBatchSelect: (id: number) => void
  selectAllBatch: (ids: number[]) => void
  clearBatchSelect: () => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  boards: [],
  selectedBoardId: null,
  selectedBatchIds: [],
  activeFolder: "boards",
  searchQuery: "",
  isLoading: true,
  error: null,

  setBoards: (boards) => {
    const state = get()
    if (state.boards === boards && !state.isLoading) return
    const currentSelectedId = state.selectedBoardId
    const isSelectedStillValid =
      currentSelectedId === null || boards.some((b) => b.id === currentSelectedId)

    set({
      boards,
      selectedBoardId: isSelectedStillValid ? currentSelectedId : null,
      isLoading: false,
      error: null,
    })
  },

  setSelectedBoardId: (id) => {
    if (get().selectedBoardId === id) return
    set({ selectedBoardId: id })
  },

  setActiveFolder: (folder) => {
    set({ activeFolder: folder, selectedBatchIds: [] })
  },

  upsertBoard: (board) => {
    const { boards } = get()
    const index = boards.findIndex((item) => item.id === board.id)
    let updatedList: Board[]

    if (index >= 0) {
      updatedList = boards.map((item) => (item.id === board.id ? board : item))
    } else {
      updatedList = [board, ...boards]
    }

    set({ boards: updatedList })
  },

  removeBoard: (id) => {
    const { boards, selectedBoardId, selectedBatchIds } = get()
    const filtered = boards.filter((item) => item.id !== id)

    set({
      boards: filtered,
      selectedBoardId: selectedBoardId === id ? null : selectedBoardId,
      selectedBatchIds: selectedBatchIds.filter((item) => item !== id),
    })
  },

  setSearchQuery: (query) => set({ searchQuery: query, selectedBatchIds: [] }),

  toggleBatchSelect: (id) => {
    const { selectedBatchIds } = get()
    if (selectedBatchIds.includes(id)) {
      set({ selectedBatchIds: selectedBatchIds.filter((item) => item !== id) })
    } else {
      set({ selectedBatchIds: [...selectedBatchIds, id] })
    }
  },

  selectAllBatch: (ids) => {
    set({ selectedBatchIds: ids })
  },

  clearBatchSelect: () => {
    if (get().selectedBatchIds.length > 0) {
      set({ selectedBatchIds: [] })
    }
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () =>
    set({
      boards: [],
      selectedBoardId: null,
      selectedBatchIds: [],
      activeFolder: "boards",
      searchQuery: "",
      isLoading: false,
      error: null,
    }),
}))

/**
 * Selector hook for retrieving boards filtered by the active folder and search query.
 */
export function useFilteredBoards(): Board[] {
  const boards = useBoardStore((state) => state.boards)
  const activeFolder = useBoardStore((state) => state.activeFolder)
  const searchQuery = useBoardStore((state) => state.searchQuery)

  return boards.filter((board) => {
    // Folder filter: "boards" means active/unarchived; "archived" means archived
    if (
      (activeFolder === "boards" || (activeFolder as string) === "all") &&
      board.archived_at
    ) {
      return false
    }
    if (activeFolder === "archived" && !board.archived_at) {
      return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesName = board.name.toLowerCase().includes(query)
      const matchesDesc =
        board.description && board.description.toLowerCase().includes(query)
      if (!matchesName && !matchesDesc) {
        return false
      }
    }

    return true
  })
}

/**
 * Selector hook for retrieving the currently selected Board.
 */
export function useSelectedBoard(): Board | null {
  return useBoardStore((state) => {
    if (!state.selectedBoardId) {
      return null
    }
    return state.boards.find((b) => b.id === state.selectedBoardId) ?? null
  })
}

/**
 * Selector hook for counts of all (active) and archived boards.
 */
export function useBoardCounts(): { allCount: number; archivedCount: number } {
  const boards = useBoardStore((state) => state.boards)
  const allCount = boards.filter((b) => !b.archived_at).length
  const archivedCount = boards.filter((b) => Boolean(b.archived_at)).length

  return { allCount, archivedCount }
}

/**
 * Selector hook for retrieving currently selected batch board IDs.
 */
export function useBoardBatchSelectedIds(): number[] {
  return useBoardStore((state) => state.selectedBatchIds)
}
