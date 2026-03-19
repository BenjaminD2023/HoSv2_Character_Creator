"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDice } from "@/contexts";
import { DiceCanvas } from "@/components/DiceCanvas";
import { ArrowRight, Sparkles, RotateCcw, Check, Sword, Brain, Zap } from "lucide-react";

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
  glowColor: string;
}

const STATS: StatDefinition[] = [
  {
    key: "strength",
    label: "STR",
    fullName: "Strength",
    description: "Physical power & melee combat",
    icon: <Sword className="w-5 h-5" />,
    color: "from-rose-500 to-orange-600",
    glowColor: "shadow-rose-500/50",
  },
  {
    key: "intelligence",
    label: "INT",
    fullName: "Intelligence",
    description: "Mental acuity & arcane knowledge",
    icon: <Brain className="w-5 h-5" />,
    color: "from-cyan-500 to-blue-600",
    glowColor: "shadow-cyan-500/50",
  },
  {
    key: "athletics",
    label: "ATH",
    fullName: "Athletics",
    description: "Agility, stamina & ranged combat",
    icon: <Zap className="w-5 h-5" />,
    color: "from-emerald-500 to-teal-600",
    glowColor: "shadow-emerald-500/50",
  },
];

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

function getModifierString(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getValueQuality(value: number): { label: string; color: string; bgColor: string; glowColor: string } {
  if (value >= 16) return { label: "Legendary", color: "text-amber-300", bgColor: "bg-amber-500/20", glowColor: "shadow-amber-500/50" };
  if (value >= 14) return { label: "Exceptional", color: "text-emerald-300", bgColor: "bg-emerald-500/20", glowColor: "shadow-emerald-500/50" };
  if (value >= 12) return { label: "Good", color: "text-cyan-300", bgColor: "bg-cyan-500/20", glowColor: "shadow-cyan-500/50" };
  if (value >= 10) return { label: "Average", color: "text-slate-300", bgColor: "bg-slate-500/20", glowColor: "shadow-slate-500/50" };
  return { label: "Poor", color: "text-orange-300", bgColor: "bg-orange-500/20", glowColor: "shadow-orange-500/50" };
}

// Calculate 4d6 drop lowest from individual rolls
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
  const [rollingStatIndex, setRollingStatIndex] = useState<number | null>(null);
  const [showDice, setShowDice] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const { isReady, rollDice } = useDice();

  const rollAllStats = async () => {
    if (!isReady) return;

    setPhase("rolling");
    setShowDice(true);
    setRolledValues([]);
    const newValues: number[] = [];

    try {
      // Roll 6 values (3 stats + 3 extras to choose from)
      for (let i = 0; i < 6; i++) {
        setRollingStatIndex(i);
        const results = await rollDice("4d6");

        if (results.length >= 4) {
          const rolls = results.map((r) => r.value);
          const value = calculate4d6DropLowest(rolls);
          newValues.push(value);
        } else {
          newValues.push(10);
        }

        // Small delay for visual effect
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setRolledValues(newValues.sort((a, b) => b - a));
      setPhase("assigning");
      setRollingStatIndex(null);

      // Keep dice visible for a moment
      setTimeout(() => {
        setShowDice(false);
      }, 1500);
    } catch (error) {
      console.error("Error rolling stats:", error);
      setPhase("initial");
    }
  };

  const handleValueSelect = (value: number) => {
    if (selectedValue === value) {
      setSelectedValue(null);
    } else {
      setSelectedValue(value);
    }
  };

  const handleStatAssign = (statKey: string) => {
    if (selectedValue === null) return;

    // Check if this value is already assigned elsewhere
    const currentAssignment = Object.entries(assignedStats).find(
      ([_, val]) => val === selectedValue
    );

    if (currentAssignment) {
      // Remove from current assignment
      setAssignedStats((prev) => ({
        ...prev,
        [currentAssignment[0]]: null,
      }));
    }

    // Assign to new stat
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

  // Get assigned values for filtering
  const assignedValues = Object.values(assignedStats).filter((v): v is number => v !== null);

  return (
    <Card className="border-border/50 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <DiceCanvas
        visible={showDice}
        onClose={() => {
          if (phase !== "rolling") {
            setShowDice(false);
          }
        }}
      />

      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Ability Scores</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {phase === "initial" && "Roll 4d6 drop lowest for each ability"}
              {phase === "rolling" && "Rolling your destiny..."}
              {phase === "assigning" && "Assign your rolled values to abilities"}
              {phase === "confirmed" && "Stats confirmed!"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        {/* Initial Phase - Roll Button */}
        {phase === "initial" && (
          <div className="text-center py-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Button
                onClick={rollAllStats}
                disabled={!isReady}
                size="lg"
                className="relative w-full max-w-sm h-20 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🎲</span>
                  {isReady ? "Roll Ability Scores" : "Loading Dice..."}
                </span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Roll 6 sets of 4d6, dropping the lowest die each time. Then assign the best 3 to your abilities.
            </p>
          </div>
        )}

        {/* Rolling Phase - Show progress */}
        {phase === "rolling" && (
          <div className="py-8 space-y-6">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300",
                    i < rolledValues.length
                      ? "bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/50 text-emerald-300"
                      : i === rollingStatIndex
                      ? "bg-primary/30 border border-primary/50 animate-pulse"
                      : "bg-secondary/50 border border-border/50 text-muted-foreground"
                  )}
                >
                  {i < rolledValues.length ? rolledValues[i] : "?"}
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground animate-pulse">
              Rolling... {rolledValues.length}/6 complete
            </p>
          </div>
        )}

        {/* Assigning Phase */}
        {phase === "assigning" && (
          <div className="space-y-6">
            {/* Rolled Values Pool */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Available Values
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {3 - assignedCount} remaining
                </Badge>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {rolledValues.map((value, index) => {
                  const isAssigned = assignedValues.includes(value);
                  const isSelected = selectedValue === value;
                  const quality = getValueQuality(value);

                  return (
                    <button
                      key={`${value}-${index}`}
                      onClick={() => !isAssigned && handleValueSelect(value)}
                      disabled={isAssigned}
                      className={cn(
                        "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200",
                        isAssigned
                          ? "bg-secondary/30 border border-border/30 opacity-40"
                          : isSelected
                          ? cn(
                              "bg-gradient-to-br border-2 scale-110 shadow-lg",
                              quality.bgColor,
                              "border-white/50",
                              quality.glowColor
                            )
                          : cn(
                              "bg-gradient-to-br border hover:scale-105 cursor-pointer",
                              quality.bgColor,
                              "border-white/10 hover:border-white/30"
                            )
                      )}
                    >
                      <span className={cn("text-2xl font-bold", quality.color)}>{value}</span>
                      {isAssigned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-muted-foreground/50 rotate-45" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <ArrowRight className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedValue && (
                <p className="text-xs text-center text-primary animate-pulse">
                  Click an ability below to assign this value
                </p>
              )}
            </div>

            {/* Stats Assignment */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Abilities
              </h3>
              <div className="grid gap-3">
                {STATS.map((stat) => {
                  const assignedValue = assignedStats[stat.key];
                  const isPrimary = primaryStat === stat.key;
                  const isClickable = selectedValue !== null && assignedValue === null;

                  return (
                    <div
                      key={stat.key}
                      onClick={() => isClickable && handleStatAssign(stat.key)}
                      className={cn(
                        "relative group rounded-xl border transition-all duration-300 overflow-hidden",
                        assignedValue
                          ? "bg-secondary/50 border-border/50"
                          : isClickable
                          ? "bg-primary/5 border-primary/50 cursor-pointer hover:bg-primary/10 animate-pulse"
                          : "bg-secondary/30 border-border/30"
                      )}
                    >
                      {/* Background gradient for primary stat */}
                      {isPrimary && (
                        <div
                          className={cn(
                            "absolute inset-0 opacity-10 bg-gradient-to-r",
                            stat.color
                          )}
                        />
                      )}

                      <div className="relative p-4 flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            "p-3 rounded-lg bg-gradient-to-br text-white shadow-lg transition-transform",
                            stat.color,
                            stat.glowColor,
                            assignedValue ? "scale-100" : "scale-90 opacity-70"
                          )}
                        >
                          {stat.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{stat.label}</span>
                            <span className="text-sm text-muted-foreground">{stat.fullName}</span>
                            {isPrimary && (
                              <Badge
                                variant="default"
                                className="text-[10px] bg-primary text-primary-foreground"
                              >
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </div>

                        {/* Value Display */}
                        {assignedValue ? (
                          <div className="text-right">
                            <div className="flex items-center gap-3">
                              <div>
                                <p
                                  className={cn(
                                    "text-3xl font-bold",
                                    getValueQuality(assignedValue).color
                                  )}
                                >
                                  {assignedValue}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {getModifierString(getModifier(assignedValue))}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                              isClickable
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary/50 border-border/50 text-muted-foreground"
                            )}
                          >
                            {isClickable ? "Click to Assign" : "Waiting..."}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 h-12 border-border/50 hover:bg-secondary/50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Re-roll All
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!isAllAssigned}
                className={cn(
                  "flex-1 h-12 font-semibold transition-all",
                  isAllAssigned
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <Check className="w-4 h-4 mr-2" />
                {isAllAssigned ? "Confirm Stats" : `${assignedCount}/3 Assigned`}
              </Button>
            </div>
          </div>
        )}

        {/* Confirmed Phase */}
        {phase === "confirmed" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {STATS.map((stat) => {
                const value = assignedStats[stat.key]!;
                const isPrimary = primaryStat === stat.key;
                const quality = getValueQuality(value);

                return (
                  <div
                    key={stat.key}
                    className={cn(
                      "relative p-4 rounded-xl border text-center transition-all",
                      isPrimary
                        ? "bg-gradient-to-b from-primary/20 to-primary/5 border-primary/50"
                        : "bg-secondary/30 border-border/30"
                    )}
                  >
                    {isPrimary && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-primary">
                        Primary
                      </Badge>
                    )}
                    <div
                      className={cn(
                        "mx-auto w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-2 shadow-lg",
                        stat.color,
                        stat.glowColor
                      )}
                    >
                      {stat.icon}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className={cn("text-3xl font-bold", quality.color)}>{value}</p>
                    <p className="text-sm text-muted-foreground">
                      {getModifierString(getModifier(value))}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Stats confirmed!</span>
              </div>
              <p className="text-sm text-emerald-300/70 mt-1">
                Your character&apos;s abilities have been set.
              </p>
            </div>

            <Button variant="outline" onClick={handleReset} className="w-full h-12 border-border/50">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
