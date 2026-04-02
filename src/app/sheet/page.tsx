"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Edit2, Minus, Plus, Heart, Sword, Brain, Zap, Shield, Sparkles, Dices, Trash2, Package, Settings2, Moon, Skull } from "lucide-react";
import { DiceCanvas } from "@/components/DiceCanvas";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RollResultPopup, RollType } from "@/components/RollResultPopup";
import { SkillRenderer, SpellCasting } from "@/components/play-mode";
import { useDice } from "@/contexts";
import { useSkillStore } from "@/stores/skillStore";
import { getCharacter, Character, Personality, PERSONALITY_DICE, PERSONALITY_LABELS } from "@/lib/character-storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AttributeKey = "strength" | "intelligence" | "athletics";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  type: "item" | "weapon";
  damageDice?: string;
  flatDamage?: number;
  mod?: AttributeKey;
  customMod?: number;
  skillDamageBonus?: { skillName: string; multiplier: number };
};

type CharacterData = {
  name: string;
  className: string;
  hitDie: number;
  charismaDie: number;
  baseHpModifierAttr: AttributeKey;
  primaryStat: AttributeKey;
  stats: Record<AttributeKey, number>;
  maxHp: number;
  xp: number;
  proficiencyBonus: number;
  skills: string[];
  skillLevels: Record<string, number>;
  weapons: InventoryItem[];
  armorPieces: { name: string; armor: number }[];
  totalStartingArmor: number;
  equipmentMisc: string[];
  personality: Personality;
};

type SavedSheetState = {
  currentHp: number;
  tempHp: number;
  xp: number;
  inventory: InventoryItem[];
  notes: string;
  lastModified: string;
  spellSlots?: {
    wizard?: {
      L1: boolean[];
      L2: boolean[];
      L3: boolean[];
      L4?: boolean[];
      L5?: boolean[];
    };
    bard?: boolean[];
  };
};

const CHARACTER_STORAGE_KEY = "hos.character-builder.v1";
const SHEET_STATE_KEY = "hos.character-sheet.state";

const ATTR_LABELS: Record<AttributeKey, string> = {
  strength: "STR",
  intelligence: "INT",
  athletics: "ATH",
};

const ATTR_ICONS: Record<AttributeKey, React.ReactNode> = {
  strength: <Sword className="w-4 h-4" />,
  intelligence: <Brain className="w-4 h-4" />,
  athletics: <Zap className="w-4 h-4" />,
};

const ATTR_COLORS: Record<AttributeKey, string> = {
  strength: "#E63946",
  intelligence: "#3A86FF",
  athletics: "#2A9D2A",
};

const ATTR_GRADIENTS: Record<AttributeKey, string> = {
  strength: "from-red-500/20 to-orange-600/10",
  intelligence: "from-blue-500/20 to-cyan-600/10",
  athletics: "from-green-500/20 to-emerald-600/10",
};

const SKILL_NAME_TO_ID: Record<string, string> = {
  'Ferocious Attack': 'fighter-ferocious-attack',
  'Second Wind': 'fighter-second-wind',
  'Grappler': 'fighter-grappler',
  'Block': 'fighter-block',
  'Great Weapon Fighting': 'fighter-great-weapon-fighting',
  'Enchanted Weapon': 'fighter-enchanted-weapon',
  'Heroic Deed': 'fighter-heroic-deed',
  'Rage': 'fighter-rage',
  "Zephyrus' Echo": 'fighter-zephyrus-echo',
  'Indomitable': 'fighter-indomitable',
  'Flexible Shots': 'archer-flexible-shots',
  'Sneak Attack': 'archer-sneak-attack',
  'Enchanted Bow': 'archer-enchanted-bow',
  'Covering Fire': 'archer-covering-fire',
  'Dash': 'archer-dash',
  'Precision Attack': 'archer-precision-attack',
  'Ambush': 'archer-ambush',
  'Explosive Bounding': 'archer-explosive-bounding',
  'Lightning Speed': 'archer-lightning-speed',
  "Immeral's Chaotic Metamagic": 'wizard-chaotic-metamagic',
  "Opheria's Bardic Magic": 'wizard-bardic-magic',
  'Concentration': 'wizard-concentration',
  'Control Time': 'wizard-control-time',
  'Lay on Hands': 'priest-lay-on-hands',
  'Mass Heal': 'priest-mass-heal',
  'Holy Smite': 'priest-holy-smite',
  'Bulwark': 'priest-bulwark',
  'Quick Heal': 'priest-quick-heal',
  'Divine Formation I': 'priest-divine-formation-i',
  'Divine Formation II': 'priest-divine-formation-ii',
  'Divine Formation III': 'priest-divine-formation-iii',
  'Holy Aura': 'priest-holy-aura',
  'Holy Light': 'priest-holy-light',
  'Clerical Recovery': 'priest-clerical-recovery',
  'Inspired Insight': 'priest-inspired-insight',
  'Inspiration': 'bard-inspiration',
  'Expertise': 'bard-expertise',
  'Professional Influencer': 'bard-professional-influencer',
  'Battle Support': 'bard-battle-support',
  'Deception': 'bard-deception',
  'Pacify': 'bard-pacify',
  'Loremaster': 'bard-loremaster',
  'Soothing Ballad': 'bard-soothing-ballad',
  "Skald's War Beat": 'bard-skald-war-beat',
  'Martial Epic': 'bard-martial-epic',
  'Evasion': 'bard-evasion',
  'Decoy': 'bard-decoy',
  'Bard of the World': 'bard-bard-of-the-world',
};

// Shadow Dice Table
type ShadowDiceEffect = {
  name: string;
  description: string;
};

const SHADOW_DICE_TABLE: Record<number, ShadowDiceEffect> = {
  1: {
    name: "Fear",
    description: "Your greatest fear appears in the direction you are facing, and you get frightened by it.",
  },
  2: {
    name: "Encouraged",
    description: "You feel encouraged and you can add 1d4 to your next roll.",
  },
  3: {
    name: "Trip",
    description: "You trip and is restrained to your distance in the next round.",
  },
  4: {
    name: "Support",
    description: "You can choose up to 3 creatures and they get a +3 to their next roll.",
  },
  5: {
    name: "Size (Small)",
    description: "You turn as small as a rabbit, you can't move in the next round. You can't make melee or ranged attacks, and all your spell damage is halved.",
  },
  6: {
    name: "Size (Giant)",
    description: "You grow as large as a giant, all your melee attack damage double in the next round.",
  },
  7: {
    name: "Earthquake",
    description: "You feel like the ground shakes, and you fall prone for the next round.",
  },
  8: {
    name: "Hold",
    description: "You can hold a creature in place, and they cannot move for the next round.",
  },
  9: {
    name: "Transformed",
    description: "You randomly transform into an animal determined by the GM in the next round.",
  },
  10: {
    name: "Wings",
    description: "You grow temporary wings and you can fly until the next time you roll shadow dice or your next long rest.",
  },
  11: {
    name: "Drain",
    description: "You feel energy being drained from your bones, and your highest stat's score (STR, ATH, or INT) becomes 3 (-4). If you have more than one highest score, all of them become 3 (-4). The effect ends on the beginning of your next round.",
  },
  12: {
    name: "Burst",
    description: "You feel a burst of energy into your bones, and one of your stat's scores (STR, ATH, or INT) becomes 25 (+7) until the next time you roll shadow dice or your next long rest.",
  },
};

