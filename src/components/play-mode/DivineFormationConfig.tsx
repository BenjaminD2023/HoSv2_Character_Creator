'use client'

import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSkillStore, useSkill, useDivineFormationConfig } from '@/stores/skillStore'
import { SkillTracker } from './SkillTracker'

interface DivineFormationConfigProps {
  characterId: string
  className?: string
}

interface FormationData {
  id: string
  name: string
  formation: 'I' | 'II' | 'III'
  baseMax: number
}

const BONUS_OPTIONS: Array<{ value: number; label: string; formation: 'I' | 'II' | 'III' | null }> = [
  { value: 0, label: 'No Bonus', formation: null },
  { value: 2, label: '+2 to Formation I', formation: 'I' },
  { value: 3, label: '+3 to Formation II', formation: 'II' },
  { value: 5, label: '+5 to Formation III', formation: 'III' },
]

export function DivineFormationConfig({
  characterId,
  className,
}: DivineFormationConfigProps) {
  const formationI = useSkill(characterId, 'priest-divine-formation-i')
  const formationII = useSkill(characterId, 'priest-divine-formation-ii')
  const formationIII = useSkill(characterId, 'priest-divine-formation-iii')
  const config = useDivineFormationConfig(characterId)
  const { setDivineFormationBonus } = useSkillStore()

  const formations: FormationData[] = [
    { id: 'priest-divine-formation-i', name: 'Divine Formation I', formation: 'I', baseMax: formationI?.maxUses || 0 },
    { id: 'priest-divine-formation-ii', name: 'Divine Formation II', formation: 'II', baseMax: formationII?.maxUses || 0 },
    { id: 'priest-divine-formation-iii', name: 'Divine Formation III', formation: 'III', baseMax: formationIII?.maxUses || 0 },
  ]

  const currentBonus = config.bonusUses.formationI > 0 ? 2 : config.bonusUses.formationII > 0 ? 3 : config.bonusUses.formationIII > 0 ? 5 : 0

  const handleBonusSelect = (bonus: number, formation: 'I' | 'II' | 'III' | null) => {
    setDivineFormationBonus(characterId, 'I', 0)
    setDivineFormationBonus(characterId, 'II', 0)
    setDivineFormationBonus(characterId, 'III', 0)

    if (formation) {
      setDivineFormationBonus(characterId, formation, bonus)
    }
  }

  const getTotalMax = (formation: 'I' | 'II' | 'III') => {
    const baseSkill = formation === 'I' ? formationI : formation === 'II' ? formationII : formationIII
    const bonus = formation === 'I' ? config.bonusUses.formationI : formation === 'II' ? config.bonusUses.formationII : config.bonusUses.formationIII
    return (baseSkill?.maxUses || 0) + bonus
  }

  return (
    <Card className={cn('border-amber-500/30', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Divine Formations
          </CardTitle>
          <Badge variant="outline" className="text-xs">v3.0</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Allocate Bonus Uses</label>
          <div className="grid grid-cols-2 gap-2">
            {BONUS_OPTIONS.map((option) => {
              const isSelected = currentBonus === option.value
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBonusSelect(option.value, option.formation)}
                  className={cn(
                    'justify-start text-left h-auto py-2',
                    isSelected && option.formation && 'bg-amber-500 hover:bg-amber-600'
                  )}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Select how to distribute additional Divine Formation uses from the skill tree
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t">
          {formations.map((formation) => {
            const bonus = formation.formation === 'I' ? config.bonusUses.formationI :
                         formation.formation === 'II' ? config.bonusUses.formationII : config.bonusUses.formationIII
            const totalMax = getTotalMax(formation.formation)
            const isEnhanced = bonus > 0

            return (
              <div key={formation.id} className="space-y-1">
                <SkillTracker
                  skillId={formation.id}
                  characterId={characterId}
                  className={cn(isEnhanced && 'border-amber-500/50 bg-amber-500/5')}
                />
                {isEnhanced && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 pl-3">
                    <span className="font-medium">Enhanced:</span>
                    <span>Base {formation.baseMax} + Bonus +{bonus} = {totalMax} max</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}