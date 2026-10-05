import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Workspace } from "@/types/workspace"

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: number | null
  isLoading: boolean
  error: string | null

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void
  setActiveWorkspaceId: (id: number | null) => void
  upsertWorkspace: (workspace: Workspace) => void
  removeWorkspace: (id: number) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const STORAGE_NAME = "kaizen-workspace-storage"

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      isLoading: true,
      error: null,

      setWorkspaces: (workspaces) => {
        const currentActiveId = get().activeWorkspaceId
        const hasValidActive = workspaces.some((w) => w.id === currentActiveId)

        set({
          workspaces,
          activeWorkspaceId: hasValidActive
            ? currentActiveId
            : workspaces.length > 0
              ? workspaces[0].id
              : null,
          isLoading: false,
          error: null,
        })
      },

      setActiveWorkspaceId: (id) => {
        set({ activeWorkspaceId: id })
      },

      upsertWorkspace: (workspace) => {
        const { workspaces, activeWorkspaceId } = get()

        if (workspace.archived_at) {
          // If archived, remove it
          const filtered = workspaces.filter((w) => w.id !== workspace.id)
          const nextActiveId =
            activeWorkspaceId === workspace.id
              ? filtered.length > 0
                ? filtered[0].id
                : null
              : activeWorkspaceId

          set({
            workspaces: filtered,
            activeWorkspaceId: nextActiveId,
          })
          return
        }

        const existingIndex = workspaces.findIndex((w) => w.id === workspace.id)
        let updatedList: Workspace[]

        if (existingIndex >= 0) {
          updatedList = workspaces.map((w) =>
            w.id === workspace.id ? workspace : w
          )
        } else {
          updatedList = [...workspaces, workspace]
        }

        set({
          workspaces: updatedList,
          activeWorkspaceId: activeWorkspaceId ?? workspace.id,
        })
      },

      removeWorkspace: (id) => {
        const { workspaces, activeWorkspaceId } = get()
        const filtered = workspaces.filter((w) => w.id !== id)
        const nextActiveId =
          activeWorkspaceId === id
            ? filtered.length > 0
              ? filtered[0].id
              : null
            : activeWorkspaceId

        set({
          workspaces: filtered,
          activeWorkspaceId: nextActiveId,
        })
      },

      setIsLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      reset: () =>
        set({
          workspaces: [],
          activeWorkspaceId: null,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: STORAGE_NAME,
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
)

/**
 * Granular selector hook for retrieving the current active workspace.
 */
export function useActiveWorkspace(): Workspace | null {
  return useWorkspaceStore((state) => {
    if (!state.activeWorkspaceId) {
      return state.workspaces[0] ?? null
    }
    return (
      state.workspaces.find((w) => w.id === state.activeWorkspaceId) ??
      state.workspaces[0] ??
      null
    )
  })
}

/**
 * Granular selector hook for checking if the user has any workspaces.
 */
export function useHasWorkspaces(): boolean {
  return useWorkspaceStore((state) => state.workspaces.length > 0)
}
