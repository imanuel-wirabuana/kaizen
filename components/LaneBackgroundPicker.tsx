'use client'

import { ACCENTS, cn } from '@/lib/utils'

export default function LaneBackgroundPicker({ value, onChange }: { value?: string; onChange: (val: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Lane Background</p>

      <div className="flex flex-wrap gap-2">
        {/* Clear background */}
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn('h-8 w-8 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground', !value && 'ring-2 ring-primary ring-offset-2')}
          title="Clear background"
        >
          ✕
        </button>

        {ACCENTS.map((cls) => (
          <button key={cls} type="button" onClick={() => onChange(cls)} className={cn('h-8 w-8 rounded-md transition hover:scale-105', cls, value === cls && 'ring-2 ring-primary ring-offset-2')} />
        ))}
      </div>
    </div>
  )
}
