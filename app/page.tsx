'use client'

import Board from '@/components/Board'
import CreateBoard from '@/components/CreateBoard'
import { Button } from '@/components/ui/button'
import { index, reindex, update } from '@/lib/services'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { PlusIcon } from 'lucide-react'
import { startTransition, useEffect, useState } from 'react'

export default function Page() {
  const [boards, setBoards] = useState<Board[]>([])
  const [isCreate, setIsCreate] = useState<boolean>(false)

  useEffect(() => {
    const unsub = index<Board>('boards', (data) => setBoards(data))
    return () => unsub()
  }, [])

  return (
    <section className="px-6 py-3 mx-auto">
      <nav className="flex justify-between items-center gap-4 mb-4">
        <h1>Your Boards</h1>
      </nav>

      <DragDropProvider
        onDragEnd={(event) => {
          const { source, target } = event.operation

          if (event.canceled) return
          if (!source || !target) return
          let nextBoards: Board[] = []

          setBoards((prev) => {
            nextBoards = move(prev, event)
            return nextBoards
          })

          startTransition(() => {
            reindex<Board>('boards', nextBoards)
          })
        }}
      >
        <div className="grid md:grid-cols-6 sm:grid-cols-3 gap-4">
          {boards.map((board, index) => (
            <Board data={board} index={index} key={board.id} />
          ))}

          {isCreate ? (
            <CreateBoard open={isCreate} onOpenChange={(open) => setIsCreate(open)} />
          ) : (
            <Button variant="ghost" size="lg" className="w-full h-11 text-muted-foreground cursor-pointer" onClick={() => setIsCreate(true)}>
              <PlusIcon />
              Create new board
            </Button>
          )}
        </div>
        <DragOverlay>{({ data }) => <Board data={{ id: data.id, title: data.title, createdAt: data.createdAt, order: data.order }} index={0} />}</DragOverlay>
      </DragDropProvider>
    </section>
  )
}
