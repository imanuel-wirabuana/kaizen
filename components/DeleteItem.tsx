'use client'

import { remove } from '@/lib/services'
import { Button } from './ui/button'
import { XIcon } from 'lucide-react'

export default function DeleteItem({ data, open, onOpenChange }: { data: Item; open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = data.id

  const handleClick = async () => {
    await remove('items', id)
    onOpenChange(false)
  }

  return (
    <div className="space-y-3">
      <h1>
        Are you sure want to delete lane <b>{data.title}</b>?
      </h1>

      <div className="flex gap-1 items-center">
        <Button size="sm" variant="destructive" className="cursor-pointer" onClick={handleClick}>
          Delete item
        </Button>
        <Button size="icon-sm" variant="ghost" className="cursor-pointer" onClick={() => onOpenChange(false)}>
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
