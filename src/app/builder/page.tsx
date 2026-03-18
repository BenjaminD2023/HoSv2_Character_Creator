"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DiceCanvas } from "@/components/DiceCanvas";
import { useDice } from "@/contexts";

type AttributeKey = "strength" | "intelligence" | "athletics";
type Tier = "basic" | "intermediate" | "advanced" | "capstone";
type ClassId = "fighter" | "archer" | "wizard" | "priest" | "bard";

type Skill = {
  name: string;
  tier: Tier;
  once?: boolean;
};

type Weapon = {
  name: string;
  damageDice?: string;
  flatDamage?: number;
  mod?: AttributeKey;
};

type Equipment = {
  weapons: Weapon[];
  armorPieces: { name: string; armor: number }[];
  misc?: string[];
};

type ClassDefinition = {
  id: ClassId;
  name: string;
  hitDie: 6 | 8 | 10;
  charismaDie: 6 | 8 | 10 | 12;
  baseHpModifierAttr: AttributeKey;
  equipment: Equipment;
  totalStartingArmor: number;
  skills: Skill[];
  startsWithSpellSlots?: { level1: number; level2: number };
};

type RollToast = {
  label: string;
  notation: string;
  raw: number[];
  total: number;
  final: number;
  modifier?: number;
  crit?: "success" | "fail";
};

type DiceVisualGroup = "stats" | "hp" | "checks" | "damage";

const DICE_GROUP_STYLE: Record<DiceVisualGroup, { theme: string; themeColor: string }> = {
  stats: { theme: "smooth", themeColor: "#D62828" },
  hp: { theme: "smooth", themeColor: "#2A9D8F" },
  checks: { theme: "smooth", themeColor: "#3A86FF" },
  damage: { theme: "smooth", themeColor: "#E63946" },
};

const STAT_ROLL_GROUPS: Array<{ attr: AttributeKey; label: string; themeColor: string; cardClass: string }> = [
  { attr: "strength", label: "STR", themeColor: "#D62828", cardClass: "border-red-500/50 bg-red-500/10" },
  { attr: "athletics", label: "ATH", themeColor: "#2A9D2A", cardClass: "border-green-500/50 bg-green-500/10" },
  { attr: "intelligence", label: "INT", themeColor: "#2563EB", cardClass: "border-blue-500/50 bg-blue-500/10" },
];

type WeaponRollResult = {
  raw: number;
  mod: number;
  final: number;
};

type SavedCharacterState = {
  version: 1;
  savedAt: string;
  activeStep: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  characterName: string;
  rolls: number[];
  rollBreakdown: number[][];
  assignment: Record<AttributeKey, string>;
  manualMode: boolean;
  manualStats: Record<AttributeKey, number>;
  selectedClassId: ClassId | null;
  baseHpRoll: number | null;
  startingXp: number;
  extraHpRolls: number[];
  skillLevels: Record<string, number>;
  enemyArmor: number;
  checkRolls: Partial<Record<AttributeKey | "initiative", number>>;
  charismaCheck: number | null;
  weaponRolls: Record<string, WeaponRollResult>;
};

const CHARACTER_STORAGE_KEY = "hos.character-builder.v1";
const CHARACTER_SLOTS_KEY = "hos.character-builder.slots.v1";
const CHARACTER_ACTIVE_SLOT_KEY = "hos.character-builder.active-slot.v1";
const CHARACTER_SLOT_COUNT = 12;
type SlotIndex = number;
type CharacterSlotItem = {
  slot: SlotIndex;
  name: string;
  className: string;
  savedAt: string;
};

function slotKey(slot: SlotIndex) {
  return `${CHARACTER_STORAGE_KEY}.slot-${slot}`;
}

function isValidSlot(slot: number) {
  return Number.isInteger(slot) && slot >= 1 && slot <= CHARACTER_SLOT_COUNT;
}

const ATTR_LABELS: Record<AttributeKey, string> = {
  strength: "STR",
  intelligence: "INT",
  athletics: "ATH",
};

const TIER_DATA: Record<Tier, { cost: number; max: number | null; up: number | null; label: string }> = {
  basic: { cost: 1, max: 5, up: 3, label: "Basic" },
  intermediate: { cost: 3, max: 5, up: 4, label: "Intermediate" },
  advanced: { cost: 5, max: 5, up: 5, label: "Advanced" },
  capstone: { cost: 10, max: null, up: null, label: "Capstone" },
};

