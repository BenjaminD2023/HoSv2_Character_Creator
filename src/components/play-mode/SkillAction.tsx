'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Swords, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSkill } from '@/stores/skillStore'
import { useDice } from '@/contexts'
import { RollResultPopup } from '@/components/RollResultPopup'

interface SkillActionProps {
  skillId: string
  characterId: string
  className?: string
  characterStats?: {
    strength: number
    intelligence: number
    athletics: number
  }
}

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

export function SkillAction({ skillId, characterId, className, characterStats }: SkillActionProps) {
  const skill = useSkill(characterId, skillId)
  const { rollDice, isReady } = useDice()
  const [rollResult, setRollResult] = useState<{
    label: string
    naturalRoll: number
    modifier: number
    total: number
    type: 'strength'
    diceSize: number
    grappleDamage?: number
  } | null>(null)
  const [showGlow, setShowGlow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (showGlow) {
      const timer = setTimeout(() => setShowGlow(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showGlow])

  if (!skill) return null

  const isGrappler = skillId === 'fighter-grappler'
  const isHeroicDeed = skillId === 'fighter-heroic-deed'

  const handleGrapple = async () => {
    if (!isReady || !characterStats) return
    
    const strModifier = getModifier(characterStats.strength)
    const grappleDamage = skill.level + strModifier
    
    const results = await rollDice('1d20', { theme: 'smooth', themeColor: '#D62828' })
    const naturalRoll = results[0]?.value || 0
    const total = naturalRoll + strModifier
    
    setRollResult({
      label: 'STR Check',
      naturalRoll,
      modifier: strModifier,
      total,
      type: 'strength',
      diceSize: 20,
      grappleDamage,
    })
  }

  const handleHeroicDeed = () => {
    setShowGlow(true)
  }

  if (isGrappler) {
    return (
      <>
        <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium text-sm truncate">{skill.name}</span>
            <span className="text-xs text-muted-foreground">
              Dmg: SL + STR = {skill.level + (characterStats ? getModifier(characterStats.strength) : 0)}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleGrapple}
            disabled={!isReady}
            className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white shrink-0"
          >
            <Swords className="h-3.5 w-3.5 mr-1" />
            Grapple
          </Button>
        </div>

        <RollResultPopup
          result={rollResult}
          onClose={() => setRollResult(null)}
        />
      </>
    )
  }

  if (isHeroicDeed) {
    return (
      <>
        <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-medium text-sm truncate">{skill.name}</span>
          </div>
          <Button
            size="sm"
            onClick={handleHeroicDeed}
            className="h-8 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Perform
          </Button>
        </div>

        {showGlow && mounted && createPortal(
          <div
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ animation: 'heroicGlow 2s ease-out forwards' }}
          >
            <style>{`
              @keyframes heroicGlow {
                0% { opacity: 0; }
                10% { opacity: 1; }
                100% { opacity: 0; }
              }
              @keyframes glowPulse {
                0%, 100% { box-shadow: 0 0 50px 20px rgba(245, 158, 11, 0.4); }
                50% { box-shadow: 0 0 100px 40px rgba(245, 158, 11, 0.6); }
              }
            `}</style>
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(245, 158, 11, 0.15) 70%, rgba(245, 158, 11, 0.3) 90%, rgba(245, 158, 11, 0.5) 100%)',
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'glowPulse 0.5s ease-in-out 3' }}
            >
              <div className="text-center">
                <Sparkles className="h-16 w-16 text-amber-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))' }} />
                <p className="text-2xl font-bold text-amber-200" style={{ textShadow: '0 0 20px rgba(245, 158, 11, 0.8)' }}>
                  Heroic Deed Performed!
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
      <span className="font-medium text-sm truncate">{skill.name}</span>
      {skill.description && (
        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
          {skill.description}
        </span>
      )}
    </div>
  )
}