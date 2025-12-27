'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn, COLORS, GRADIENTS } from '@/lib/utils'

function isImageUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/') || value.startsWith('data:image')
}

export default function BoardBackgroundPicker({ value, onChange }: { value?: string; onChange: (val: string) => void }) {
  const [url, setUrl] = useState(value && isImageUrl(value) ? value : '')

  const isImage = isImageUrl(value || '')

  return (
    <div className="space-y-4">
      {/* Preset colors */}
      <div className="space-y-2 h-">
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => onChange(c)} className={cn('h-8 w-8 rounded', c, value === c && 'ring-2 ring-primary')} />
          ))}
        </div>
      </div>

      {/* Preset gradients */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {GRADIENTS.map((g) => (
            <button key={g} type="button" onClick={() => onChange(g)} className={cn('h-8 w-8 rounded', g, value === g && 'ring-2 ring-primary')} />
          ))}
        </div>
      </div>

      {/* Image URL input ONLY */}
      <div className="space-y-2">
        <Input
          placeholder="https://images.unsplash.com/..."
          value={url}
          onChange={(e) => {
            const next = e.target.value
            setUrl(next)

            if (isImageUrl(next)) {
              onChange(next)
            }
          }}
        />
      </div>

      {/* Preview */}
      <div
        onClick={() => onChange('')}
        className={cn('relative h-32 rounded-lg border bg-cover bg-center cursor-pointer transition hover:opacity-90', !isImage && value)}
        style={isImage && value ? { backgroundImage: `url(${value})` } : undefined}
      >
        {/* Overlay */}
        {isImage && value && <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 bg-black/50 rounded-lg" />}

        {/* Fake content */}
        <div className="relative z-10 grid grid-cols-4 gap-2 p-2">
          {[11, 22, 8, 14].map((e, i) => (
            <div
              key={i}
              className="bg-zinc-900/70 rounded-lg"
              style={{ height: `${e * 4}px` }} // Tailwind h-* is 4px scale
            />
          ))}
        </div>
      </div>
    </div>
  )
}
