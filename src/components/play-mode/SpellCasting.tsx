'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Moon } from 'lucide-react'

interface SpellCastingProps {
  characterId: string
  classId: 'wizard' | 'bard' | 'fighter' | 'archer' | 'priest'
  bardLevel?: number
}

interface SpellSlot {
  id: string
  isUsed: boolean
}

interface SpellSlotRow {
  level: string
  slots: SpellSlot[]
}

export function SpellCasting({ characterId, classId, bardLevel = 1 }: SpellCastingProps) {
  const [rows, setRows] = useState<SpellSlotRow[]>([])

  useEffect(() => {
    if (classId === 'wizard') {
      setRows([
        { 
          level: 'Level 1', 
          slots: Array.from({ length: 5 }, (_, i) => ({ 
            id: `l1-${i}`, 
            isUsed: false 
          }))
        },
        { 
          level: 'Level 2', 
          slots: Array.from({ length: 4 }, (_, i) => ({ 
            id: `l2-${i}`, 
            isUsed: false 
          }))
        },
        { 
          level: 'Level 3', 
          slots: Array.from({ length: 1 }, (_, i) => ({ 
            id: `l3-${i}`, 
            isUsed: false 
          }))
        },
      ])
    } else if (classId === 'bard') {
      setRows([
        { 
          level: 'Spell Slots', 
          slots: Array.from({ length: bardLevel }, (_, i) => ({ 
            id: `bard-${i}`, 
            isUsed: false 
          }))
        },
      ])
    }
  }, [classId, bardLevel])

  const toggleSlot = (rowIndex: number, slotIndex: number) => {
    setRows(prev => {
      const newRows = [...prev]
      const slot = newRows[rowIndex].slots[slotIndex]
      slot.isUsed = !slot.isUsed
      return newRows
    })
  }

  const restoreAll = () => {
    setRows(prev => prev.map(row => ({
      ...row,
      slots: row.slots.map(slot => ({ ...slot, isUsed: false }))
    })))
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
            {row.slots.map((slot, slotIndex) => (
              <button
                key={slot.id}
                onClick={() => toggleSlot(rowIndex, slotIndex)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all duration-200',
                  'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                  slot.isUsed
                    ? 'bg-gray-800 border-gray-700 shadow-inner'
                    : 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/20'
                )}
                title={slot.isUsed ? 'Click to restore' : 'Click to use'}
              />
            ))}
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
