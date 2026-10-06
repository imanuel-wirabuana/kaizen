import { useState, useEffect, useRef, useCallback } from "react"
import { BlockNoteEditor } from "@/components/editor/block-note-editor"
import type { Zen } from "@/types/zen"
import { Separator } from "@/components/ui/separator"

export interface InboxItemDetailFormProps {
  zen: Zen
  onUpdate: (
    id: number,
    updates: { name: string; description?: string }
  ) => Promise<void>
  onSaveStatusChange?: (status: "idle" | "saving" | "saved") => void
}

export function InboxItemDetailForm({
  zen,
  onUpdate,
  onSaveStatusChange,
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
        onChange={handleEditorChange}
        onBlur={handleEditorBlur}
        className="flex-1"
      >
        <div className="w-full pl-[54px] pr-6 pt-6 sm:pr-10 sm:pt-8">
          <textarea
            ref={titleTextareaRef}
            value={name}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            rows={1}
            placeholder="Untitled"
            className="w-full resize-none border-none bg-transparent p-0 text-2xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:ring-0 focus:outline-none sm:text-3xl"
          />
          <Separator className="mt-3 mb-4" />
        </div>
      </BlockNoteEditor>
    </div>
  )
}

export { InboxItemDetailForm as ZenboxItemDetailForm }
export default InboxItemDetailForm
