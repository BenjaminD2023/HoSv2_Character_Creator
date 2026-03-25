'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Moon } from 'lucide-react'

interface SpellCastingProps {
  characterId: string
  classId: 'wizard' | 'bard' | 'fighter' | 'archer' | 'priest'
  bardLevel?: number // For bards: highest skill level
}

interface SpellSlotRow {
  level: string
  maxSlots: number
  usedSlots: number
}

export function SpellCasting({ characterId, classId, bardLevel = 1 }: SpellCastingProps) {
  const [rows, setRows] = useState<SpellSlotRow[]>([])

  useEffect(() => {
    if (classId === 'wizard') {
      setRows([
        { level: 'Level 1', maxSlots: 5, usedSlots: 0 },
        { level: 'Level 2', maxSlots: 4, usedSlots: 0 },
        { level: 'Level 3', maxSlots: 1, usedSlots: 0 },
        { level: 'Level 4', maxSlots: 0, usedSlots: 0 },
        { level: 'Level 5', maxSlots: 0, usedSlots: 0 },
      ])
    } else if (classId === 'bard') {
      setRows([
        { level: 'Spell Slots', maxSlots: bardLevel, usedSlots: 0 },
      ])
    }
  }, [classId, bardLevel])

  const toggleSlot = (rowIndex: number, slotIndex: number) => {
    setRows(prev => {
      const newRows = [...prev]
      const row = newRows[rowIndex]
      // If slot is available (index >= usedSlots), use it
      // If slot is used (index < usedSlots), restore it
      if (slotIndex >= row.usedSlots) {
        // Using a slot: mark all slots from usedSlots to slotIndex as used
        row.usedSlots = slotIndex + 1
      } else {
        // Restoring a slot: mark slotIndex as available
        row.usedSlots = slotIndex
      }
      return newRows
    })
  }

  const restoreAll = () => {
    setRows(prev => prev.map(row => ({ ...row, usedSlots: 0 })))
  }

  if (rows.length === 0) return null

  return (
    <div className="space-y-4">
      {rows.map((row, rowIndex) => (
        <div key={row.level} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 shrink-0">
            {row.level}
          </span>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: row.maxSlots }).map((_, slotIndex) => {
              const isUsed = slotIndex < row.usedSlots
              return (
                <button
                  key={slotIndex}
                  onClick={() => toggleSlot(rowIndex, slotIndex)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all duration-200',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                    isUsed
                      ? 'bg-gray-800 border-gray-700 shadow-inner'
                      : 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/20'
                  )}
                  title={isUsed ? 'Click to restore' : 'Click to use'}
                />
              )
            })}
            {row.maxSlots === 0 && (
              <span className="text-xs text-muted-foreground italic">
                Unlock via XP
              </span>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={restoreAll}
        className="w-full mt-4 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
      >
        <Moon className="w-4 h-4 mr-2" />
        Long Rest - Restore All Slots
      </Button>
    </div>
  )
}