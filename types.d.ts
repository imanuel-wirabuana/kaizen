// BOARD
type Board = {
  id: string
  title: string
  order: number
  background?: string
  createdAt?: number
  updatedAt?: number
}

// LANE
type Lane = {
  id: string
  title: string
  order: number
  background?: string
  createdAt?: number
  updatedAt?: number

  boardId: string // FK Board
}

// ITEM

// ITEM -> LIST
type List = {
  id: string
  title: string
  order: number
}

// ITEM -> ITEM CONTENT
type ItemContent = {
  description: any // Rich text editor
  list: List[]
}

type Item = {
  id: string
  title: string
  order: number
  createdAt?: number
  updatedAt?: number

  description?: string

  boardId: string // FK Board
  laneId: string // FK Lane
}
