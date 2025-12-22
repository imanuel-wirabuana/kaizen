'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'

import TextAlign from '@tiptap/extension-text-align'

import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'

import { EditorToolbar } from './editor-toolbar'

export function TiptapEditor({ value, onChange }: { value: string | null; onChange: (json: any) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),

      BulletList,
      OrderedList,

      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),

      TaskList,
      TaskItem.configure({
        nested: true,
      }),

      Table.configure({
        resizable: true,
        handleWidth: 5,
        lastColumnResizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'align-top',
        },
      }),

      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value ? JSON.parse(value) : '',
    onUpdate({ editor }) {
      onChange?.(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none tiptap',
      },
    },
    onBeforeCreate() {
      editor?.commands.setContent(value ? JSON.parse(value) : '')
    },
  })

  if (!editor) return null

  return (
    <div className="rounded-md border bg-background">
      <EditorToolbar editor={editor} />

      <div className="overflow-x-auto">
        <EditorContent
          editor={editor}
          className="
            min-h-44 
            p-4

            [&_h1]:text-3xl [&_h1]:font-bold
            [&_h2]:text-2xl [&_h2]:font-semibold
            [&_h3]:text-xl [&_h3]:font-semibold

            [&_ul]:list-disc [&_ol]:list-decimal
            [&_ul,&_ol]:pl-6

            [&_blockquote]:border-l-4
            [&_blockquote]:border-border
            [&_blockquote]:pl-4
            [&_blockquote]:italic
            [&_blockquote]:my-4
            [&_blockquote]:text-muted-foreground

            [&_a]:text-primary
            [&_a]:underline
            [&_a]:underline-offset-4

            [&_code]:bg-muted
            [&_code]:px-1
            [&_code]:rounded

            [&_pre]:bg-muted
            [&_pre]:p-4
            [&_pre]:rounded-md
            [&_pre]:overflow-x-auto

            /* TABLE */
            [&_table]:w-full
            [&_table]:border-collapse
            [&_table]:my-4

            [&_th]:border
            [&_th]:bg-muted
            [&_th]:px-3 [&_th]:py-2
            [&_th]:text-left

            [&_td]:border
            [&_td]:px-3 [&_td]:py-2
            [&_td]:min-w-30

            [&_.selectedCell]:bg-primary/10

            /* CHECKLIST */
            [&_ul[data-type='taskList']]:list-none
            [&_ul[data-type='taskList']]:pl-0
            [&_li[data-type='taskItem']]:flex
            [&_li[data-type='taskItem']]:items-start
            [&_li[data-type='taskItem']]:gap-2
            [&_li[data-type='taskItem'][data-checked='true']>div]:line-through
            [&_li[data-type='taskItem'][data-checked='true']>div]:text-muted-foreground
          "
        />
      </div>
    </div>
  )
}
