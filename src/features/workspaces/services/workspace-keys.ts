export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (userId?: string) => [...workspaceKeys.lists(), userId] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id?: number) => [...workspaceKeys.details(), id] as const,
}
