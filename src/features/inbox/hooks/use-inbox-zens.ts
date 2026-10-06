import { useCallback, useEffect } from "react"
import { useLocation, useRoute } from "wouter"
import { useUser } from "@clerk/clerk-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { queryClient } from "@/lib/query-client"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  useZenStore,
  useFilteredZens,
  useZenCount,
  type InboxFolder,
} from "@/stores/zen-store"
import {
  fetchWorkspaceZens,
  createZenRecord,
  updateZenRecord,
  archiveZenRecord,
  restoreZenRecord,
  deleteZenRecord,
  batchArchiveZenRecords,
  batchRestoreZenRecords,
  batchDeleteZenRecords,
  batchArchiveAndDeleteZenRecords,
  subscribeToZenChanges,
} from "@/features/inbox/services/zen-service"
import { zenKeys } from "@/features/inbox/services/zen-keys"
import type { Zen, UpdateZenInput } from "@/types/zen"

const EMPTY_ZENS: Zen[] = []

export function useInboxZens() {
  const [, setLocation] = useLocation()
  const [isZenboxIdRoute, zenboxParams] = useRoute<{ id: string }>("/zenbox/:id")
  const [isInboxIdRoute, inboxParams] = useRoute<{ id: string }>("/inbox/:id")

  const rawRouteId = isZenboxIdRoute
    ? zenboxParams?.id
    : isInboxIdRoute
      ? inboxParams?.id
      : null
  const parsedId = rawRouteId ? Number.parseInt(rawRouteId, 10) : null
  const selectedZenId =
    parsedId !== null && !Number.isNaN(parsedId) ? parsedId : null

  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. TanStack React Query: Cached Server State
  const {
    data: queryZens,
    isLoading: isQueryLoading,
    error: queryError,
    refetch: refreshZens,
  } = useQuery({
    queryKey: zenKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceZens(workspaceId!),
    enabled: Boolean(workspaceId),
  })

  // Synchronize Zustand client store with React Query cache
  const setZens = useZenStore((state) => state.setZens)
  const resetStore = useZenStore((state) => state.reset)
  const upsertZen = useZenStore((state) => state.upsertZen)
  const removeZen = useZenStore((state) => state.removeZen)

  useEffect(() => {
    if (!workspaceId) {
      resetStore()
      return
    }
    if (queryZens !== undefined) {
      setZens(queryZens)
    }
  }, [queryZens, workspaceId, setZens, resetStore])

  // Synchronize URL route with Zustand selectedZenId
  useEffect(() => {
    if (selectedZenId !== useZenStore.getState().selectedZenId) {
      useZenStore.setState({ selectedZenId })
    }
  }, [selectedZenId])

  // UI state from Zustand & React Query
  const storeZens = useZenStore((state) => state.zens)
  const zens = queryZens ?? storeZens ?? EMPTY_ZENS
  const filteredZens = useFilteredZens()
  const activeFolder = useZenStore((state) => state.activeFolder)
  const showUnreadOnly = useZenStore((state) => state.showUnreadOnly)
  const zenCount = useZenCount()
  const searchQuery = useZenStore((state) => state.searchQuery)
  const selectedBatchIds = useZenStore((state) => state.selectedBatchIds)
  const toggleBatchSelect = useZenStore((state) => state.toggleBatchSelect)
  const selectAllBatch = useZenStore((state) => state.selectAllBatch)
  const clearBatchSelect = useZenStore((state) => state.clearBatchSelect)
  const setActiveFolder = useZenStore((state) => state.setActiveFolder)
  const setShowUnreadOnly = useZenStore((state) => state.setShowUnreadOnly)
  const setSearchQuery = useZenStore((state) => state.setSearchQuery)

  const selectedZen = selectedZenId
    ? zens.find((z) => z.id === selectedZenId) ?? null
    : null

  // 2. Realtime Subscriptions: Update React Query Cache directly (0ms latency)
  useEffect(() => {
    if (!workspaceId) return

    const unsubscribe = subscribeToZenChanges(workspaceId, {
      onInsert: (zen) => {
        queryClient.setQueryData<Zen[]>(
          zenKeys.list(workspaceId),
          (old) => {
            if (!old) return [zen]
            if (old.some((item) => item.id === zen.id)) return old
            return [zen, ...old]
          }
        )
        upsertZen(zen)
      },
      onUpdate: (zen) => {
        queryClient.setQueryData<Zen[]>(
          zenKeys.list(workspaceId),
          (old) => old?.map((item) => (item.id === zen.id ? zen : item)) ?? [zen]
        )
        upsertZen(zen)
      },
      onDelete: (id) => {
        queryClient.setQueryData<Zen[]>(
          zenKeys.list(workspaceId),
          (old) => old?.filter((item) => item.id !== id) ?? []
        )
        removeZen(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, upsertZen, removeZen])

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
      if (!user) throw new Error("Must be signed in to create an item")

      const ownerName =
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "You"

      return createZenRecord({
        workspaceId,
        ownerId: user.id,
        name,
        description,
        settings: {
          owner_name: ownerName,
          owner_image: user.imageUrl || undefined,
          owner_email: user.primaryEmailAddress?.emailAddress || undefined,
        },
      })
    },
    onSuccess: (newZen) => {
      if (!workspaceId) return
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) => (old ? [newZen, ...old] : [newZen])
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      upsertZen(newZen)
      toast.success("Zen item created", {
        description: `"${newZen.name}" is ready to edit.`,
      })
      setLocation(`/zenbox/${newZen.id}`)
    },
    onError: (error) => {
      toast.error("Failed to create Zen item", {
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
      updates: UpdateZenInput
    }) => {
      return updateZenRecord(id, updates)
    },
    onSuccess: (updated) => {
      if (!workspaceId) return
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) => old?.map((item) => (item.id === updated.id ? updated : item)) ?? [updated]
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      upsertZen(updated)
    },
    onError: (error) => {
      toast.error("Failed to save changes", {
        description: (error as Error).message || "Unable to save zen item updates.",
      })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      return archiveZenRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      const existing = zens.find((z) => z.id === id)
      if (existing) {
        const archivedItem: Zen = {
          ...existing,
          archived_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Zen[]>(
          zenKeys.list(workspaceId),
          (old) => old?.map((item) => (item.id === id ? archivedItem : item)) ?? []
        )
        upsertZen(archivedItem)
        toast.success("Zen item archived", {
          description: `"${existing.name}" moved to the archive folder.`,
        })
      }
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
    },
    onError: (error) => {
      toast.error("Failed to archive Zen item", {
        description: (error as Error).message || "Unable to archive zen item.",
      })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      return restoreZenRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      const existing = zens.find((z) => z.id === id)
      if (existing) {
        const restoredItem: Zen = { ...existing, archived_at: null }
        queryClient.setQueryData<Zen[]>(
          zenKeys.list(workspaceId),
          (old) => old?.map((item) => (item.id === id ? restoredItem : item)) ?? []
        )
        upsertZen(restoredItem)
        toast.success("Zen item restored", {
          description: `"${existing.name}" returned to active Zenbox.`,
        })
      }
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
    },
    onError: (error) => {
      toast.error("Failed to restore Zen item", {
        description: (error as Error).message || "Unable to restore zen item.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const target = zens.find((z) => z.id === id)
      if (target && !target.archived_at) {
        throw new Error("Zen item must be archived before it can be permanently deleted")
      }
      return deleteZenRecord(id)
    },
    onSuccess: (success, id) => {
      if (!success || !workspaceId) return
      const existing = zens.find((z) => z.id === id)
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) => old?.filter((item) => item.id !== id) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      removeZen(id)
      toast.success("Zen item deleted", {
        description: existing
          ? `"${existing.name}" permanently deleted.`
          : "Item permanently deleted.",
      })
      if (selectedZenId === id) {
        setLocation("/zenbox")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete Zen item", {
        description: (error as Error).message || "Unable to permanently delete zen item.",
      })
    },
  })

  const batchArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchArchiveZenRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      const nowIso = new Date().toISOString()
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: nowIso } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      for (const id of ids) {
        const item = zens.find((z) => z.id === id)
        if (item) upsertZen({ ...item, archived_at: nowIso })
      }
      clearBatchSelect()
      toast.success("Items archived", {
        description: `${ids.length} ${ids.length === 1 ? "item" : "items"} moved to archive.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to archive items", {
        description: (error as Error).message || "Unable to archive selected items.",
      })
    },
  })

  const batchRestoreMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchRestoreZenRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) =>
          old?.map((item) =>
            ids.includes(item.id) ? { ...item, archived_at: null } : item
          ) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      for (const id of ids) {
        const item = zens.find((z) => z.id === id)
        if (item) upsertZen({ ...item, archived_at: null })
      }
      clearBatchSelect()
      toast.success("Items restored", {
        description: `${ids.length} ${ids.length === 1 ? "item" : "items"} returned to active Zenbox.`,
      })
    },
    onError: (error) => {
      toast.error("Failed to restore items", {
        description: (error as Error).message || "Unable to restore selected items.",
      })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchDeleteZenRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) => old?.filter((item) => !ids.includes(item.id)) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      for (const id of ids) {
        removeZen(id)
      }
      clearBatchSelect()
      toast.success("Items deleted", {
        description: `${ids.length} ${ids.length === 1 ? "item" : "items"} permanently deleted.`,
      })
      if (selectedZenId !== null && ids.includes(selectedZenId)) {
        setLocation("/zenbox")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete items", {
        description: (error as Error).message || "Unable to delete selected items.",
      })
    },
  })

  const batchArchiveAndDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 0) return true
      return batchArchiveAndDeleteZenRecords(ids)
    },
    onSuccess: (success, ids) => {
      if (!success || !workspaceId) return
      queryClient.setQueryData<Zen[]>(
        zenKeys.list(workspaceId),
        (old) => old?.filter((item) => !ids.includes(item.id)) ?? []
      )
      void queryClient.invalidateQueries({ queryKey: zenKeys.list(workspaceId) })
      for (const id of ids) {
        removeZen(id)
      }
      clearBatchSelect()
      toast.success("Items deleted", {
        description: `${ids.length} ${ids.length === 1 ? "item" : "items"} permanently removed.`,
      })
      if (selectedZenId !== null && ids.includes(selectedZenId)) {
        setLocation("/zenbox")
      }
    },
    onError: (error) => {
      toast.error("Failed to delete items", {
        description: (error as Error).message || "Unable to delete selected items.",
      })
    },
  })

  const createZen = async (
    name: string,
    description?: string
  ): Promise<Zen> => {
    return createMutation.mutateAsync({ name, description })
  }

  const updateZen = async (
    id: number,
    updates: UpdateZenInput
  ): Promise<Zen> => {
    return updateMutation.mutateAsync({ id, updates })
  }

  const archiveZen = async (id: number): Promise<boolean> => {
    return archiveMutation.mutateAsync(id)
  }

  const restoreZen = async (id: number): Promise<boolean> => {
    return restoreMutation.mutateAsync(id)
  }

  const deleteZen = async (id: number): Promise<boolean> => {
    return deleteMutation.mutateAsync(id)
  }

  const batchArchiveZens = async (ids: number[]): Promise<boolean> => {
    return batchArchiveMutation.mutateAsync(ids)
  }

  const batchRestoreZens = async (ids: number[]): Promise<boolean> => {
    return batchRestoreMutation.mutateAsync(ids)
  }

  const batchDeleteZens = async (ids: number[]): Promise<boolean> => {
    return batchDeleteMutation.mutateAsync(ids)
  }

  const batchArchiveAndDeleteZens = async (ids: number[]): Promise<boolean> => {
    return batchArchiveAndDeleteMutation.mutateAsync(ids)
  }

  const navigateToZen = useCallback(
    (id: number | null) => {
      if (id !== null) {
        setLocation(`/zenbox/${id}`)
      } else {
        setLocation("/zenbox")
      }
    },
    [setLocation]
  )

  const handleSelectFolder = useCallback(
    (folder: InboxFolder) => {
      setActiveFolder(folder)
      if (selectedZen) {
        const isStillVisible =
          folder === "zenbox"
            ? !selectedZen.archived_at
            : Boolean(selectedZen.archived_at)
        if (!isStillVisible) {
          setLocation("/zenbox")
        }
      }
    },
    [selectedZen, setActiveFolder, setLocation]
  )

  return {
    zens,
    filteredZens,
    selectedZen,
    selectedZenId,
    activeFolder,
    showUnreadOnly,
    zenCount,
    searchQuery,
    selectedBatchIds,
    isLoading: isQueryLoading,
    error: queryError ? (queryError as Error).message : null,
    createZen,
    updateZen,
    archiveZen,
    restoreZen,
    deleteZen,
    batchArchiveZens,
    batchRestoreZens,
    batchDeleteZens,
    batchArchiveAndDeleteZens,
    toggleBatchSelect,
    selectAllBatch,
    clearBatchSelect,
    setSelectedZenId: navigateToZen,
    setActiveFolder: handleSelectFolder,
    setShowUnreadOnly,
    setSearchQuery,
    refreshZens,
  }
}

export { useInboxZens as useZenboxZens }
export default useInboxZens
