import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import {
  RefreshTiming,
  SkillState,
  DivineFormationConfig,
  SkillDefinition,
  SkillStore,
} from './types'

export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
  'fighter-ferocious-attack': {
    id: 'fighter-ferocious-attack',
    name: 'Ferocious Attack',
    uiType: 'Tracker',
    class: 'fighter',
    calculateMax: (sl) => 2 + sl,
    refresh: 'Day',
    description: 'Powerful attacks that deal extra damage',
  },
  'fighter-second-wind': {
    id: 'fighter-second-wind',
    name: 'Second Wind',
    uiType: 'Tracker',
    class: 'fighter',
    calculateMax: () => 1,
    refresh: 'Day',
    description: 'Heal SL*d6 HP',
  },
  'fighter-block': {
    id: 'fighter-block',
    name: 'Block',
    uiType: 'Toggle & Tracker',
    class: 'fighter',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Add 1d6+STR to temporary Armor. Auto-toggles OFF when taking damage.',
    autoOffConditions: ['on-damage'],
  },
  'fighter-great-weapon-fighting': {
    id: 'fighter-great-weapon-fighting',
    name: 'Great Weapon Fighting',
    uiType: 'Passive',
    class: 'fighter',
    calculateMax: () => 0,
    refresh: 'Day',
    description: '+SL*2 melee damage',
  },
  'fighter-enchanted-weapon': {
    id: 'fighter-enchanted-weapon',
    name: 'Enchanted Weapon',
    uiType: 'Config',
    class: 'fighter',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Configure weapon enchantments',
    configOptions: ['Defender', 'Elemental', 'Powerful Swing'],
  },
  'fighter-heroic-deed': {
    id: 'fighter-heroic-deed',
    name: 'Heroic Deed',
    uiType: 'Action',
    class: 'fighter',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Perform a heroic deed',
  },
  'fighter-rage': {
    id: 'fighter-rage',
    name: 'Rage',
    uiType: 'Toggle',
    class: 'fighter',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Resist Physical damage, -2 INT checks, +SL to all damage',
  },
  'fighter-zephyrus-echo': {
    id: 'fighter-zephyrus-echo',
    name: "Zephyrus' Echo",
    uiType: 'Tracker',
    class: 'fighter',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Spawn SL number of echoes with 1 HP',
  },
  'fighter-indomitable': {
    id: 'fighter-indomitable',
    name: 'Indomitable',
    uiType: 'Tracker',
    class: 'fighter',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Resist debilitating effects',
  },
  'fighter-grappler': {
    id: 'fighter-grappler',
    name: 'Grappler',
    uiType: 'Action',
    class: 'fighter',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Use your action to grapple a target within melee range. Roll an opposed STR check (succeed if you roll higher than target). On success, target is grappled. Grappled targets take SL + STR damage at start of their turn, and your attacks on them deal double damage. Target can attempt opposed STR check at end of their turn to escape.',
    specialRules: ['grapple'],
  },
  'archer-flexible-shots': {
    id: 'archer-flexible-shots',
    name: 'Flexible Shots',
    uiType: 'Tracker',
    class: 'archer',
    calculateMax: (sl) => 3 + sl,
    refresh: 'Day',
    description: 'Regain 2 uses when rolling 6 on damage',
    showRegainButton: true,
  },
  'archer-sneak-attack': {
    id: 'archer-sneak-attack',
    name: 'Sneak Attack',
    uiType: 'Toggle',
    class: 'archer',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Hidden state active. Next attack deals max damage.',
  },
  'archer-enchanted-bow': {
    id: 'archer-enchanted-bow',
    name: 'Enchanted Bow',
    uiType: 'Config',
    class: 'archer',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Configure bow enchantments',
    configOptions: ['Power', 'Piercing', 'Automation'],
  },
  'archer-covering-fire': {
    id: 'archer-covering-fire',
    name: 'Covering Fire',
    uiType: 'Toggle',
    class: 'archer',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Area denial active. Cannot take other actions. Auto-toggles OFF when taking damage.',
    autoOffConditions: ['on-damage'],
  },
  'archer-dash': {
    id: 'archer-dash',
    name: 'Dash',
    uiType: 'Tracker',
    class: 'archer',
    calculateMax: (sl) => 2 + sl,
    refresh: 'Day',
    description: 'Auto-dodge ranged attack',
  },
  'archer-precision-attack': {
    id: 'archer-precision-attack',
    name: 'Precision Attack',
    uiType: 'Tracker',
    class: 'archer',
    calculateMax: (sl) => sl + 1,
    refresh: 'Day',
    description: 'Double arrow damage',
  },
  'archer-ambush': {
    id: 'archer-ambush',
    name: 'Ambush',
    uiType: 'Passive',
    class: 'archer',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Unseen attacks deal SL bleed damage at start of enemy round',
  },
  'archer-explosive-bounding': {
    id: 'archer-explosive-bounding',
    name: 'Explosive Bounding',
    uiType: 'Tracker',
    class: 'archer',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: '40 AOE damage',
  },
  'archer-lightning-speed': {
    id: 'archer-lightning-speed',
    name: 'Lightning Speed',
    uiType: 'Toggle & Tracker',
    class: 'archer',
    calculateMax: () => 1,
    refresh: 'Day',
    description: 'Lasts SL turns. ATH score gets +(2*SL)+3 up to max 30. Grants free extra actions/shots.',
  },
  'wizard-spell-slots-l1': {
    id: 'wizard-spell-slots-l1',
    name: 'Spell Slots (Level 1)',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => 5 + sl,
    refresh: 'Sleep',
    description: 'Level 1 spell slots (5 base + SL, SL = COUNT rule)',
  },
  'wizard-spell-slots-l2': {
    id: 'wizard-spell-slots-l2',
    name: 'Spell Slots (Level 2)',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => 4 + sl,
    refresh: 'Sleep',
    description: 'Level 2 spell slots (4 base + SL, SL = COUNT rule)',
  },
  'wizard-spell-slots-l3': {
    id: 'wizard-spell-slots-l3',
    name: 'Spell Slots (Level 3)',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => sl,
    refresh: 'Sleep',
    description: 'Level 3 spell slots (0 base + SL, SL = COUNT rule)',
  },
  'wizard-spell-slots-l4': {
    id: 'wizard-spell-slots-l4',
    name: 'Spell Slots (Level 4)',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => sl,
    refresh: 'Sleep',
    description: 'Level 4 spell slots (0 base + SL, SL = COUNT rule)',
  },
  'wizard-spell-slots-l5': {
    id: 'wizard-spell-slots-l5',
    name: 'Spell Slots (Level 5)',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => sl,
    refresh: 'Sleep',
    description: 'Level 5 spell slots (0 base + SL, SL = COUNT rule)',
  },
  'wizard-chaotic-metamagic': {
    id: 'wizard-chaotic-metamagic',
    name: "Immeral's Chaotic Metamagic",
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => 5 + Math.max(0, sl - 1) * 2,
    refresh: 'Day',
    description: 'Convert points to spell slots (3 points = L1 slot, 5 points = L2 slot, etc.)',
    specialRules: ['convert-to-slots'],
  },
  'wizard-bardic-magic': {
    id: 'wizard-bardic-magic',
    name: "Opheria's Bardic Magic",
    uiType: 'Passive',
    class: 'wizard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Heal allies SL * 10% of spell damage. At SL >= 3, gain Tracker for auto-pass checks (Max: 2, Ref: Day).',
  },
  'wizard-concentration': {
    id: 'wizard-concentration',
    name: 'Concentration',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Maintain concentration on spells',
  },
  'wizard-control-time': {
    id: 'wizard-control-time',
    name: 'Control Time',
    uiType: 'Tracker',
    class: 'wizard',
    calculateMax: () => 1,
    refresh: 'Day',
    description: 'Manipulate time flow',
  },
  'priest-lay-on-hands': {
    id: 'priest-lay-on-hands',
    name: 'Lay on Hands',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: () => 1,
    refresh: 'Per Combat Round',
    description: 'Heal touch target',
  },
  'priest-mass-heal': {
    id: 'priest-mass-heal',
    name: 'Mass Heal',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: () => 1,
    refresh: 'Day',
    description: 'Heal all allies in range',
  },
  'priest-holy-smite': {
    id: 'priest-holy-smite',
    name: 'Holy Smite',
    uiType: 'Toggle',
    class: 'priest',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Mark target for explosion',
  },
  'priest-bulwark': {
    id: 'priest-bulwark',
    name: 'Bulwark',
    uiType: 'Toggle',
    class: 'priest',
    calculateMax: () => 1,
    refresh: 'Combat',
    description: '+STR to Armor. Auto-toggles OFF if >10 damage taken.',
    autoOffConditions: ['on-heavy-damage'],
  },
  'priest-quick-heal': {
    id: 'priest-quick-heal',
    name: 'Quick Heal',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Quick healing ability',
  },
  'priest-divine-formation-i': {
    id: 'priest-divine-formation-i',
    name: 'Divine Formation I',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Divine Formation I uses. Base max = SL, can receive bonus +2 from skill tree.',
  },
  'priest-divine-formation-ii': {
    id: 'priest-divine-formation-ii',
    name: 'Divine Formation II',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Divine Formation II uses. Base max = SL, can receive bonus +3 from skill tree.',
  },
  'priest-divine-formation-iii': {
    id: 'priest-divine-formation-iii',
    name: 'Divine Formation III',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Divine Formation III uses. Base max = SL, can receive bonus +5 from skill tree.',
  },
  'priest-holy-aura': {
    id: 'priest-holy-aura',
    name: 'Holy Aura',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Radiate protective holy energy',
  },
  'priest-holy-light': {
    id: 'priest-holy-light',
    name: 'Holy Light',
    uiType: 'Tracker',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Channel holy light to damage undead',
  },
  'priest-clerical-recovery': {
    id: 'priest-clerical-recovery',
    name: 'Clerical Recovery',
    uiType: 'Action',
    class: 'priest',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Restore up to 5 expended Divine Formation uses',
  },
  'priest-inspired-insight': {
    id: 'priest-inspired-insight',
    name: 'Inspired Insight',
    uiType: 'Toggle',
    class: 'priest',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Adds +SL to INT Modifier and INT checks',
  },
  'bard-spell-slots': {
    id: 'bard-spell-slots',
    name: 'Spell Slots',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Sleep',
    description: 'Bard spell slots (equal to Skill Level)',
  },
  'bard-inspiration': {
    id: 'bard-inspiration',
    name: 'Inspiration',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Toggles off automatically when combat starts',
    autoOffConditions: ['combat-start'],
  },
  'bard-expertise': {
    id: 'bard-expertise',
    name: 'Expertise',
    uiType: 'ExpertiseRoll',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Add SL to STR, ATH, INT, and CHA checks when rolling from this skill.',
  },
  'bard-professional-influencer': {
    id: 'bard-professional-influencer',
    name: 'Professional Influencer',
    uiType: 'Passive',
    class: 'bard',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Help action adds half your persuasion roll to ally',
  },
  'bard-battle-support': {
    id: 'bard-battle-support',
    name: 'Battle Support',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: () => 1,
    refresh: 'Day',
    description: 'Support allies in combat',
  },
  'bard-deception': {
    id: 'bard-deception',
    name: 'Deception',
    uiType: 'Toggle',
    class: 'bard',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Mistaken for ally',
  },
  'bard-pacify': {
    id: 'bard-pacify',
    name: 'Pacify',
    uiType: 'Action',
    class: 'bard',
    calculateMax: () => 0,
    refresh: 'Day',
    description: 'Skip combat for XP',
  },
  'bard-loremaster': {
    id: 'bard-loremaster',
    name: 'Loremaster',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Recall lore and information',
  },
  'bard-soothing-ballad': {
    id: 'bard-soothing-ballad',
    name: 'Soothing Ballad',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Heal and soothe with music',
  },
  'bard-skald-war-beat': {
    id: 'bard-skald-war-beat',
    name: "Skald's War Beat",
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (_, intMod) => Math.max(1, intMod || 0),
    refresh: 'Day',
    description: 'Inspire allies to fight harder',
  },
  'bard-martial-epic': {
    id: 'bard-martial-epic',
    name: 'Martial Epic',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Add variable d4/d6 buff to allies',
  },
  'bard-evasion': {
    id: 'bard-evasion',
    name: 'Evasion',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl) => sl,
    refresh: 'Day',
    description: 'Avoid area effects',
  },
  'bard-decoy': {
    id: 'bard-decoy',
    name: 'Decoy',
    uiType: 'Tracker',
    class: 'bard',
    calculateMax: (sl, _, athMod) => Math.max(1, (athMod || 0) + sl),
    refresh: 'Day',
    description: 'Create a decoy to distract enemies',
  },
}

