'use client'

import { useMemo, useRef, useEffect } from 'react'
import { Sword, Crosshair, Sparkles, Shield, Music } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSkillStore, SKILL_DEFINITIONS } from '@/stores/skillStore'
import { SkillTracker } from './SkillTracker'
import { SkillToggle } from './SkillToggle'
import { SkillConfig } from './SkillConfig'
import { SkillPassive } from './SkillPassive'
import { SkillAction } from './SkillAction'
import { DivineFormationConfig } from './DivineFormationConfig'

interface SkillRendererProps {
  characterId: string
  classId: 'fighter' | 'archer' | 'wizard' | 'priest' | 'bard'
  skills: Array<{ id: string; level: number }>
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

export function SkillRenderer({ characterId, classId, skills }: SkillRendererProps) {
  const { initializeSkills, characterSkills } = useSkillStore()
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
      }
    })

    return result
  }, [skills])

  const Icon = CLASS_ICONS[classId]
  const colorClass = CLASS_COLORS[classId]

  const hasContent = skills.length > 0

  if (!hasContent) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No skills available for this character</p>
        </CardContent>
      </Card>
    )
  }

  const allSkills = [
    ...categorizedSkills.toggleTrackers.map(s => ({ ...s, type: 'toggle-tracker' as const })),
    ...categorizedSkills.trackers.map(s => ({ ...s, type: 'tracker' as const })),
    ...categorizedSkills.toggles.map(s => ({ ...s, type: 'toggle' as const })),
    ...categorizedSkills.configs.map(s => ({ ...s, type: 'config' as const })),
    ...categorizedSkills.passives.map(s => ({ ...s, type: 'passive' as const })),
    ...categorizedSkills.actions.map(s => ({ ...s, type: 'action' as const })),
  ]

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {categorizedSkills.divineFormation && classId === 'priest' && (
        <DivineFormationConfig characterId={characterId} />
      )}

      {allSkills.map((skill) => {
        const def = SKILL_DEFINITIONS[skill.id]

        if (skill.type === 'toggle-tracker') {
          return (
            <div key={skill.id} className="space-y-2">
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
          return <SkillAction key={skill.id} skillId={skill.id} characterId={characterId} />
        }

        return null
      })}
    </div>
  )
}