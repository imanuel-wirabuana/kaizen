import { move } from '@dnd-kit/helpers'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function reorderLaneItems(items: Item[], event: any) {
  return move(items, event)
}
