export const memberKeys = {
  all: ["members"] as const,
  list: (workspaceId?: number | null) =>
    ["members", "list", workspaceId ?? null] as const,
  myPermissions: (workspaceId?: number | null, userId?: string | null) =>
    ["members", "permissions", workspaceId ?? null, userId ?? null] as const,
  invites: (workspaceId?: number | null) =>
    ["members", "invites", workspaceId ?? null] as const,
  inviteCode: (code?: string | null) =>
    ["members", "invite-code", code ?? null] as const,
}
