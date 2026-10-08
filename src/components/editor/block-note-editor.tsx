import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  AddBlockButton,
  SideMenu,
  SideMenuController,
  useCreateBlockNote,
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { DragOnlyHandleButton } from "./drag-only-handle-button"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/shadcn/style.css"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export interface BlockNoteEditorProps {
  initialContent?: string
  onChange?: (html: string) => void
  onBlur?: (html: string) => void
  editable?: boolean
  className?: string
  editorClassName?: string
  children?: ReactNode
}

export function BlockNoteEditor({
  initialContent,
  onChange,
  onBlur,
  editable = true,
  className,
  editorClassName,
  children,
}: BlockNoteEditorProps) {
  const { theme } = useTheme()
  const editor = useCreateBlockNote()
  const initialLoadedRef = useRef(false)
  const isUpdatingFromExternalRef = useRef(false)

  // Resolve current active theme mode for BlockNote
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
    return theme === "dark" ? "dark" : "light"
  })

  useEffect(() => {
    if (theme === "system") {
      const isDark = document.documentElement.classList.contains("dark")
      setResolvedTheme(isDark ? "dark" : "light")
    } else {
      setResolvedTheme(theme === "dark" ? "dark" : "light")
    }
  }, [theme])

  const containerRef = useRef<HTMLDivElement>(null)
  const lastAppliedContentRef = useRef<string>(initialContent || "")

  // Load initial HTML into blocks once on mount or when content is first provided
  useEffect(() => {
    if (!editor || initialLoadedRef.current) return

    if (initialContent && initialContent.trim()) {
      isUpdatingFromExternalRef.current = true
      try {
        const blocks = editor.tryParseHTMLToBlocks(initialContent)
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks)
        }
      } catch (err) {
        console.error("Failed to parse initial HTML into BlockNote blocks:", err)
      } finally {
        isUpdatingFromExternalRef.current = false
        initialLoadedRef.current = true
        lastAppliedContentRef.current = initialContent
      }
    } else {
      initialLoadedRef.current = true
      lastAppliedContentRef.current = ""
    }
  }, [editor, initialContent])

  // Sync external content changes when editor is not actively focused
  useEffect(() => {
    if (!editor || !initialLoadedRef.current) return
    const incoming = initialContent || ""
    if (incoming === lastAppliedContentRef.current) return

    const isFocused =
      typeof document !== "undefined" &&
      containerRef.current?.contains(document.activeElement)

    if (isFocused) {
      // Don't overwrite while user is actively typing in the editor
      return
    }

    isUpdatingFromExternalRef.current = true
    try {
      if (incoming.trim()) {
        const blocks = editor.tryParseHTMLToBlocks(incoming)
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks)
        }
      } else {
        editor.replaceBlocks(editor.document, [])
      }
      lastAppliedContentRef.current = incoming
    } catch (err) {
      console.error("Failed to sync external content to BlockNote:", err)
    } finally {
      isUpdatingFromExternalRef.current = false
    }
  }, [editor, initialContent])

  // Subscribe to editor changes
  useEffect(() => {
    if (!editor || !onChange) return

    return editor.onChange(async () => {
      if (isUpdatingFromExternalRef.current) return
      try {
        const html = await editor.blocksToHTMLLossy(editor.document)
        lastAppliedContentRef.current = html
        onChange(html)
      } catch (err) {
        console.error("Failed to serialize BlockNote blocks to HTML:", err)
      }
    })
  }, [editor, onChange])

  // Handle blur to flush changes immediately
  const handleBlur = async () => {
    if (!editor || !onBlur) return
    try {
      const html = await editor.blocksToHTMLLossy(editor.document)
      lastAppliedContentRef.current = html
      onBlur(html)
    } catch (err) {
      console.error("Failed to serialize BlockNote on blur:", err)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex min-h-full flex-1 flex-col bg-card", className)}
      onBlur={handleBlur}
    >
      {children}
      <div
        className={cn(
          "flex-1 w-full pb-12 [&_.bn-container]:w-full [&_.bn-editor]:w-full [&_.bn-editor]:max-w-none [&_.bn-editor]:pl-[54px] [&_.bn-editor]:pr-6 sm:[&_.bn-editor]:pr-10",
          editorClassName
        )}
      >
        <BlockNoteView
          editor={editor}
          theme={resolvedTheme}
          editable={editable}
          sideMenu={false}
          className="w-full"
        >
          <SideMenuController
            sideMenu={(sideMenuProps) => (
              <SideMenu {...sideMenuProps}>
                <AddBlockButton />
                <DragOnlyHandleButton />
              </SideMenu>
            )}
          />
        </BlockNoteView>
      </div>
    </div>
  )
}

export default BlockNoteEditor
