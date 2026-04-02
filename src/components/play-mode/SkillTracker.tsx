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
    <div className={cn('flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0', className)}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-sm truncate">{skill.name}</span>
        <Badge
          variant={isAtZero ? 'destructive' : isAtMax ? 'default' : 'secondary'}
          className="text-[10px] px-1.5 py-0 h-4 shrink-0"
        >
          {skill.refresh}
        </Badge>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {showRegainButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegain}
            className="h-7 w-7 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            title="Regain 2 uses (rolled 6 on damage)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => decrementUses(characterId, skillId)}
          disabled={isAtZero}
          className="h-7 w-7 p-0"
          aria-label={`Decrease ${skill.name} uses`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>

        <div
          className={cn(
            'min-w-[40px] px-2 py-0.5 rounded text-center font-bold text-sm tabular-nums',
            usageRatio <= 0.25 && 'text-destructive bg-destructive/10',
            usageRatio > 0.25 && usageRatio < 1 && 'text-foreground bg-muted',
            usageRatio >= 1 && 'text-green-600 bg-green-500/10'
          )}
        >
          {skill.currentUses}/{skill.maxUses}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => incrementUses(characterId, skillId)}
          disabled={isAtMax}
          className="h-7 w-7 p-0"
          aria-label={`Increase ${skill.name} uses`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}