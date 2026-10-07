export const calendarKeys = {
  all: ["calendars"] as const,
  lists: () => [...calendarKeys.all, "list"] as const,
  list: (workspaceId: number | null | undefined) =>
    [...calendarKeys.lists(), workspaceId ?? "none"] as const,
  details: () => [...calendarKeys.all, "detail"] as const,
  detail: (id: number | null | undefined) =>
    [...calendarKeys.details(), id ?? "none"] as const,
}
