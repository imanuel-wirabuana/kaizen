import type { ReactNode } from "react"
import { useWorkspacePermissions } from "@/features/members/hooks/use-workspace-permissions"
import type { PermissionAction, PermissionResource } from "@/types/member"

export interface PermissionGuardProps<T extends PermissionResource> {
  resource: T
  action: PermissionAction<T>
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard<T extends PermissionResource>({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGuardProps<T>) {
  const { can, isLoading } = useWorkspacePermissions()

  if (isLoading) {
    return null
  }

  const isAllowed = can(resource, action)
  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
