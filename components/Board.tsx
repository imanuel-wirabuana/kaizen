'use client'

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit3Icon, GripHorizontalIcon, TrashIcon } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/react/sortable'
import { useState } from 'react'
import EditBoard from './EditBoard'
import DeleteBoard from './DeleteBoard'
import { cn, isImageUrl } from '@/lib/utils'

export default function Board({ data, index }: { data: Board; index: number }) {
  const id = data.id
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [isDelete, setIsDelete] = useState<boolean>(false)

  const { ref, handleRef, isDragging } = useSortable({
    id,
    index,
    data,
    disabled: isEdit || isDelete,
  })

  return (
    <Card
      ref={ref}
      className={cn('group h-fit relative bg-cover bg-center ', isDragging && 'opacity-60', !isImageUrl(String(data.background)) && !isEdit && !isDelete ? data.background : '')}
      size="sm"
      style={isImageUrl(String(data.background)) && !isEdit && !isDelete ? { backgroundImage: `url(${data.background})` } : {}}
    >
      {/* Overlay (below content) */}
      {isImageUrl(String(data.background)) && !isEdit && !isDelete && <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 bg-black/50 rounded-md z-0" />}

      <div className="relative z-10 py-3">
        {isEdit ? (
          <CardContent>
            <EditBoard open={isEdit} onOpenChange={setIsEdit} data={data} />
          </CardContent>
        ) : isDelete ? (
          <CardContent>
            <DeleteBoard open={isDelete} onOpenChange={setIsDelete} data={data} />
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <Link href={`/board/${data.id}`} className="hover:underline">
                <CardTitle>{data.title}</CardTitle>
              </Link>

              <CardAction ref={handleRef}>
                <Button variant="ghost" size="icon" className="cursor-grab">
                  <GripHorizontalIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardFooter className="group-hover:opacity-100 opacity-0">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={() => setIsEdit(true)}>
                  <Edit3Icon />
                </Button>
                <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={() => setIsDelete(true)}>
                  <TrashIcon />
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </div>
    </Card>
  )
}
