'use client'

import { useMemo, useRef, useEffect } from 'react'
import { Sword, Crosshair, Sparkles, Shield, Music } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSkillStore, SKILL_DEFINITIONS } from '@/stores/skillStore'
import { SkillTracker } from './SkillTracker'
import { SkillToggle } from './SkillToggle'
import { SkillConfig } from './SkillConfig'
import { SkillPassive } from './SkillPassive'
import { SkillAction } from './SkillAction'
import { SkillExpertiseRoll } from './SkillExpertiseRoll'
import { DivineFormationConfig } from './DivineFormationConfig'

interface SkillRendererProps {
  characterId: string
  classId: 'fighter' | 'archer' | 'wizard' | 'priest' | 'bard'
  skills: Array<{ id: string; level: number }>
  characterStats?: {
    strength: number
    intelligence: number
    athletics: number
  }
}

const CLASS_ICONS = {
  fighter: Sword,
  archer: Crosshair,
  wizard: Sparkles,
  priest: Shield,
  bard: Music,
}

const CLASS_COLORS = {
  fighter: 'text-red-500',
  archer: 'text-green-500',
  wizard: 'text-blue-500',
  priest: 'text-amber-500',
  bard: 'text-purple-500',
}

export function SkillRenderer({ characterId, classId, skills, characterStats }: SkillRendererProps) {
  const { initializeSkills } = useSkillStore()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current && skills.length > 0) {
      initializeSkills(characterId, skills, classId)
      hasInitialized.current = true
    }
  }, [characterId, classId, skills, initializeSkills])

  const categorizedSkills = useMemo(() => {
    const result = {
      toggleTrackers: [] as typeof skills,
      trackers: [] as typeof skills,
      toggles: [] as typeof skills,
      configs: [] as typeof skills,
      passives: [] as typeof skills,
      actions: [] as typeof skills,
      expertiseRolls: [] as typeof skills,
      divineFormation: null as typeof skills[0] | null,
    }

    skills.forEach((skill) => {
      const def = SKILL_DEFINITIONS[skill.id]
      if (!def) return

      if (def.specialRules?.includes('divine-formation')) {
        result.divineFormation = skill
        return
      }

      switch (def.uiType) {
        case 'Toggle & Tracker':
          result.toggleTrackers.push(skill)
          break
        case 'Tracker':
          result.trackers.push(skill)
          break
        case 'Toggle':
          result.toggles.push(skill)
          break
        case 'Config':
          result.configs.push(skill)
          break
        case 'Passive':
          result.passives.push(skill)
          break
        case 'Action':
          result.actions.push(skill)
          break
        case 'ExpertiseRoll':
          result.expertiseRolls.push(skill)
          break
      }
    })

    return result
  }, [skills])

  const hasContent = skills.length > 0

  if (!hasContent) {
    return (
      <p className="text-sm text-muted-foreground py-2">No skills available</p>
    )
  }

  const allSkills = [
    ...categorizedSkills.toggleTrackers.map(s => ({ ...s, type: 'toggle-tracker' as const })),
    ...categorizedSkills.trackers.map(s => ({ ...s, type: 'tracker' as const })),
    ...categorizedSkills.toggles.map(s => ({ ...s, type: 'toggle' as const })),
    ...categorizedSkills.configs.map(s => ({ ...s, type: 'config' as const })),
    ...categorizedSkills.passives.map(s => ({ ...s, type: 'passive' as const })),
    ...categorizedSkills.actions.map(s => ({ ...s, type: 'action' as const })),
    ...categorizedSkills.expertiseRolls.map(s => ({ ...s, type: 'expertise-roll' as const })),
  ]

  return (
    <div className="space-y-0">
      {categorizedSkills.divineFormation && classId === 'priest' && (
        <DivineFormationConfig characterId={characterId} />
      )}

      {allSkills.map((skill) => {
        const def = SKILL_DEFINITIONS[skill.id]

        if (skill.type === 'toggle-tracker') {
          return (
            <div key={skill.id}>
              <SkillToggle skillId={skill.id} characterId={characterId} />
              <SkillTracker skillId={skill.id} characterId={characterId} />
            </div>
          )
        }

        if (skill.type === 'tracker') {
          return (
            <SkillTracker
              key={skill.id}
              skillId={skill.id}
              characterId={characterId}
              showRegainButton={def?.showRegainButton}
            />
          )
        }

        if (skill.type === 'toggle') {
          return <SkillToggle key={skill.id} skillId={skill.id} characterId={characterId} />
        }

        if (skill.type === 'config') {
          return <SkillConfig key={skill.id} skillId={skill.id} characterId={characterId} />
        }

        if (skill.type === 'passive') {
          return <SkillPassive key={skill.id} skillId={skill.id} characterId={characterId} />
        }

        if (skill.type === 'action') {
          return <SkillAction key={skill.id} skillId={skill.id} characterId={characterId} characterStats={characterStats} />
        }

        if (skill.type === 'expertise-roll') {
          return <SkillExpertiseRoll key={skill.id} skillId={skill.id} characterId={characterId} characterStats={characterStats} />
        }

        return null
      })}
    </div>
  )
}