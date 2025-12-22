'use client'

import { Editor } from '@tiptap/react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import {
  Bold,
  Italic,
  Underline,
  Code,
  Link as LinkIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Text,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Rows,
  Columns,
  Trash2,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Heading,
  Paintbrush,
  Highlighter,
  Eraser,
} from 'lucide-react'
import { Button } from '../ui/button'

export function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
      {/* UNDO */}
      <Button size="sm" variant="ghost" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo className="h-4 w-4" />
      </Button>

      {/* REDO */}
      <Button size="sm" variant="ghost" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* BLOCK TYPE */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Heading className="h-3 w-3 m-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
            <Text className="mr-2 h-4 w-4" /> Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="mr-2 h-4 w-4" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="mr-2 h-4 w-4" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="mr-2 h-4 w-4" /> Heading 3
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="mr-2 h-4 w-4" /> Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code className="mr-2 h-4 w-4" /> Code block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* LISTS */}
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive('taskList')} onPressedChange={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6" />

      {/* ALIGNMENT */}
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}>
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6" />

      {/* INLINE FORMATTING */}
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
      </Toggle>

      {/* LINK */}
      <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={() => {
          const prev = editor.getAttributes('link').href
          const url = window.prompt('Enter URL', prev)
          if (url === null) return
          if (url === '') {
            editor.chain().focus().unsetLink().run()
            return
          }
          editor.chain().focus().setLink({ href: url }).run()
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6" />

      {/* TABLE */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <TableIcon className="h-3 w-3 m-1" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <Plus className="mr-2 h-4 w-4" /> Insert table
          </DropdownMenuItem>

          <Separator />

          <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
            <Rows className="mr-2 h-4 w-4" /> Row above
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows className="mr-2 h-4 w-4" /> Row below
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
            <Columns className="mr-2 h-4 w-4" /> Column left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns className="mr-2 h-4 w-4" /> Column right
          </DropdownMenuItem>

          <Separator />

          <DropdownMenuItem className="text-destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* TEXT COLOR */}
      <input type="color" className="h-7 w-7 cursor-pointer rounded border p-0" value={editor.getAttributes('textStyle').color ?? '#000000'} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />

      {/* HIGHLIGHT */}
      <Toggle size="sm" pressed={editor.isActive('highlight')} onPressedChange={() => editor.chain().focus().toggleHighlight({ color: '#fde047' }).run()}>
        <Highlighter className="h-4 w-4" />
      </Toggle>

      {/* CLEAR FORMATTING */}
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        <Eraser className="h-4 w-4" />
      </Button>
    </div>
  )
}
