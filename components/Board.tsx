'use client'

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit3Icon, GripHorizontalIcon, TrashIcon } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/react/sortable'
import { useEffect, useState } from 'react'
import EditBoard from './EditBoard'
import DeleteBoard from './DeleteBoard'

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
    <Card ref={ref} className={`group h-fit ${isDragging && 'opacity-60'}`} size="sm">
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
    </Card>
  )
}
