'use client'
import { Item as ItemCard, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { useSortable } from '@dnd-kit/react/sortable'
import { EditIcon } from 'lucide-react'
import EditItem from './EditItem'
import { useState } from 'react'

export default function Item({ data, index, group }: { data: Item; index: number; group: string }) {
  const id = data.id

  const [isEdit, setIsEdit] = useState<boolean>(false)

  const { ref, isDragging } = useSortable({
    id,
    index,
    data,
    type: 'ITEM',
    accept: 'ITEM',
    group,
  })
  return (
    <div>
      <ItemCard variant="muted" size="sm" ref={ref} className={`group/item cursor-pointer bg-muted ${isDragging && 'opacity-50'} hover:brightness-125`} onClick={() => setIsEdit(true)}>
        <ItemContent>
          <ItemTitle>{data.title}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <EditIcon size={11} className="hidden group-hover/item:block" />
        </ItemActions>
      </ItemCard>
      {isEdit && <EditItem data={data} open={isEdit} onOpenChange={setIsEdit} />}
    </div>
  )
}
