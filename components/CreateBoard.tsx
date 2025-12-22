'use client'

import { Input } from '@/components/ui/input'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from './ui/button'
import { useState } from 'react'
import { store } from '@/lib/services'
import { XIcon } from 'lucide-react'

export default function CreateBoard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState<string>('')

  const handleClick = async () => {
    await store<Board>('boards', { title })
  }

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleClick()
      onOpenChange(false)
    }
  }

  return (
    <Card size="sm" className="h-fit">
      <CardContent>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter board title..." autoFocus onBlur={() => setTimeout(() => onOpenChange(false), 200)} onKeyDown={onEnter} />
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleClick}>
            Create board
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onOpenChange(false)}>
            <XIcon />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
