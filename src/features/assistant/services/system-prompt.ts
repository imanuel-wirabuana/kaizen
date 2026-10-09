import type { Workspace } from "@/types/workspace"
import type { Zen } from "@/types/zen"
import type { Board } from "@/types/board"
import type { Calendar } from "@/types/calendar"
import type { WorkspaceMember, WorkspaceMemberProfile } from "@/types/member"
import type { AiThread } from "@/types/assistant"

export const DEFAULT_BASE_SYSTEM_PROMPT =
  "You are Kaizen Assistant, a friendly, intelligent, and highly practical AI coach embedded inside the Kaizen productivity platform. You embody the philosophy of Kaizen (continuous, compounding 1% improvement). Keep answers clear, well-structured, formatted with markdown where helpful, and immediately actionable."

export interface AssistantCurrentUserContext {
  id: string
  name: string
  email: string
  role: "Owner" | "Member" | string
}

export interface AssistantKnowledgeContext {
  workspace?: Workspace | null
  currentUser?: AssistantCurrentUserContext | null
  members?: (WorkspaceMember | WorkspaceMemberProfile)[]
  memberProfiles?: Record<string, { displayName?: string; email?: string }>
  zens?: Zen[]
  boards?: Board[]
  calendars?: Calendar[]
  thread?: AiThread | null
  customInstructions?: string | null
}

/**
 * Formats workspace properties and environment into a prompt section.
 */
export function formatWorkspaceKnowledge(workspace?: Workspace | null): string {
  if (!workspace) return ""

  const parts: string[] = []
  parts.push(`- **Workspace Name**: ${workspace.name}`)
  if (workspace.description?.trim()) {
    parts.push(`- **Description**: ${workspace.description.trim()}`)
  }
  if (workspace.settings?.timezone) {
    parts.push(`- **Timezone**: ${String(workspace.settings.timezone)}`)
  }
  if (workspace.settings?.default_view) {
    parts.push(`- **Default View**: ${String(workspace.settings.default_view)}`)
  }
  if (workspace.created_at) {
    parts.push(`- **Created At**: ${new Date(workspace.created_at).toLocaleDateString()}`)
  }

  return `### Workspace Properties\n${parts.join("\n")}`
}

/**
 * Formats current user identity and role.
 */
export function formatCurrentUserKnowledge(
  currentUser?: AssistantCurrentUserContext | null
): string {
  if (!currentUser) return ""

  return `### Current User Context\n- **Name**: ${currentUser.name}\n- **Email**: ${currentUser.email}\n- **Role**: ${currentUser.role}`
}

/**
 * Formats team members and their roles.
 */
export function formatMembersKnowledge(
  members?: (WorkspaceMember | WorkspaceMemberProfile)[],
  memberProfiles?: Record<string, { displayName?: string; email?: string }>
): string {
  if (!members || members.length === 0) return ""

  const activeMembers = members.filter((m) => {
    if ("revokedAt" in m) return !m.revokedAt
    if ("revoked_at" in m) return !m.revoked_at
    return true
  })

  if (activeMembers.length === 0) return ""

  const memberLines = activeMembers.map((m) => {
    // If it's a WorkspaceMemberProfile
    if ("displayName" in m && "role" in m) {
      return `- **${m.displayName}** (${m.role}) — ${m.email || "No email"}`
    }

    // If it's a raw WorkspaceMember
    const profile = memberProfiles?.[m.user_id] || (m as WorkspaceMember).profile
    const name = profile?.displayName || `User ${m.user_id.slice(-6)}`
    const email = profile?.email || "No email"
    return `- **${name}** (Member) — ${email}`
  })

  return `### Workspace Members (${activeMembers.length})\n${memberLines.join("\n")}`
}

/**
 * Formats Zenbox (inbox items / zens).
 */
export function formatZenboxKnowledge(zens?: Zen[]): string {
  if (!zens || zens.length === 0) return ""

  const activeZens = zens.filter((z) => !z.archived_at)
  if (activeZens.length === 0) {
    return `### Zenbox Items (Inbox)\n- No active inbox items currently.`
  }

  const lines = activeZens.slice(0, 30).map((z) => {
    const desc = z.description?.trim() ? ` — "${z.description.trim()}"` : ""
    const date = z.created_at ? ` (Added: ${new Date(z.created_at).toLocaleDateString()})` : ""
    return `- **#${z.id} ${z.name}**${desc}${date}`
  })

  const overflow =
    activeZens.length > 30 ? `\n- *...and ${activeZens.length - 30} more items.*` : ""

  return `### Zenbox Items (${activeZens.length} active)\n${lines.join("\n")}${overflow}`
}

