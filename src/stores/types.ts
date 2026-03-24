/**
 * Skill State Types for House of Shadows Play Mode
 * Defines all type definitions for the skill tracking system
 */

export type UIType = 
  | 'Tracker' 
  | 'Toggle' 
  | 'Config' 
  | 'Passive' 
  | 'Action' 
  | 'Toggle & Tracker'

export type RefreshTiming = 'Day' | 'Combat' | 'Sleep' | 'Per Combat Round'

export type CharacterClass = 'fighter' | 'archer' | 'wizard' | 'priest' | 'bard'

export interface SkillState {
  id: string
  name: string
  level: number
  maxUses: number
  currentUses: number
  isToggled: boolean
  configValue?: string | number
  refresh: RefreshTiming
  description?: string
}

export interface DivineFormationConfig {
  bonusUses: {
    formationI: number
    formationII: number
    formationIII: number
  }
}

export interface SkillDefinition {
  id: string
  name: string
  uiType: UIType
  class: CharacterClass
  calculateMax: (skillLevel: number, intMod?: number, athMod?: number) => number
  refresh: RefreshTiming
  specialRules?: string[]
  description?: string
  autoOffConditions?: string[]
  configOptions?: string[]
  showRegainButton?: boolean
}

export interface SkillStoreState {
  characterSkills: Record<string, Record<string, SkillState>>
  divineFormationConfig: Record<string, DivineFormationConfig>
}

export interface SkillStoreActions {
  initializeSkills: (characterId: string, skills: Array<{ id: string; level: number }>, classId: CharacterClass, intMod?: number, athMod?: number) => void
  incrementUses: (characterId: string, skillId: string, amount?: number) => void
  decrementUses: (characterId: string, skillId: string, amount?: number) => void
  setUses: (characterId: string, skillId: string, uses: number) => void
  toggleSkill: (characterId: string, skillId: string) => void
  setSkillToggle: (characterId: string, skillId: string, isToggled: boolean) => void
  setConfig: (characterId: string, skillId: string, value: string | number) => void
  setDivineFormationBonus: (characterId: string, formation: 'I' | 'II' | 'III', bonus: number) => void
  refreshAllDaily: (characterId: string) => void
  refreshAllForSleep: (characterId: string) => void
  refreshAllForCombat: (characterId: string) => void
  resetCharacterSkills: (characterId: string) => void
}

export type SkillStore = SkillStoreState & SkillStoreActions
