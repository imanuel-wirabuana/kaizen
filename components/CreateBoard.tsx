'use client'

import { Input } from '@/components/ui/input'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from './ui/button'
import { useState } from 'react'
import { store } from '@/lib/services'
import { XIcon } from 'lucide-react'
import BoardBackgroundPicker from './BoardBackgroundPicker'

export default function CreateBoard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState<string>('')
  const [background, setBackground] = useState<string>('')

  const handleClick = async () => {
    onOpenChange(false)
    await store<Board>('boards', { title, background })
  }

  return (
    <Card size="sm" className="h-fit">
      <div className="py-3 space-y-3">
        <CardContent>
          <div className="space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter board title..." autoFocus />
            <BoardBackgroundPicker value={background} onChange={setBackground} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={handleClick} className="cursor-pointer">
              Create board
            </Button>
            <Button size="icon-sm" variant="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
              <XIcon />
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
