import { useCallback, useEffect } from "react"
import { useUser } from "@clerk/clerk-react"
import { useActiveWorkspace } from "@/stores/workspace-store"
import {
  useZenStore,
  useFilteredZens,
  useSelectedZen,
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
  subscribeToZenChanges,
} from "@/features/inbox/services/zen-service"
import type { Zen, UpdateZenInput } from "@/types/zen"

export function useInboxZens() {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  const zens = useZenStore((state) => state.zens)
  const filteredZens = useFilteredZens()
  const selectedZen = useSelectedZen()
  const selectedZenId = useZenStore((state) => state.selectedZenId)
  const activeFolder = useZenStore((state) => state.activeFolder)
  const showUnreadOnly = useZenStore((state) => state.showUnreadOnly)
  const zenCount = useZenCount()
  const searchQuery = useZenStore((state) => state.searchQuery)
  const isLoading = useZenStore((state) => state.isLoading)
  const error = useZenStore((state) => state.error)

  const setZens = useZenStore((state) => state.setZens)
  const setSelectedZenId = useZenStore((state) => state.setSelectedZenId)
  const setActiveFolder = useZenStore((state) => state.setActiveFolder)
  const setShowUnreadOnly = useZenStore((state) => state.setShowUnreadOnly)
  const upsertZen = useZenStore((state) => state.upsertZen)
  const removeZen = useZenStore((state) => state.removeZen)
  const setSearchQuery = useZenStore((state) => state.setSearchQuery)
  const setIsLoading = useZenStore((state) => state.setIsLoading)
  const setError = useZenStore((state) => state.setError)
  const resetStore = useZenStore((state) => state.reset)

  // Fetch Zens for the active workspace
  const refreshZens = useCallback(async () => {
    if (!workspaceId) {
      resetStore()
      return
    }

    try {
      setIsLoading(true)
      const data = await fetchWorkspaceZens(workspaceId)
      setZens(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load inbox items"
      setError(message)
    }
  }, [workspaceId, resetStore, setIsLoading, setZens, setError])

  // Lifecycle: fetch when workspace changes and subscribe to Realtime updates
  useEffect(() => {
    if (!workspaceId) {
      resetStore()
      return
    }

    void refreshZens()

    const unsubscribe = subscribeToZenChanges(workspaceId, {
      onInsert: (zen) => {
        upsertZen(zen)
      },
      onUpdate: (zen) => {
        upsertZen(zen)
      },
      onDelete: (id) => {
        removeZen(id)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [workspaceId, refreshZens, upsertZen, removeZen, resetStore])

  // Create a new Zen
  const createZen = async (
    name: string,
    description?: string
  ): Promise<Zen> => {
    if (!workspaceId) {
      throw new Error("No active workspace selected")
    }
    if (!user) {
      throw new Error("Must be signed in to create an item")
    }

    const newZen = await createZenRecord({
      workspaceId,
      ownerId: user.id,
      name,
      description,
      settings: {},
    })

    upsertZen(newZen)
    setSelectedZenId(newZen.id)
    return newZen
  }

  // Update a Zen
  const updateZen = async (
    id: number,
    updates: UpdateZenInput
  ): Promise<Zen> => {
    const updated = await updateZenRecord(id, updates)
    upsertZen(updated)
    return updated
  }

  // Archive a Zen
  const archiveZen = async (id: number): Promise<boolean> => {
    const success = await archiveZenRecord(id)
    if (success) {
      // Fetch updated or update locally
      const existing = zens.find((z) => z.id === id)
      if (existing) {
        upsertZen({ ...existing, archived_at: new Date().toISOString() })
      }
    }
    return success
  }

  // Restore a Zen
  const restoreZen = async (id: number): Promise<boolean> => {
    const success = await restoreZenRecord(id)
    if (success) {
      const existing = zens.find((z) => z.id === id)
      if (existing) {
        upsertZen({ ...existing, archived_at: null })
      }
    }
    return success
  }

  // Delete a Zen permanently
  const deleteZen = async (id: number): Promise<boolean> => {
    const success = await deleteZenRecord(id)
    if (success) {
      removeZen(id)
    }
    return success
  }

  return {
    zens,
    filteredZens,
    selectedZen,
    selectedZenId,
    activeFolder,
    showUnreadOnly,
    zenCount,
    searchQuery,
    isLoading,
    error,
    createZen,
    updateZen,
    archiveZen,
    restoreZen,
    deleteZen,
    setSelectedZenId,
    setActiveFolder: (folder: InboxFolder) => setActiveFolder(folder),
    setShowUnreadOnly,
    setSearchQuery,
    refreshZens,
  }
}
