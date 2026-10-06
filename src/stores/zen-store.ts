import { create } from "zustand"
import type { Zen } from "@/types/zen"

export type ZenboxFolder = "zenbox" | "archived"
export type InboxFolder = ZenboxFolder

interface ZenState {
  zens: Zen[]
  selectedZenId: number | null
  activeFolder: ZenboxFolder
  searchQuery: string
  showUnreadOnly: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setZens: (zens: Zen[]) => void
  setSelectedZenId: (id: number | null) => void
  setActiveFolder: (folder: ZenboxFolder) => void
  setShowUnreadOnly: (show: boolean) => void
  upsertZen: (zen: Zen) => void
  removeZen: (id: number) => void
  setSearchQuery: (query: string) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useZenStore = create<ZenState>()((set, get) => ({
  zens: [],
  selectedZenId: null,
  activeFolder: "zenbox",
  searchQuery: "",
  showUnreadOnly: false,
  isLoading: true,
  error: null,

  setZens: (zens) => {
    const currentSelectedId = get().selectedZenId
    const isSelectedStillValid = zens.some((z) => z.id === currentSelectedId)

    set({
      zens,
      selectedZenId: isSelectedStillValid ? currentSelectedId : null,
      isLoading: false,
      error: null,
    })
  },

  setSelectedZenId: (id) => set({ selectedZenId: id }),

  setActiveFolder: (folder) => {
    set({ activeFolder: folder })
  },

  setShowUnreadOnly: (show) => set({ showUnreadOnly: show }),

  upsertZen: (zen) => {
    const { zens } = get()

    const index = zens.findIndex((item) => item.id === zen.id)
    let updatedList: Zen[]

    if (index >= 0) {
      updatedList = zens.map((item) => (item.id === zen.id ? zen : item))
    } else {
      updatedList = [zen, ...zens]
    }

    set({
      zens: updatedList,
    })
  },

  removeZen: (id) => {
    const { zens, selectedZenId } = get()
    const filtered = zens.filter((item) => item.id !== id)

    set({
      zens: filtered,
      selectedZenId: selectedZenId === id ? null : selectedZenId,
    })
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () =>
    set({
      zens: [],
      selectedZenId: null,
      activeFolder: "zenbox",
      searchQuery: "",
      showUnreadOnly: false,
      isLoading: false,
      error: null,
    }),
}))

/**
 * Selector hook for retrieving zens filtered by the active folder, unread toggle, and search query.
 */
export function useFilteredZens(): Zen[] {
  const zens = useZenStore((state) => state.zens)
  const activeFolder = useZenStore((state) => state.activeFolder)
  const searchQuery = useZenStore((state) => state.searchQuery)

  return zens.filter((zen) => {
    // Folder filter
    if (
      (activeFolder === "zenbox" || (activeFolder as string) === "inbox") &&
      zen.archived_at
    ) {
      return false
    }
    if (activeFolder === "archived" && !zen.archived_at) {
      return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesName = zen.name.toLowerCase().includes(query)
      const matchesDesc =
        zen.description && zen.description.toLowerCase().includes(query)
      if (!matchesName && !matchesDesc) {
        return false
      }
    }

    return true
  })
}

/**
 * Selector hook for retrieving the currently selected Zen.
 */
export function useSelectedZen(): Zen | null {
  return useZenStore((state) => {
    if (!state.selectedZenId) {
      return null
    }
    return state.zens.find((z) => z.id === state.selectedZenId) ?? null
  })
}

/**
 * Selector hook for total count of active zens in the current folder.
 */
export function useZenCount(): number {
  const zens = useFilteredZens()
  return zens.length
}
