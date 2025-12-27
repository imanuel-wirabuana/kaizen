import { move } from '@dnd-kit/helpers'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const COLORS = [
  'bg-slate-800', // neutral / base
  'bg-sky-700', // light cool
  'bg-teal-700', // cool green-blue
  'bg-indigo-700', // deep cool
  'bg-rose-700', // warm accent
]

export const GRADIENTS = [
  'bg-gradient-to-br from-sky-600 to-indigo-600', // calm, airy
  'bg-gradient-to-br from-teal-600 to-cyan-600', // fresh, productive
  'bg-gradient-to-br from-indigo-600 to-purple-600', // focused, deep
  'bg-gradient-to-br from-fuchsia-600 to-pink-600', // energetic
  'bg-gradient-to-br from-rose-600 to-orange-600', // bold, warm
]

export const ACCENTS = [
  // Cool
  'bg-sky-600',
  'bg-cyan-600',
  'bg-teal-600',

  // Primary
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',

  // Warm
  'bg-amber-500',
  'bg-orange-600',

  // Accent
  'bg-rose-600',
  'bg-pink-600',
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function reorderLaneItems(items: Item[], event: any) {
  return move(items, event)
}

export function isImageUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/') || value.startsWith('data:image')
}