function createInitialSkillState(
  definition: SkillDefinition,
  level: number,
  intMod?: number,
  athMod?: number
): SkillState {
  const maxUses = definition.calculateMax(level, intMod, athMod)
  return {
    id: definition.id,
    name: definition.name,
    level,
    maxUses,
    currentUses: maxUses,
    isToggled: false,
    configValue: undefined,
    refresh: definition.refresh,
    description: definition.description,
  }
}

function getDefaultDivineFormationConfig(): DivineFormationConfig {
  return {
    bonusUses: {
      formationI: 0,
      formationII: 0,
      formationIII: 0,
    },
  }
}

export const useSkillStore = create<SkillStore>()(
  immer(
    persist(
      (set, get) => ({
        characterSkills: {},
        divineFormationConfig: {},

        initializeSkills: (characterId, skills, classId, intMod, athMod) => {
          set((state) => {
            if (!state.characterSkills[characterId]) {
              state.characterSkills[characterId] = {}
            }
            if (!state.divineFormationConfig[characterId]) {
              state.divineFormationConfig[characterId] = getDefaultDivineFormationConfig()
            }

            const allSkills = [...skills]

            if (classId === 'wizard') {
              const hasL1 = allSkills.some(s => s.id === 'wizard-spell-slots-l1')
              const hasL2 = allSkills.some(s => s.id === 'wizard-spell-slots-l2')
              if (!hasL1) allSkills.push({ id: 'wizard-spell-slots-l1', level: 1 })
              if (!hasL2) allSkills.push({ id: 'wizard-spell-slots-l2', level: 1 })
            }

            if (classId === 'bard') {
              const hasSpellSlots = allSkills.some(s => s.id === 'bard-spell-slots')
              if (!hasSpellSlots) {
                const highestLevel = skills.length > 0 ? Math.max(...skills.map(s => s.level)) : 1
                allSkills.push({ id: 'bard-spell-slots', level: highestLevel })
              }
            }

            for (const skill of allSkills) {
              const definition = SKILL_DEFINITIONS[skill.id]
              if (!definition) {
                console.warn(`Skill definition not found: ${skill.id}`)
                continue
              }

              const existingSkill = state.characterSkills[characterId][skill.id]
              if (existingSkill) {
                if (existingSkill.level !== skill.level) {
                  const newMaxUses = definition.calculateMax(skill.level, intMod, athMod)
                  const ratio = existingSkill.maxUses > 0 ? existingSkill.currentUses / existingSkill.maxUses : 1
                  const newCurrentUses = Math.round(newMaxUses * ratio)
                  
                  existingSkill.level = skill.level
                  existingSkill.maxUses = newMaxUses
                  existingSkill.currentUses = Math.min(newCurrentUses, newMaxUses)
                }
                existingSkill.name = definition.name
                existingSkill.description = definition.description
                existingSkill.refresh = definition.refresh
                continue
              }

              state.characterSkills[characterId][skill.id] = createInitialSkillState(
                definition,
                skill.level,
                intMod,
                athMod
              )
            }
          })
        },

        incrementUses: (characterId, skillId, amount = 1) => {
          set((state) => {
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              skill.currentUses = Math.min(skill.currentUses + amount, skill.maxUses)
            }
          })
        },

        decrementUses: (characterId, skillId, amount = 1) => {
          set((state) => {
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              skill.currentUses = Math.max(skill.currentUses - amount, 0)
            }
          })
        },

        setUses: (characterId, skillId, uses) => {
          set((state) => {
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              skill.currentUses = Math.max(0, Math.min(uses, skill.maxUses))
            }
          })
        },

        toggleSkill: (characterId, skillId) => {
          set((state) => {
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              skill.isToggled = !skill.isToggled
            }
          })
        },

        setSkillToggle: (characterId, skillId, isToggled) => {
          set((state) => {
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              skill.isToggled = isToggled
            }
          })
        },

        setConfig: (characterId, skillId, value) => {
          set((state) => {
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              skill.configValue = value
            }
          })
        },

        setDivineFormationBonus: (characterId, formation, bonus) => {
          set((state) => {
            if (!state.divineFormationConfig[characterId]) {
              state.divineFormationConfig[characterId] = getDefaultDivineFormationConfig()
            }
            
            const config = state.divineFormationConfig[characterId]
            const formationKey = formation === 'I' ? 'formationI' : formation === 'II' ? 'formationII' : 'formationIII'
            
            config.bonusUses.formationI = 0
            config.bonusUses.formationII = 0
            config.bonusUses.formationIII = 0
            config.bonusUses[formationKey] = bonus
            
            const skillId = `priest-divine-formation-${formationKey.replace('formation', '').toLowerCase()}`
            const skill = state.characterSkills[characterId]?.[skillId]
            if (skill) {
              const definition = SKILL_DEFINITIONS[skillId]
              const baseMax = definition.calculateMax(skill.level, 0, 0)
              skill.maxUses = baseMax + bonus
              skill.currentUses = Math.min(skill.currentUses, skill.maxUses)
            }
          })
        },

        refreshAllDaily: (characterId) => {
          set((state) => {
            const skills = state.characterSkills[characterId]
            if (!skills) return

            for (const skill of Object.values(skills)) {
              if (skill.refresh === 'Day') {
                skill.currentUses = skill.maxUses
                skill.isToggled = false
              }
            }
          })
        },

        refreshAllForSleep: (characterId) => {
          set((state) => {
            const skills = state.characterSkills[characterId]
            if (!skills) return

            for (const skill of Object.values(skills)) {
              if (skill.refresh === 'Sleep' || skill.refresh === 'Day') {
                skill.currentUses = skill.maxUses
                skill.isToggled = false
              }
            }
          })
        },

        refreshAllForCombat: (characterId) => {
          set((state) => {
            const skills = state.characterSkills[characterId]
            if (!skills) return

            for (const skill of Object.values(skills)) {
              if (skill.refresh === 'Combat') {
                skill.currentUses = skill.maxUses
                skill.isToggled = false
              }
              const definition = SKILL_DEFINITIONS[skill.id]
              if (definition?.autoOffConditions?.includes('combat-start')) {
                skill.isToggled = false
              }
            }
          })
        },

        resetCharacterSkills: (characterId) => {
          set((state) => {
            delete state.characterSkills[characterId]
            delete state.divineFormationConfig[characterId]
          })
        },

        longRest: (characterId) => {
          set((state) => {
            const skills = state.characterSkills[characterId]
            if (!skills) return

            for (const skill of Object.values(skills)) {
              // Restore all skill uses on long rest
              skill.currentUses = skill.maxUses
              
              // Reset toggles except for passive abilities
              const definition = SKILL_DEFINITIONS[skill.id]
              if (definition.uiType !== 'Passive') {
                skill.isToggled = false
              }
            }
          })
        },
      }),
      {
        name: 'hos-skill-store',
        partialize: (state) => ({
          characterSkills: state.characterSkills,
          divineFormationConfig: state.divineFormationConfig,
        }),
      }
    )
  )
)

export function useCharacterSkills(characterId: string) {
  return useSkillStore((state) => state.characterSkills[characterId] || {})
}

export function useSkill(characterId: string, skillId: string) {
  return useSkillStore((state) => state.characterSkills[characterId]?.[skillId])
}

export function useDivineFormationConfig(characterId: string) {
  return useSkillStore((state) => state.divineFormationConfig[characterId] || getDefaultDivineFormationConfig())
}

export function useSkillActions() {
  const store = useSkillStore()
  return useMemo(() => ({
    initializeSkills: store.initializeSkills,
    incrementUses: store.incrementUses,
    decrementUses: store.decrementUses,
    setUses: store.setUses,
    toggleSkill: store.toggleSkill,
    setSkillToggle: store.setSkillToggle,
    setConfig: store.setConfig,
    setDivineFormationBonus: store.setDivineFormationBonus,
    refreshAllDaily: store.refreshAllDaily,
    refreshAllForSleep: store.refreshAllForSleep,
    refreshAllForCombat: store.refreshAllForCombat,
    resetCharacterSkills: store.resetCharacterSkills,
    longRest: store.longRest,
  }), [store])
}
