'use client'

import { useSkill } from '@/stores/skillStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SkillPassiveProps {
  skillId: string
  characterId: string
  className?: string
}

export function SkillPassive({ skillId, characterId, className }: SkillPassiveProps) {
  const skill = useSkill(characterId, skillId)

  if (!skill) return null

  return (
    <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-sm truncate">{skill.name}</span>
        {skill.level > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
            SL {skill.level}
          </Badge>
        )}
      </div>
      {skill.description && (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
          {skill.description}
        </span>
      )}
    </div>
  )
}