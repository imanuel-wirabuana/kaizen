export interface ResourcePermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
  [key: string]: boolean
}

export interface WorkspacePermissionItem {
  read: boolean
  update: boolean
  [key: string]: boolean
}

export interface WorkspacePermissions {
  workspace: WorkspacePermissionItem
  zenbox: ResourcePermissions
  boards: ResourcePermissions
  calendars: ResourcePermissions
  assistant: ResourcePermissions
  members: ResourcePermissions
}

export type PermissionResource = keyof WorkspacePermissions

export type PermissionAction<T extends PermissionResource> =
  T extends "workspace" ? "read" | "update" : "create" | "read" | "update" | "delete"

export const DEFAULT_MEMBER_PERMISSIONS: WorkspacePermissions = {
  workspace: { read: true, update: false },
  zenbox: { read: true, create: true, update: true, delete: true },
  boards: { read: true, create: true, update: true, delete: true },
  calendars: { read: true, create: true, update: true, delete: true },
  assistant: { read: true, create: true, update: true, delete: true },
  members: { read: true, create: false, update: false, delete: false },
}

export const OWNER_PERMISSIONS: WorkspacePermissions = {
  workspace: { read: true, update: true },
  zenbox: { read: true, create: true, update: true, delete: true },
  boards: { read: true, create: true, update: true, delete: true },
  calendars: { read: true, create: true, update: true, delete: true },
  assistant: { read: true, create: true, update: true, delete: true },
  members: { read: true, create: true, update: true, delete: true },
}

export interface MemberProfileData {
  displayName?: string
  email?: string
  avatarUrl?: string
  initials?: string
  lastSeenAt?: string
}

export interface WorkspaceMember {
  id: number
  workspace_id: number
  user_id: string
  permissions: WorkspacePermissions
  profile?: MemberProfileData
  created_at: string
  updated_at: string | null
  revoked_at: string | null
}

export interface WorkspaceInvite {
  id: number
  workspace_id: number
  owner_id: string
  code: string
  permissions: WorkspacePermissions
  max_uses: number
  use_count: number
  created_at: string
  expired_at: string | null
  revoked_at: string | null
}

export interface CreateInviteInput {
  workspaceId: number
  ownerId: string
  permissions: WorkspacePermissions
  maxUses?: number
  expiredAt?: string | null
}

export interface WorkspaceMemberProfile {
  id: number
  workspaceId: number
  userId: string
  displayName: string
  email: string
  avatarUrl?: string
  initials: string
  role: "Owner" | "Member"
  permissions: WorkspacePermissions
  createdAt: string
  updatedAt: string | null
  revokedAt: string | null
  isCurrentUser: boolean
}