/**
 * Formats Kanban boards knowledge.
 */
export function formatBoardsKnowledge(boards?: Board[]): string {
  if (!boards || boards.length === 0) return ""

  const activeBoards = boards.filter((b) => !b.archived_at)
  if (activeBoards.length === 0) {
    return `### Kanban Boards\n- No active boards currently.`
  }

  const lines = activeBoards.slice(0, 20).map((b) => {
    const desc = b.description?.trim() ? ` — "${b.description.trim()}"` : ""
    const date = b.created_at ? ` (Created: ${new Date(b.created_at).toLocaleDateString()})` : ""
    return `- **#${b.id} ${b.name}**${desc}${date}`
  })

  const overflow =
    activeBoards.length > 20 ? `\n- *...and ${activeBoards.length - 20} more boards.*` : ""

  return `### Kanban Boards (${activeBoards.length} active)\n${lines.join("\n")}${overflow}`
}

/**
 * Formats Calendars knowledge.
 */
export function formatCalendarsKnowledge(calendars?: Calendar[]): string {
  if (!calendars || calendars.length === 0) return ""

  const activeCalendars = calendars.filter((c) => !c.archived_at)
  if (activeCalendars.length === 0) {
    return `### Calendars\n- No active calendars currently.`
  }

  const lines = activeCalendars.slice(0, 20).map((c) => {
    const desc = c.description?.trim() ? ` — "${c.description.trim()}"` : ""
    return `- **#${c.id} ${c.name}**${desc}`
  })

  const overflow =
    activeCalendars.length > 20
      ? `\n- *...and ${activeCalendars.length - 20} more calendars.*`
      : ""

  return `### Calendars (${activeCalendars.length} active)\n${lines.join("\n")}${overflow}`
}

/**
 * Constructs the complete, context-enriched system prompt for the Kaizen AI Assistant.
 */
export function buildAssistantSystemPrompt(context?: AssistantKnowledgeContext): string {
  const sections: string[] = [DEFAULT_BASE_SYSTEM_PROMPT]

  if (!context) {
    return sections.join("\n\n")
  }

  const knowledgeSections: string[] = []

  // 1. Current User
  const userSection = formatCurrentUserKnowledge(context.currentUser)
  if (userSection) knowledgeSections.push(userSection)

  // 2. Workspace Properties
  const wsSection = formatWorkspaceKnowledge(context.workspace)
  if (wsSection) knowledgeSections.push(wsSection)

  // 3. Team Members
  const membersSection = formatMembersKnowledge(context.members, context.memberProfiles)
  if (membersSection) knowledgeSections.push(membersSection)

  // 4. Zenbox Items
  const zenboxSection = formatZenboxKnowledge(context.zens)
  if (zenboxSection) knowledgeSections.push(zenboxSection)

  // 5. Boards
  const boardsSection = formatBoardsKnowledge(context.boards)
  if (boardsSection) knowledgeSections.push(boardsSection)

  // 6. Calendars
  const calendarsSection = formatCalendarsKnowledge(context.calendars)
  if (calendarsSection) knowledgeSections.push(calendarsSection)

  if (knowledgeSections.length > 0) {
    sections.push(
      "## Live Workspace Context\nYou have direct visibility into the user's workspace, projects, schedules, and team. When answering questions, offering advice, or breaking down tasks, reference these specific items by name whenever relevant:\n\n" +
        knowledgeSections.join("\n\n")
    )
  }

  // Thread Title & Description context if present
  if (context.thread?.title || context.thread?.description) {
    const threadDetails: string[] = []
    if (context.thread.title) threadDetails.push(`- **Thread Topic**: ${context.thread.title}`)
    if (context.thread.description) {
      threadDetails.push(`- **Thread Summary**: ${context.thread.description}`)
    }
    sections.push(`## Current Conversation\n${threadDetails.join("\n")}`)
  }

  // Custom user or system instructions
  if (context.customInstructions?.trim()) {
    sections.push(`## Custom Instructions\n${context.customInstructions.trim()}`)
  }

  // Guidelines for assistant behavior
  sections.push(
    "## Operational Guidelines\n" +
      "- Suggest small, continuous, compounding steps (Kaizen philosophy).\n" +
      "- Actively connect thoughts or action items to the user's existing Zenbox items, Boards, or Calendars.\n" +
      "- When asked about team members, tasks, or boards, rely accurately on the live workspace context above."
  )

  return sections.join("\n\n")
}