function getModifier(value: number): number {
  if (value <= 1) return -5;
  if (value <= 3) return -4;
  if (value <= 5) return -3;
  if (value <= 7) return -2;
  if (value <= 9) return -1;
  if (value <= 11) return 0;
  if (value <= 13) return 1;
  if (value <= 15) return 2;
  if (value <= 17) return 3;
  if (value <= 19) return 4;
  if (value <= 21) return 5;
  if (value <= 23) return 6;
  if (value <= 25) return 7;
  if (value <= 27) return 8;
  if (value <= 29) return 9;
  return 10;
}

const calculateWizardSlots = (skills: string[], skillLevels: Record<string, number>) => {
  // SL = COUNT rule: Max_Slots = Starting_Base + SL for Wizard
  // Wizard starts with: L1=5, L2=4, L3-5=0 base slots
  // Each purchased spell slot skill adds SL to the total
  const slots = { L1: 5, L2: 4, L3: 0, L4: 0, L5: 0 };
  
  if (!skills || !Array.isArray(skills)) {
    return slots;
  }
  
  skills.forEach(skillName => {
    if (typeof skillName !== 'string') return;
    
    const skillLower = skillName.toLowerCase();
    const level = skillLevels[skillName] ?? 1;
    
    if (!skillLower.includes('spell slot')) return;
    
    // SL = COUNT: directly add the skill level to slot count
    if (skillLower.includes('level 5') || skillLower.includes('lv 5') || skillLower.includes('l5')) {
      slots.L5 += level;
    } else if (skillLower.includes('level 4') || skillLower.includes('lv 4') || skillLower.includes('l4')) {
      slots.L4 += level;
    } else if (skillLower.includes('level 3') || skillLower.includes('lv 3') || skillLower.includes('l3')) {
      slots.L3 += level;
    } else if (skillLower.includes('level 2') || skillLower.includes('lv 2') || skillLower.includes('l2')) {
      slots.L2 += level;
    } else if (skillLower.includes('level 1') || skillLower.includes('lv 1') || skillLower.includes('l1')) {
      slots.L1 += level;
    } else if (skillLower.includes('capstone')) {
      slots.L5 += level;
    }
  });
  
  return slots;
};

