'use client'

import { useSkill, useSkillActions, SKILL_DEFINITIONS } from '@/stores/skillStore'
import { Switch } from '@radix-ui/react-switch'
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
    if (skillId.includes('rage')) return <Flame className="h-4 w-4" />
    if (skillId.includes('block') || skillId.includes('bulwark')) return <Shield className="h-4 w-4" />
    return null
  }

  const getToggleColor = () => {
    if (skillId.includes('rage')) return 'data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500'
    if (skillId.includes('block') || skillId.includes('bulwark')) return 'data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500'
    return 'data-[state=checked]:bg-primary data-[state=checked]:border-primary'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3 rounded-lg border bg-card transition-all',
        isActive && 'border-primary/50 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {getToggleIcon()}
          <span className="font-medium">{skill.name}</span>
          {isActive && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Active</span>
          )}
        </div>
        {skill.description && (
          <span className="text-sm text-muted-foreground">{skill.description}</span>
        )}
        {hasAutoOff && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            <span>
              Auto-off: {definition.autoOffConditions?.join(', ').replace(/-/g, ' ')}
            </span>
          </div>
        )}
      </div>

      <Switch
        checked={skill.isToggled}
        onCheckedChange={() => toggleSkill(characterId, skillId)}
        className={cn(
          'w-14 h-8 rounded-full border-2 border-input bg-muted transition-colors relative',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          getToggleColor()
        )}
      >
        <span
          className={cn(
            'block w-6 h-6 rounded-full bg-background shadow-lg transition-transform duration-200',
            'absolute top-0.5 left-0.5',
            isActive ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </Switch>
    </div>
  )
}
