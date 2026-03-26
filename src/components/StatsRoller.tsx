"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDice } from "@/contexts";
import {
  ArrowRight,
  Sparkles,
  RotateCcw,
  Check,
  Sword,
  Brain,
  Zap,
  HelpCircle,
  Dices,
  Crown,
  Target,
} from "lucide-react";

interface StatsRollerProps {
  onStatsRolled: (stats: {
    strength: number;
    intelligence: number;
    athletics: number;
  }) => void;
  primaryStat?: string;
}

interface StatDefinition {
  key: "strength" | "intelligence" | "athletics";
  label: string;
  fullName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  glowColor: string;
}

const STATS: StatDefinition[] = [
  {
    key: "strength",
    label: "STR",
    fullName: "Strength",
    description: "Physical might and melee prowess",
    icon: <Sword className="w-5 h-5" />,
    color: "text-rose-300",
    gradient: "from-rose-600/80 to-red-700/80",
    glowColor: "shadow-rose-500/40",
  },
  {
    key: "intelligence",
    label: "INT",
    fullName: "Intelligence",
    description: "Arcane knowledge and mental acuity",
    icon: <Brain className="w-5 h-5" />,
    color: "text-violet-300",
    gradient: "from-violet-600/80 to-purple-700/80",
    glowColor: "shadow-violet-500/40",
  },
  {
    key: "athletics",
    label: "ATH",
    fullName: "Athletics",
    description: "Agility, stamina and ranged skill",
    icon: <Zap className="w-5 h-5" />,
    color: "text-emerald-300",
    gradient: "from-emerald-600/80 to-teal-700/80",
    glowColor: "shadow-emerald-500/40",
  },
];

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

