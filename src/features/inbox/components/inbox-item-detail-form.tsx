import { useState, useEffect, useRef, useCallback } from "react"
import { Lock } from "lucide-react"
import { BlockNoteEditor } from "@/components/editor/block-note-editor"
import type { Zen } from "@/types/zen"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface InboxItemDetailFormProps {
  zen: Zen
  onUpdate: (
    id: number,
    updates: { name: string; description?: string }
  ) => Promise<void>
  onSaveStatusChange?: (status: "idle" | "saving" | "saved") => void
  isReadOnly?: boolean
}

export function InboxItemDetailForm({
  zen,
  onUpdate,
  onSaveStatusChange,
  isReadOnly = false,
}: InboxItemDetailFormProps) {
  const [name, setName] = useState(zen.name)
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const currentNameRef = useRef(zen.name)
  const currentDescRef = useRef(zen.description || "")
  const lastSavedRef = useRef({
    name: zen.name,
    description: zen.description || "",
  })
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-resize title textarea to match content height
  useEffect(() => {
    const textarea = titleTextareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [name])

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

  // Synchronize remote realtime updates from other users when not actively typing
  useEffect(() => {
    const isTitleFocused =
      typeof document !== "undefined" &&
      document.activeElement === titleTextareaRef.current

    if (!isTitleFocused && zen.name !== currentNameRef.current) {
      setName(zen.name)
      currentNameRef.current = zen.name
      lastSavedRef.current.name = zen.name
    }

    const incomingDesc = zen.description || ""
    if (incomingDesc !== currentDescRef.current) {
      const isEditorFocused =
        typeof document !== "undefined" &&
        Boolean(document.activeElement?.closest?.(".bn-editor"))

      if (!isEditorFocused) {
        currentDescRef.current = incomingDesc
        lastSavedRef.current.description = incomingDesc
      }
    }
  }, [zen.name, zen.description, zen.updated_at])

  const triggerSave = useCallback(
    async (nameToSave: string, descToSave: string) => {
      const trimmedName = nameToSave.trim() || "Untitled"
      const cleanDesc = descToSave === "<p></p>" ? "" : descToSave

      if (
        trimmedName === lastSavedRef.current.name &&
        cleanDesc === lastSavedRef.current.description
      ) {
        return
      }

      try {
        onSaveStatusChange?.("saving")
        await onUpdate(zen.id, {
          name: trimmedName,
          description: cleanDesc || undefined,
        })
        lastSavedRef.current = { name: trimmedName, description: cleanDesc }
        onSaveStatusChange?.("saved")

        if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
        statusTimerRef.current = setTimeout(() => {
          onSaveStatusChange?.("idle")
        }, 2200)
      } catch {
        onSaveStatusChange?.("idle")
      }
    },
    [zen.id, onUpdate, onSaveStatusChange]
  )

  const scheduleDebouncedSave = useCallback(
    (nextName: string, nextDesc: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = setTimeout(() => {
        triggerSave(nextName, nextDesc)
      }, 1500)
    },
    [triggerSave]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setName(val)
    currentNameRef.current = val
    scheduleDebouncedSave(val, currentDescRef.current)
  }

  const handleTitleBlur = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    triggerSave(currentNameRef.current, currentDescRef.current)
  }

  const handleEditorChange = (html: string) => {
    currentDescRef.current = html
    scheduleDebouncedSave(currentNameRef.current, html)
  }

  const handleEditorBlur = (html: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    triggerSave(currentNameRef.current, html)
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-card">
      <BlockNoteEditor
        key={zen.id}
        initialContent={zen.description || ""}
        onChange={isReadOnly ? undefined : handleEditorChange}
        onBlur={isReadOnly ? undefined : handleEditorBlur}
        editable={!isReadOnly}
        className="flex-1"
      >
        <div className="w-full pl-[54px] pr-6 pt-6 sm:pr-10 sm:pt-8">
          {isReadOnly && (
            <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground select-none">
              <Lock className="size-3 text-muted-foreground" />
              <span>You have read-only access to this note.</span>
            </div>
          )}
          <textarea
            ref={titleTextareaRef}
            value={name}
            onChange={isReadOnly ? undefined : handleTitleChange}
            onBlur={isReadOnly ? undefined : handleTitleBlur}
            disabled={isReadOnly}
            rows={1}
            placeholder="Untitled"
            className={cn(
              "w-full resize-none border-none bg-transparent p-0 text-2xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:ring-0 focus:outline-none sm:text-3xl",
              isReadOnly && "cursor-default text-foreground/90"
            )}
          />
          <Separator className="mt-3 mb-4" />
        </div>
      </BlockNoteEditor>
    </div>
  )
}

export { InboxItemDetailForm as ZenboxItemDetailForm }
export default InboxItemDetailForm
