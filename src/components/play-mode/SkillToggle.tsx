'use client'

import { useSkill, useSkillActions, SKILL_DEFINITIONS } from '@/stores/skillStore'
import { cn } from '@/lib/utils'
import { AlertCircle, Flame, Shield } from 'lucide-react'

interface SkillToggleProps {
  skillId: string
  characterId: string
  className?: string
}

export function SkillToggle({ skillId, characterId, className }: SkillToggleProps) {
  const skill = useSkill(characterId, skillId)
  const definition = SKILL_DEFINITIONS[skillId]
  const { toggleSkill } = useSkillActions()

  if (!skill || !definition) return null

  const hasAutoOff = definition.autoOffConditions && definition.autoOffConditions.length > 0
  const isActive = skill.isToggled

  const getToggleIcon = () => {
    if (skillId.includes('rage')) return <Flame className="h-3.5 w-3.5" />
    if (skillId.includes('block') || skillId.includes('bulwark')) return <Shield className="h-3.5 w-3.5" />
    return null
  }

  const getToggleColor = () => {
    if (skillId.includes('rage')) return 'bg-orange-500 text-white border-orange-500'
    if (skillId.includes('block') || skillId.includes('bulwark')) return 'bg-blue-500 text-white border-blue-500'
    return 'bg-primary text-primary-foreground border-primary'
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
      <div className="flex items-center gap-2 min-w-0">
        {getToggleIcon()}
        <span className="font-medium text-sm truncate">{skill.name}</span>
        {hasAutoOff && (
          <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
        )}
      </div>
      <button
        onClick={() => toggleSkill(characterId, skillId)}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0',
          isActive
            ? getToggleColor()
            : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
        )}
      >
        {isActive ? 'Active' : 'Off'}
      </button>
    </div>
  )
}