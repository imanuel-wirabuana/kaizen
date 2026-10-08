import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AiThread, AssistantFolder } from "@/types/assistant"
import { AI_CONFIG } from "@/features/assistant/services/ai-client"

interface AssistantState {
  threads: AiThread[]
  selectedThreadId: number | null
  selectedBatchIds: number[]
  activeFolder: AssistantFolder
  searchQuery: string
  modelName: string
  isRightSidebarOpen: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setThreads: (threads: AiThread[]) => void
  setSelectedThreadId: (id: number | null) => void
  setActiveFolder: (folder: AssistantFolder) => void
  setSearchQuery: (query: string) => void
  setModelName: (modelName: string) => void
  setRightSidebarOpen: (open: boolean) => void
  toggleRightSidebarOpen: () => void
  toggleBatchSelect: (id: number) => void
  selectAllBatch: (ids: number[]) => void
  clearBatchSelect: () => void
  upsertThread: (thread: AiThread) => void
  removeThread: (id: number) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const STORAGE_KEY = "kaizen-assistant-preferences"

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      threads: [],
      selectedThreadId: null,
      selectedBatchIds: [],
      activeFolder: "threads",
      searchQuery: "",
      modelName: AI_CONFIG.defaultModel,
      isRightSidebarOpen: false,
      isLoading: true,
      error: null,

      setThreads: (threads) => {
        const state = get()
        if (state.threads === threads && !state.isLoading) return
        const currentSelectedId = state.selectedThreadId
        const isSelectedStillValid =
          currentSelectedId === null ||
          threads.some((t) => t.id === currentSelectedId)

        set({
          threads,
          selectedThreadId: isSelectedStillValid ? currentSelectedId : null,
          isLoading: false,
          error: null,
        })
      },

      setSelectedThreadId: (id) => {
        if (get().selectedThreadId === id) return
        set({ selectedThreadId: id })
      },

      setActiveFolder: (folder) => {
        set({ activeFolder: folder, selectedBatchIds: [] })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query, selectedBatchIds: [] })
      },

      setModelName: (modelName) => {
        set({ modelName })
      },

      setRightSidebarOpen: (open) => {
        set({ isRightSidebarOpen: open })
      },

      toggleRightSidebarOpen: () => {
        set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }))
      },

      toggleBatchSelect: (id) => {
        const { selectedBatchIds } = get()
        if (selectedBatchIds.includes(id)) {
          set({
            selectedBatchIds: selectedBatchIds.filter((item) => item !== id),
          })
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

      upsertThread: (thread) => {
        const { threads } = get()
        const index = threads.findIndex((t) => t.id === thread.id)
        let updatedList: AiThread[]

        if (index >= 0) {
          updatedList = threads.map((t) => (t.id === thread.id ? thread : t))
        } else {
          updatedList = [thread, ...threads]
        }

        set({
          threads: updatedList,
        })
      },

      removeThread: (id) => {
        const { threads, selectedThreadId, selectedBatchIds } = get()
        const filtered = threads.filter((t) => t.id !== id)
        set({
          threads: filtered,
          selectedThreadId: selectedThreadId === id ? null : selectedThreadId,
          selectedBatchIds: selectedBatchIds.filter((item) => item !== id),
        })
      },

      setIsLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      reset: () => {
        set({
          threads: [],
          selectedThreadId: null,
          selectedBatchIds: [],
          activeFolder: "threads",
          searchQuery: "",
          isRightSidebarOpen: false,
          isLoading: false,
          error: null,
        })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        selectedThreadId: state.selectedThreadId,
      }),
    }
  )
)

/**
 * Selector hook for retrieving filtered threads based on activeFolder and searchQuery.
 */
export function useFilteredThreads(): AiThread[] {
  const threads = useAssistantStore((state) => state.threads)
  const activeFolder = useAssistantStore((state) => state.activeFolder)
  const searchQuery = useAssistantStore((state) => state.searchQuery)

  return threads.filter((thread) => {
    // Folder filter: active vs archived
    if (activeFolder === "threads" && thread.archived_at) {
      return false
    }
    if (activeFolder === "archived" && !thread.archived_at) {
      return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = thread.title.toLowerCase().includes(q)
      const matchDesc =
        thread.description && thread.description.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) {
        return false
      }
    }

    return true
  })
}

/**
 * Selector hook for retrieving the currently selected thread.
 */
export function useSelectedThread(): AiThread | null {
  return useAssistantStore((state) => {
    if (!state.selectedThreadId) return null
    return state.threads.find((t) => t.id === state.selectedThreadId) ?? null
  })
}

/**
 * Selector hook for counting active and archived threads.
 */
export function useAssistantCounts() {
  const threads = useAssistantStore((state) => state.threads)
  const activeCount = threads.filter((t) => !t.archived_at).length
  const archivedCount = threads.filter((t) => Boolean(t.archived_at)).length

  return {
    activeCount,
    archivedCount,
  }
}

/**
 * Selector hook for retrieving selected batch thread IDs.
 */
export function useAssistantBatchSelectedIds(): number[] {
  return useAssistantStore((state) => state.selectedBatchIds)
}

/**
 * Selector hook for retrieving right assistant sidebar open state.
 */
export function useIsAssistantRightSidebarOpen(): boolean {
  return useAssistantStore((state) => state.isRightSidebarOpen)
}
