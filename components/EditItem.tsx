'use client'

import { Button } from './ui/button'
import { useCallback, useEffect, useState } from 'react'
import { update } from '@/lib/services'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TiptapEditor } from './editor/tiptap-editor'
import { Field, FieldGroup, FieldLabel, FieldSet } from './ui/field'
import { Input } from './ui/input'
import { Loader2Icon, TrashIcon, XIcon } from 'lucide-react'
import { debounce } from 'lodash'
import DeleteItem from './DeleteItem'

export default function EditItem({ data, open, onOpenChange }: { data: Item; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isTitleOpen, setIsTitleOpen] = useState<boolean>(false)
  const [isDelete, setIsDelete] = useState<boolean>(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-3xl max-h-[calc(100vh-10vh)] overflow-auto fixed top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="text-muted-foreground">Edit item</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <FieldSet>
          <FieldGroup>
            <Field>
              {isTitleOpen ? (
                <FieldTitle data={data} open={isTitleOpen} onOpenChange={setIsTitleOpen} />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div onClick={() => setIsTitleOpen(true)} className="text-xl hover:brightness-200 px-4 py-2 bg-background rounded-sm cursor-pointer w-fit">
                    {data.title}
                  </div>
                  <div>
                    {isDelete ? (
                      <DeleteItem data={data} open={isDelete} onOpenChange={setIsDelete} />
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setIsDelete(true)}>
                        <TrashIcon />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Field>
            <Field>
              <FieldLabel className="text-muted-foreground">Description</FieldLabel>
              <FieldDescription data={data} />
            </Field>
          </FieldGroup>
        </FieldSet>
      </DialogContent>
    </Dialog>
  )
}

function FieldTitle({ data, open, onOpenChange }: { data: Item; open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = data.id

  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    setTitle(data.title)
  }, [data])

  const handleClick = async () => {
    await update<Item>('items', id, { title })
    onOpenChange(false)
  }

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleClick()
      onOpenChange(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter new title..." autoFocus onKeyDown={onEnter} onBlur={() => setTimeout(() => onOpenChange(false), 200)} />

      <div className="flex gap-1 items-center">
        <Button size="sm" className="cursor-pointer" onClick={handleClick}>
          Save title
        </Button>
        <Button size="icon-sm" variant="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
          <XIcon />
        </Button>
      </div>
    </div>
  )
}

function FieldDescription({ data }: { data: Item }) {
  const [description, setDescription] = useState<string>(data.description || '')
  const [loading, setLoading] = useState<boolean>(false)

  // Update local state when data changes
  useEffect(() => {
    setDescription(data.description || '')
  }, [data.description])

  // Save function
  const handleSave = useCallback(
    async (desc: string) => {
      try {
        await update<Item>('items', data.id, { description: desc })
      } catch (err) {
        console.error(err)
      }
    },
    [data.id]
  )

  // Debounced save with loading tied to debounce duration
  const debouncedSave = useCallback(
    debounce(async (desc: string) => {
      setLoading(true)
      await handleSave(desc)
      setLoading(false)
    }, 3000), // <-- debounce duration in ms
    [handleSave]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  const handleChange = (desc: string) => {
    setLoading(true)
    setDescription(desc)
    debouncedSave(desc) // pass the latest description
  }

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex right-6 bottom-3 items-center gap-2 text-sm text-muted-foreground fixed">
          <p>Saving...</p>
          <Loader2Icon className="animate-spin" size={16} />
        </div>
      )}
      <TiptapEditor value={description} onChange={handleChange} />
    </div>
  )
}
