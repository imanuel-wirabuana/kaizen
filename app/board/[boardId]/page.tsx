'use client'

import CreateLane from '@/components/CreateLane'
import Item from '@/components/Item'
import Lane from '@/components/Lane'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { index, reindex, reindexItems, show, update } from '@/lib/services'
import { cn, isImageUrl, reorderLaneItems } from '@/lib/utils'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { where } from 'firebase/firestore'
import { PlusIcon } from 'lucide-react'
import { startTransition, use, useEffect, useState } from 'react'

export default function Page({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params)

  const [board, setBoard] = useState<Board | null>(null)
  const [lanes, setLanes] = useState<Lane[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState<string>('')

  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [isCreate, setIsCreate] = useState<boolean>(false)

  useEffect(() => {
    index<Lane>('lanes', (lanes) => setLanes(lanes), { where: where('boardId', '==', boardId) })
    index<Item>('items', (items) => setItems(items), { where: where('boardId', '==', boardId) })
    show<Board>('boards', boardId, (data) => setBoard(data))
  }, [boardId])

  useEffect(() => {
    if (!board) return
    setTitle(board.title)
  }, [board])

  const handleOnKeyEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      update<Board>('boards', boardId, { title })
      setIsEdit(false)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Ignore wheel events coming from children
    if (e.target !== e.currentTarget) return

    // Convert vertical wheel → horizontal scroll
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY * 0.5
    }
  }

  return (
    <section
      className={cn('flex flex-col h-[calc(100vh-44px)] relative bg-cover bg-center', !isImageUrl(String(board?.background)) && board?.background)}
      style={isImageUrl(String(board?.background)) ? { backgroundImage: `url(${board?.background})` } : undefined}
    >
      {isImageUrl(String(board?.background)) && <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 bg-black/50 z-0" />}

      <nav className="relative z-10 shrink-0 flex justify-between items-center h-10 px-6 py-1.5 bg-black/50">
        {isEdit ? (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-fit" autoFocus onBlur={() => setIsEdit(false)} onKeyDown={handleOnKeyEnter} />
        ) : (
          <Button variant="ghost" size="lg" className="text-lg cursor-pointer" onClick={() => setIsEdit(true)}>
            {board?.title}
          </Button>
        )}
      </nav>
      <DragDropProvider
        onDragOver={(event) => {
          const { source, target } = event.operation
          if (!source || !target) return
          if (source.id === target.id) return

          // ───────────────
          // LANE → LANE
          // ───────────────
          if (source.type === 'LANE' && target.type === 'LANE') {
            setLanes((lanes) => move(lanes, event))
            return
          }

          // ───────────────
          // ITEM logic
          // ───────────────
          if (source.type !== 'ITEM') return

          setItems((items) => {
            const sourceItem = items.find((i) => i.id === source.data.id)
            if (!sourceItem) return items

            // ITEM → LANE (empty lane)
            if (target.type === 'LANE') {
              if (sourceItem.laneId === target.data.id) return items

              return items.map((item) => (item.id === sourceItem.id ? { ...item, laneId: target.data.id } : item))
            }

            // ITEM → ITEM
            if (target.type === 'ITEM') {
              const targetLaneId = target.data.laneId

              const updated = items.map((item) => (item.id === sourceItem.id ? { ...item, laneId: targetLaneId } : item))

              const laneItems = updated.filter((i) => i.laneId === targetLaneId)
              const otherItems = updated.filter((i) => i.laneId !== targetLaneId)

              return [...otherItems, ...reorderLaneItems(laneItems, event)]
            }

            return items
          })
        }}
        onDragEnd={(event) => {
          const { source, target } = event.operation

          if (event.canceled) return
          if (!source || !target) return

          startTransition(async () => {
            // ───────────────
            // LANE → LANE
            // ───────────────
            if (source.type === 'LANE') {
              await reindex<Lane>('lanes', lanes)
              return
            }

            // ───────────────
            // ITEM → (LANE | ITEM)
            // ───────────────
            if (source.type === 'ITEM') {
              await reindexItems('items', items)
              return
            }
          })
        }}
      >
        <div onWheel={handleWheel} className="relative z-10 flex-1 min-h-0 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
          <div className="flex gap-4 py-3 min-w-max px-3 ">
            {lanes.map((lane, index) => (
              <Lane data={lane} index={index} items={items.filter((item) => item.laneId === lane.id)} key={lane.id} />
            ))}
            {isCreate ? (
              <CreateLane boardId={boardId} open={isCreate} onOpenChange={setIsCreate} />
            ) : (
              <div className="min-w-3xs">
                <Button variant="ghost" className="w-full h-11 bg-black/20 text-muted-foreground cursor-pointer" onClick={() => setIsCreate(true)}>
                  <PlusIcon /> Create new lane
                </Button>
              </div>
            )}
          </div>
        </div>
        <DragOverlay>
          {({ data, type }) =>
            type === 'LANE' ? (
              <Lane data={{ id: data.id, title: data.title, boardId, order: data.order }} index={0} items={items.filter((item) => item.laneId === data.id)}></Lane>
            ) : (
              <Item data={{ id: data.id, title: data.title, laneId: data.laneId, boardId, order: data.order }} index={0} group="" />
            )
          }
        </DragOverlay>
      </DragDropProvider>
    </section>
  )
}
