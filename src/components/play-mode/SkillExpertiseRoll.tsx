'use client'

import { useState } from 'react'
import { Swords, Zap, Brain, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSkill } from '@/stores/skillStore'
import { useDice } from '@/contexts'
import { RollResultPopup } from '@/components/RollResultPopup'

interface SkillExpertiseRollProps {
  skillId: string
  characterId: string
  className?: string
  characterStats?: {
    strength: number
    intelligence: number
    athletics: number
  }
}

type ExpertiseAttribute = 'strength' | 'athletics' | 'intelligence' | 'charisma'

function getModifier(value: number): number {
  if (value <= 1) return -5
  if (value <= 3) return -4
  if (value <= 5) return -3
  if (value <= 7) return -2
  if (value <= 9) return -1
  if (value <= 11) return 0
  if (value <= 13) return 1
  if (value <= 15) return 2
  if (value <= 17) return 3
  if (value <= 19) return 4
  if (value <= 21) return 5
  if (value <= 23) return 6
  if (value <= 25) return 7
  if (value <= 27) return 8
  if (value <= 29) return 9
  return 10
}

const EXPERTISE_CONFIG: Record<ExpertiseAttribute, {
  label: string
  icon: typeof Swords
  color: string
  getModifier: (stats: { strength: number; intelligence: number; athletics: number }) => number
}> = {
  strength: {
    label: 'STR',
    icon: Swords,
    color: '#D62828',
    getModifier: (stats) => getModifier(stats.strength),
  },
  athletics: {
    label: 'ATH',
    icon: Zap,
    color: '#2A9D2A',
    getModifier: (stats) => getModifier(stats.athletics),
  },
  intelligence: {
    label: 'INT',
    icon: Brain,
    color: '#2563EB',
    getModifier: (stats) => getModifier(stats.intelligence),
  },
  charisma: {
    label: 'CHA',
    icon: Sparkles,
    color: '#F4D03F',
    getModifier: () => 0,
  },
}

export function SkillExpertiseRoll({ skillId, characterId, className, characterStats }: SkillExpertiseRollProps) {
  const skill = useSkill(characterId, skillId)
  const { rollDice, isReady } = useDice()
  const [rollResult, setRollResult] = useState<{
    label: string
    naturalRoll: number
    modifier: number
    total: number
    type: ExpertiseAttribute
    diceSize: number
    skillBonus: number
  } | null>(null)

  if (!skill) return null

  const handleRoll = async (attr: ExpertiseAttribute) => {
    if (!isReady || !characterStats) return

    const config = EXPERTISE_CONFIG[attr]
    const baseModifier = config.getModifier(characterStats)
    const skillBonus = skill.level
    const totalModifier = baseModifier + skillBonus

    const results = await rollDice('1d20', { theme: 'smooth', themeColor: config.color })
    const naturalRoll = results[0]?.value || 0
    const total = naturalRoll + totalModifier

    setRollResult({
      label: `${config.label} Check`,
      naturalRoll,
      modifier: totalModifier,
      total,
      type: attr,
      diceSize: 20,
      skillBonus,
    })
  }

  return (
    <>
      <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
        <span className="font-medium text-sm truncate">{skill.name}</span>
        <div className="flex items-center gap-1 shrink-0">
          {(Object.keys(EXPERTISE_CONFIG) as ExpertiseAttribute[]).map((attr) => {
            const config = EXPERTISE_CONFIG[attr]
            const Icon = config.icon
            const baseMod = characterStats ? config.getModifier(characterStats) : 0
            const totalMod = baseMod + skill.level

            return (
              <Button
                key={attr}
                onClick={() => handleRoll(attr)}
                disabled={!isReady}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                style={{ color: config.color, borderColor: `${config.color}40` }}
                title={`${config.label} +${totalMod}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            )
          })}
        </div>
      </div>

      <RollResultPopup
        result={rollResult}
        onClose={() => setRollResult(null)}
      />
    </>
  )
}