function getModifierString(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getValueQuality(value: number): { label: string; color: string; gradient: string; glowColor: string } {
  if (value >= 16) return {
    label: "Legendary",
    color: "text-amber-300",
    gradient: "from-amber-500/30 via-orange-500/30 to-amber-500/30",
    glowColor: "shadow-amber-500/40"
  };
  if (value >= 14) return {
    label: "Exceptional",
    color: "text-cyan-300",
    gradient: "from-cyan-500/25 via-blue-500/25 to-cyan-500/25",
    glowColor: "shadow-cyan-500/35"
  };
  if (value >= 12) return {
    label: "Good",
    color: "text-emerald-300",
    gradient: "from-emerald-500/25 via-teal-500/25 to-emerald-500/25",
    glowColor: "shadow-emerald-500/35"
  };
  if (value >= 10) return {
    label: "Average",
    color: "text-slate-300",
    gradient: "from-slate-500/25 via-zinc-500/25 to-slate-500/25",
    glowColor: "shadow-slate-500/30"
  };
  return {
    label: "Poor",
    color: "text-red-300",
    gradient: "from-red-500/25 via-rose-500/25 to-red-500/25",
    glowColor: "shadow-red-500/35"
  };
}

function calculate4d6DropLowest(rolls: number[]): number {
  const sorted = [...rolls].sort((a, b) => b - a);
  return sorted[0] + sorted[1] + sorted[2];
}

export function StatsRoller({ onStatsRolled, primaryStat }: StatsRollerProps) {
  const [phase, setPhase] = useState<"initial" | "rolling" | "assigning" | "confirmed">("initial");
  const [rolledValues, setRolledValues] = useState<number[]>([]);
  const [assignedStats, setAssignedStats] = useState<Record<string, number | null>>({
    strength: null,
    intelligence: null,
    athletics: null,
  });
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const { isReady, rollDiceBatch } = useDice();

  const rollAllStats = async () => {
    if (!isReady) return;

    setPhase("rolling");
    setRolledValues([]);

    try {
      const batchResults = await rollDiceBatch([
        { notation: "4d6", options: { themeColor: "#E63946" } },
        { notation: "4d6", options: { themeColor: "#3A86FF" } },
        { notation: "4d6", options: { themeColor: "#2A9D2A" } },
      ]);

      const newValues: number[] = [];
      batchResults.forEach((resultGroup) => {
        if (resultGroup.length >= 4) {
          const rolls = resultGroup.map((r) => r.value);
          const value = calculate4d6DropLowest(rolls);
          newValues.push(value);
        } else {
          newValues.push(10);
        }
      });

      setRolledValues(newValues.sort((a, b) => b - a));
      setPhase("assigning");
    } catch (error) {
      console.error("Error rolling stats:", error);
      setPhase("initial");
    }
  };

  const handleValueSelect = (value: number) => {
    setSelectedValue(selectedValue === value ? null : value);
  };

  const handleStatAssign = (statKey: string) => {
    if (selectedValue === null) return;

    const currentAssignment = Object.entries(assignedStats).find(
      ([_, val]) => val === selectedValue
    );

    if (currentAssignment) {
      setAssignedStats((prev) => ({
        ...prev,
        [currentAssignment[0]]: null,
      }));
    }

    setAssignedStats((prev) => ({
      ...prev,
      [statKey]: selectedValue,
    }));
    setSelectedValue(null);
  };

  const handleClearStat = (statKey: string) => {
    setAssignedStats((prev) => ({
      ...prev,
      [statKey]: null,
    }));
  };

  const handleConfirm = () => {
    onStatsRolled({
      strength: assignedStats.strength!,
      intelligence: assignedStats.intelligence!,
      athletics: assignedStats.athletics!,
    });
    setPhase("confirmed");
  };

  const handleReset = () => {
    setPhase("initial");
    setRolledValues([]);
    setAssignedStats({
      strength: null,
      intelligence: null,
      athletics: null,
    });
    setSelectedValue(null);
  };

  const isAllAssigned = Object.values(assignedStats).every((v) => v !== null);
  const assignedCount = Object.values(assignedStats).filter((v) => v !== null).length;
  const assignedValues = Object.values(assignedStats).filter((v): v is number => v !== null);

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden fantasy-frame-premium">
        <div className="corner-flourish top-left" />
        <div className="corner-flourish top-right" />
        <div className="corner-flourish bottom-left" />
        <div className="corner-flourish bottom-right" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <CardHeader className="fantasy-header">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 shadow-lg shadow-amber-500/10"
            >
              <Dices className="w-7 h-7 text-amber-400" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-100 to-orange-200 bg-clip-text text-transparent">
                  Destiny Rolls
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-400">
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs bg-slate-900/95 border-white/10">
                    <p>Roll 4d6 for each ability, dropping the lowest die. Higher scores grant better modifiers to your rolls!</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="text-slate-400">
                {phase === "initial" && "The dice await your command"}
                {phase === "rolling" && "Fate is being decided..."}
                {phase === "assigning" && "Assign your destiny to your abilities"}
                {phase === "confirmed" && "Your fate is sealed"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 relative">
          <AnimatePresence mode="wait">
            {phase === "initial" && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12 space-y-8"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl"
                  />
                  <Button
                    onClick={rollAllStats}
                    disabled={!isReady}
                    size="lg"
                    className="btn-fantasy relative w-full max-w-sm h-24 text-xl shadow-2xl shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group disabled:opacity-50"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative flex flex-col items-center gap-1">
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="text-3xl"
                      >
                        <Dices className="w-8 h-8" />
                      </motion.span>
                      <span>{isReady ? "Roll Your Destiny" : "Summoning Dice..."}</span>
                    </span>
                  </Button>
                </div>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Roll 3 sets of 4d6 simultaneously. The lowest die from each set will be discarded.
                </p>
              </motion.div>
            )}

            {phase === "rolling" && (
              <motion.div
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 space-y-8"
              >
                <div className="flex justify-center gap-6">
                  {["Strength", "Intelligence", "Athletics"].map((stat, i) => (
                    <motion.div
                      key={stat}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                      className="relative"
                    >
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(245, 158, 11, 0.3)",
                            "0 0 40px rgba(245, 158, 11, 0.5)",
                            "0 0 20px rgba(245, 158, 11, 0.3)",
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={cn(
                          "w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2",
                          i === 0 && "bg-gradient-to-br from-rose-500/30 to-rose-600/30 border-rose-400/50",
                          i === 1 && "bg-gradient-to-br from-violet-500/30 to-violet-600/30 border-violet-400/50",
                          i === 2 && "bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border-emerald-400/50"
                        )}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Dices className="w-6 h-6 text-amber-400" />
                        </motion.div>
                      </motion.div>
                      <p className="text-xs text-center mt-2 text-slate-400 font-medium">{stat}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-center text-amber-400/80 text-lg font-medium"
                >
                  The dice tumble through the void...
                </motion.p>
              </motion.div>
            )}

            {phase === "assigning" && (
              <motion.div
                key="assigning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Rolled Values
                      </h3>
                    </div>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border border-slate-700">
                      {3 - assignedCount} to assign
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {rolledValues.map((value, index) => {
                      const isAssigned = assignedValues.includes(value);
                      const isSelected = selectedValue === value;
                      const quality = getValueQuality(value);

                      return (
                        <Tooltip key={`${value}-${index}`}>
                          <TooltipTrigger asChild>
                            <motion.button
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                              whileHover={!isAssigned ? { scale: 1.05, rotate: 2 } : {}}
                              whileTap={!isAssigned ? { scale: 0.95 } : {}}
                              onClick={() => !isAssigned && handleValueSelect(value)}
                              disabled={isAssigned}
                              className={cn(
                                "relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2",
                                isAssigned
                                  ? "bg-slate-800/50 border-slate-700/50 opacity-40 cursor-not-allowed"
                                  : isSelected
                                  ? cn(
                                      "bg-gradient-to-br scale-110 shadow-2xl z-10",
                                      quality.gradient,
                                      "border-white/60",
                                      quality.glowColor
                                    )
                                  : cn(
                                      "bg-gradient-to-br border cursor-pointer hover:shadow-lg",
                                      quality.gradient,
                                      "border-white/10 hover:border-white/40 hover:scale-105"
                                    )
                              )}
                            >
                              <span className={cn("text-4xl font-bold", quality.color)}>{value}</span>
                              <span className={cn("text-xs font-medium mt-1", quality.color)}>{quality.label}</span>
                              {isAssigned && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-full h-0.5 bg-slate-500/50 rotate-45" />
                                </div>
                              )}
                              {isSelected && (
                                <>
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50"
                                  >
                                    <ArrowRight className="w-3 h-3 text-white" />
                                  </motion.div>
                                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400/60 rounded-tl" />
                                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400/60 rounded-tr" />
                                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400/60 rounded-bl" />
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400/60 rounded-br" />
                                </>
                              )}
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900/95 border-white/10">
                            <p>{quality.label} value - Click to assign</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                  {selectedValue && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-center text-amber-400 font-medium"
                    >
                      Select an ability below to assign this value
                    </motion.p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Abilities
                    </h3>
                  </div>
                  <div className="grid gap-4">
                    {STATS.map((stat) => {
                      const assignedValue = assignedStats[stat.key];
                      const isPrimary = primaryStat === stat.key;
                      const isClickable = selectedValue !== null && assignedValue === null;

                      return (
                        <Tooltip key={stat.key}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={isClickable ? { scale: 1.01 } : {}}
                              onClick={() => isClickable && handleStatAssign(stat.key)}
                              className={cn(
                                "relative group rounded-xl border-2 transition-all duration-300 overflow-hidden cursor-default",
                                assignedValue
                                  ? "bg-slate-800/50 border-slate-700/50"
                                  : isClickable
                                  ? "bg-amber-500/10 border-amber-500/50 cursor-pointer hover:bg-amber-500/20 shadow-lg shadow-amber-500/10"
                                  : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50"
                              )}
                            >
                              {isPrimary && (
                                <div
                                  className={cn(
                                    "absolute inset-0 opacity-10 bg-gradient-to-r",
                                    stat.gradient
                                  )}
                                />
                              )}

                              <div className="relative p-5 flex items-center gap-5">
                                <motion.div
                                  whileHover={{ rotate: 10 }}
                                  className={cn(
                                    "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg transition-all duration-300",
                                    stat.gradient,
                                    stat.glowColor
                                  )}
                                >
                                  {stat.icon}
                                </motion.div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-slate-100">{stat.label}</span>
                                    <span className="text-sm text-slate-400">{stat.fullName}</span>
                                    {isPrimary && (
                                      <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">{stat.description}</p>
                                </div>

                                {assignedValue ? (
                                  <div className="text-right">
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <p className={cn("text-3xl font-bold", getValueQuality(assignedValue).color)}>
                                          {assignedValue}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                          {getModifierString(getModifier(assignedValue))}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClearStat(stat.key);
                                        }}
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={cn(
                                      "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300",
                                      isClickable
                                        ? "bg-amber-500 text-amber-950 border-amber-400 shadow-md"
                                        : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                                    )}
                                  >
                                    {isClickable ? "Click to Assign" : "Awaiting..."}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-slate-900/95 border-white/10">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-200">{stat.fullName}</p>
                              <p className="text-xs text-slate-400">{stat.description}</p>
                              {assignedValue && (
                                <p className="text-xs text-amber-400">Modifier: {getModifierString(getModifier(assignedValue))}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 h-14 border-slate-600/50 hover:bg-slate-800/50 hover:border-slate-500/50 text-slate-300 transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Roll Again
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!isAllAssigned}
                    className={cn(
                      "flex-1 h-14 font-semibold text-lg transition-all duration-300",
                      isAllAssigned
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                        : "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {isAllAssigned ? "Seal Fate" : `${assignedCount}/3 Assigned`}
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === "confirmed" && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-3 gap-4">
                  {STATS.map((stat, index) => {
                    const value = assignedStats[stat.key]!;
                    const isPrimary = primaryStat === stat.key;
                    const quality = getValueQuality(value);

                    return (
                      <motion.div
                        key={stat.key}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                      >
                        <div
                          className={cn(
                            "relative p-6 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-105 cursor-default",
                            isPrimary
                              ? "bg-gradient-to-b from-amber-500/20 to-amber-600/10 border-amber-500/50 shadow-lg shadow-amber-500/20"
                              : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50"
                          )}
                        >
                          {isPrimary && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-amber-500 text-amber-950">
                              Primary
                            </Badge>
                          )}
                          <div
                            className={cn(
                              "mx-auto w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3 shadow-lg",
                              stat.gradient,
                              stat.glowColor
                            )}
                          >
                            {stat.icon}
                          </div>
                          <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
                          <p className={cn("text-4xl font-bold", quality.color)}>{value}</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {getModifierString(getModifier(value))}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/30 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold text-lg">Fate Sealed!</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-emerald-300/70">
                    Your abilities have been woven into the fabric of your destiny.
                  </p>
                </motion.div>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full h-14 border-slate-600/50 hover:bg-slate-800/50 text-slate-300 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Begin Anew
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
