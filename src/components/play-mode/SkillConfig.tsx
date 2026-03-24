'use client'

import { useState } from 'react'
import { useSkill, useSkillActions, SKILL_DEFINITIONS } from '@/stores/skillStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Settings, Check } from 'lucide-react'

interface SkillConfigProps {
  skillId: string
  characterId: string
  className?: string
}

export function SkillConfig({ skillId, characterId, className }: SkillConfigProps) {
  const skill = useSkill(characterId, skillId)
  const definition = SKILL_DEFINITIONS[skillId]
  const { setConfig } = useSkillActions()
  const [textValue, setTextValue] = useState(skill?.configValue?.toString() || '')

  if (!skill || !definition) return null

  const hasOptions = definition.configOptions && definition.configOptions.length > 0
  const isExpertise = skillId.includes('expertise')

  const handleOptionSelect = (option: string) => {
    setConfig(characterId, skillId, option)
  }

  const handleTextSave = () => {
    setConfig(characterId, skillId, textValue)
  }

  if (hasOptions) {
    return (
      <div className={cn('p-3 rounded-lg border bg-card', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{skill.name}</span>
          {skill.configValue && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
              {skill.configValue}
            </span>
          )}
        </div>
        
        {skill.description && (
          <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
        )}

        <div className="grid grid-cols-1 gap-2">
          {definition.configOptions?.map((option) => {
            const isSelected = skill.configValue === option
            return (
              <Button
                key={option}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  'justify-start',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {isSelected && <Check className="h-3 w-3 mr-2" />}
                {option}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  if (isExpertise) {
    return (
      <div className={cn('p-3 rounded-lg border bg-card', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{skill.name}</span>
          {skill.configValue && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
              +{skill.level} {skill.configValue}
            </span>
          )}
        </div>
        
        {skill.description && (
          <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor={`${skillId}-expertise`} className="sr-only">
              Expertise Skill
            </Label>
            <Input
              id={`${skillId}-expertise`}
              type="text"
              placeholder="e.g., Persuasion, Stealth, etc."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="h-9"
            />
          </div>
          <Button size="sm" onClick={handleTextSave} disabled={!textValue}>
            Set
          </Button>
        </div>
      </div>
    )
  }

  return null
}
