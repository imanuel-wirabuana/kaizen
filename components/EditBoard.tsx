'use client'

import { Input } from '@/components/ui/input'

import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { update } from '@/lib/services'
import { XIcon } from 'lucide-react'
import BoardBackgroundPicker from './BoardBackgroundPicker'

export default function EditBoard({ data, open, onOpenChange }: { data: Board; open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = data.id

  const [title, setTitle] = useState<string>('')
  const [background, setBackground] = useState<string>('')

  useEffect(() => {
    setTitle(data.title)
    setBackground(data.background ?? '')
  }, [data])

  const handleClick = async () => {
    onOpenChange(false)
    await update<Board>('boards', id, { title, background })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter board title..." autoFocus />
        <BoardBackgroundPicker value={background} onChange={setBackground} />
      </div>
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
