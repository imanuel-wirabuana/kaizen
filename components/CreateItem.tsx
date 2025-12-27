'use client'

import { Input } from '@/components/ui/input'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from './ui/button'
import { useState } from 'react'
import { store } from '@/lib/services'
import { XIcon } from 'lucide-react'

export default function CreateItem({ boardId, laneId, open, onOpenChange }: { boardId: string; laneId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState<string>('')

  const handleClick = async () => {
    await store<Item>('items', { title, boardId, laneId })
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
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter item title..." autoFocus onBlur={() => setTimeout(() => onOpenChange(false), 200)} onKeyDown={onEnter} />

      <div className="flex items-center gap-1">
        <Button size="sm" onClick={handleClick} className="cursor-pointer">
          Create item
        </Button>
        <Button size="icon-sm" variant="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
