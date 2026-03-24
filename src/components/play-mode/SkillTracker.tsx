'use client'

import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSkill, useSkillActions } from '@/stores/skillStore'

interface SkillTrackerProps {
  skillId: string
  characterId: string
  showRegainButton?: boolean
  onRegain?: () => void
  className?: string
}

export function SkillTracker({
  skillId,
  characterId,
  showRegainButton = false,
  onRegain,
  className,
}: SkillTrackerProps) {
  const skill = useSkill(characterId, skillId)
  const { incrementUses, decrementUses } = useSkillActions()

  if (!skill) return null

  const isAtMax = skill.currentUses >= skill.maxUses
  const isAtZero = skill.currentUses <= 0
  const usageRatio = skill.maxUses > 0 ? skill.currentUses / skill.maxUses : 0

  const handleRegain = () => {
    if (onRegain) {
      onRegain()
    } else {
      incrementUses(characterId, skillId, 2)
    }
  }

  return (
    <div className={cn('flex items-center justify-between gap-4 p-3 rounded-lg border bg-card', className)}>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">{skill.name}</span>
        <div className="flex items-center gap-2">
          <Badge
            variant={isAtZero ? 'destructive' : isAtMax ? 'default' : 'secondary'}
            className="text-xs"
          >
            {skill.refresh}
          </Badge>
          {skill.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {skill.description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showRegainButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegain}
            className="h-9 px-2 border-green-500/50 hover:bg-green-500/10"
            title="Regain 2 uses (rolled 6 on damage)"
          >
            <RotateCcw className="h-4 w-4 text-green-500" />
            <span className="ml-1 text-xs text-green-600">+2</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => decrementUses(characterId, skillId)}
          disabled={isAtZero}
          className="h-9 w-9 min-w-[44px] min-h-[44px]"
          aria-label={`Decrease ${skill.name} uses`}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div
          className={cn(
            'min-w-[60px] px-3 py-1 rounded-md text-center font-bold text-lg tabular-nums',
            usageRatio <= 0.25 && 'text-destructive bg-destructive/10',
            usageRatio > 0.25 && usageRatio < 1 && 'text-foreground bg-muted',
            usageRatio >= 1 && 'text-green-600 bg-green-500/10'
          )}
        >
          {skill.currentUses}
          <span className="text-muted-foreground text-sm font-normal">/{skill.maxUses}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => incrementUses(characterId, skillId)}
          disabled={isAtMax}
          className="h-9 w-9 min-w-[44px] min-h-[44px]"
          aria-label={`Increase ${skill.name} uses`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
