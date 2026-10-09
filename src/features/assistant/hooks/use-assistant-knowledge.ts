import { useMemo } from "react"
import { useUser } from "@clerk/clerk-react"
import { useQuery } from "@tanstack/react-query"
import { useActiveWorkspace } from "@/stores/workspace-store"
import { zenKeys } from "@/features/inbox/services/zen-keys"
import { fetchWorkspaceZens } from "@/features/inbox/services/zen-service"
import { boardKeys } from "@/features/boards/services/board-keys"
import { fetchWorkspaceBoards } from "@/features/boards/services/board-service"
import { calendarKeys } from "@/features/calendar/services/calendar-keys"
import { fetchWorkspaceCalendars } from "@/features/calendar/services/calendar-service"
import { memberKeys } from "@/features/members/services/member-keys"
import { fetchWorkspaceMembers } from "@/features/members/services/member-service"
import {
  buildAssistantSystemPrompt,
  type AssistantKnowledgeContext,
  type AssistantCurrentUserContext,
} from "@/features/assistant/services/system-prompt"
import type { AiThread } from "@/types/assistant"

export interface UseAssistantKnowledgeOptions {
  thread?: AiThread | null
  customInstructions?: string | null
}

/**
 * Hook to retrieve workspace knowledge (zens, boards, calendars, members, workspace-properties)
 * cached via TanStack React Query and dynamically assemble the assistant's system prompt.
 */
export function useAssistantKnowledge(options?: UseAssistantKnowledgeOptions) {
  const { user } = useUser()
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id

  // 1. Zens (Inbox items)
  const { data: zens = [] } = useQuery({
    queryKey: zenKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceZens(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // 2. Boards (Kanban boards)
  const { data: boards = [] } = useQuery({
    queryKey: boardKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceBoards(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // 3. Calendars
  const { data: calendars = [] } = useQuery({
    queryKey: calendarKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceCalendars(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // 4. Members
  const { data: members = [] } = useQuery({
    queryKey: memberKeys.list(workspaceId),
    queryFn: () => fetchWorkspaceMembers(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  // Current user context
  const currentUser = useMemo<AssistantCurrentUserContext | null>(() => {
    if (!user) return null
    const isOwner = Boolean(
      activeWorkspace && activeWorkspace.owner_id === user.id
    )

    const displayName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "You"

    return {
      id: user.id,
      name: displayName,
      email: user.primaryEmailAddress?.emailAddress || "",
      role: isOwner ? "Owner" : "Member",
    }
  }, [user, activeWorkspace])

  // Member profiles from workspace settings
  const memberProfiles = useMemo(() => {
    const settings = activeWorkspace?.settings as Record<string, unknown> | undefined
    return (
      (settings?.profiles as Record<
        string,
        { displayName?: string; email?: string }
      >) || undefined
    )
  }, [activeWorkspace?.settings])

  // Assemble full knowledge context
  const knowledgeContext = useMemo<AssistantKnowledgeContext>(
    () => ({
      workspace: activeWorkspace,
      currentUser,
      members,
      memberProfiles,
      zens,
      boards,
      calendars,
      thread: options?.thread,
      customInstructions: options?.customInstructions,
    }),
    [
      activeWorkspace,
      currentUser,
      members,
      memberProfiles,
      zens,
      boards,
      calendars,
      options?.thread,
      options?.customInstructions,
    ]
  )

  // Dynamically generated system prompt
  const systemPrompt = useMemo(
    () => buildAssistantSystemPrompt(knowledgeContext),
    [knowledgeContext]
  )

  return {
    knowledgeContext,
    systemPrompt,
    zens,
    boards,
    calendars,
    members,
    activeWorkspace,
    currentUser,
  }
}
