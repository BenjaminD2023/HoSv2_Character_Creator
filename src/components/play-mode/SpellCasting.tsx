'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Wand2, Star } from 'lucide-react'

interface SpellCastingProps {
  characterId: string
  classId: 'wizard' | 'bard' | 'fighter' | 'archer' | 'priest'
  wizardSlots?: { L1: number; L2: number; L3: number; L4: number; L5: number }
  bardSlots?: number
  initialSlotState?: {
    wizard?: {
      L1: boolean[]
      L2: boolean[]
      L3: boolean[]
      L4?: boolean[]
      L5?: boolean[]
    }
    bard?: boolean[]
  }
  onSlotStateChange?: (state: {
    wizard?: {
      L1: boolean[]
      L2: boolean[]
      L3: boolean[]
      L4?: boolean[]
      L5?: boolean[]
    }
    bard?: boolean[]
  }) => void
}

interface SpellSlot {
  id: string
  isUsed: boolean
}

interface SpellSlotRow {
  level: string
  slots: SpellSlot[]
}

const LEVEL_CONFIG = {
  'Level 1': {
    icon: Sparkles,
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    slotColor: 'bg-purple-500',
  },
  'Level 2': {
    icon: Star,
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    slotColor: 'bg-violet-500',
  },
  'Level 3': {
    icon: Zap,
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    slotColor: 'bg-indigo-500',
  },
  'Level 4': {
    icon: Wand2,
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    slotColor: 'bg-rose-500',
  },
  'Level 5': {
    icon: Star,
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    slotColor: 'bg-fuchsia-500',
  },
  'Spell Slots': {
    icon: Sparkles,
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    slotColor: 'bg-blue-500',
  },
}

export function SpellCasting({
  characterId,
  classId,
  wizardSlots,
  bardSlots,
  initialSlotState,
  onSlotStateChange,
}: SpellCastingProps) {
  const [rows, setRows] = useState<SpellSlotRow[]>([])
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    
    if (classId === 'wizard' && wizardSlots) {
      const newRows: SpellSlotRow[] = [
        {
          level: 'Level 1',
          slots: Array.from({ length: wizardSlots.L1 }, (_, i) => ({
            id: `l1-${i}`,
            isUsed: initialSlotState?.wizard?.L1?.[i] ?? false,
          })),
        },
        {
          level: 'Level 2',
          slots: Array.from({ length: wizardSlots.L2 }, (_, i) => ({
            id: `l2-${i}`,
            isUsed: initialSlotState?.wizard?.L2?.[i] ?? false,
          })),
        },
        {
          level: 'Level 3',
          slots: Array.from({ length: wizardSlots.L3 }, (_, i) => ({
            id: `l3-${i}`,
            isUsed: initialSlotState?.wizard?.L3?.[i] ?? false,
          })),
        },
      ]
      if (wizardSlots.L4 > 0) {
        newRows.push({
          level: 'Level 4',
          slots: Array.from({ length: wizardSlots.L4 }, (_, i) => ({
            id: `l4-${i}`,
            isUsed: initialSlotState?.wizard?.L4?.[i] ?? false,
          })),
        })
      }
      if (wizardSlots.L5 > 0) {
        newRows.push({
          level: 'Level 5',
          slots: Array.from({ length: wizardSlots.L5 }, (_, i) => ({
            id: `l5-${i}`,
            isUsed: initialSlotState?.wizard?.L5?.[i] ?? false,
          })),
        })
      }
      setRows(newRows)
    } else if (classId === 'bard' && bardSlots) {
      setRows([{
        level: 'Spell Slots',
        slots: Array.from({ length: bardSlots }, (_, i) => ({
          id: `bard-${i}`,
          isUsed: initialSlotState?.bard?.[i] ?? false,
        })),
      }])
    }
    
    initializedRef.current = true
  }, [classId, wizardSlots, bardSlots])

  const syncToParent = useCallback(() => {
    if (!onSlotStateChange || rows.length === 0) return
    
    if (classId === 'wizard') {
      const wizardState: any = {}
      rows.forEach((row) => {
        const level = row.level.toLowerCase().replace('level ', 'L')
        wizardState[level] = row.slots.map((s) => s.isUsed)
      })
      onSlotStateChange({ wizard: wizardState })
    } else if (classId === 'bard') {
      const bardState = rows[0]?.slots.map((s) => s.isUsed) ?? []
      onSlotStateChange({ bard: bardState })
    }
  }, [rows, onSlotStateChange, classId])

  const toggleSlot = (rowIndex: number, slotIndex: number) => {
    setRows(prev => {
      const newRows = prev.map((row, ri) => {
        if (ri !== rowIndex) return row
        return {
          ...row,
          slots: row.slots.map((slot, si) => {
            if (si !== slotIndex) return slot
            return { ...slot, isUsed: !slot.isUsed }
          }),
        }
      })
      return newRows
    })
    setTimeout(syncToParent, 0)
  }

  if (rows.length === 0) return null

  const totalSlots = rows.reduce((sum, row) => sum + row.slots.length, 0)
  const usedSlots = rows.reduce((sum, row) => sum + row.slots.filter(s => s.isUsed).length, 0)

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-slate-950 to-purple-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-300">
          <Wand2 className="w-5 h-5" />
          Spell Slots
          <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-300 bg-purple-500/10">
            {totalSlots - usedSlots} / {totalSlots}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row, rowIndex) => {
          const config = LEVEL_CONFIG[row.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG['Level 1']
          const Icon = config.icon
          const availableInRow = row.slots.filter(s => !s.isUsed).length

          return (
            <div key={row.level} className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn("w-24 justify-center shrink-0", config.badgeClass)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {row.level}
              </Badge>

              <div className="flex gap-1.5 flex-wrap flex-1">
                {row.slots.map((slot, slotIndex) => (
                  <button
                    key={slot.id}
                    onClick={() => toggleSlot(rowIndex, slotIndex)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all duration-200',
                      'hover:scale-110 active:scale-95',
                      slot.isUsed
                        ? 'bg-slate-800 border-slate-600'
                        : [config.slotColor, 'border-white/30']
                    )}
                  >
                    {!slot.isUsed && (
                      <span className="block w-2 h-2 mx-auto rounded-full bg-white/50" />
                    )}
                  </button>
                ))}
              </div>

              <span className="text-xs text-muted-foreground w-10 text-right">
                {availableInRow}/{row.slots.length}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
