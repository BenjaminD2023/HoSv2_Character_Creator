'use client'

import { useState } from 'react'
import { useSkill, useSkillActions, SKILL_DEFINITIONS } from '@/stores/skillStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className={cn('py-2 border-b border-border/50 last:border-0', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{skill.name}</span>
          {skill.configValue && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded shrink-0">
              {skill.configValue}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {definition.configOptions?.map((option) => {
            const isSelected = skill.configValue === option
            return (
              <Button
                key={option}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleOptionSelect(option)}
                className="h-7 px-2 text-xs"
              >
                {isSelected && <Check className="h-3 w-3 mr-1" />}
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
      <div className={cn('py-2 border-b border-border/50 last:border-0', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{skill.name}</span>
          {skill.configValue && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded shrink-0">
              +{skill.level} {skill.configValue}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Skill name..."
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="h-7 text-xs"
          />
          <Button size="sm" onClick={handleTextSave} disabled={!textValue} className="h-7 px-2 text-xs">
            Set
          </Button>
        </div>
      </div>
    )
  }

  return null
}