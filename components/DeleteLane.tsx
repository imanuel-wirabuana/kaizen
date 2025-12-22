'use client'

import { remove } from '@/lib/services'
import { Button } from './ui/button'
import { XIcon } from 'lucide-react'

export default function DeleteLane({ data, open, onOpenChange }: { data: Lane; open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = data.id

  const handleClick = async () => {
    await remove('lanes', id)
    onOpenChange(false)
  }

  return (
    <div className="space-y-3">
      <h1>
        Are you sure want to delete lane <b>{data.title}</b>?
      </h1>

      <div className="flex gap-1 items-center">
        <Button size="sm" variant="destructive" className="cursor-pointer" onClick={handleClick}>
          Delete lane
        </Button>
        <Button size="icon-sm" variant="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
