'use client'

import { Input } from '@/components/ui/input'

import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { update } from '@/lib/services'
import { XIcon } from 'lucide-react'

export default function EditBoard({ data, open, onOpenChange }: { data: Board; open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = data.id

  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    setTitle(data.title)
  }, [data])

  const handleClick = async () => {
    await update<Board>('boards', id, { title })
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
          Update board
        </Button>
        <Button size="icon-sm" variant="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
