'use client'

import { useSkill } from '@/stores/skillStore'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillPassiveProps {
  skillId: string
  characterId: string
  className?: string
}

export function SkillPassive({ skillId, characterId, className }: SkillPassiveProps) {
  const skill = useSkill(characterId, skillId)

  if (!skill) return null

  return (
    <Card className={cn('p-3 border-dashed bg-muted/50', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1 rounded-full bg-primary/10">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{skill.name}</h4>
          {skill.description && (
            <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
          )}
          {skill.level > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Level {skill.level}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