const calculateBardSlots = (skills: string[]) => {
  let highestTier = 1;
  skills.forEach(skill => {
    const lowerSkill = skill.toLowerCase();
    if (lowerSkill.includes('tier 3') || lowerSkill.includes('tier3')) highestTier = Math.max(highestTier, 3);
    else if (lowerSkill.includes('tier 4') || lowerSkill.includes('tier4')) highestTier = Math.max(highestTier, 4);
    else if (lowerSkill.includes('tier 5') || lowerSkill.includes('tier5')) highestTier = Math.max(highestTier, 5);
    else if (lowerSkill.includes('tier 2') || lowerSkill.includes('tier2')) highestTier = Math.max(highestTier, 2);
  });
  return highestTier;
};

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function CharacterSheetPage() {
  const router = useRouter();
  const { rollDice, rollDiceBatch, isReady } = useDice();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [currentHp, setCurrentHp] = useState(0);
  const [tempHp, setTempHp] = useState(0);
  const [xp, setXp] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showDice, setShowDice] = useState(false);
  const [hpInput, setHpInput] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [resourceTab, setResourceTab] = useState<"skills" | "spells">("skills")
  const [spellSlotState, setSpellSlotState] = useState<SavedSheetState['spellSlots']>(undefined);
  const [rollResult, setRollResult] = useState<{
    label: string;
    naturalRoll: number;
    modifier: number;
    total: number;
    type: RollType;
    diceSize?: number;
    crit?: boolean;
    critFail?: boolean;
    prone?: boolean;
    mode?: "normal" | "advantage" | "disadvantage";
    roll1?: number;
    roll2?: number;
    kept?: "roll1" | "roll2";
  } | null>(null);

  // Inventory dialog state
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemType, setNewItemType] = useState<"item" | "weapon">("item");
  const [newWeaponDamage, setNewWeaponDamage] = useState("");
  const [newWeaponMod, setNewWeaponMod] = useState<AttributeKey | undefined>(undefined);
  const [newWeaponCustomMod, setNewWeaponCustomMod] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Custom dice roller state
  const [customDiceOpen, setCustomDiceOpen] = useState(false);
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(20);
  const [diceModifier, setDiceModifier] = useState(0);
  const [rollMode, setRollMode] = useState<"normal" | "advantage" | "disadvantage">("normal");

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: "stat" | "roll" | "initiative" | "charisma" | "shadow";
    key?: AttributeKey | string;
  }>({ show: false, x: 0, y: 0, type: "stat" });

  // Shadow Dice state
  const [shadowDiceResult, setShadowDiceResult] = useState<{
    roll: number;
    modifiedRoll: number;
    effect: ShadowDiceEffect;
    effectNumber: number;
    personality: Personality;
    canModify: boolean;
    modificationApplied: number;
  } | null>(null);
  const [showShadowDiceResult, setShowShadowDiceResult] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Convert equipmentMisc to inventory items
        const startingItems: InventoryItem[] = (parsed.equipmentMisc || []).map((name: string) => ({
          id: generateId(),
          name,
          quantity: 1,
          type: "item",
        }));

        // Convert weapons to inventory format
        const startingWeapons: InventoryItem[] = (parsed.weapons || []).map((w: { name: string; damageDice?: string; flatDamage?: number; mod?: AttributeKey; customMod?: number; skillDamageBonus?: { skillName: string; multiplier: number } }) => {
          const weapon: InventoryItem = {
            id: generateId(),
            name: w.name,
            quantity: 1,
            type: "weapon",
            damageDice: w.damageDice,
            flatDamage: w.flatDamage,
            mod: w.mod,
            customMod: w.customMod,
            skillDamageBonus: w.skillDamageBonus,
          };
          
          // Auto-add skillDamageBonus for GWF Greatsword if missing
          if (w.name === "Greatsword (Great Weapon Fighting)" && !w.skillDamageBonus) {
            weapon.skillDamageBonus = { skillName: "Great Weapon Fighting", multiplier: 2 };
          }
          
          return weapon;
        });

        const charData: CharacterData = {
          name: parsed.characterName || "Unnamed",
          className: parsed.selectedClassId ? parsed.selectedClassId.charAt(0).toUpperCase() + parsed.selectedClassId.slice(1) : "Unknown",
          hitDie: parsed.hitDie || 8,
          charismaDie: parsed.charismaDie || 6,
          baseHpModifierAttr: parsed.baseHpModifierAttr || "strength",
          primaryStat: parsed.primaryStat || "strength",
          stats: parsed.manualMode ? parsed.manualStats : parsed.assignment ? {
            strength: parsed.rolls?.[Number(parsed.assignment.strength)] || 10,
            athletics: parsed.rolls?.[Number(parsed.assignment.athletics)] || 10,
            intelligence: parsed.rolls?.[Number(parsed.assignment.intelligence)] || 10,
          } : { strength: 10, intelligence: 10, athletics: 10 },
          maxHp: parsed.maxHp ?? (((parsed.baseHpRoll ?? 0) + (parsed.extraHpRolls?.reduce((a: number, b: number) => a + b, 0) ?? 0)) || 10),
          xp: parsed.startingXp ?? parsed.xp ?? 0,
          proficiencyBonus: parsed.proficiencyBonus || 2,
          skills: parsed.skills || [],
          skillLevels: parsed.skillLevels || {},
          weapons: startingWeapons,
          armorPieces: parsed.armorPieces || [],
          totalStartingArmor: parsed.totalStartingArmor || 0,
          equipmentMisc: parsed.equipmentMisc || [],
          personality: parsed.personality || "mayhem",
        };
        setCharacter(charData);

        // Load sheet state
        const sheetState = localStorage.getItem(SHEET_STATE_KEY);
        if (sheetState) {
          const state: SavedSheetState = JSON.parse(sheetState);
          setCurrentHp(state.currentHp);
          setTempHp(state.tempHp);
          setXp(state.xp ?? 0);
          // Merge saved inventory with starting items (avoid duplicates)
          const savedInventory = state.inventory || [];
          const combinedInventory = [...startingWeapons, ...startingItems, ...savedInventory.filter((i) =>
            !startingItems.some((si) => si.name === i.name) &&
            !startingWeapons.some((sw) => sw.name === i.name)
          )];
          setInventory(combinedInventory);
          // Load spell slots if present
          if (state.spellSlots) {
            setSpellSlotState(state.spellSlots);
          }
        } else {
          setCurrentHp(charData.maxHp);
          setXp(charData.xp);
          setInventory([...startingWeapons, ...startingItems]);
        }

        setTimeout(() => setIsLoaded(true), 100);
      } catch {
        // Invalid data
      }
    }
  }, []);

  useEffect(() => {
    if (character) {
      const state: SavedSheetState = {
        currentHp,
        tempHp,
        xp,
        inventory,
        notes: "",
        lastModified: new Date().toISOString(),
        spellSlots: spellSlotState,
      };
      localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(state));
    }
  }, [currentHp, tempHp, xp, inventory, character, spellSlotState]);

  const handleHeal = () => {
    const amount = parseInt(hpInput) || 0;
    if (amount > 0) {
      setCurrentHp((prev) => Math.min(prev + amount, character?.maxHp || prev));
      setHpInput("");
    }
  };

  const applyDamage = (amount: number) => {
    if (amount <= 0) return;
    if (tempHp > 0) {
      const tempAbsorb = Math.min(tempHp, amount);
      setTempHp((prev) => prev - tempAbsorb);
      const remaining = amount - tempAbsorb;
      if (remaining > 0) {
        setCurrentHp((prev) => Math.max(0, prev - remaining));
      }
    } else {
      setCurrentHp((prev) => Math.max(0, prev - amount));
    }
  };

  const handleDamage = () => {
    const amount = parseInt(hpInput) || 0;
    if (amount > 0) {
      applyDamage(amount);
      setHpInput("");
    }
  };

  const handleAddTemp = () => {
    const amount = parseInt(hpInput) || 0;
    if (amount > 0) {
      setTempHp((prev) => prev + amount);
      setHpInput("");
    }
  };
  const saveSheetState = () => {
    if (character) {
      const state: SavedSheetState = {
        currentHp,
        tempHp,
        xp,
        inventory,
        notes: "",
        lastModified: new Date().toISOString(),
        spellSlots: spellSlotState,
      };
      localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(state));
    }
  };

  const handleLongRest = () => {
    if (!character) return;
    
    // Restore HP to max
    setCurrentHp(character.maxHp);
    setTempHp(0);
    
    // Restore skills and spell slots via store
    const { longRest } = useSkillStore.getState();
    longRest(`sheet-${character.name}`);
    
    // Clear spell slots
    setSpellSlotState(undefined);
    
    // Save the updated state
    saveSheetState();
  }


  // XP handlers
  const addXp = (amount: number) => {
    setXp((prev) => prev + amount);
  };

  // Make addXp available for future use
  void addXp;

  // Inventory handlers
  const addInventoryItem = () => {
    if (!newItemName.trim()) return;

    const newItem: InventoryItem = {
      id: editingItem?.id || generateId(),
      name: newItemName.trim(),
      quantity: newItemQuantity,
      description: newItemDesc.trim() || undefined,
      type: newItemType,
      ...(newItemType === "weapon" && {
        damageDice: newWeaponDamage.trim() || undefined,
        mod: newWeaponMod,
        customMod: newWeaponCustomMod || undefined,
      }),
    };

    if (editingItem) {
      setInventory((prev) => prev.map((item) => (item.id === editingItem.id ? newItem : item)));
      setEditingItem(null);
    } else {
      setInventory((prev) => [...prev, newItem]);
    }

    resetItemForm();
    setDialogOpen(false);
  };

  const removeInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const startEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDesc(item.description || "");
    setNewItemQuantity(item.quantity);
    setNewItemType(item.type);
    setNewWeaponDamage(item.damageDice || "");
    setNewWeaponMod(item.mod);
    setNewWeaponCustomMod(item.customMod || 0);
    setDialogOpen(true);
  };

  const resetItemForm = () => {
    setNewItemName("");
    setNewItemDesc("");
    setNewItemQuantity(1);
    setNewItemType("item");
    setNewWeaponDamage("");
    setNewWeaponMod(undefined);
    setNewWeaponCustomMod(0);
    setEditingItem(null);
  };

  const rollDamage = async (
    weaponName: string,
    damageDice: string,
    mod: number,
    skillDamageBonus?: { skillName: string; multiplier: number; sl: number; bonus: number }
  ) => {
    if (!isReady) return;
    setShowDice(true);
    const results = await rollDice(damageDice, { theme: "smooth", themeColor: "#E63946" });
    const naturalTotal = results.reduce((sum, r) => sum + r.value, 0);
    const skillBonus = skillDamageBonus?.bonus ?? 0;
    const total = naturalTotal + mod + skillBonus;

    const diceMatch = damageDice.match(/d(\d+)/);
    const diceSize = diceMatch ? parseInt(diceMatch[1]) : 6;
    
    const maxDiceRolled = naturalTotal === diceSize;
    const isGWFWeapon = weaponName.includes("Great Weapon Fighting");

    setRollResult({
      label: weaponName,
      naturalRoll: naturalTotal,
      modifier: mod + skillBonus,
      total,
      type: "damage",
      diceSize,
      prone: maxDiceRolled && isGWFWeapon,
    });
  };

  const rollCheck = async (attr: AttributeKey) => {
    if (!isReady || !character) return;
    setShowDice(true);
    const color = ATTR_COLORS[attr];
    const results = await rollDice("1d20", { theme: "smooth", themeColor: color });
    // Dice stay visible until user clicks close
    const naturalRoll = results[0]?.value || 0;
    const modifier = getModifier(character.stats[attr]);
    const total = naturalRoll + modifier;

    setRollResult({
      label: ATTR_LABELS[attr],
      naturalRoll,
      modifier,
      total,
      type: attr as RollType,
      diceSize: 20,
      crit: naturalRoll === 20,
      critFail: naturalRoll === 1,
    });
  };

  const rollInitiative = async () => {
    if (!isReady || !character) return;
    setShowDice(true);
    const results = await rollDice("1d20", { theme: "smooth", themeColor: "#2A9D2A" });
    // Dice stay visible until user clicks close
    const naturalRoll = results[0]?.value || 0;
    const modifier = getModifier(character.stats.athletics);
    const total = naturalRoll + modifier;

    setRollResult({
      label: "Initiative",
      naturalRoll,
      modifier,
      total,
      type: "initiative",
      diceSize: 20,
    });
  };

  // Roll initiative with advantage/disadvantage
  const rollInitiativeWithMode = async (mode: "normal" | "advantage" | "disadvantage") => {
    if (!isReady || !character) return;
    setShowDice(true);
    let finalRoll: number;
    let roll1: number | undefined;
    let roll2: number | undefined;
    let kept: "roll1" | "roll2" | undefined;
    
    if (mode === "advantage" || mode === "disadvantage") {
      const batchResults = await rollDiceBatch([
        { notation: "1d20", options: { theme: "smooth", themeColor: "#2A9D2A" } },
        { notation: "1d20", options: { theme: "smooth", themeColor: "#2A9D2A" } }
      ]);
      const results1 = batchResults[0] || [{ value: 0 }];
      const results2 = batchResults[1] || [{ value: 0 }];
      roll1 = results1[0]?.value || 0;
      roll2 = results2[0]?.value || 0;
      finalRoll = mode === "advantage" ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      kept = mode === "advantage" ? (roll1 > roll2 ? "roll1" : "roll2") : (roll1 < roll2 ? "roll1" : "roll2");
    } else {
      const results = await rollDice("1d20", { theme: "smooth", themeColor: "#2A9D2A" });
      finalRoll = results[0]?.value || 0;
    }
    const modifier = getModifier(character.stats.athletics);
    setRollResult({
      label: "Initiative", naturalRoll: finalRoll, modifier, total: finalRoll + modifier,
      type: "initiative", diceSize: 20,
      mode, roll1, roll2, kept,
    });
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  const rollCharisma = async () => {
    if (!isReady || !character) return;
    setShowDice(true);
    const results = await rollDice(`1d${character.charismaDie}`, { theme: "smooth", themeColor: "#F4D03F" });
    // Dice stay visible until user clicks close
    const naturalRoll = results[0]?.value || 0;

    setRollResult({
      label: "Charisma",
      naturalRoll,
      modifier: 0,
      total: naturalRoll,
      type: "charisma",
      diceSize: character.charismaDie,
    });
  };

  // Roll charisma with advantage/disadvantage
  const rollCharismaWithMode = async (mode: "normal" | "advantage" | "disadvantage") => {
    if (!isReady || !character) return;
    setShowDice(true);
    const diceNotation = `1d${character.charismaDie}`;
    let finalRoll: number;
    let roll1: number | undefined;
    let roll2: number | undefined;
    let kept: "roll1" | "roll2" | undefined;
    if (mode === "advantage" || mode === "disadvantage") {
      const batchResults = await rollDiceBatch([
        { notation: diceNotation, options: { theme: "smooth", themeColor: "#F4D03F" } },
        { notation: diceNotation, options: { theme: "smooth", themeColor: "#F4D03F" } }
      ]);
      const results1 = batchResults[0] || [{ value: 0 }];
      const results2 = batchResults[1] || [{ value: 0 }];
      roll1 = results1[0]?.value || 0;
      roll2 = results2[0]?.value || 0;
      finalRoll = mode === "advantage" ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      kept = mode === "advantage" ? (roll1 > roll2 ? "roll1" : "roll2") : (roll1 < roll2 ? "roll1" : "roll2");
    } else {
      const results = await rollDice(diceNotation, { theme: "smooth", themeColor: "#F4D03F" });
      finalRoll = results[0]?.value || 0;
    }
    setRollResult({
      label: "Charisma", naturalRoll: finalRoll, modifier: 0, total: finalRoll,
      type: "charisma", diceSize: character.charismaDie,
      mode, roll1, roll2, kept,
    });
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  const getBardOfTheWorldSL = (): number => {
    if (!character || character.className.toLowerCase() !== 'bard') return 0;
    const hasBardOfTheWorld = character.skills.some(s => s === 'Bard of the World');
    if (!hasBardOfTheWorld) return 0;
    return character.skillLevels['Bard of the World'] || 0;
  };

  const rollShadowDice = async () => {
    if (!isReady || !character) return;
    setShowDice(true);
    const diceSize = PERSONALITY_DICE[character.personality];
    const results = await rollDice(`1d${diceSize}`, { theme: "smooth", themeColor: "#9333EA" });
    const naturalRoll = results[0]?.value || 0;
    const effectNumber = Math.min(naturalRoll, 12);
    const effect = SHADOW_DICE_TABLE[effectNumber];
    const bardSL = getBardOfTheWorldSL();
    const canModify = bardSL > 0;

    setShadowDiceResult({
      roll: naturalRoll,
      modifiedRoll: naturalRoll,
      effect,
      effectNumber,
      personality: character.personality,
      canModify,
      modificationApplied: 0,
    });
    setShowShadowDiceResult(true);
  };

  const modifyShadowDice = (delta: number) => {
    if (!shadowDiceResult) return;
    const bardSL = getBardOfTheWorldSL();
    const maxMod = bardSL * 2;
    const newModification = Math.max(-maxMod, Math.min(maxMod, shadowDiceResult.modificationApplied + delta));
    const newModifiedRoll = Math.max(1, Math.min(12, shadowDiceResult.roll + newModification));
    const newEffectNumber = Math.min(newModifiedRoll, 12);
    const newEffect = SHADOW_DICE_TABLE[newEffectNumber];

    setShadowDiceResult({
      ...shadowDiceResult,
      modifiedRoll: newModifiedRoll,
      effect: newEffect,
      effectNumber: newEffectNumber,
      modificationApplied: newModification,
    });
  };

  const rollCharismaWithBonus = async (mode: "normal" | "advantage" | "disadvantage" = "normal") => {
    if (!isReady || !character) return;
    setShowDice(true);
    const diceNotation = `1d${character.charismaDie}`;
    const bardSL = getBardOfTheWorldSL();
    let finalRoll: number;
    let roll1: number | undefined;
    let roll2: number | undefined;
    let kept: "roll1" | "roll2" | undefined;

    if (mode === "advantage" || mode === "disadvantage") {
      const batchResults = await rollDiceBatch([
        { notation: diceNotation, options: { theme: "smooth", themeColor: "#F4D03F" } },
        { notation: diceNotation, options: { theme: "smooth", themeColor: "#F4D03F" } }
      ]);
      const results1 = batchResults[0] || [{ value: 0 }];
      const results2 = batchResults[1] || [{ value: 0 }];
      roll1 = results1[0]?.value || 0;
      roll2 = results2[0]?.value || 0;
      finalRoll = mode === "advantage" ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      kept = mode === "advantage" ? (roll1 > roll2 ? "roll1" : "roll2") : (roll1 < roll2 ? "roll1" : "roll2");
    } else {
      const results = await rollDice(diceNotation, { theme: "smooth", themeColor: "#F4D03F" });
      finalRoll = results[0]?.value || 0;
    }

    const modifier = bardSL;
    setRollResult({
      label: "Charisma",
      naturalRoll: finalRoll,
      modifier,
      total: finalRoll + modifier,
      type: "charisma",
      diceSize: character.charismaDie,
      mode,
      roll1,
      roll2,
      kept,
    });
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  // Custom dice roller with advantage/disadvantage support
  const rollCustomDice = async () => {
    if (!isReady) return;
    setShowDice(true);
    setCustomDiceOpen(false);

    const diceNotation = `${diceCount}d${diceType}`;

    if (rollMode === "advantage" || rollMode === "disadvantage") {
      // Roll both groups together with different colors
      const group1Color = "#00FFFF"; // Cyan
      const group2Color = "#7400b8"; // Purple

      // Roll both simultaneously using batch
      const batchResults = await rollDiceBatch([
        { notation: diceNotation, options: { theme: "smooth", themeColor: group1Color } },
        { notation: diceNotation, options: { theme: "smooth", themeColor: group2Color } }
      ]);
      const results1 = batchResults[0] || [];
      const results2 = batchResults[1] || [];

      const total1 = results1.reduce((sum, r) => sum + r.value, 0);
      const total2 = results2.reduce((sum, r) => sum + r.value, 0);

      const finalRoll = rollMode === "advantage" ? Math.max(total1, total2) : Math.min(total1, total2);
      const kept: "roll1" | "roll2" = rollMode === "advantage"
        ? (total1 > total2 ? "roll1" : "roll2")
        : (total1 < total2 ? "roll1" : "roll2");

      const total = finalRoll + diceModifier;
      const isCrit = diceType === 20 && finalRoll === 20;
      const isCritFail = diceType === 20 && finalRoll === 1;

      setRollResult({
        label: `Custom ${diceNotation} (${rollMode})`,
        naturalRoll: finalRoll,
        modifier: diceModifier,
        total,
        type: "save",
        diceSize: diceType,
        crit: isCrit,
        critFail: isCritFail,
        mode: rollMode,
        roll1: total1,
        roll2: total2,
        kept,
      });
    } else {
      // Normal roll - use orange color
      const themeColor = "#FF7F00";
      const results = await rollDice(diceNotation, { theme: "smooth", themeColor });
      const finalRoll = results.reduce((sum, r) => sum + r.value, 0);
      const total = finalRoll + diceModifier;
      const isCrit = diceType === 20 && finalRoll === 20;
      const isCritFail = diceType === 20 && finalRoll === 1;

      setRollResult({
        label: `Custom ${diceNotation}`,
        naturalRoll: finalRoll,
        modifier: diceModifier,
        total,
        type: "save",
        diceSize: diceType,
        crit: isCrit,
        critFail: isCritFail,
        mode: "normal",
      });
    }
  };

  // Roll check with advantage/disadvantage
  const rollCheckWithMode = async (attr: AttributeKey, mode: "normal" | "advantage" | "disadvantage") => {
    if (!isReady || !character) return;
    setShowDice(true);
    const color = ATTR_COLORS[attr];

    let finalRoll: number;
    let roll1: number | undefined;
    let roll2: number | undefined;
    let kept: "roll1" | "roll2" | undefined;

    if (mode === "advantage" || mode === "disadvantage") {
      // Roll both dice simultaneously using batch
      const batchResults = await rollDiceBatch([
        { notation: "1d20", options: { theme: "smooth", themeColor: color } },
        { notation: "1d20", options: { theme: "smooth", themeColor: color } }
      ]);
      const results1 = batchResults[0] || [{ value: 0 }];
      const results2 = batchResults[1] || [{ value: 0 }];

      roll1 = results1[0]?.value || 0;
      roll2 = results2[0]?.value || 0;

      if (mode === "advantage") {
        finalRoll = Math.max(roll1, roll2);
        kept = roll1 > roll2 ? "roll1" : "roll2";
      } else {
        finalRoll = Math.min(roll1, roll2);
        kept = roll1 < roll2 ? "roll1" : "roll2";
      }
    } else {
      const results = await rollDice("1d20", { theme: "smooth", themeColor: color });
      finalRoll = results[0]?.value || 0;
    }

    const modifier = getModifier(character.stats[attr]);
    const total = finalRoll + modifier;

    setRollResult({
      label: `${ATTR_LABELS[attr]}`,
      naturalRoll: finalRoll,
      modifier,
      total,
      type: attr as RollType,
      diceSize: 20,
      crit: finalRoll === 20,
      critFail: finalRoll === 1,
      mode,
      roll1,
      roll2,
      kept,
    });

    setContextMenu(prev => ({ ...prev, show: false }));
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, type: "stat" | "roll" | "initiative" | "charisma", key?: AttributeKey | string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      key,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, show: false }));
  };

  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu.show) {
      const handleClick = () => closeContextMenu();
      const handleScroll = () => closeContextMenu();
      document.addEventListener("click", handleClick);
      document.addEventListener("scroll", handleScroll);
      return () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("scroll", handleScroll);
      };
    }
  }, [contextMenu.show]);

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="parchment-frame-aged w-full max-w-md">
          <div className="corner-flourish top-left" />
          <div className="corner-flourish top-right" />
          <div className="corner-flourish bottom-left" />
          <div className="corner-flourish bottom-right" />
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-muted-foreground mb-6">No character found. Create one in the builder first.</p>
            <Button onClick={() => router.push("/builder")} className="btn-fantasy">
              Go to Builder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hpPercent = (currentHp / character.maxHp) * 100;
  const weapons = inventory.filter((i) => i.type === "weapon");
  const items = inventory.filter((i) => i.type === "item");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03),transparent_50%)]" />
      </div>

      <DiceCanvas visible={showDice} onClose={() => setShowDice(false)} />
      <RollResultPopup result={rollResult} onClose={() => setRollResult(null)} />

      {showShadowDiceResult && shadowDiceResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShadowDiceResult(false)}>
          <Card className="w-full max-w-lg mx-4 bg-card border-purple-700/50 dark:border-purple-500/50 shadow-2xl shadow-purple-700/20 dark:shadow-purple-500/20" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1">Shadow Dice</p>
                <p className="text-sm text-muted-foreground">{PERSONALITY_LABELS[shadowDiceResult.personality]}</p>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-5xl font-bold text-purple-700 dark:text-purple-400">
                  {shadowDiceResult.modifiedRoll}
                </div>
                {shadowDiceResult.modificationApplied !== 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="text-xs">rolled</span>
                    <span className="mx-1">{shadowDiceResult.roll}</span>
                    <span className="text-xs">{shadowDiceResult.modificationApplied > 0 ? '+' : ''}{shadowDiceResult.modificationApplied}</span>
                  </div>
                )}
              </div>

              <div className="bg-purple-700/10 dark:bg-purple-500/10 border border-purple-700/30 dark:border-purple-500/30 rounded-lg p-4 mb-4" title={shadowDiceResult.effect.description}>
                <p className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">
                  {shadowDiceResult.effectNumber}. {shadowDiceResult.effect.name}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{shadowDiceResult.effect.description}</p>
              </div>

              {shadowDiceResult.canModify && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center mb-2">Bard of the World: Modify Result</p>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-500"
                      onClick={() => modifyShadowDice(-2)}
                      disabled={shadowDiceResult.modificationApplied <= -(getBardOfTheWorldSL() * 2) + 1}
                    >
                      -2
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/50 text-amber-500"
                      onClick={() => modifyShadowDice(-1)}
                      disabled={shadowDiceResult.modificationApplied <= -(getBardOfTheWorldSL() * 2)}
                    >
                      -1
                    </Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">
                      {shadowDiceResult.modificationApplied}/{getBardOfTheWorldSL() * 2}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-500"
                      onClick={() => modifyShadowDice(1)}
                      disabled={shadowDiceResult.modificationApplied >= getBardOfTheWorldSL() * 2}
                    >
                      +1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-500"
                      onClick={() => modifyShadowDice(2)}
                      disabled={shadowDiceResult.modificationApplied >= getBardOfTheWorldSL() * 2 - 1}
                    >
                      +2
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-purple-600 hover:bg-purple-500"
                onClick={() => setShowShadowDiceResult(false)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed z-[300] bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 120),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "stat" && contextMenu.key && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollCheckWithMode(contextMenu.key as AttributeKey, "advantage")}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Advantage
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollCheckWithMode(contextMenu.key as AttributeKey, "normal")}
              >
                <span className="w-2 h-2 rounded-full bg-muted0" />
                Flat Roll
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollCheckWithMode(contextMenu.key as AttributeKey, "disadvantage")}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Disadvantage
              </button>
            </>
          )}
          {contextMenu.type === "initiative" && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollInitiativeWithMode("advantage")}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Advantage
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollInitiativeWithMode("normal")}
              >
                <span className="w-2 h-2 rounded-full bg-muted0" />
                Flat Roll
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollInitiativeWithMode("disadvantage")}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Disadvantage
              </button>
            </>
          )}
          {contextMenu.type === "charisma" && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollCharismaWithBonus("advantage")}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Advantage
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollCharismaWithBonus("normal")}
              >
                <span className="w-2 h-2 rounded-full bg-muted0" />
                Flat Roll
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => rollCharismaWithBonus("disadvantage")}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Disadvantage
              </button>
            </>
          )}
        </div>
      )}

      {/* Custom Dice Roller Dialog */}
      <Dialog open={customDiceOpen} onOpenChange={setCustomDiceOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-purple-400" />
              Custom Dice Roller
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Dice Count */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Number of Dice</label>
              <Input
                type="number"
                min={1}
                value={diceCount}
                onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Dice Type */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Dice Type</label>
              <div className="flex gap-1">
                {[4, 6, 8, 10, 12, 20, 100].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiceType(d)}
                    className={cn(
                      "flex-1 py-2 rounded text-sm font-medium transition-colors",
                      diceType === d
                        ? "bg-amber-600 text-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    d{d}
                  </button>
                ))}
              </div>
            </div>

            {/* Roll Mode */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Roll Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRollMode("normal")}
                  className={cn(
                    "flex-1 py-2 rounded text-sm font-medium transition-colors",
                    rollMode === "normal"
                      ? "bg-blue-700/60 text-blue-100"
                      : "bg-muted text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  Normal
                </button>
                <button
                  onClick={() => setRollMode("advantage")}
                  className={cn(
                    "flex-1 py-2 rounded text-sm font-medium transition-colors",
                    rollMode === "advantage"
                      ? "bg-emerald-700/60 text-emerald-100"
                      : "bg-muted text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  Advantage
                </button>
                <button
                  onClick={() => setRollMode("disadvantage")}
                  className={cn(
                    "flex-1 py-2 rounded text-sm font-medium transition-colors",
                    rollMode === "disadvantage"
                      ? "bg-red-800/60 text-red-100"
                      : "bg-muted text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  Disadvantage
                </button>
              </div>
            </div>

            {/* Modifier */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Modifier</label>
              <Input
                type="number"
                value={diceModifier}
                onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Roll Button */}
            <Button
              className="w-full bg-purple-700/60 hover:bg-purple-600/60 text-purple-100"
              onClick={rollCustomDice}
              disabled={!isReady}
            >
              <Dices className="w-4 h-4 mr-2" />
              Roll {diceCount}d{diceType}
              {diceModifier !== 0 && ` ${diceModifier >= 0 ? '+' : ''}${diceModifier}`}
              {rollMode !== "normal" && ` (${rollMode})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative z-10 min-h-screen p-2 sm:p-4 md:p-6 flex flex-col">
        {/* Header - Character Identity */}
        <header
          className={cn(
            "parchment-frame p-3 sm:p-4 mb-3 sm:mb-6 transition-opacity duration-700",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          <div className="corner-flourish top-left" />
          <div className="corner-flourish top-right" />
          <div className="corner-flourish bottom-left" />
          <div className="corner-flourish bottom-right" />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <span className="text-2xl font-bold text-amber-400">{character.name.charAt(0)}</span>
                </div>
                {/* XP Badge - Shows Total XP */}
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-foreground shadow-lg">
                  {character.xp} XP
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground dark:bg-gradient-to-r dark:from-amber-100 dark:via-amber-200 dark:to-orange-200 dark:bg-clip-text dark:text-transparent">
                  {character.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {character.className}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/builder")}
                className="parchment-frame hover:border-amber-500/50 hover:text-amber-400 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Character
              </Button>
            </div>
          </div>
        </header>

        {/* Main Grid Layout - responsive */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 min-h-0">
          {/* Left Column - Stats & XP */}
          <div
            className={cn(
              "md:col-span-4 flex flex-col gap-3 sm:gap-4 transition-opacity duration-700 delay-100",
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            )}
          >
            {/* Primary Stats - Large Cards */}
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(ATTR_LABELS) as AttributeKey[]).map((attr, idx) => {
                const value = character.stats[attr];
                const mod = getModifier(value);
                const isPrimary = character.primaryStat === attr;

                return (
                  <button
                    key={attr}
                    onClick={() => rollCheck(attr)}
                    onContextMenu={(e) => handleContextMenu(e, "stat", attr)}
                    disabled={!isReady}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-card transition-transform duration-300 hover:scale-105",
                      isPrimary
                        ? "border-amber-500/40 shadow-lg shadow-amber-500/10"
                        : "border-border hover:border-amber-500/30"
                    )}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="relative p-5 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 bg-muted text-foreground">
                        {ATTR_ICONS[attr]}
                      </div>

                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {ATTR_LABELS[attr]}
                      </p>

                      <p className="text-4xl font-bold text-foreground mb-1">{value}</p>

                      <p
                        className={cn(
                          "text-lg font-semibold",
                          mod >= 0 ? "text-emerald-500" : "text-red-500"
                        )}
                      >
                        {formatMod(mod)}
                      </p>

                      {isPrimary && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                      )}

                      <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dices className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Armor & Initiative Row */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="parchment-frame overflow-hidden">
                <div className="corner-flourish top-left" />
                <div className="corner-flourish top-right" />
                <div className="corner-flourish bottom-left" />
                <div className="corner-flourish bottom-right" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Armor</p>
                      <p className="text-3xl font-bold text-foreground">{character.totalStartingArmor}</p>
                    </div>
                  </div>
                  {character.armorPieces.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex flex-wrap gap-1">
                        {character.armorPieces.map((a) => (
                          <Badge
                            key={a.name}
                            variant="outline"
                            className="text-[10px] border-border bg-muted text-muted-foreground"
                          >
                            {a.name} +{a.armor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <button
                onClick={rollInitiative}
                onContextMenu={(e) => handleContextMenu(e, "initiative")}
                disabled={!isReady}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-transform hover:scale-105 hover:border-primary/30"
              >
                <div className="relative p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center transition-transform group-hover:scale-110">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Initiative</p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatMod(getModifier(character.stats.athletics))}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Hit Die & Inner Chaos */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="parchment-frame">
                <div className="corner-flourish top-left" />
                <div className="corner-flourish top-right" />
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hit Die</p>
                  <p className="text-2xl font-bold text-foreground">d{character.hitDie}</p>
                </CardContent>
              </Card>
              <Card className="parchment-frame border-purple-500/30">
                <div className="corner-flourish top-left" />
                <div className="corner-flourish top-right" />
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Skull className="w-3 h-3 text-purple-500" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inner Chaos</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-purple-600 dark:text-purple-400 border-purple-500/50">
                      d{PERSONALITY_DICE[character.personality]}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold border-purple-500/50 bg-purple-100/80 dark:bg-purple-900/40 hover:bg-purple-200/80 dark:hover:bg-purple-800/50 hover:border-purple-500/60 text-purple-700 dark:text-purple-200"
                    onClick={rollShadowDice}
                    disabled={!isReady}
                  >
                    <Skull className="w-3 h-3 mr-1" />
                    Roll
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Inventory */}
            <Card className="parchment-frame">
              <div className="corner-flourish top-left" />
              <div className="corner-flourish top-right" />
              <div className="corner-flourish bottom-left" />
              <div className="corner-flourish bottom-right" />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Inventory
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => {
                          resetItemForm();
                          setNewItemType("item");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>

                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-foreground/30 text-center py-3">No items</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        onClick={() => startEditItem(item)}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-foreground">{item.name}</span>
                        </div>
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                            x{item.quantity}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - HP & Weapons */}
          <div
            className={cn(
              "md:col-span-4 flex flex-col gap-3 sm:gap-4 transition-opacity duration-700 delay-200",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {/* HP Card */}
            <Card className="parchment-frame overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
                      <Heart className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Hit Points</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">{currentHp}</span>
                        <span className="text-lg text-muted-foreground">/ {character.maxHp}</span>
                      </div>
                    </div>
                  </div>
                  {tempHp > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Temp</p>
                      <p className="text-2xl font-bold text-cyan-600">+{tempHp}</p>
                    </div>
                  )}
                </div>

                {/* HP Bar */}
                <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg,
                        ${hpPercent > 60 ? "#10b981" : hpPercent > 30 ? "#f59e0b" : "#ef4444"} 0%,
                        ${hpPercent > 60 ? "#34d399" : hpPercent > 30 ? "#fbbf24" : "#f87171"} 100%)`,
                      width: `${Math.min((currentHp / character.maxHp) * 100, 100)}%`,
                      transition: "width 0.5s ease-out",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
                </div>

                {/* HP Controls - Combined Damage/Heal Grid */}
                <div className="grid grid-cols-8 gap-1.5 mb-3">
                  {/* Damage row */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/40 bg-red-950/60 hover:bg-red-900/60 hover:border-red-500/60 text-red-200 px-1"
                    onClick={() => applyDamage(10)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    10
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/40 bg-red-950/60 hover:bg-red-900/60 hover:border-red-500/60 text-red-200 px-1"
                    onClick={() => applyDamage(5)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    5
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/40 bg-red-950/60 hover:bg-red-900/60 hover:border-red-500/60 text-red-200 px-1"
                    onClick={() => applyDamage(2)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    2
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/40 bg-red-950/60 hover:bg-red-900/60 hover:border-red-500/60 text-red-200 px-1"
                    onClick={() => applyDamage(1)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    1
                  </Button>
                  {/* Heal row - aligned */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 hover:border-emerald-500/60 text-emerald-200 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 1, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 hover:border-emerald-500/60 text-emerald-200 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 2, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    2
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 hover:border-emerald-500/60 text-emerald-200 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 5, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    5
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 hover:border-emerald-500/60 text-emerald-200 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 10, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    10
                  </Button>
                </div>

                {/* Custom HP Input Row */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    className="h-10 flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-amber-500/50"
                    value={hpInput}
                    onChange={(e) => setHpInput(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 border-red-500/40 bg-red-950/60 hover:bg-red-900/60 text-red-200"
                    onClick={handleDamage}
                    disabled={!hpInput}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200"
                    onClick={handleHeal}
                    disabled={!hpInput}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Temp HP Button */}
                <Button
                  variant="outline"
                  className="w-full h-9 mt-2 border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200"
                  onClick={handleAddTemp}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Temp HP
                </Button>
                {/* Long Rest Button */}
                <Button
                  variant="outline"
                  onClick={handleLongRest}
                  className="btn-long-rest w-full mt-3"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  <span>Long Rest</span>
                  <span className="ml-2 text-xs opacity-70">Restores HP, Skills & Spells</span>
                </Button>
              </CardContent>
            </Card>

            {/* Weapons */}
            <Card className="parchment-frame flex-1 overflow-hidden">
              <div className="corner-flourish top-left" />
              <div className="corner-flourish top-right" />
              <div className="corner-flourish bottom-left" />
              <div className="corner-flourish bottom-right" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sword className="w-3 h-3" />
                    Weapons
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => {
                          resetItemForm();
                          setNewItemType("weapon");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border text-foreground">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit" : "Add"} {newItemType === "weapon" ? "Weapon" : "Item"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={newItemType === "weapon" ? "default" : "outline"}
                              className={newItemType === "weapon" ? "bg-amber-600" : ""}
                              onClick={() => setNewItemType("weapon")}
                            >
                              <Sword className="w-3 h-3 mr-1" />
                              Weapon
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={newItemType === "item" ? "default" : "outline"}
                              className={newItemType === "item" ? "bg-blue-700/60 text-blue-100" : ""}
                              onClick={() => setNewItemType("item")}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Item
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Name</label>
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={newItemType === "weapon" ? "Weapon name" : "Item name"}
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        {newItemType === "weapon" && (
                          <>
                            <div>
                              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Damage Dice</label>
                              <Input
                                value={newWeaponDamage}
                                onChange={(e) => setNewWeaponDamage(e.target.value)}
                                placeholder="e.g., 1d8, 2d6"
                                className="bg-background border-border text-foreground"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Modifier Attribute</label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={newWeaponMod === undefined ? "default" : "outline"}
                                  className={newWeaponMod === undefined ? "bg-gray-600" : ""}
                                  onClick={() => setNewWeaponMod(undefined)}
                                >
                                  None
                                </Button>
                                {(Object.keys(ATTR_LABELS) as AttributeKey[]).map((attr) => (
                                  <Button
                                    key={attr}
                                    type="button"
                                    size="sm"
                                    variant={newWeaponMod === attr ? "default" : "outline"}
                                    className={newWeaponMod === attr ? "bg-amber-600" : ""}
                                    onClick={() => setNewWeaponMod(attr)}
                                  >
                                    {ATTR_LABELS[attr]}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Custom Modifier (optional)</label>
                              <Input
                                type="number"
                                value={newWeaponCustomMod || ""}
                                onChange={(e) => setNewWeaponCustomMod(parseInt(e.target.value) || 0)}
                                placeholder="e.g., +2 or -1"
                                className="bg-background border-border text-foreground"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Quantity</label>
                          <Input
                            type="number"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                          <Input
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            placeholder="Brief description"
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1 bg-amber-600 hover:bg-amber-500"
                            onClick={addInventoryItem}
                            disabled={!newItemName.trim()}
                          >
                            {editingItem ? "Save Changes" : "Add"}
                          </Button>
                          {editingItem && (
                            <Button
                              variant="destructive"
                              onClick={() => {
                                removeInventoryItem(editingItem.id);
                                setDialogOpen(false);
                                resetItemForm();
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {weapons.length === 0 ? (
                    <p className="text-sm text-foreground/30 text-center py-4">No weapons</p>
                  ) : (
                    weapons.map((w) => {
                      const statMod = w.mod ? getModifier(character.stats[w.mod]) : 0;
                      const customMod = w.customMod || 0;
                      const flatDmg = w.flatDamage || 0;
                      const baseMod = statMod + customMod + flatDmg;
                      
                      const skillBonus = w.skillDamageBonus ? {
                        ...w.skillDamageBonus,
                        sl: character.skillLevels[w.skillDamageBonus.skillName] || 1,
                        bonus: (character.skillLevels[w.skillDamageBonus.skillName] || 1) * w.skillDamageBonus.multiplier,
                      } : undefined;
                      
                      const totalMod = baseMod + (skillBonus?.bonus ?? 0);
                      const hasAnyMod = w.mod || customMod !== 0 || flatDmg !== 0 || skillBonus;
                      
                      return (
                        <div
                          key={w.id}
                          className="group flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer"
                          onClick={() => startEditItem(w)}
                        >
                          <div>
                            <p className="font-medium text-foreground">{w.name}</p>
                            {hasAnyMod && (
                              <p className="text-xs text-muted-foreground">
                                {w.mod && `${ATTR_LABELS[w.mod]} ${formatMod(statMod)}`}
                                {skillBonus && ` + SL*${skillBonus.multiplier} (${skillBonus.bonus})`}
                                {flatDmg !== 0 && ` +${flatDmg}`}
                              </p>
                            )}
                          </div>
                          {w.damageDice ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                rollDamage(w.name, w.damageDice!, baseMod, skillBonus);
                              }}
                              disabled={!isReady}
                            >
                              <Dices className="w-3 h-3 mr-1" />
                              {w.damageDice}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="border-border text-muted-foreground">
                              {w.flatDamage} dmg
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Skills & Inventory */}
          <div
            className={cn(
              "md:col-span-4 flex flex-col gap-3 sm:gap-4 transition-opacity duration-700 delay-300",
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            )}
          >
            {/* Quick Actions */}
            <Card className="parchment-frame">
              <div className="corner-flourish top-left" />
              <div className="corner-flourish top-right" />
              <div className="corner-flourish bottom-left" />
              <div className="corner-flourish bottom-right" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Quick Rolls</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setCustomDiceOpen(true)}
                  >
                    <Settings2 className="w-3 h-3 mr-1" />
                    Custom
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={rollInitiative}
                    onContextMenu={(e) => handleContextMenu(e, "initiative")}
                    disabled={!isReady}
                    className="group relative overflow-hidden rounded-xl p-4 border border-border bg-card transition-transform hover:scale-105 hover:border-amber-500/30"
                  >
                    <Zap className="w-6 h-6 text-muted-foreground mb-2 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-foreground">Initiative</p>
                    <p className="text-xs text-muted-foreground">d20 + ATH</p>
                  </button>

                  <button
                    onClick={() => rollCharismaWithBonus("normal")}
                    onContextMenu={(e) => handleContextMenu(e, "charisma")}
                    disabled={!isReady}
                    className="group relative overflow-hidden rounded-xl p-4 border border-border bg-card transition-transform hover:scale-105 hover:border-amber-500/30"
                  >
                    <Sparkles className="w-6 h-6 text-muted-foreground mb-2 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-foreground">Charisma</p>
                    <p className="text-xs text-muted-foreground">
                      d{character.charismaDie}
                      {getBardOfTheWorldSL() > 0 && <span className="text-amber-400"> +{getBardOfTheWorldSL()}</span>}
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Skill & Spellcasting */}
            <Card className="parchment-frame">
              <div className="corner-flourish top-left" />
              <div className="corner-flourish top-right" />
              <div className="corner-flourish bottom-left" />
              <div className="corner-flourish bottom-right" />
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Skill & Spellcasting
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant={resourceTab === 'skills' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setResourceTab('skills')}
                      className="h-7 px-2 text-xs"
                    >
                      Skills
                    </Button>
                    {(character.className.toLowerCase() === 'wizard' || character.className.toLowerCase() === 'bard') && (
                      <Button
                        variant={resourceTab === 'spells' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResourceTab('spells')}
                        className="h-7 px-2 text-xs"
                      >
                        Spells
                      </Button>
                    )}
                  </div>
                </div>
                
                {resourceTab === 'skills' && (() => {
                  const classPrefix = character.className.toLowerCase()
                  const mappedSkills = character.skills
                    .map((skillName) => {
                      const skillId = SKILL_NAME_TO_ID[skillName]
                      if (!skillId) {
                        console.warn(`Skill not found: ${skillName}`)
                        return null
                      }
                      return {
                        id: skillId,
                        level: character.skillLevels[skillName] || 1,
                      }
                    })
                    .filter(Boolean) as Array<{ id: string; level: number }>
                  
                  if (mappedSkills.length === 0) return <p className="text-sm text-muted-foreground">No skills available</p>
                  
                  return (
                    <SkillRenderer
                      characterId={`sheet-${character.name}`}
                      classId={character.className.toLowerCase() as 'fighter' | 'archer' | 'wizard' | 'priest' | 'bard'}
                      skills={mappedSkills}
                      characterStats={character.stats}
                      charismaDie={character.charismaDie}
                      skillLevels={character.skillLevels}
                    />
                  )
                })()}
                
                {resourceTab === 'spells' && (() => {
                  const classId = character.className.toLowerCase() as 'wizard' | 'bard'
                  if (classId !== 'wizard' && classId !== 'bard') return null
                  
                  const wizardSlots = classId === 'wizard' ? calculateWizardSlots(character.skills, character.skillLevels) : undefined
                  const bardSlots = classId === 'bard' ? calculateBardSlots(character.skills) : undefined
                  
                  const hasChaoticMetamagic = classId === 'wizard' && character.skills.some(s => s.includes("Immeral's Chaotic Metamagic"))
                  const chaoticSkill = hasChaoticMetamagic ? useSkillStore.getState().characterSkills[`sheet-${character.name}`]?.['wizard-chaotic-metamagic'] : null
                  const chaosPoints = chaoticSkill ? { current: chaoticSkill.currentUses, max: chaoticSkill.maxUses } : { current: 0, max: 0 }
                  
                  const handleRefillWithChaos = (level: string) => {
                    if (!hasChaoticMetamagic || chaosPoints.current <= 0) return
                    useSkillStore.getState().decrementUses(`sheet-${character.name}`, 'wizard-chaotic-metamagic', 1)
                  }
                  
                  return (
                    <SpellCasting
                      characterId={`sheet-${character.name}`}
                      classId={classId}
                      wizardSlots={wizardSlots}
                      bardSlots={bardSlots}
                      initialSlotState={spellSlotState}
                      onSlotStateChange={setSpellSlotState}
                      hasChaoticMetamagic={hasChaoticMetamagic}
                      chaosPoints={chaosPoints}
                      onRefillWithChaos={handleRefillWithChaos}
                    />
                  )
                })()}
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card className="parchment-frame flex-1 overflow-hidden">
              <div className="corner-flourish top-left" />
              <div className="corner-flourish top-right" />
              <div className="corner-flourish bottom-left" />
              <div className="corner-flourish bottom-right" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Inventory
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => {
                          resetItemForm();
                          setNewItemType("item");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-foreground/30 text-center py-4">No items</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        onClick={() => startEditItem(item)}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-foreground">{item.name}</span>
                        </div>
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                            x{item.quantity}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reset Button */}
            <Button
              variant="ghost"
              className="h-10 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
              onClick={() => {
                localStorage.removeItem(SHEET_STATE_KEY);
                setCurrentHp(character.maxHp);
                setTempHp(0);
              }}
            >
              Reset HP to Maximum
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
