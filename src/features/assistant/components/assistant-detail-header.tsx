import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { Archive, ArchiveRestore, Eraser, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useWorkspaceMemberProfiles } from "@/features/members/hooks/use-workspace-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageSidebarTrigger } from "@/components/layout/page-sidebar-layout"
import { cn } from "@/lib/utils"
import type { AiThread } from "@/types/assistant"

export interface AssistantDetailHeaderProps {
  thread: AiThread | null
  isProcessing?: boolean
  onToggleArchive?: () => Promise<unknown>
  onClearMessages?: () => Promise<unknown>
  onDelete?: () => Promise<unknown>
  className?: string
}

export function AssistantDetailHeader({
  thread,
  isProcessing = false,
  onToggleArchive,
  onClearMessages,
  onDelete,
  className,
}: AssistantDetailHeaderProps) {
  const { user } = useUser()
  const workspaceProfiles = useWorkspaceMemberProfiles()

  const isArchived = Boolean(thread?.archived_at)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isClearOpen, setIsClearOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isCurrentUser = Boolean(user && thread?.owner_id === user.id)
  const creatorProfile = thread?.owner_id
    ? workspaceProfiles[thread.owner_id]
    : undefined

  const creatorName = isCurrentUser
    ? "You"
    : creatorProfile?.displayName ||
      (typeof thread?.settings?.owner_name === "string" &&
        thread.settings.owner_name) ||
      "Collaborator"

  const creatorImageUrl = isCurrentUser
    ? user?.imageUrl
    : creatorProfile?.avatarUrl ||
      (typeof thread?.settings?.owner_image === "string" &&
        thread.settings.owner_image) ||
      undefined

  const initials = (() => {
    if (isCurrentUser) {
      const first = user?.firstName?.[0]
      const last = user?.lastName?.[0]
      if (first && last) return `${first}${last}`.toUpperCase()
      if (first) return first.toUpperCase()
      return "U"
    }
    if (creatorName) {
      const parts = creatorName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return parts[0]?.slice(0, 2).toUpperCase() || "CB"
    }
    return "CB"
  })()

  const handleConfirmDelete = async () => {
    if (!onDelete || isProcessing || isDeleting) return
    try {
      setIsDeleting(true)
      await onDelete()
      setIsConfirmOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConfirmClear = async () => {
    if (!onClearMessages || isProcessing) return
    try {
      setIsClearOpen(false)
      await onClearMessages()
    } catch {
      // Handled in mutation
    }
  }

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-20 flex min-h-11 shrink-0 items-center justify-between border-b border-border bg-sidebar/30 p-1 px-3 backdrop-blur-xs",
          className
        )}
      >
        {/* Left: Sidebar Trigger + Thread Title & Info */}
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <PageSidebarTrigger
            className="size-7 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Toggle sidebar"
          />

          {thread && (
            <>
              <Separator orientation="vertical" className="shrink-0" />

              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className="truncate text-xs font-semibold text-foreground sm:text-sm"
                  title={thread.title}
                >
                  {thread.title}
                </span>

                {thread.description?.trim() && (
                  <span
                    className="hidden max-w-[280px] truncate text-[11px] text-muted-foreground md:inline"
                    title={thread.description}
                  >
                    • {thread.description}
                  </span>
                )}

                {/* Thread Creator Attribution */}
                <div
                  className="hidden items-center gap-1 text-[11px] text-muted-foreground lg:flex"
                  title={`Conversation created by ${creatorName}`}
                >
                  <span>•</span>
                  <Avatar className="size-3.5 shrink-0 select-none">
                    {creatorImageUrl ? (
                      <AvatarImage src={creatorImageUrl} alt={creatorName} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-[8px] font-semibold uppercase leading-none text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-normal text-muted-foreground">
                    {creatorName}
                  </span>
                </div>

                {isArchived && (
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    Archived
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        {thread && (
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Clear messages history */}
            {onClearMessages && !isArchived && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsClearOpen(true)}
                disabled={isProcessing || isDeleting}
                className="h-8 cursor-pointer gap-1.5 text-xs"
                title="Clear message history"
              >
                <Eraser className="size-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}

            {/* Archive / Restore button */}
            {onToggleArchive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleArchive}
                disabled={isProcessing || isDeleting}
                className="h-8 cursor-pointer gap-1.5 text-xs"
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isArchived ? (
                  <>
                    <ArchiveRestore className="size-3.5" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="size-3.5" />
                    <span>Archive</span>
                  </>
                )}
              </Button>
            )}

            {/* Delete button (Only available when archived, exactly like Boards / Calendar / Inbox) */}
            {isArchived && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isProcessing || isDeleting}
                className="h-8 cursor-pointer gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Permanent Deletion */}
      {thread && isArchived && onDelete && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete &ldquo;
                {thread.title}&rdquo;? All messages and data inside this
                conversation will be permanently removed. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                <span>Delete Conversation</span>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Confirmation Dialog for Clearing Messages */}
      {thread && onClearMessages && (
        <AlertDialog open={isClearOpen} onOpenChange={setIsClearOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear message history?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clear all messages in &ldquo;
                {thread.title}&rdquo;? The conversation thread will remain
                active, but previous chat turns will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleConfirmClear}
              >
                Clear History
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default AssistantDetailHeader
