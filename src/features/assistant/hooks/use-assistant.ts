import { useCallback, useEffect } from "react"
import { useLocation, useRoute } from "wouter"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  useAssistantStore,
  useFilteredThreads,
  useAssistantCounts,
  useSelectedThread,
  useAssistantBatchSelectedIds,
} from "@/stores/assistant-store"
import {
  fetchWorkspaceThreads,
  createThreadRecord,
  updateThreadRecord,
  archiveThreadRecord,
  restoreThreadRecord,
  deleteThreadRecord,
  batchArchiveThreadRecords,
  batchRestoreThreadRecords,
  batchDeleteThreadRecords,
  subscribeToAssistantChanges,
} from "@/features/assistant/services/assistant-service"
import { assistantKeys } from "@/features/assistant/services/assistant-keys"
import type {
  AiThread,
  AssistantFolder,
  UpdateAiThreadInput,
} from "@/types/assistant"

export interface UseAssistantOptions {
  /**
   * When true (used by /assistant and /assistant/:id page), synchronizes route params
   * and performs URL navigation. When false (default, used by right sidebar), operates
   * standalone via Zustand without affecting browser location.
   */
  syncUrl?: boolean
}

export function useAssistant(options: UseAssistantOptions = {}) {
  const { syncUrl = false } = options
  const [, setLocation] = useLocation()
  const [isAssistantIdRoute, assistantParams] = useRoute<{ id: string }>(
    "/assistant/:id"
  )
  const [isExactAssistantRoute] = useRoute("/assistant")

  const rawRouteId = syncUrl && isAssistantIdRoute ? assistantParams?.id : null
  const parsedId = rawRouteId ? Number.parseInt(rawRouteId, 10) : null
  const routeThreadId =
    parsedId !== null && !Number.isNaN(parsedId) ? parsedId : null

  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // TanStack React Query: Cached Server State
  const {
    data: queryThreads,
    isLoading: isQueryLoading,
    refetch: refreshThreads,
  } = useQuery({
    queryKey: assistantKeys.threadList(workspaceId),
    queryFn: () => fetchWorkspaceThreads(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // Synchronize Zustand client store with React Query cache
  const setThreads = useAssistantStore((state) => state.setThreads)
  const resetStore = useAssistantStore((state) => state.reset)
  const upsertThread = useAssistantStore((state) => state.upsertThread)
  const removeThread = useAssistantStore((state) => state.removeThread)
  const selectedThreadId = useAssistantStore((state) => state.selectedThreadId)
  const setSelectedThreadIdStore = useAssistantStore(
    (state) => state.setSelectedThreadId
  )
  const activeFolder = useAssistantStore((state) => state.activeFolder)
  const setActiveFolder = useAssistantStore((state) => state.setActiveFolder)
  const searchQuery = useAssistantStore((state) => state.searchQuery)
  const setSearchQuery = useAssistantStore((state) => state.setSearchQuery)
  const modelName = useAssistantStore((state) => state.modelName)
  const setModelName = useAssistantStore((state) => state.setModelName)
  const selectAllBatch = useAssistantStore((state) => state.selectAllBatch)
  const clearBatchSelect = useAssistantStore((state) => state.clearBatchSelect)
  const selectedBatchIds = useAssistantBatchSelectedIds()

  const threads = useAssistantStore((state) => state.threads)
  const filteredThreads = useFilteredThreads()
  const selectedThread = useSelectedThread()
  const { activeCount, archivedCount } = useAssistantCounts()

  // Sync threads query to Zustand
  useEffect(() => {
    if (!workspaceId) {
      resetStore()
      return
    }
    if (queryThreads) {
      setThreads(queryThreads)
    }
  }, [queryThreads, workspaceId, setThreads, resetStore])

  // Sync route param with Zustand selectedThreadId when syncUrl is enabled
  useEffect(() => {
    if (!syncUrl) return
    if (routeThreadId !== null && routeThreadId !== selectedThreadId) {
      setSelectedThreadIdStore(routeThreadId)
    }
  }, [syncUrl, routeThreadId, selectedThreadId, setSelectedThreadIdStore])

  // Auto-redirect when accessing /assistant: consume persisted selectedThreadId from Zustand
  useEffect(() => {
    if (!syncUrl || !isExactAssistantRoute) return
    if (isQueryLoading || !queryThreads) return

    const activeThreads = queryThreads.filter((t) => !t.archived_at)
    if (activeThreads.length === 0) return

    const targetId =
      selectedThreadId !== null &&
      activeThreads.some((t) => t.id === selectedThreadId)
        ? selectedThreadId
        : activeThreads[0]?.id

    if (targetId) {
      setSelectedThreadIdStore(targetId)
      setLocation(`/assistant/${targetId}`, { replace: true })
    }
  }, [
    syncUrl,
    isExactAssistantRoute,
    isQueryLoading,
    queryThreads,
    selectedThreadId,
    setSelectedThreadIdStore,
    setLocation,
  ])

  // Hydrate active model from selected thread settings
  useEffect(() => {
    const threadModel = selectedThread?.settings?.model
    if (typeof threadModel === "string" && threadModel.trim()) {
      if (threadModel !== modelName) {
        setModelName(threadModel)
      }
    }
  }, [selectedThread?.id, selectedThread?.settings?.model, modelName, setModelName])

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return

    const unsubscribe = subscribeToAssistantChanges(workspaceId, {
      onInsertThread: (thread) => {
        queryClient.setQueryData<AiThread[]>(
          assistantKeys.threadList(workspaceId),
          (old) => {
            if (!old) return [thread]
            if (old.some((item) => item.id === thread.id)) return old
            return [thread, ...old]
          }
        )
        upsertThread(thread)
      },
      onUpdateThread: (thread) => {
        queryClient.setQueryData<AiThread[]>(
          assistantKeys.threadList(workspaceId),
          (old) =>
            old?.map((item) => (item.id === thread.id ? thread : item)) ?? [
              thread,
            ]
        )
        upsertThread(thread)
      },
      onDeleteThread: (id) => {
        queryClient.setQueryData<AiThread[]>(
          assistantKeys.threadList(workspaceId),
          (old) => old?.filter((item) => item.id !== id) ?? []
        )
        removeThread(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, upsertThread, removeThread])

  // Select Thread handler
  const setSelectedThreadId = useCallback(
    (id: number | null) => {
      setSelectedThreadIdStore(id)
      if (syncUrl) {
        if (id !== null) {
          setLocation(`/assistant/${id}`)
        } else {
          setLocation("/assistant")
        }
      }
    },
    [syncUrl, setSelectedThreadIdStore, setLocation]
  )

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ title = "new convo" }: { title?: string }) => {
      if (!workspaceId) throw new Error("No active workspace selected")
      if (!user?.id) throw new Error("User authentication required")

      return createThreadRecord({
        workspaceId,
        ownerId: user.id,
        title,
        settings: {
          model: modelName,
          owner_name: user.fullName || user.username || "You",
          owner_image: user.imageUrl,
        },
      })
    },
    onSuccess: (newThread) => {
      if (!workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) => (old ? [newThread, ...old] : [newThread])
      )
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.threadList(workspaceId),
      })
      upsertThread(newThread)
      setSelectedThreadId(newThread.id)
      toast.success("New conversation started", {
        description: `Thread "${newThread.title}" created.`,
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to create conversation", {
        description: err.message,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number
      updates: UpdateAiThreadInput
    }) => {
      return updateThreadRecord(id, updates)
    },
    onSuccess: (updatedThread) => {
      if (!workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === updatedThread.id ? updatedThread : item
          ) ?? [updatedThread]
      )
      upsertThread(updatedThread)
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.threadDetail(updatedThread.id),
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to update conversation", {
        description: err.message,
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      return archiveThreadRecord(id)
    },
    onSuccess: (archivedThread) => {
      if (!workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === archivedThread.id ? archivedThread : item
          ) ?? [archivedThread]
      )
      upsertThread(archivedThread)
      toast.success("Conversation archived", {
        description: `"${archivedThread.title}" moved to archived.`,
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to archive conversation", {
        description: err.message,
      })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      return restoreThreadRecord(id)
    },
    onSuccess: (restoredThread) => {
      if (!workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) =>
          old?.map((item) =>
            item.id === restoredThread.id ? restoredThread : item
          ) ?? [restoredThread]
      )
      upsertThread(restoredThread)
      toast.success("Conversation restored", {
        description: `"${restoredThread.title}" restored.`,
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to restore conversation", {
        description: err.message,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const target = threads.find((t) => t.id === id)
      if (target && !target.archived_at) {
        throw new Error(
          "Conversation must be archived before it can be permanently deleted"
        )
      }
      return deleteThreadRecord(id)
    },
    onSuccess: (_, id) => {
      if (!workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) => old?.filter((item) => item.id !== id) ?? []
      )
      removeThread(id)
      if (selectedThreadId === id) {
        setSelectedThreadId(null)
      }
      toast.success("Conversation deleted", {
        description: "Conversation permanently removed.",
      })
    },
    onError: (err: Error) => {
      toast.error("Failed to delete conversation", {
        description: err.message,
      })
    },
  })

  const batchArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchArchiveThreadRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      const archivedAt = new Date().toISOString()
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: archivedAt } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.threadList(workspaceId),
      })
      for (const id of ids) {
        const item = threads.find((t) => t.id === id)
        if (item) upsertThread({ ...item, archived_at: archivedAt })
      }
      clearBatchSelect()
      toast.success("Conversations archived", {
        description: `${ids.length} ${ids.length === 1 ? "conversation" : "conversations"} moved to archived.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to archive conversations", {
        description: (error as Error).message || "Unable to archive selected conversations.",
      })
    },
  })

  const batchRestoreMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchRestoreThreadRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: null } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.threadList(workspaceId),
      })
      for (const id of ids) {
        const item = threads.find((t) => t.id === id)
        if (item) upsertThread({ ...item, archived_at: null })
      }
      clearBatchSelect()
      toast.success("Conversations restored", {
        description: `${ids.length} ${ids.length === 1 ? "conversation" : "conversations"} restored.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to restore conversations", {
        description: (error as Error).message || "Unable to restore selected conversations.",
      })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchDeleteThreadRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<AiThread[]>(
        assistantKeys.threadList(workspaceId),
        (old) => old?.filter((item) => !ids.includes(item.id)) ?? []
      )
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.threadList(workspaceId),
      })
      for (const id of ids) {
        removeThread(id)
      }
      clearBatchSelect()
      toast.success("Conversations deleted", {
        description: `${ids.length} ${ids.length === 1 ? "conversation" : "conversations"} permanently deleted.`,
      })
      if (selectedThreadId && ids.includes(selectedThreadId)) {
        setSelectedThreadId(null)
      }
    },
    onError: (error) => {
      toast.error("Failed to delete conversations", {
        description: (error as Error).message || "Unable to delete selected conversations.",
      })
    },
  })

  const changeModel = useCallback(
    async (newModel: string) => {
      setModelName(newModel)

      if (selectedThread?.id) {
        try {
          const currentSettings = selectedThread.settings || {}
          await updateMutation.mutateAsync({
            id: selectedThread.id,
            updates: {
              settings: {
                ...currentSettings,
                model: newModel,
              },
            },
          })
          toast.success("Model updated", {
            description: `Conversation model set to "${newModel}".`,
          })
        } catch (err: unknown) {
          toast.error("Failed to update thread model", {
            description: (err as Error).message || "An error occurred.",
          })
        }
      }
    },
    [selectedThread, setModelName, updateMutation]
  )

  return {
    threads: queryThreads ?? [],
    filteredThreads,
    selectedThread,
    selectedThreadId,
    activeFolder,
    searchQuery,
    modelName,
    activeCount,
    archivedCount,
    isLoading: isQueryLoading,
    isCreating: createMutation.isPending,
    selectedBatchIds,
    selectAllBatch,
    clearBatchSelect,
    setSelectedThreadId,
    setActiveFolder: (folder: AssistantFolder) => setActiveFolder(folder),
    setSearchQuery,
    setModelName,
    changeModel,
    refreshThreads,
    createThread: (title?: string) => createMutation.mutateAsync({ title }),
    updateThread: (id: number, updates: UpdateAiThreadInput) =>
      updateMutation.mutateAsync({ id, updates }),
    archiveThread: (id: number) => archiveMutation.mutateAsync(id),
    restoreThread: (id: number) => restoreMutation.mutateAsync(id),
    deleteThread: (id: number) => deleteMutation.mutateAsync(id),
    batchArchiveThreads: (ids: number[]) =>
      batchArchiveMutation.mutateAsync(ids),
    batchRestoreThreads: (ids: number[]) =>
      batchRestoreMutation.mutateAsync(ids),
    batchDeleteThreads: (ids: number[]) =>
      batchDeleteMutation.mutateAsync(ids),
  }
}
