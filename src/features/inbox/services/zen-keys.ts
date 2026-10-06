export const zenKeys = {
  all: ["zens"] as const,
  lists: () => [...zenKeys.all, "list"] as const,
  list: (workspaceId?: number) => [...zenKeys.lists(), workspaceId] as const,
  details: () => [...zenKeys.all, "detail"] as const,
  detail: (id?: number) => [...zenKeys.details(), id] as const,
}
