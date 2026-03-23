"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Edit2, Minus, Plus, Heart, Sword, Brain, Zap, Shield, Sparkles, Dices, Trash2, Package, Settings2 } from "lucide-react";
import { DiceCanvas } from "@/components/DiceCanvas";
import { RollResultPopup, RollType } from "@/components/RollResultPopup";
import { useDice } from "@/contexts";
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
  weapons: InventoryItem[];
  armorPieces: { name: string; armor: number }[];
  totalStartingArmor: number;
  equipmentMisc: string[];
};

type SavedSheetState = {
  currentHp: number;
  tempHp: number;
  xp: number;
  inventory: InventoryItem[];
  notes: string;
  lastModified: string;
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

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function CharacterSheetPage() {
  const router = useRouter();
  const { rollDice, isReady } = useDice();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [currentHp, setCurrentHp] = useState(0);
  const [tempHp, setTempHp] = useState(0);
  const [xp, setXp] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showDice, setShowDice] = useState(false);
  const [hpInput, setHpInput] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [rollResult, setRollResult] = useState<{
    label: string;
    naturalRoll: number;
    modifier: number;
    total: number;
    type: RollType;
    diceSize?: number;
    crit?: boolean;
    critFail?: boolean;
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
    type: "stat" | "roll";
    key?: AttributeKey | string;
  }>({ show: false, x: 0, y: 0, type: "stat" });

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
        const startingWeapons: InventoryItem[] = (parsed.weapons || []).map((w: { name: string; damageDice?: string; flatDamage?: number; mod?: AttributeKey; customMod?: number }) => ({
          id: generateId(),
          name: w.name,
          quantity: 1,
          type: "weapon",
          damageDice: w.damageDice,
          flatDamage: w.flatDamage,
          mod: w.mod,
          customMod: w.customMod,
        }));

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
          maxHp: parsed.maxHp || 10,
          xp: parsed.startingXp ?? parsed.xp ?? 0,
          proficiencyBonus: parsed.proficiencyBonus || 2,
          skills: parsed.skills || [],
          weapons: startingWeapons,
          armorPieces: parsed.armorPieces || [],
          totalStartingArmor: parsed.totalStartingArmor || 0,
          equipmentMisc: parsed.equipmentMisc || [],
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
      };
      localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(state));
    }
  }, [currentHp, tempHp, xp, inventory, character]);

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

  const rollDamage = async (weaponName: string, damageDice: string, mod: number) => {
    if (!isReady) return;
    setShowDice(true);
    const results = await rollDice(damageDice, { theme: "smooth", themeColor: "#E63946" });
    // Dice stay visible until user clicks close
    const naturalTotal = results.reduce((sum, r) => sum + r.value, 0);
    const total = naturalTotal + mod;

    const diceMatch = damageDice.match(/d(\d+)/);
    const diceSize = diceMatch ? parseInt(diceMatch[1]) : 6;

    setRollResult({
      label: weaponName,
      naturalRoll: naturalTotal,
      modifier: mod,
      total,
      type: "damage",
      diceSize,
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
      crit: naturalRoll === 20,
      critFail: naturalRoll === 1,
    });
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

      // Roll both simultaneously for visual effect
      const [results1, results2] = await Promise.all([
        rollDice(diceNotation, { theme: "smooth", themeColor: group1Color }),
        rollDice(diceNotation, { theme: "smooth", themeColor: group2Color }),
      ]);

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
      // Roll both dice simultaneously
      const [results1, results2] = await Promise.all([
        rollDice("1d20", { theme: "smooth", themeColor: color }),
        rollDice("1d20", { theme: "smooth", themeColor: color })
      ]);

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
  const handleContextMenu = (e: React.MouseEvent, type: "stat" | "roll", key?: AttributeKey | string) => {
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c]">
        <Card className="w-full max-w-md border-white/10 bg-white/5">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-muted-foreground mb-6">No character found. Create one in the builder first.</p>
            <Button onClick={() => router.push("/builder")} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500">
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
    <div className="min-h-screen bg-[#0a0a0c] text-foreground overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03),transparent_50%)]" />
      </div>

      <DiceCanvas visible={showDice} onClose={() => setShowDice(false)} />
      <RollResultPopup result={rollResult} onClose={() => setRollResult(null)} />

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed z-[300] bg-gray-900 border border-white/20 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 120),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "stat" && contextMenu.key && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                onClick={() => rollCheckWithMode(contextMenu.key as AttributeKey, "advantage")}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Advantage
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                onClick={() => rollCheckWithMode(contextMenu.key as AttributeKey, "normal")}
              >
                <span className="w-2 h-2 rounded-full bg-white/50" />
                Flat Roll
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                onClick={() => rollCheckWithMode(contextMenu.key as AttributeKey, "disadvantage")}
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
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-purple-400" />
              Custom Dice Roller
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Dice Count */}
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Number of Dice</label>
              <Input
                type="number"
                min={1}
                value={diceCount}
                onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>

            {/* Dice Type */}
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Dice Type</label>
              <div className="flex gap-1">
                {[4, 6, 8, 10, 12, 20, 100].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiceType(d)}
                    className={cn(
                      "flex-1 py-2 rounded text-sm font-medium transition-colors",
                      diceType === d
                        ? "bg-amber-600 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    d{d}
                  </button>
                ))}
              </div>
            </div>

            {/* Roll Mode */}
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Roll Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRollMode("normal")}
                  className={cn(
                    "flex-1 py-2 rounded text-sm font-medium transition-colors",
                    rollMode === "normal"
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  Normal
                </button>
                <button
                  onClick={() => setRollMode("advantage")}
                  className={cn(
                    "flex-1 py-2 rounded text-sm font-medium transition-colors",
                    rollMode === "advantage"
                      ? "bg-emerald-600 text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  Advantage
                </button>
                <button
                  onClick={() => setRollMode("disadvantage")}
                  className={cn(
                    "flex-1 py-2 rounded text-sm font-medium transition-colors",
                    rollMode === "disadvantage"
                      ? "bg-red-600 text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  Disadvantage
                </button>
              </div>
            </div>

            {/* Modifier */}
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Modifier</label>
              <Input
                type="number"
                value={diceModifier}
                onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/20 border-white/10 text-white"
              />
            </div>

            {/* Roll Button */}
            <Button
              className="w-full bg-purple-600 hover:bg-purple-500"
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

      {/* Main container - optimized for 2.5k display */}
      <div className="relative z-10 h-screen p-4 md:p-6 lg:p-8 flex flex-col">
        {/* Header - Character Identity */}
        <header
          className={cn(
            "flex items-center justify-between mb-6 transition-opacity duration-700",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <span className="text-2xl font-bold text-amber-400">{character.name.charAt(0)}</span>
              </div>
              {/* XP Badge - Shows Total XP */}
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                {character.xp} XP
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-100 via-amber-200 to-orange-200 bg-clip-text text-transparent">
                {character.name}
              </h1>
              <p className="text-sm text-amber-400/60">
                {character.className}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/builder")}
            className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Character
          </Button>
        </header>

        {/* Main Grid Layout */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Column - Stats & XP (4 cols) */}
          <div
            className={cn(
              "col-span-4 flex flex-col gap-4 transition-opacity duration-700 delay-100",
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            )}
          >
            {/* Primary Stats - Large Cards */}
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(ATTR_LABELS) as AttributeKey[]).map((attr, idx) => {
                const value = character.stats[attr];
                const mod = getModifier(value);
                const isPrimary = character.primaryStat === attr;
                const color = ATTR_COLORS[attr];

                return (
                  <button
                    key={attr}
                    onClick={() => rollCheck(attr)}
                    onContextMenu={(e) => handleContextMenu(e, "stat", attr)}
                    disabled={!isReady}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border transition-transform duration-300 hover:scale-105",
                      "bg-gradient-to-b",
                      ATTR_GRADIENTS[attr],
                      isPrimary
                        ? "border-amber-500/40 shadow-lg shadow-amber-500/10"
                        : "border-white/10 hover:border-white/20"
                    )}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at center, ${color}15, transparent 70%)`,
                      }}
                    />

                    <div className="relative p-5 flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {ATTR_ICONS[attr]}
                      </div>

                      <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                        {ATTR_LABELS[attr]}
                      </p>

                      <p className="text-4xl font-bold text-white mb-1">{value}</p>

                      <p
                        className={cn(
                          "text-lg font-semibold",
                          mod >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {formatMod(mod)}
                      </p>

                      {isPrimary && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                      )}

                      <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dices className="w-4 h-4 text-white/40" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Armor & Initiative Row */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-white/10 bg-white/5 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Armor</p>
                      <p className="text-3xl font-bold text-white">{character.totalStartingArmor}</p>
                    </div>
                  </div>
                  {character.armorPieces.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap gap-1">
                        {character.armorPieces.map((a) => (
                          <Badge
                            key={a.name}
                            variant="outline"
                            className="text-[10px] border-white/10 bg-white/5 text-white/60"
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
                disabled={!isReady}
                className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-600/5 transition-transform hover:scale-105 hover:border-emerald-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-400/60 uppercase tracking-wider">Initiative</p>
                    <p className="text-3xl font-bold text-emerald-100">
                      {formatMod(getModifier(character.stats.athletics))}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Hit Die & Proficiency */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Hit Die</p>
                  <p className="text-2xl font-bold text-amber-400">d{character.hitDie}</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Proficiency</p>
                  <p className="text-2xl font-bold text-emerald-400">+{character.proficiencyBonus}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Middle Column - HP & Weapons (4 cols) */}
          <div
            className={cn(
              "col-span-4 flex flex-col gap-4 transition-opacity duration-700 delay-200",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {/* HP Card */}
            <Card className="border-white/10 bg-gradient-to-b from-white/10 to-white/5 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Hit Points</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{currentHp}</span>
                        <span className="text-lg text-white/40">/ {character.maxHp}</span>
                      </div>
                    </div>
                  </div>
                  {tempHp > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-cyan-400/60 uppercase tracking-wider">Temp</p>
                      <p className="text-2xl font-bold text-cyan-400">+{tempHp}</p>
                    </div>
                  )}
                </div>

                {/* HP Bar */}
                <div className="relative h-4 bg-black/40 rounded-full overflow-hidden mb-4">
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
                    className="h-8 text-xs font-medium border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-1"
                    onClick={() => applyDamage(10)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    10
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-1"
                    onClick={() => applyDamage(5)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    5
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-1"
                    onClick={() => applyDamage(2)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    2
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-1"
                    onClick={() => applyDamage(1)}
                  >
                    <Minus className="w-3 h-3 mr-0.5" />
                    1
                  </Button>
                  {/* Heal row - aligned */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 1, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 2, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    2
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-1"
                    onClick={() => setCurrentHp((prev) => Math.min(prev + 5, character.maxHp))}
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    5
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-1"
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
                    className="h-10 flex-1 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50"
                    value={hpInput}
                    onChange={(e) => setHpInput(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300"
                    onClick={handleDamage}
                    disabled={!hpInput}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300"
                    onClick={handleHeal}
                    disabled={!hpInput}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Temp HP Button */}
                <Button
                  variant="outline"
                  className="w-full h-9 mt-2 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 text-cyan-300"
                  onClick={handleAddTemp}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Temp HP
                </Button>
              </CardContent>
            </Card>

            {/* Weapons */}
            <Card className="border-white/10 bg-white/5 flex-1 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Sword className="w-3 h-3" />
                    Weapons
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        onClick={() => {
                          resetItemForm();
                          setNewItemType("weapon");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit" : "Add"} {newItemType === "weapon" ? "Weapon" : "Item"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Type</label>
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
                              className={newItemType === "item" ? "bg-blue-600" : ""}
                              onClick={() => setNewItemType("item")}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Item
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Name</label>
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={newItemType === "weapon" ? "Weapon name" : "Item name"}
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>

                        {newItemType === "weapon" && (
                          <>
                            <div>
                              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Damage Dice</label>
                              <Input
                                value={newWeaponDamage}
                                onChange={(e) => setNewWeaponDamage(e.target.value)}
                                placeholder="e.g., 1d8, 2d6"
                                className="bg-black/20 border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Modifier Attribute</label>
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
                              <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Custom Modifier (optional)</label>
                              <Input
                                type="number"
                                value={newWeaponCustomMod || ""}
                                onChange={(e) => setNewWeaponCustomMod(parseInt(e.target.value) || 0)}
                                placeholder="e.g., +2 or -1"
                                className="bg-black/20 border-white/10 text-white"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Quantity</label>
                          <Input
                            type="number"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-white/60 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                          <Input
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            placeholder="Brief description"
                            className="bg-black/20 border-white/10 text-white"
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
                    <p className="text-sm text-white/30 text-center py-4">No weapons</p>
                  ) : (
                    weapons.map((w) => {
                      const statMod = w.mod ? getModifier(character.stats[w.mod]) : 0;
                      const customMod = w.customMod || 0;
                      const totalMod = statMod + customMod;
                      const hasAnyMod = w.mod || customMod !== 0;
                      return (
                        <div
                          key={w.id}
                          className="group flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer"
                          onClick={() => startEditItem(w)}
                        >
                          <div>
                            <p className="font-medium text-white">{w.name}</p>
                            {hasAnyMod && (
                              <p className="text-xs text-white/40">
                                {w.mod && `${ATTR_LABELS[w.mod]} ${formatMod(statMod)}`}
                                {w.mod && customMod !== 0 && " + "}
                                {customMod !== 0 && `custom ${formatMod(customMod)}`}
                                {totalMod !== 0 && ` = ${formatMod(totalMod)}`}
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
                                rollDamage(w.name, w.damageDice!, totalMod);
                              }}
                              disabled={!isReady}
                            >
                              <Dices className="w-3 h-3 mr-1" />
                              {w.damageDice}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="border-white/10 text-white/60">
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

          {/* Right Column - Skills & Inventory (4 cols) */}
          <div
            className={cn(
              "col-span-4 flex flex-col gap-4 transition-opacity duration-700 delay-300",
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            )}
          >
            {/* Quick Actions */}
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Quick Rolls</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    onClick={() => setCustomDiceOpen(true)}
                  >
                    <Settings2 className="w-3 h-3 mr-1" />
                    Custom
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={rollInitiative}
                    disabled={!isReady}
                    className="group relative overflow-hidden rounded-xl p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-600/5 transition-transform hover:scale-105 hover:border-emerald-500/50"
                  >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Zap className="w-6 h-6 text-emerald-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-emerald-100">Initiative</p>
                    <p className="text-xs text-emerald-400/60">d20 + ATH</p>
                  </button>

                  <button
                    onClick={rollCharisma}
                    disabled={!isReady}
                    className="group relative overflow-hidden rounded-xl p-4 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-600/5 transition-transform hover:scale-105 hover:border-amber-500/50"
                  >
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-6 h-6 text-amber-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium text-amber-100">Charisma</p>
                    <p className="text-xs text-amber-400/60">d{character.charismaDie}</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Skills
                </p>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                  {character.skills.map((skill, idx) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-amber-500/30 hover:text-amber-200 transition-colors cursor-default"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card className="border-white/10 bg-white/5 flex-1 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Inventory
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
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
                    <p className="text-sm text-white/30 text-center py-4">No items</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        onClick={() => startEditItem(item)}
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-white">{item.name}</span>
                        </div>
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
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
              className="h-10 text-white/40 hover:text-white/60 hover:bg-white/5"
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
