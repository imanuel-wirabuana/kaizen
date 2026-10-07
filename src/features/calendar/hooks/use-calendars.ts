import { useCallback, useEffect } from "react"
import { useLocation, useRoute } from "wouter"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  useCalendarStore,
  useFilteredCalendars,
  useCalendarCounts,
} from "@/stores/calendar-store"
import {
  fetchWorkspaceCalendars,
  createCalendarRecord,
  updateCalendarRecord,
  archiveCalendarRecord,
  restoreCalendarRecord,
  deleteCalendarRecord,
  batchArchiveCalendarRecords,
  batchRestoreCalendarRecords,
  batchDeleteCalendarRecords,
  subscribeToCalendarChanges,
} from "@/features/calendar/services/calendar-service"
import { calendarKeys } from "@/features/calendar/services/calendar-keys"
import type { Calendar, CalendarFolder, UpdateCalendarInput } from "@/types/calendar"

const EMPTY_CALENDARS: Calendar[] = []

export function useCalendars() {
  const [, setLocation] = useLocation()
  const [isCalendarIdRoute, calendarParams] = useRoute<{ id: string }>(
    "/calendars/:id"
  )

  const rawRouteId = isCalendarIdRoute ? calendarParams?.id : null
  const parsedId = rawRouteId ? Number.parseInt(rawRouteId, 10) : null
  const selectedCalendarId =
    parsedId !== null && !Number.isNaN(parsedId) ? parsedId : null

  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. TanStack React Query: Cached Server State
  const {
    data: queryCalendars,
    isLoading: isQueryLoading,
    refetch: refreshCalendars,
  } = useQuery({
    queryKey: calendarKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceCalendars(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // Synchronize Zustand client store with React Query cache
  const setCalendars = useCalendarStore((state) => state.setCalendars)
  const resetStore = useCalendarStore((state) => state.reset)
  const upsertCalendar = useCalendarStore((state) => state.upsertCalendar)
  const removeCalendar = useCalendarStore((state) => state.removeCalendar)

  useEffect(() => {
    if (!workspaceId) {
      resetStore()
      return
    }
    if (queryCalendars !== undefined) {
      setCalendars(queryCalendars)
    }
  }, [queryCalendars, workspaceId, setCalendars, resetStore])

  // Synchronize URL route with Zustand selectedCalendarId
  useEffect(() => {
    if (selectedCalendarId !== useCalendarStore.getState().selectedCalendarId) {
      useCalendarStore.setState({ selectedCalendarId })
    }
  }, [selectedCalendarId])

  // UI state from Zustand & React Query
  const storeCalendars = useCalendarStore((state) => state.calendars)
  const calendars = queryCalendars ?? storeCalendars ?? EMPTY_CALENDARS
  const filteredCalendars = useFilteredCalendars()
  const activeFolder = useCalendarStore((state) => state.activeFolder)
  const { allCount, archivedCount } = useCalendarCounts()
  const searchQuery = useCalendarStore((state) => state.searchQuery)
  const selectedBatchIds = useCalendarStore((state) => state.selectedBatchIds)
  const toggleBatchSelect = useCalendarStore((state) => state.toggleBatchSelect)
  const selectAllBatch = useCalendarStore((state) => state.selectAllBatch)
  const clearBatchSelect = useCalendarStore((state) => state.clearBatchSelect)
  const setActiveFolder = useCalendarStore((state) => state.setActiveFolder)
  const setSearchQuery = useCalendarStore((state) => state.setSearchQuery)

  const selectedCalendar = selectedCalendarId
    ? calendars.find((c) => c.id === selectedCalendarId) ?? null
    : null

  // 2. Realtime Subscriptions: Update React Query Cache directly (0ms latency)
  useEffect(() => {
    if (!workspaceId) return

    const unsubscribe = subscribeToCalendarChanges(workspaceId, {
      onInsert: (calendar) => {
        queryClient.setQueryData<Calendar[]>(
          calendarKeys.list(workspaceId),
          (old) => {
            if (!old) return [calendar]
            if (old.some((item) => item.id === calendar.id)) return old
            return [calendar, ...old]
          }
        )
        upsertCalendar(calendar)
      },
      onUpdate: (calendar) => {
        queryClient.setQueryData<Calendar[]>(
          calendarKeys.list(workspaceId),
          (old) =>
            old?.map((item) =>
              item.id === calendar.id ? calendar : item
            ) ?? [calendar]
        )
        upsertCalendar(calendar)
      },
      onDelete: (id) => {
        queryClient.setQueryData<Calendar[]>(
          calendarKeys.list(workspaceId),
          (old) => old?.filter((item) => item.id !== id) ?? []
        )
        removeCalendar(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, upsertCalendar, removeCalendar])

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
      if (!user) throw new Error("Must be signed in to create a calendar")

      return createCalendarRecord({
        workspaceId,
        ownerId: user.id,
        name,
        description,
      })
    },
    onSuccess: (newCalendar) => {
      if (!workspaceId) return
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) => (old ? [newCalendar, ...old] : [newCalendar])
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      upsertCalendar(newCalendar)
      setLocation(`/calendars/${newCalendar.id}`)
      toast.success("Calendar created", {
        description: `"${newCalendar.name}" has been created successfully.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to create calendar", {
        description:
          (error as Error).message || "An unexpected error occurred.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number
      updates: UpdateCalendarInput
    }) => {
      return updateCalendarRecord(id, updates)
    },
    onSuccess: (updatedCalendar) => {
      if (!workspaceId) return
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === updatedCalendar.id ? updatedCalendar : item
          ) ?? [updatedCalendar]
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      upsertCalendar(updatedCalendar)
      toast.success("Calendar updated", {
        description: `"${updatedCalendar.name}" has been updated.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update calendar", {
        description:
          (error as Error).message || "An unexpected error occurred.",
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      return archiveCalendarRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      const archivedAt = new Date().toISOString()
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === id ? { ...item, archived_at: archivedAt } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      const item = calendars.find((c) => c.id === id)
      if (item) upsertCalendar({ ...item, archived_at: archivedAt })
      toast.success("Calendar archived", {
        description: "Calendar moved to the archived section.",
      })
    },
    onError: (error) => {
      toast.error("Failed to archive calendar", {
        description:
          (error as Error).message || "Unable to archive calendar.",
      })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      return restoreCalendarRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === id ? { ...item, archived_at: null } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      const item = calendars.find((c) => c.id === id)
      if (item) upsertCalendar({ ...item, archived_at: null })
      toast.success("Calendar restored", {
        description: "Calendar returned to active calendars.",
      })
    },
    onError: (error) => {
      toast.error("Failed to restore calendar", {
        description:
          (error as Error).message || "Unable to restore calendar.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const target = calendars.find((c) => c.id === id)
      if (target && !target.archived_at) {
        throw new Error(
          "Calendar must be archived before it can be permanently deleted"
        )
      }
      return deleteCalendarRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) => old?.filter((item) => item.id !== id) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      removeCalendar(id)
      toast.success("Calendar deleted", {
        description: "Calendar has been permanently removed.",
      })
      if (selectedCalendarId === id) {
        setLocation("/calendars")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete calendar", {
        description:
          (error as Error).message || "Unable to delete calendar.",
      })
    },
  })

  const batchArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchArchiveCalendarRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      const archivedAt = new Date().toISOString()
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: archivedAt } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      for (const id of ids) {
        const item = calendars.find((c) => c.id === id)
        if (item) upsertCalendar({ ...item, archived_at: archivedAt })
      }
      clearBatchSelect()
      toast.success("Calendars archived", {
        description: `${ids.length} ${ids.length === 1 ? "calendar" : "calendars"} moved to archived.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to archive calendars", {
        description:
          (error as Error).message || "Unable to archive selected calendars.",
      })
    },
  })

  const batchRestoreMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchRestoreCalendarRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: null } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      for (const id of ids) {
        const item = calendars.find((c) => c.id === id)
        if (item) upsertCalendar({ ...item, archived_at: null })
      }
      clearBatchSelect()
      toast.success("Calendars restored", {
        description: `${ids.length} ${ids.length === 1 ? "calendar" : "calendars"} restored to active calendars.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to restore calendars", {
        description:
          (error as Error).message || "Unable to restore selected calendars.",
      })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      const nonArchived = calendars.filter(
        (c) => ids.includes(c.id) && !c.archived_at
      )
      if (nonArchived.length > 0) {
        throw new Error(
          "Calendars must be archived before they can be permanently deleted"
        )
      }
      return batchDeleteCalendarRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Calendar[]>(
        calendarKeys.list(workspaceId),
        (old) => old?.filter((item) => !ids.includes(item.id)) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: calendarKeys.list(workspaceId),
      })
      for (const id of ids) {
        removeCalendar(id)
      }
      clearBatchSelect()
      toast.success("Calendars deleted", {
        description: `${ids.length} ${ids.length === 1 ? "calendar" : "calendars"} permanently deleted.`,
      })
      if (selectedCalendarId !== null && ids.includes(selectedCalendarId)) {
        setLocation("/calendars")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete calendars", {
        description:
          (error as Error).message || "Unable to delete selected calendars.",
      })
    },
  })

  const createCalendar = async (
    name: string = "Untitled Calendar",
    description?: string
  ): Promise<Calendar> => {
    return createMutation.mutateAsync({ name, description })
  }

  const updateCalendar = async (
    id: number,
    updates: UpdateCalendarInput
  ): Promise<Calendar> => {
    return updateMutation.mutateAsync({ id, updates })
  }

  const archiveCalendar = async (id: number): Promise<boolean> => {
    return archiveMutation.mutateAsync(id)
  }

  const restoreCalendar = async (id: number): Promise<boolean> => {
    return restoreMutation.mutateAsync(id)
  }

  const deleteCalendar = async (id: number): Promise<boolean> => {
    return deleteMutation.mutateAsync(id)
  }

  const handleSelectFolder = useCallback(
    (folder: CalendarFolder) => {
      setActiveFolder(folder)
      if (selectedCalendar) {
        const isStillVisible =
          folder === "calendars"
            ? !selectedCalendar.archived_at
            : Boolean(selectedCalendar.archived_at)
        if (!isStillVisible) {
          setLocation("/calendars")
        }
      }
    },
    [selectedCalendar, setActiveFolder, setLocation]
  )

  return {
    calendars,
    filteredCalendars,
    selectedCalendar,
    selectedCalendarId,
    activeFolder,
    allCount,
    archivedCount,
    searchQuery,
    isLoading: isQueryLoading,
    selectedBatchIds,
    toggleBatchSelect,
    selectAllBatch,
    clearBatchSelect,
    createCalendar,
    updateCalendar,
    archiveCalendar,
    restoreCalendar,
    deleteCalendar,
    batchArchiveCalendars: (ids: number[]) => batchArchiveMutation.mutateAsync(ids),
    batchRestoreCalendars: (ids: number[]) => batchRestoreMutation.mutateAsync(ids),
    batchDeleteCalendars: (ids: number[]) => batchDeleteMutation.mutateAsync(ids),
    refreshCalendars,
    setSelectedCalendarId: (id: number | null) => {
      if (id) {
        setLocation(`/calendars/${id}`)
      } else {
        setLocation("/calendars")
      }
    },
    setActiveFolder: handleSelectFolder,
    setSearchQuery,
  }
}
