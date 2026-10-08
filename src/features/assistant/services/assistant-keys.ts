export const assistantKeys = {
  all: ["assistant"] as const,
  threads: () => [...assistantKeys.all, "threads"] as const,
  threadList: (workspaceId: number | null | undefined) =>
    [...assistantKeys.threads(), "list", workspaceId ?? "none"] as const,
  threadDetail: (threadId: number | null | undefined) =>
    [...assistantKeys.threads(), "detail", threadId ?? "none"] as const,
  messages: (threadId: number | null | undefined) =>
    [...assistantKeys.all, "messages", threadId ?? "none"] as const,
  models: () => [...assistantKeys.all, "models"] as const,
}
