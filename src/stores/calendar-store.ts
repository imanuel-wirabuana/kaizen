import { create } from "zustand"
import type { Calendar, CalendarFolder } from "@/types/calendar"

interface CalendarState {
  calendars: Calendar[]
  selectedCalendarId: number | null
  selectedBatchIds: number[]
  activeFolder: CalendarFolder
  searchQuery: string
  isLoading: boolean
  error: string | null

  // Actions
  setCalendars: (calendars: Calendar[]) => void
  setSelectedCalendarId: (id: number | null) => void
  setActiveFolder: (folder: CalendarFolder) => void
  upsertCalendar: (calendar: Calendar) => void
  removeCalendar: (id: number) => void
  setSearchQuery: (query: string) => void
  toggleBatchSelect: (id: number) => void
  selectAllBatch: (ids: number[]) => void
  clearBatchSelect: () => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  calendars: [],
  selectedCalendarId: null,
  selectedBatchIds: [],
  activeFolder: "calendars",
  searchQuery: "",
  isLoading: true,
  error: null,

  setCalendars: (calendars) => {
    const state = get()
    if (state.calendars === calendars && !state.isLoading) return
    const currentSelectedId = state.selectedCalendarId
    const isSelectedStillValid =
      currentSelectedId === null ||
      calendars.some((c) => c.id === currentSelectedId)

    set({
      calendars,
      selectedCalendarId: isSelectedStillValid ? currentSelectedId : null,
      isLoading: false,
      error: null,
    })
  },

  setSelectedCalendarId: (id) => {
    if (get().selectedCalendarId === id) return
    set({ selectedCalendarId: id })
  },

  setActiveFolder: (folder) => {
    set({ activeFolder: folder, selectedBatchIds: [] })
  },

  upsertCalendar: (calendar) => {
    const { calendars } = get()
    const index = calendars.findIndex((item) => item.id === calendar.id)
    let updatedList: Calendar[]

    if (index >= 0) {
      updatedList = calendars.map((item) =>
        item.id === calendar.id ? calendar : item
      )
    } else {
      updatedList = [calendar, ...calendars]
    }

    set({ calendars: updatedList })
  },

  removeCalendar: (id) => {
    const { calendars, selectedCalendarId, selectedBatchIds } = get()
    const filtered = calendars.filter((item) => item.id !== id)

    set({
      calendars: filtered,
      selectedCalendarId:
        selectedCalendarId === id ? null : selectedCalendarId,
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
      calendars: [],
      selectedCalendarId: null,
      selectedBatchIds: [],
      activeFolder: "calendars",
      searchQuery: "",
      isLoading: false,
      error: null,
    }),
}))

/**
 * Selector hook for retrieving calendars filtered by the active folder and search query.
 */
export function useFilteredCalendars(): Calendar[] {
  const calendars = useCalendarStore((state) => state.calendars)
  const activeFolder = useCalendarStore((state) => state.activeFolder)
  const searchQuery = useCalendarStore((state) => state.searchQuery)

  return calendars.filter((calendar) => {
    // Folder filter: "calendars" means active/unarchived; "archived" means archived
    if (activeFolder === "calendars" && calendar.archived_at) {
      return false
    }
    if (activeFolder === "archived" && !calendar.archived_at) {
      return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesName = calendar.name.toLowerCase().includes(query)
      const matchesDesc =
        calendar.description &&
        calendar.description.toLowerCase().includes(query)
      if (!matchesName && !matchesDesc) {
        return false
      }
    }

    return true
  })
}

/**
 * Selector hook for retrieving the currently selected Calendar.
 */
export function useSelectedCalendar(): Calendar | null {
  return useCalendarStore((state) => {
    if (!state.selectedCalendarId) {
      return null
    }
    return state.calendars.find((c) => c.id === state.selectedCalendarId) ?? null
  })
}

/**
 * Selector hook for counts of all (active) and archived calendars.
 */
export function useCalendarCounts(): {
  allCount: number
  archivedCount: number
} {
  const calendars = useCalendarStore((state) => state.calendars)
  const allCount = calendars.filter((c) => !c.archived_at).length
  const archivedCount = calendars.filter((c) => Boolean(c.archived_at)).length

  return { allCount, archivedCount }
}

/**
 * Selector hook for retrieving currently selected batch calendar IDs.
 */
export function useCalendarBatchSelectedIds(): number[] {
  return useCalendarStore((state) => state.selectedBatchIds)
}