const CLASS_DATA: Record<ClassId, ClassDefinition> = {
  fighter: {
    id: "fighter",
    name: "Fighter",
    hitDie: 10,
    charismaDie: 6,
    baseHpModifierAttr: "strength",
    equipment: {
      weapons: [{ name: "Longsword", damageDice: "1d8", mod: "strength" }],
      armorPieces: [
        { name: "Chain Mail", armor: 3 },
        { name: "Shield", armor: 2 },
      ],
    },
    totalStartingArmor: 5,
    skills: [
      { name: "Ferocious Attack", tier: "basic" },
      { name: "Second Wind", tier: "basic" },
      { name: "Block", tier: "intermediate" },
      { name: "Great Weapon Fighting", tier: "intermediate", once: true },
      { name: "Enchanted Weapon", tier: "advanced" },
      { name: "Heroic Deed", tier: "advanced", once: true },
      { name: "Rage", tier: "advanced" },
      { name: "Zephyrus' Echo", tier: "capstone" },
      { name: "Indomitable", tier: "capstone" },
    ],
  },
  archer: {
    id: "archer",
    name: "Archer",
    hitDie: 8,
    charismaDie: 6,
    baseHpModifierAttr: "athletics",
    equipment: {
      weapons: [
        { name: "Longbow", damageDice: "1d6", mod: "athletics" },
        { name: "Dagger", damageDice: "1d4", mod: "athletics" },
      ],
      armorPieces: [{ name: "Leather Armor", armor: 2 }],
    },
    totalStartingArmor: 2,
    skills: [
      { name: "Flexible Shots", tier: "basic" },
      { name: "Dash", tier: "basic" },
      { name: "Covering Fire", tier: "basic" },
      { name: "Sneak Attack", tier: "basic" },
      { name: "Enchanted Bow", tier: "intermediate" },
      { name: "2 Additional Flexible Shots Uses", tier: "intermediate" },
      { name: "Precision Attack", tier: "intermediate" },
      { name: "Ambush", tier: "intermediate" },
      { name: "3 Additional Flexible Shots Uses", tier: "advanced" },
      { name: "Explosive Bounding", tier: "advanced" },
      { name: "Lightning Speed", tier: "capstone" },
      { name: "5 Additional Flexible Shots Uses", tier: "capstone" },
    ],
  },
  wizard: {
    id: "wizard",
    name: "Wizard",
    hitDie: 6,
    charismaDie: 10,
    baseHpModifierAttr: "intelligence",
    equipment: {
      weapons: [{ name: "Staff", flatDamage: 2 }],
      armorPieces: [],
    },
    totalStartingArmor: 0,
    startsWithSpellSlots: { level1: 5, level2: 4 },
    skills: [
      { name: "Immeral's Chaotic Metamagic", tier: "basic" },
      { name: "Lv 3 Spell Slot", tier: "basic" },
      { name: "Lv 4 Spell Slot", tier: "intermediate" },
      { name: "Opheria's Bardic Magic", tier: "intermediate" },
      { name: "Concentration", tier: "intermediate" },
      { name: "Lv 5 Spell Slot", tier: "advanced" },
      { name: "Control Time", tier: "advanced" },
      { name: "Arcane Capstone Spell Slot", tier: "capstone" },
    ],
  },
  priest: {
    id: "priest",
    name: "Priest",
    hitDie: 8,
    charismaDie: 8,
    baseHpModifierAttr: "intelligence",
    equipment: {
      weapons: [{ name: "Mace", damageDice: "1d6", mod: "strength" }],
      armorPieces: [
        { name: "Leather Armor", armor: 2 },
        { name: "Shield", armor: 2 },
      ],
    },
    totalStartingArmor: 4,
    skills: [
      { name: "Lay on Hands", tier: "basic" },
      { name: "Divine Formation", tier: "basic" },
      { name: "Quick Heal", tier: "intermediate" },
      { name: "Holy Aura", tier: "intermediate" },
      { name: "Holy Light", tier: "intermediate" },
      { name: "2 Additional Divine Formation Uses", tier: "intermediate" },
      { name: "3 Additional Divine Formation Uses", tier: "advanced" },
      { name: "Clerical Recovery", tier: "advanced" },
      { name: "Inspired Insight", tier: "advanced" },
      { name: "5 Additional Divine Formation Uses", tier: "capstone" },
    ],
  },
  bard: {
    id: "bard",
    name: "Bard",
    hitDie: 6,
    charismaDie: 12,
    baseHpModifierAttr: "intelligence",
    equipment: {
      weapons: [
        { name: "Dagger", damageDice: "1d4", mod: "athletics" },
        { name: "Shortsword", damageDice: "1d6", mod: "strength" },
      ],
      armorPieces: [{ name: "Leather Armor", armor: 2 }],
      misc: ["Instrument (2-handed, no damage)"],
    },
    totalStartingArmor: 2,
    skills: [
      { name: "Inspiration", tier: "basic" },
      { name: "Expertise", tier: "basic" },
      { name: "Professional Influencer", tier: "basic" },
      { name: "Lv 3 Spell Slot", tier: "basic" },
      { name: "Lv 4 Spell Slot", tier: "intermediate" },
      { name: "Loremaster", tier: "intermediate" },
      { name: "Skald's War Beat", tier: "intermediate" },
      { name: "Evasion", tier: "intermediate" },
      { name: "Lv 5 Spell Slot", tier: "advanced" },
      { name: "Soothing Ballad", tier: "advanced" },
      { name: "Martial Epic", tier: "advanced" },
      { name: "Decoy", tier: "advanced" },
    ],
  },
};

function getModifier(score: number) {
  if (score <= 1) return -5;
  if (score <= 3) return -4;
  if (score <= 5) return -3;
  if (score <= 7) return -2;
  if (score <= 9) return -1;
  if (score <= 11) return 0;
  if (score <= 13) return 1;
  if (score <= 15) return 2;
  if (score <= 17) return 3;
  if (score <= 19) return 4;
  if (score <= 21) return 5;
  if (score <= 23) return 6;
  if (score <= 25) return 7;
  if (score <= 27) return 8;
  if (score <= 29) return 9;
  return 10;
}

