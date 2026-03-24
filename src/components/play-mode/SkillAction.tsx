'use client'

import { useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSkillStore, useSkill } from '@/stores/skillStore'

interface SkillActionProps {
  skillId: string
  characterId: string
  className?: string
}

export function SkillAction({ skillId, characterId, className }: SkillActionProps) {
  const skill = useSkill(characterId, skillId)
  const [showDialog, setShowDialog] = useState(false)
  const [description, setDescription] = useState('')
  const { refreshAllDaily } = useSkillStore()

  if (!skill) return null

  const isClericalRecovery = skillId === 'priest-clerical-recovery'

  const handleAction = () => {
    if (isClericalRecovery) {
      refreshAllDaily(characterId)
    } else {
      setShowDialog(true)
    }
  }

  const handleSubmit = () => {
    setShowDialog(false)
    setDescription('')
  }

  return (
    <>
      <Card className={cn('border-purple-500/30', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{skill.name}</span>
              {skill.description && (
                <span className="text-sm text-muted-foreground">{skill.description}</span>
              )}
            </div>
            <Button
              onClick={handleAction}
              className={cn(
                'gap-2',
                isClericalRecovery && 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              {isClericalRecovery ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Restore Formations
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Perform
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{skill.name}</DialogTitle>
            <DialogDescription>{skill.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Describe your heroic action..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit to GM</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}