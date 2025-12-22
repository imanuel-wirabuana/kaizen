'use client'

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from './ui/button'
import { GripHorizontalIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { Separator } from './ui/separator'
import { CollisionPriority } from '@dnd-kit/abstract'
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { useSortable } from '@dnd-kit/react/sortable'
import Item from './Item'
import { useState } from 'react'
import EditLane from './EditLane'
import DeleteLane from './DeleteLane'
import CreateItem from './CreateItem'

export default function Lane({ data, index, items }: { data: Lane; index: number; items: Item[] }) {
  const id = data.id

  const [isCreate, setIsCreate] = useState<boolean>(false)
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [isDelete, setIsDelete] = useState<boolean>(false)

  const { ref, handleRef, isDragging } = useSortable({
    id,
    index,
    data: { ...data, type: 'Lane' },
    disabled: isEdit || isDelete || isCreate,
    type: 'LANE',
    collisionPriority: CollisionPriority.Low,
    accept: ['ITEM', 'LANE'],
    modifiers: [RestrictToHorizontalAxis],
  })

  return (
    <Card size="sm" className={`w-3xs h-fit group/outer ${isDragging && 'opacity-60'}`} ref={ref}>
      <CardHeader>
        <CardTitle className="cursor-pointer">
          {isEdit ? (
            <EditLane data={data} open={isEdit} onOpenChange={setIsEdit} />
          ) : isDelete ? (
            <DeleteLane data={data} open={isDelete} onOpenChange={setIsDelete} />
          ) : (
            <div className=" flex items-center gap-2" onClick={() => setIsEdit(true)}>
              {data.title}
            </div>
          )}
        </CardTitle>

        {!isEdit && !isDelete ? (
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" className="cursor-pointer group-hover/outer:opacity-100 opacity-0" onClick={() => setIsDelete(true)}>
                <TrashIcon />
              </Button>
              <div ref={handleRef}>
                <Button variant="ghost" size="icon" className="cursor-grab">
                  <GripHorizontalIcon />
                </Button>
              </div>
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <Separator />
      <CardContent className="group">
        <div data-scroll className="space-y-3 overflow-y-auto h-fit max-h-[calc(100vh-50vh)]">
          {items.map((item, index) => (
            <Item data={item} index={index} group={id} key={item.id} />
          ))}

          {isCreate ? (
            <CreateItem boardId={data.boardId} laneId={id} open={isCreate} onOpenChange={setIsCreate} />
          ) : (
            <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={() => setIsCreate(true)}>
              <PlusIcon /> Create new item
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