function formatMod(mod: number) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function Home() {
  const { rollDice, rollDiceBatch, isReady, clearDice } = useDice();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [characterName, setCharacterName] = useState("");

  const [rolls, setRolls] = useState<number[]>([]);
  const [rollBreakdown, setRollBreakdown] = useState<number[][]>([]);
  const [assignment, setAssignment] = useState<Record<AttributeKey, string>>({
    strength: "",
    intelligence: "",
    athletics: "",
  });
  const [manualMode, setManualMode] = useState(false);
  const [manualStats, setManualStats] = useState<Record<AttributeKey, number>>({
    strength: 10,
    intelligence: 10,
    athletics: 10,
  });
  const [statWarning, setStatWarning] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<ClassId | null>(null);

  const [baseHpRoll, setBaseHpRoll] = useState<number | null>(null);
  const [startingXp, setStartingXp] = useState(5);
  const [extraHpRolls, setExtraHpRolls] = useState<number[]>([]);

  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});

  const [enemyArmor, setEnemyArmor] = useState(2);
  const [checkRolls, setCheckRolls] = useState<Partial<Record<AttributeKey | "initiative", number>>>({});
  const [charismaCheck, setCharismaCheck] = useState<number | null>(null);
  const [weaponRolls, setWeaponRolls] = useState<Record<string, WeaponRollResult>>({});
  const [showDice, setShowDice] = useState(false);
  const [isRolling3d, setIsRolling3d] = useState(false);
  const [rollToast, setRollToast] = useState<RollToast | null>(null);
  const [dicePulse, setDicePulse] = useState(0);
  const [showVanishFx, setShowVanishFx] = useState(false);
  const fxTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [hasLoadedLocalData, setHasLoadedLocalData] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotIndex>(1);

  const selectedClass = selectedClassId ? CLASS_DATA[selectedClassId] : null;

  const canRollNextStat = !manualMode && rolls.length < 3;

  const assignedStats = useMemo(() => {
    if (manualMode) return manualStats;
    if (Object.values(assignment).some((v) => v === "")) return null;
    return {
      strength: rolls[Number(assignment.strength)] ?? 0,
      intelligence: rolls[Number(assignment.intelligence)] ?? 0,
      athletics: rolls[Number(assignment.athletics)] ?? 0,
    };
  }, [assignment, manualMode, manualStats, rolls]);

  const modifiers = useMemo(() => {
    if (!assignedStats) return null;
    return {
      strength: getModifier(assignedStats.strength),
      intelligence: getModifier(assignedStats.intelligence),
      athletics: getModifier(assignedStats.athletics),
    };
  }, [assignedStats]);

  const baseHp = useMemo(() => {
    if (!selectedClass || !assignedStats || baseHpRoll === null) return null;
    const attrMod = getModifier(assignedStats[selectedClass.baseHpModifierAttr]);
    return baseHpRoll + attrMod;
  }, [assignedStats, baseHpRoll, selectedClass]);

  const extraDiceCount = Math.max(0, Math.floor(startingXp / 3));

  const maxHp = useMemo(() => {
    if (baseHp === null) return null;
    const extra = extraHpRolls.reduce((sum, v) => sum + v, 0);
    return baseHp + extra;
  }, [baseHp, extraHpRolls]);

  const spentXp = useMemo(() => {
    if (!selectedClass) return 0;
    return selectedClass.skills.reduce((sum, skill) => {
      const sl = skillLevels[skill.name] ?? 0;
      return sum + sl * TIER_DATA[skill.tier].cost;
    }, 0);
  }, [selectedClass, skillLevels]);

  const remainingXp = startingXp - spentXp;

  const tierTotals = useMemo(() => {
    if (!selectedClass) return { basic: 0, intermediate: 0, advanced: 0, capstone: 0 };
    return selectedClass.skills.reduce(
      (acc, skill) => {
        acc[skill.tier] += skillLevels[skill.name] ?? 0;
        return acc;
      },
      { basic: 0, intermediate: 0, advanced: 0, capstone: 0 }
    );
  }, [selectedClass, skillLevels]);

  const highestSpellSlot = useMemo(() => {
    if (!selectedClass) return 0;
    let slot = selectedClass.startsWithSpellSlots ? 2 : 0;
    const purchased = Object.entries(skillLevels)
      .filter(([, level]) => level > 0)
      .map(([name]) => name);
    if (purchased.some((name) => name.includes("Lv 3"))) slot = Math.max(slot, 3);
    if (purchased.some((name) => name.includes("Lv 4"))) slot = Math.max(slot, 4);
    if (purchased.some((name) => name.includes("Lv 5"))) slot = Math.max(slot, 5);
    if (purchased.some((name) => name.includes("Capstone Spell Slot"))) slot = Math.max(slot, 6);
    return slot;
  }, [selectedClass, skillLevels]);

  const canShowFinal = Boolean(
    assignedStats && selectedClass && baseHp !== null && extraHpRolls.length === extraDiceCount
  );

  const step1Ready = Boolean(assignedStats);
  const step2Ready = Boolean(selectedClass);
  const step3Ready = baseHp !== null;
  const step4Ready = startingXp >= 0;
  const step5Ready = extraHpRolls.length === extraDiceCount;
  const step6Ready = true;

  const maxUnlockedStep = useMemo(() => {
    if (!step1Ready) return 1;
    if (!step2Ready) return 2;
    if (!step3Ready) return 3;
    if (!step4Ready) return 4;
    if (!step5Ready) return 5;
    if (!step6Ready) return 6;
    return 7;
  }, [step1Ready, step2Ready, step3Ready, step4Ready, step5Ready, step6Ready]);

  const buildSavedState = useCallback((): SavedCharacterState => ({
    version: 1,
    savedAt: new Date().toISOString(),
    activeStep,
    characterName,
    rolls,
    rollBreakdown,
    assignment,
    manualMode,
    manualStats,
    selectedClassId,
    baseHpRoll,
    startingXp,
    extraHpRolls,
    skillLevels,
    enemyArmor,
    checkRolls,
    charismaCheck,
    weaponRolls,
  }), [
    activeStep,
    assignment,
    baseHpRoll,
    characterName,
    charismaCheck,
    checkRolls,
    enemyArmor,
    extraHpRolls,
    manualMode,
    manualStats,
    rollBreakdown,
    rolls,
    selectedClassId,
    skillLevels,
    startingXp,
    weaponRolls,
  ]);

  const applySavedState = useCallback((parsed: SavedCharacterState) => {
    setActiveStep(parsed.activeStep ?? 1);
    setCharacterName(parsed.characterName ?? "");
    setRolls(Array.isArray(parsed.rolls) ? parsed.rolls : []);
    setRollBreakdown(Array.isArray(parsed.rollBreakdown) ? parsed.rollBreakdown : []);
    setAssignment(parsed.assignment ?? { strength: "", intelligence: "", athletics: "" });
    setManualMode(Boolean(parsed.manualMode));
    setManualStats(parsed.manualStats ?? { strength: 10, intelligence: 10, athletics: 10 });
    setSelectedClassId(parsed.selectedClassId ?? null);
    setBaseHpRoll(parsed.baseHpRoll ?? null);
    setStartingXp(typeof parsed.startingXp === "number" ? parsed.startingXp : 5);
    setExtraHpRolls(Array.isArray(parsed.extraHpRolls) ? parsed.extraHpRolls : []);
    setSkillLevels(parsed.skillLevels ?? {});
    setEnemyArmor(typeof parsed.enemyArmor === "number" ? parsed.enemyArmor : 2);
    setCheckRolls(parsed.checkRolls ?? {});
    setCharismaCheck(typeof parsed.charismaCheck === "number" ? parsed.charismaCheck : null);
    setWeaponRolls(parsed.weaponRolls ?? {});
  }, []);

  const resetBuilderState = useCallback(() => {
    setCharacterName("");
    setRolls([]);
    setRollBreakdown([]);
    setAssignment({ strength: "", intelligence: "", athletics: "" });
    setManualMode(false);
    setManualStats({ strength: 10, intelligence: 10, athletics: 10 });
    setSelectedClassId(null);
    setBaseHpRoll(null);
    setStartingXp(5);
    setExtraHpRolls([]);
    setSkillLevels({});
    setEnemyArmor(2);
    setCheckRolls({});
    setCharismaCheck(null);
    setWeaponRolls({});
    setActiveStep(1);
    setRollToast(null);
    setShowDice(false);
    setShowVanishFx(false);
    clearDice();
  }, [clearDice]);

  const saveCharacterToLocal = useCallback((showFlashNotice = false, slotOverride?: SlotIndex, syncState = true) => {
    if (typeof window === "undefined") return;
    const snapshot = buildSavedState();
    const slotToSave = slotOverride ?? activeSlot;
    if (!isValidSlot(slotToSave)) return;

    window.localStorage.setItem(slotKey(slotToSave), JSON.stringify(snapshot));
    window.localStorage.setItem(CHARACTER_ACTIVE_SLOT_KEY, String(slotToSave));

    const className = snapshot.selectedClassId ? CLASS_DATA[snapshot.selectedClassId].name : "Unassigned";
    const nextItem: CharacterSlotItem = {
      slot: slotToSave,
      name: snapshot.characterName || "Unnamed",
      className,
      savedAt: snapshot.savedAt,
    };

    const existingRaw = window.localStorage.getItem(CHARACTER_SLOTS_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as CharacterSlotItem[]) : [];
    const merged = [
      ...existing.filter((item) => item.slot !== slotToSave),
      nextItem,
    ].sort((a, b) => a.slot - b.slot);

    window.localStorage.setItem(CHARACTER_SLOTS_KEY, JSON.stringify(merged));
    if (syncState) {
      setActiveSlot(slotToSave);
    }

    if (showFlashNotice) {
      setSaveFlash(true);
      window.setTimeout(() => setSaveFlash(false), 900);
    }
  }, [activeSlot, buildSavedState]);

  const clearSavedCharacter = useCallback((slotOverride?: SlotIndex) => {
    const slotToClear = slotOverride ?? activeSlot;
    if (!isValidSlot(slotToClear)) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(slotKey(slotToClear));
      const slotsRaw = window.localStorage.getItem(CHARACTER_SLOTS_KEY);
      const existing = slotsRaw ? (JSON.parse(slotsRaw) as CharacterSlotItem[]) : [];
      const nextSlots = existing.filter((item) => item.slot !== slotToClear);
      window.localStorage.setItem(CHARACTER_SLOTS_KEY, JSON.stringify(nextSlots));
      if (slotToClear === activeSlot) {
        window.localStorage.setItem(CHARACTER_ACTIVE_SLOT_KEY, String(slotToClear));
      }
    }
    if (slotToClear === activeSlot) {
      resetBuilderState();
    }
  }, [activeSlot, resetBuilderState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const slotsRaw = window.localStorage.getItem(CHARACTER_SLOTS_KEY);
      const slotsParsed = slotsRaw ? (JSON.parse(slotsRaw) as CharacterSlotItem[]) : [];
      const normalizedSlots = Array.isArray(slotsParsed)
        ? slotsParsed.filter((item) => isValidSlot(item.slot)).sort((a, b) => a.slot - b.slot)
        : [];
      const persistedActiveRaw = Number(window.localStorage.getItem(CHARACTER_ACTIVE_SLOT_KEY) ?? "1");
      const querySlotRaw = Number(new URLSearchParams(window.location.search).get("slot") ?? "0");
      const fallbackSlot = isValidSlot(querySlotRaw)
        ? querySlotRaw
        : (isValidSlot(persistedActiveRaw)
            ? persistedActiveRaw
            : (normalizedSlots[0]?.slot ?? 1));
      setActiveSlot(fallbackSlot);
      window.localStorage.setItem(CHARACTER_ACTIVE_SLOT_KEY, String(fallbackSlot));

      const raw = window.localStorage.getItem(slotKey(fallbackSlot));
      if (!raw) {
        setHasLoadedLocalData(true);
        return;
      }
      const parsed = JSON.parse(raw) as SavedCharacterState;
      if (!parsed || parsed.version !== 1) {
        setHasLoadedLocalData(true);
        return;
      }
      applySavedState(parsed);
    } catch {
      // no-op: ignore malformed local save
    } finally {
      setHasLoadedLocalData(true);
    }
  }, [applySavedState]);

  useEffect(() => {
    if (!hasLoadedLocalData || typeof window === "undefined") return;
    window.localStorage.setItem(CHARACTER_ACTIVE_SLOT_KEY, String(activeSlot));
  }, [activeSlot, hasLoadedLocalData]);

  useEffect(() => {
    if (!hasLoadedLocalData) return;
    const hasMeaningfulData = Boolean(
      characterName.trim() ||
      selectedClassId ||
      rolls.length > 0 ||
      baseHpRoll !== null ||
      Object.values(skillLevels).some((sl) => sl > 0)
    );
    if (!hasMeaningfulData) return;
    saveCharacterToLocal(false, activeSlot, false);
  }, [
    hasLoadedLocalData,
    activeStep,
    characterName,
    rolls,
    rollBreakdown,
    assignment,
    manualMode,
    manualStats,
    selectedClassId,
    baseHpRoll,
    startingXp,
    extraHpRolls,
    skillLevels,
    enemyArmor,
    checkRolls,
    charismaCheck,
    weaponRolls,
    activeSlot,
    saveCharacterToLocal,
  ]);

  useEffect(() => {
    if (activeStep > maxUnlockedStep) {
      setActiveStep(maxUnlockedStep as 1 | 2 | 3 | 4 | 5 | 6 | 7);
    }
  }, [activeStep, maxUnlockedStep]);

  const playVanishFx = useCallback(() => {
    setDicePulse((v) => v + 1);
    setShowVanishFx(true);
    if (fxTimerRef.current) {
      window.clearTimeout(fxTimerRef.current);
    }
    fxTimerRef.current = window.setTimeout(() => {
      setShowVanishFx(false);
      fxTimerRef.current = null;
    }, 2200);
  }, []);

  const hideDiceOnClick = useCallback(() => {
    if (isRolling3d) return;
    setShowDice(false);
    playVanishFx();
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      clearDice();
      hideTimerRef.current = null;
    }, 1300);
  }, [clearDice, isRolling3d, playVanishFx]);

  useEffect(() => {
    if (!rollToast) return;
    const timeout = window.setTimeout(() => {
      setRollToast(null);
    }, 5500);
    return () => window.clearTimeout(timeout);
  }, [rollToast]);

  useEffect(() => {
    const onAnyPointerDown = () => {
      if (showDice && !isRolling3d) {
        hideDiceOnClick();
      }
    };
    window.addEventListener("pointerdown", onAnyPointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", onAnyPointerDown, true);
    };
  }, [hideDiceOnClick, isRolling3d, showDice]);

  useEffect(() => {
    return () => {
      if (fxTimerRef.current) {
        window.clearTimeout(fxTimerRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onDiceEngineRestarted = () => {
      setIsRolling3d(false);
      setShowDice(false);
      setRollToast(null);
      setShowVanishFx(false);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (fxTimerRef.current) {
        window.clearTimeout(fxTimerRef.current);
        fxTimerRef.current = null;
      }
      clearDice();
    };

    window.addEventListener("dice-engine-restarted", onDiceEngineRestarted);
    return () => window.removeEventListener("dice-engine-restarted", onDiceEngineRestarted);
  }, [clearDice]);

  const dismissRollToast = () => {
    setRollToast(null);
    hideDiceOnClick();
  };

  const announceRoll = (toast: RollToast) => {
    setRollToast(toast);
  };

  const rollWith3dGroup = async (notation: string, group: DiceVisualGroup) => {
    if (!isReady) {
      throw new Error("3D dice are not ready yet.");
    }
    setIsRolling3d(true);
    setShowDice(true);
    try {
      const style = DICE_GROUP_STYLE[group];
      const results = await rollDice(notation, { theme: style.theme, themeColor: style.themeColor });
      return results.map((r) => r.value);
    } finally {
      setIsRolling3d(false);
    }
  };

  const rollBatchWith3d = async (
    items: Array<{ notation: string; options?: { theme?: string; themeColor?: string } }>
  ): Promise<Array<Array<{ value: number; modifier?: number; rolls?: number[] }>>> => {
    if (!isReady) {
      throw new Error("3D dice are not ready yet.");
    }
    setIsRolling3d(true);
    setShowDice(true);
    try {
      return await rollDiceBatch(items);
    } finally {
      setIsRolling3d(false);
    }
  };

  const rollSingleStat = async () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    clearDice();
    playVanishFx();
    setRollToast(null);
    setShowDice(true);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const dice = await rollWith3dGroup("4d6", "stats");
    if (dice.length < 4) {
      throw new Error("Roll failed");
    }
    const sorted = [...dice].sort((a, b) => a - b);
    const total = sorted[1] + sorted[2] + sorted[3];
    return { dice, total };
  };

  const resetStatStep = () => {
    setRolls([]);
    setRollBreakdown([]);
    setAssignment({ strength: "", intelligence: "", athletics: "" });
    setStatWarning(null);
  };

  const handleRollNext = async () => {
    if (!canRollNextStat) return;
    try {
      const { dice, total: resultTotal } = await rollSingleStat();
      const nextRolls = [...rolls, resultTotal];
      const nextBreakdown = [...rollBreakdown, dice];

      announceRoll({
        label: `Attribute Roll ${nextRolls.length}`,
        notation: "4d6 drop lowest",
        raw: dice,
        total: resultTotal,
        final: resultTotal,
      });

      setRolls(nextRolls);
      setRollBreakdown(nextBreakdown);
    } catch {
      setStatWarning("Roll failed. Please click Roll Next again.");
    }
  };

  const handleRollAllStats = async () => {
    if (manualMode || !isReady || isRolling3d) return;

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    clearDice();
    playVanishFx();
    setRollToast(null);
    setShowDice(true);
    await new Promise((resolve) => setTimeout(resolve, 80));

    const groups = await rollBatchWith3d([
      { notation: "4d6", options: { theme: "smooth", themeColor: "#D62828" } },
      { notation: "4d6", options: { theme: "smooth", themeColor: "#2A9D2A" } },
      { notation: "4d6", options: { theme: "smooth", themeColor: "#2563EB" } },
    ]);

    let breakdown = groups.map((group) => group.map((die) => die.value));

    if (breakdown.length < 3 || breakdown.some((dice) => dice.length < 4)) {
      setStatWarning("Roll all failed on one throw. Please try again.");
      return;
    }

    breakdown = breakdown.slice(0, 3);
    const rolled = breakdown.map((dice) => {
      const sorted = [...dice].sort((a, b) => a - b);
      return sorted[1] + sorted[2] + sorted[3];
    });

    setStatWarning(null);
    setRolls(rolled);
    setRollBreakdown(breakdown);
    setAssignment({ strength: "0", athletics: "1", intelligence: "2" });

    announceRoll({
      label: "Roll All Attributes (STR/ATH/INT)",
      notation: "STR red + ATH green + INT blue (4d6 each)",
      raw: rolled,
      total: rolled.reduce((sum, v) => sum + v, 0),
      final: rolled.reduce((sum, v) => sum + v, 0),
    });
  };

  const handleRollAllExtraHp = async () => {
    if (!selectedClass || baseHp === null || extraDiceCount <= 0 || !isReady || isRolling3d) return;

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    clearDice();
    playVanishFx();
    setRollToast(null);
    setShowDice(true);
    await new Promise((resolve) => setTimeout(resolve, 80));

    const groups = await rollBatchWith3d(
      Array.from({ length: extraDiceCount }, () => ({
        notation: `1d${selectedClass.hitDie}`,
        options: { theme: "smooth", themeColor: DICE_GROUP_STYLE.hp.themeColor },
      }))
    );

    if (groups.length < extraDiceCount) {
      return;
    }

    const values = groups.map((group) => group[0]?.value ?? 0).slice(0, extraDiceCount);

    setExtraHpRolls(values);
    announceRoll({
      label: "Roll All Extra HP Dice",
      notation: `${extraDiceCount}x d${selectedClass.hitDie}`,
      raw: values,
      total: values.reduce((sum, v) => sum + v, 0),
      final: values.reduce((sum, v) => sum + v, 0),
    });
  };

  const usedIndexes = new Set(
    Object.values(assignment)
      .filter((v) => v !== "")
      .map((v) => Number(v))
  );

  const canPurchase = (skill: Skill) => {
    const current = skillLevels[skill.name] ?? 0;
    const tierInfo = TIER_DATA[skill.tier];
    if (remainingXp < tierInfo.cost) return false;
    if (skill.once && current >= 1) return false;
    if (skill.tier === "intermediate" && tierTotals.basic < 3) return false;
    if (skill.tier === "advanced" && tierTotals.intermediate < 4) return false;
    if (skill.tier === "capstone" && tierTotals.advanced < 5) return false;
    if (tierInfo.max !== null && tierTotals[skill.tier] >= tierInfo.max) return false;
    return true;
  };

  const changeSkillLevel = (skill: Skill, delta: 1 | -1) => {
    setSkillLevels((prev) => {
      const current = prev[skill.name] ?? 0;
      const next = Math.max(0, current + delta);
      if (delta > 0 && !canPurchase(skill)) return prev;
      return { ...prev, [skill.name]: next };
    });
  };

  const exportCharacterJson = () => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify(buildSavedState(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeName = (characterName || "hos-character").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    anchor.href = url;
    anchor.download = `${safeName}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCharacterSheetHtml = () => {
    if (!canShowFinal || !selectedClass || !assignedStats || !modifiers || maxHp === null || typeof window === "undefined") return;

    const skills = Object.entries(skillLevels)
      .filter(([, sl]) => sl > 0)
      .map(([name, sl]) => `${name} (SL ${sl})`)
      .join(", ") || "No skills purchased";

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${characterName || "Unnamed"} - HoS Sheet</title>
<style>
body{font-family:Georgia,serif;background:#0d0f14;color:#f4f1ea;padding:24px}
.card{border:1px solid #4a3f31;background:#16131d;padding:16px;border-radius:12px;margin-bottom:12px}
h1{margin:0 0 12px 0} h2{margin:0 0 8px 0;font-size:16px;color:#e6b36b}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
small{color:#bfb7a6}
</style></head><body>
<h1>${characterName || "Unnamed"} - ${selectedClass.name}</h1>
<div class="row">
<div class="card"><h2>STR</h2><div>${assignedStats.strength} (${formatMod(modifiers.strength)})</div></div>
<div class="card"><h2>INT</h2><div>${assignedStats.intelligence} (${formatMod(modifiers.intelligence)})</div></div>
<div class="card"><h2>ATH</h2><div>${assignedStats.athletics} (${formatMod(modifiers.athletics)})</div></div>
</div>
<div class="row">
<div class="card"><h2>Max HP</h2><div>${maxHp}</div><small>Base ${baseHp} + Extra ${extraHpRolls.reduce((a,b)=>a+b,0)}</small></div>
<div class="card"><h2>Armor (DR)</h2><div>${selectedClass.totalStartingArmor}</div></div>
<div class="card"><h2>XP</h2><div>${startingXp}</div><small>Remaining ${remainingXp}</small></div>
</div>
<div class="card"><h2>Skills</h2><div>${skills}</div></div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeName = (characterName || "hos-sheet").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    anchor.href = url;
    anchor.download = `${safeName}.html`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <div className="relative">
        <DiceCanvas visible={showDice || isRolling3d} onClose={dismissRollToast} />
        {(showVanishFx || isRolling3d) && (
          <div
            key={dicePulse}
            className="pointer-events-none fixed inset-0 z-[45] bg-gradient-to-b from-transparent via-black/30 to-black/55 animate-dice-vanish"
          />
        )}
      </div>
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">House of Shadows Character Builder</h1>
            <p className="text-sm text-muted-foreground">SRD-driven flow: Stats → Class → HP → XP → Skills → Sheet</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">v2.2.0-alpha</Badge>
            <Button size="sm" variant="outline" onClick={() => saveCharacterToLocal(true)}>Save Character</Button>
            <Button size="sm" variant="ghost" onClick={() => clearSavedCharacter()}>Clear Save</Button>
            <Button size="sm" variant="ghost" asChild><Link href="/characters">Manage</Link></Button>
            {saveFlash && <span className="text-xs text-emerald-400">Saved</span>}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              "1. Stats",
              "2. Class",
              "3. Base HP",
              "4. XP",
              "5. Extra HP",
              "6. Skills",
              "7. Sheet",
            ].map((label, idx) => {
              const step = (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => step <= maxUnlockedStep && setActiveStep(step)}
                  className={[
                    "rounded-full px-3 py-1 text-xs transition-all",
                    activeStep === step
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : step <= maxUnlockedStep
                        ? "bg-secondary/70 text-foreground hover:bg-secondary"
                        : "bg-secondary/30 text-muted-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
              style={{ width: `${(activeStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {activeStep === 1 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle>Step 1: Core Stats</CardTitle>
              <CardDescription>Roll 4d6 drop lowest, one stat at a time; assign manually or enter direct scores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Character Name</label>
                  <Input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="Name" />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant={manualMode ? "outline" : "default"} onClick={() => setManualMode(false)}>Roll Mode</Button>
                  <Button variant={manualMode ? "default" : "outline"} onClick={() => setManualMode(true)}>Manual Mode</Button>
                </div>
              </div>

              {!manualMode && (
                <>
                  <div className="flex gap-2">
                    <Button onClick={handleRollNext} disabled={!canRollNextStat || !isReady || isRolling3d}>
                      Roll Next ({rolls.length}/3)
                    </Button>
                    <Button variant="outline" onClick={handleRollAllStats} disabled={!isReady || isRolling3d}>
                      Roll All 12 Dice
                    </Button>
                    <Button variant="outline" onClick={resetStatStep}>Reroll All 3</Button>
                  </div>
                  {!isReady && <p className="text-xs text-amber-400">3D dice loading...</p>}
                  {statWarning && <p className="text-sm text-amber-400">{statWarning}</p>}
                  <div className="grid gap-2 md:grid-cols-3">
                    {STAT_ROLL_GROUPS.map((group, i) => (
                      <div key={group.attr} className={`rounded border p-3 ${rolls[i] !== undefined ? group.cardClass : "border-border/60"}`}>
                        <p className="text-xs text-muted-foreground">{group.label} Group</p>
                        <p className="text-2xl font-bold">{rolls[i] ?? "-"}</p>
                        {rollBreakdown[i] && (
                          <p className="text-xs text-muted-foreground">[{rollBreakdown[i].join(", ")}]</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {rolls.length === 3 && (
                    <div className="grid gap-2 md:grid-cols-3">
                      {(["strength", "intelligence", "athletics"] as AttributeKey[]).map((attr) => (
                        <div key={attr}>
                          <label className="mb-1 block text-xs text-muted-foreground">Assign {ATTR_LABELS[attr]}</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={assignment[attr]}
                            onChange={(e) => setAssignment((prev) => ({ ...prev, [attr]: e.target.value }))}
                          >
                            <option value="">Select Roll</option>
                            {rolls.map((value, index) => {
                              const inUse = usedIndexes.has(index) && assignment[attr] !== String(index);
                              return (
                                <option key={`${value}-${index}`} value={index} disabled={inUse}>
                                  Roll {index + 1}: {value}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {manualMode && (
                <div className="grid gap-2 md:grid-cols-3">
                  {(["strength", "intelligence", "athletics"] as AttributeKey[]).map((attr) => (
                    <div key={attr}>
                      <label className="mb-1 block text-xs text-muted-foreground">{ATTR_LABELS[attr]}</label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={manualStats[attr]}
                        onChange={(e) =>
                          setManualStats((prev) => ({
                            ...prev,
                            [attr]: Number.isNaN(Number(e.target.value)) ? 1 : Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {assignedStats && modifiers && (
                <div className="grid grid-cols-3 gap-2 rounded border border-border/60 p-3">
                  {(["strength", "intelligence", "athletics"] as AttributeKey[]).map((attr) => (
                    <div key={attr} className="text-center">
                      <p className="text-xs text-muted-foreground">{ATTR_LABELS[attr]}</p>
                      <p className="text-lg font-bold">{assignedStats[attr]}</p>
                      <p className="text-xs">{formatMod(modifiers[attr])}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button disabled={!step1Ready} onClick={() => setActiveStep(2)}>Continue to Class</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 2 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle>Step 2: Class Selection</CardTitle>
              <CardDescription>Select your HoS class data profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                {(Object.values(CLASS_DATA) as ClassDefinition[]).map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setBaseHpRoll(null);
                      setExtraHpRolls([]);
                      setSkillLevels({});
                    }}
                    className={`rounded border p-3 text-left transition ${selectedClassId === cls.id ? "border-primary bg-primary/10" : "border-border/60"}`}
                  >
                    <p className="font-semibold">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">Hit Die d{cls.hitDie} · Charisma d{cls.charismaDie}</p>
                    <p className="text-xs text-muted-foreground">Starting Armor {cls.totalStartingArmor}</p>
                  </button>
                ))}
              </div>

              {selectedClass && (
                <div className="rounded border border-border/60 p-3 text-sm">
                  <p className="mb-1 font-medium">Starting Equipment</p>
                  {selectedClass.equipment.weapons.map((w) => (
                    <p key={w.name} className="text-muted-foreground">
                      - {w.name}: {w.flatDamage ?? `${w.damageDice}${w.mod ? ` + ${ATTR_LABELS[w.mod]} mod` : ""}`}
                    </p>
                  ))}
                  {selectedClass.equipment.armorPieces.map((a) => (
                    <p key={a.name} className="text-muted-foreground">- {a.name}: Armor {a.armor}</p>
                  ))}
                  {selectedClass.equipment.misc?.map((m) => (
                    <p key={m} className="text-muted-foreground">- {m}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep(1)}>Back</Button>
                <Button disabled={!step2Ready} onClick={() => setActiveStep(3)}>Continue to Base HP</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 3 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle>Step 3: Base HP Generation</CardTitle>
              <CardDescription>Roll 1 class hit die and add class-specific attribute modifier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  disabled={!selectedClass || !assignedStats}
                  onClick={async () => {
                    if (!selectedClass) return;
                    const raw = await rollWith3dGroup(`1d${selectedClass.hitDie}`, "hp");
                    const total = raw[0] ?? 0;
                    setBaseHpRoll(total);
                    announceRoll({
                      label: "Base HP Roll",
                      notation: `1d${selectedClass.hitDie}`,
                      raw,
                      total,
                      final: total,
                    });
                  }}
                >
                  Roll Base HP Die
                </Button>
                <Input
                  type="number"
                  className="max-w-28"
                  placeholder="Manual"
                  value={baseHpRoll ?? ""}
                  onChange={(e) => setBaseHpRoll(e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>

              {selectedClass && assignedStats && baseHpRoll !== null && (
                <div className="rounded border border-border/60 p-3 text-sm">
                  <p>Roll: <strong>{baseHpRoll}</strong></p>
                  <p>
                    Modifier ({ATTR_LABELS[selectedClass.baseHpModifierAttr]}): <strong>{formatMod(getModifier(assignedStats[selectedClass.baseHpModifierAttr]))}</strong>
                  </p>
                  <p>
                    Base Max HP: <strong>{baseHp}</strong>
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep(2)}>Back</Button>
                <Button disabled={!step3Ready} onClick={() => setActiveStep(4)}>Continue to XP</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 4 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle>Step 4: XP Input</CardTitle>
              <CardDescription>Set starting XP and determine extra hit dice thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Starting XP</label>
                  <Input
                    type="number"
                    min={0}
                    value={startingXp}
                    onChange={(e) => {
                      const xp = Math.max(0, Number(e.target.value) || 0);
                      setStartingXp(xp);
                      const needed = Math.floor(xp / 3);
                      setExtraHpRolls((prev) => prev.slice(0, needed));
                    }}
                  />
                </div>
                <div className="rounded border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Extra hit dice from XP</p>
                  <p className="text-2xl font-bold">{extraDiceCount}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep(3)}>Back</Button>
                <Button onClick={() => setActiveStep(5)}>Continue to Extra HP</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 5 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle>Step 5: Extra HP Generation</CardTitle>
              <CardDescription>Roll one extra hit die per full 3 XP, no modifiers added.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedClass && baseHp !== null && (
                <div className="space-y-2 rounded border border-border/60 p-3">
                  <p className="text-sm font-medium">Extra HP Rolls (no modifier)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isReady || isRolling3d || extraDiceCount <= 0}
                    onClick={handleRollAllExtraHp}
                  >
                    Roll All Extra HP Dice
                  </Button>
                  {Array.from({ length: extraDiceCount }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-16 text-xs text-muted-foreground">d{selectedClass.hitDie} #{idx + 1}</span>
                      <Input
                        type="number"
                        className="max-w-24"
                        value={extraHpRolls[idx] ?? ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : Number(e.target.value);
                          setExtraHpRolls((prev) => {
                            const next = [...prev];
                            next[idx] = value;
                            return next;
                          });
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isReady || isRolling3d}
                        onClick={async () => {
                          const raw = await rollWith3dGroup(`1d${selectedClass.hitDie}`, "hp");
                          const total = raw[0] ?? 0;
                          setExtraHpRolls((prev) => {
                            const next = [...prev];
                            next[idx] = total;
                            return next;
                          });
                          announceRoll({
                            label: `Extra HP Roll #${idx + 1}`,
                            notation: `1d${selectedClass.hitDie}`,
                            raw,
                            total,
                            final: total,
                          });
                        }}
                      >
                        Roll
                      </Button>
                    </div>
                  ))}
                  <p className="text-sm">Current Max HP: <strong>{maxHp ?? "-"}</strong></p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep(4)}>Back</Button>
                <Button disabled={!step5Ready} onClick={() => setActiveStep(6)}>Continue to Skills</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 6 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <CardTitle>Step 6: Skill Purchasing</CardTitle>
              <CardDescription>Spend XP on class skills with active Tier UP/Tier MAX constraints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {selectedClass && (
                <>
                  <div className="rounded border border-border/60 p-3">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span>XP Spent: {spentXp}</span>
                      <span className={remainingXp < 0 ? "text-destructive" : "text-emerald-400"}>XP Remaining: {remainingXp}</span>
                    </div>
                    <div className="space-y-3">
                      {(["basic", "intermediate", "advanced", "capstone"] as Tier[]).map((tier) => (
                        <div key={tier} className="rounded border border-border/50 p-2">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-semibold">{TIER_DATA[tier].label}</p>
                            <p className="text-xs text-muted-foreground">
                              Cost {TIER_DATA[tier].cost} · Total SL {tierTotals[tier]}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {selectedClass.skills
                              .filter((skill) => skill.tier === tier)
                              .map((skill) => {
                                const level = skillLevels[skill.name] ?? 0;
                                return (
                                  <div key={`${tier}-${skill.name}`} className="flex items-center justify-between gap-2 rounded bg-secondary/30 p-2">
                                    <div>
                                      <p className="text-sm">{skill.name}{skill.once ? " (Once)" : ""}</p>
                                      <p className="text-xs text-muted-foreground">SL {level}</p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="outline" onClick={() => changeSkillLevel(skill, -1)} disabled={level <= 0}>-</Button>
                                      <Button size="sm" onClick={() => changeSkillLevel(skill, 1)} disabled={!canPurchase(skill)}>+</Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep(5)}>Back</Button>
                <Button onClick={() => setActiveStep(7)}>Continue to Final Sheet</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 7 && (
          <Card id="final-sheet" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300 border-amber-200/20 bg-[linear-gradient(160deg,rgba(191,137,53,0.08),rgba(44,19,9,0.26)_30%,rgba(13,13,18,0.9)_85%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <CardHeader>
            <CardTitle>Step 7: Final Interactive Character Sheet</CardTitle>
            <CardDescription>D20 checks/saves, damage reduction armor, spell DC, and purchased skills.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canShowFinal && <p className="text-sm text-muted-foreground">Complete stats, class, HP, and XP rolls to unlock final sheet.</p>}

            {canShowFinal && selectedClass && assignedStats && modifiers && maxHp !== null && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-amber-200/20 bg-black/25 p-4 backdrop-blur-sm shadow-inner">
                    <p className="text-xs text-muted-foreground">Character</p>
                    <p className="text-xl font-black tracking-wide">{characterName || "Unnamed"}</p>
                    <p className="text-sm text-amber-200/80">{selectedClass.name}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-300/20 bg-emerald-950/20 p-4 backdrop-blur-sm shadow-inner">
                    <p className="text-xs text-muted-foreground">Max HP</p>
                    <p className="text-3xl font-black text-emerald-200">{maxHp}</p>
                    <p className="text-xs text-muted-foreground">Base {baseHp} + Extra {extraHpRolls.reduce((a, b) => a + b, 0)}</p>
                  </div>
                  <div className="rounded-xl border border-sky-300/20 bg-sky-950/20 p-4 backdrop-blur-sm shadow-inner">
                    <p className="text-xs text-muted-foreground">Armor (DR)</p>
                    <p className="text-3xl font-black text-sky-200">{selectedClass.totalStartingArmor}</p>
                    <p className="text-xs text-muted-foreground">Armor subtracts from weapon damage</p>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  {(["strength", "intelligence", "athletics"] as AttributeKey[]).map((attr) => (
                    <div key={attr} className="rounded-xl border border-amber-100/15 bg-black/25 p-4 text-center backdrop-blur-sm transition hover:border-amber-300/30 hover:bg-black/35">
                      <p className="text-xs uppercase tracking-widest text-amber-100/70">{ATTR_LABELS[attr]}</p>
                      <p className="text-3xl font-black">{assignedStats[attr]}</p>
                      <p className="text-sm text-amber-100/80">{formatMod(modifiers[attr])}</p>
                      <Button
                        className="mt-2 w-full"
                        variant="outline"
                        disabled={!isReady || isRolling3d}
                        onClick={async () => {
                          const raw = await rollWith3dGroup("1d20", "checks");
                          const d20 = raw[0] ?? 0;
                          const final = d20 + modifiers[attr];
                          setCheckRolls((prev) => ({ ...prev, [attr]: final }));
                          announceRoll({
                            label: `${ATTR_LABELS[attr]} Check`,
                            notation: "1d20",
                            raw,
                            total: d20,
                            modifier: modifiers[attr],
                            final,
                            crit: d20 === 20 ? "success" : d20 === 1 ? "fail" : undefined,
                          });
                        }}
                      >
                        Roll d20 Check
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">{checkRolls[attr] ? `Result: ${checkRolls[attr]}` : "-"}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-rose-300/20 bg-rose-950/20 p-4 backdrop-blur-sm">
                    <p className="mb-2 text-sm font-semibold tracking-wide text-rose-100/90">Combat Derived</p>
                    <p className="text-sm">Initiative: 1d20 {formatMod(modifiers.athletics)}</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      variant="outline"
                      disabled={!isReady || isRolling3d}
                      onClick={async () => {
                        const raw = await rollWith3dGroup("1d20", "checks");
                        const d20 = raw[0] ?? 0;
                        const final = d20 + modifiers.athletics;
                        setCheckRolls((prev) => ({ ...prev, initiative: final }));
                          announceRoll({
                            label: "Initiative",
                          notation: "1d20",
                          raw,
                          total: d20,
                          modifier: modifiers.athletics,
                          final,
                          crit: d20 === 20 ? "success" : d20 === 1 ? "fail" : undefined,
                        });
                      }}
                    >
                      Roll Initiative
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">{checkRolls.initiative ? `Initiative: ${checkRolls.initiative}` : "-"}</p>
                    <p className="mt-2 text-sm">Charisma Checks: roll d{selectedClass.charismaDie}</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      variant="outline"
                      disabled={!isReady || isRolling3d}
                      onClick={async () => {
                        const raw = await rollWith3dGroup(`1d${selectedClass.charismaDie}`, "checks");
                        const total = raw[0] ?? 0;
                        setCharismaCheck(total);
                        announceRoll({
                          label: "Charisma Check",
                          notation: `1d${selectedClass.charismaDie}`,
                          raw,
                          total,
                          final: total,
                        });
                      }}
                    >
                      Roll Charisma Die
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">{charismaCheck !== null ? `Charisma: ${charismaCheck}` : "-"}</p>
                    {selectedClass.id === "wizard" && (
                      <p className="mt-2 text-sm">Spell DC: 10 + INT mod + max spell slot ({highestSpellSlot}) = <strong>{10 + modifiers.intelligence + highestSpellSlot}</strong></p>
                    )}
                  </div>

                  <div className="rounded-xl border border-indigo-300/20 bg-indigo-950/20 p-4 backdrop-blur-sm">
                    <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-100/90">Damage vs Enemy Armor</p>
                    <div className="mb-2 flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Enemy Armor</label>
                      <Input type="number" value={enemyArmor} onChange={(e) => setEnemyArmor(Number(e.target.value) || 0)} className="max-w-20" />
                    </div>
                    <div className="space-y-2">
                      {selectedClass.equipment.weapons.map((w) => {
                        const basePreview = w.flatDamage ?? 0;
                        const mod = w.mod ? modifiers[w.mod] : 0;
                        const rawPreview = w.damageDice ? `(${w.damageDice} + ${mod})` : `${basePreview}`;
                        const weaponKey = w.name;
                        const rolled = weaponRolls[weaponKey];
                        return (
                          <div key={w.name} className="rounded-lg border border-indigo-200/10 bg-indigo-950/30 p-3 text-sm">
                            <p>
                              {w.name}: raw {rawPreview} → DR result {w.damageDice ? `max(0, roll - ${enemyArmor})` : Math.max(0, basePreview - enemyArmor)}
                            </p>
                            {w.damageDice && (
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!isReady || isRolling3d}
                                  onClick={async () => {
                                    const damageDice = w.damageDice!;
                                    const raw = await rollWith3dGroup(damageDice, "damage");
                                    const rolledRaw = raw.reduce((sum: number, v: number) => sum + v, 0);
                                    const withMod = rolledRaw + mod;
                                    const finalDamage = Math.max(0, withMod - enemyArmor);
                                    setWeaponRolls((prev) => ({
                                      ...prev,
                                      [weaponKey]: { raw: rolledRaw, mod, final: finalDamage },
                                    }));
                                    announceRoll({
                                      label: `${w.name} Damage`,
                                      notation: damageDice,
                                      raw,
                                      total: rolledRaw,
                                      modifier: mod,
                                      final: finalDamage,
                                    });
                                  }}
                                >
                                  Roll Damage
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                  {rolled ? `Rolled ${rolled.raw}${formatMod(rolled.mod)} → ${rolled.final} after DR` : "No damage roll yet"}
                                </p>
                              </div>
                            )}
                            {w.flatDamage !== undefined && (
                              <p className="mt-2 text-xs text-muted-foreground">Flat damage: {Math.max(0, w.flatDamage - enemyArmor)} after DR</p>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-xs text-muted-foreground">Spell attacks ignore armor unless magical resistance explicitly applies.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-950/20 p-4 backdrop-blur-sm">
                  <p className="mb-2 text-sm font-semibold tracking-wide text-fuchsia-100/90">Purchased Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(skillLevels)
                      .filter(([, sl]) => sl > 0)
                      .map(([name, sl]) => (
                        <Badge key={name} variant="secondary">{name} (SL {sl})</Badge>
                      ))}
                    {Object.values(skillLevels).every((v) => v <= 0) && (
                      <p className="text-xs text-muted-foreground">No skills purchased yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200/20 bg-black/35 p-4 backdrop-blur-sm">
                  <p className="mb-2 text-sm font-semibold tracking-wide text-amber-100/90">Exports</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportCharacterSheetHtml}>Export Character Sheet (HTML)</Button>
                    <Button variant="outline" onClick={exportCharacterJson}>Export Character JSON</Button>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setActiveStep(6)}>Back to Skills</Button>
            </div>
          </CardContent>
          </Card>
        )}
      </main>

      {rollToast && (
        <div className="fixed bottom-4 right-4 z-[80] w-[320px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={[
              "rounded-xl border p-4 shadow-2xl backdrop-blur-md",
              rollToast.crit === "success"
                ? "border-emerald-400/60 bg-emerald-950/80"
                : rollToast.crit === "fail"
                  ? "border-red-500/70 bg-red-950/80"
                  : "border-border/70 bg-card/95",
            ].join(" ")}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{rollToast.label}</p>
                <p className="text-xs text-muted-foreground">{rollToast.notation}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={dismissRollToast}>x</Button>
            </div>

            {rollToast.crit === "success" && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Critical Success!</p>
            )}
            {rollToast.crit === "fail" && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">Critical Fail!</p>
            )}

            <div className="space-y-1 text-sm">
              <p>Raw: <span className="font-semibold">[{rollToast.raw.join(", ")}]</span></p>
              <p>Total: <span className="font-semibold">{rollToast.total}</span></p>
              {typeof rollToast.modifier === "number" && <p>Modifier: <span className="font-semibold">{formatMod(rollToast.modifier)}</span></p>}
              <p className="text-base font-bold">Result: {rollToast.final}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
