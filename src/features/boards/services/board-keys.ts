export const boardKeys = {
  all: ["boards"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: (workspaceId: number | null | undefined) =>
    [...boardKeys.lists(), workspaceId ?? "none"] as const,
  details: () => [...boardKeys.all, "detail"] as const,
  detail: (id: number | null | undefined) =>
    [...boardKeys.details(), id ?? "none"] as const,
  lanes: (boardId: number | null | undefined) =>
    [...boardKeys.all, "lanes", boardId ?? "none"] as const,
  tasks: (boardId: number | null | undefined) =>
    [...boardKeys.all, "tasks", boardId ?? "none"] as const,
}

