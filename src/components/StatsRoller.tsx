"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDice } from "@/contexts";
import { DiceCanvas } from "@/components/DiceCanvas";

interface StatsRollerProps {
  onStatsRolled: (stats: {
    strength: number;
    intelligence: number;
    athletics: number;
  }) => void;
  primaryStat?: string;
}

const STAT_NAMES = [
  { key: "strength", label: "STR", fullName: "Strength", description: "Physical power and melee combat" },
  { key: "intelligence", label: "INT", fullName: "Intelligence", description: "Mental acuity and arcane knowledge" },
  { key: "athletics", label: "ATH", fullName: "Athletics", description: "Agility, stamina, and ranged combat" },
] as const;

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

function getModifierString(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Calculate 4d6 drop lowest from individual rolls
function calculate4d6DropLowest(rolls: number[]): number {
  const sorted = [...rolls].sort((a, b) => b - a);
  return sorted[0] + sorted[1] + sorted[2];
}

export function StatsRoller({ onStatsRolled, primaryStat }: StatsRollerProps) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollingStat, setRollingStat] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const { isReady, rollDice } = useDice();

  const rollStat = useCallback(async (statKey: string): Promise<number> => {
    setRollingStat(statKey);

    // Roll 4d6 using the 3D dice
    const results = await rollDice("4d6");

    if (results.length < 4) {
      console.warn("Dice roll returned insufficient results:", results);
      setRollingStat(null);
      return 10;
    }

    // Calculate 4d6 drop lowest
    const rolls = results.map(r => r.value);
    const value = calculate4d6DropLowest(rolls);

    setRollingStat(null);
    return value;
  }, [rollDice]);

  const rollAllStats = async () => {
    if (!isReady) {
      console.warn("Dice box not ready yet");
      return;
    }

    setRolling(true);
    setConfirmed(false);
    setShowDice(true);
    const newStats: Record<string, number> = {};

    try {
      // Roll each stat sequentially with a delay between each
      for (const stat of STAT_NAMES) {
        newStats[stat.key] = await rollStat(stat.key);
        // Small delay between rolls for visual effect
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setStats(newStats);

      // Keep dice visible for a moment, then hide
      setTimeout(() => {
        if (!confirmed) {
          setShowDice(false);
        }
      }, 2000);
    } finally {
      setRolling(false);
      setRollingStat(null);
    }
  };

  const confirmStats = () => {
    if (stats) {
      onStatsRolled({
        strength: stats.strength,
        intelligence: stats.intelligence,
        athletics: stats.athletics,
      });
      setConfirmed(true);
      setShowDice(false);
    }
  };

  const getTotalPoints = () => {
    if (!stats) return 0;
    return Object.values(stats).reduce((a, b) => a + b, 0);
  };

  const getStatQuality = (value: number) => {
    if (value >= 16) return { label: "Exceptional", color: "text-emerald-400" };
    if (value >= 14) return { label: "Good", color: "text-blue-400" };
    if (value >= 12) return { label: "Above Average", color: "text-cyan-400" };
    if (value >= 10) return { label: "Average", color: "text-muted-foreground" };
    return { label: "Below Average", color: "text-orange-400" };
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      {/* 3D Dice Canvas */}
      <DiceCanvas
        visible={showDice || rolling}
        onClose={() => {
          if (!rolling) {
            setShowDice(false);
          }
        }}
      />

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          Ability Scores
        </CardTitle>
        <CardDescription>
          Roll 4d6 and drop the lowest die for each ability score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Roll Button */}
        {!stats && (
          <Button
            onClick={rollAllStats}
            disabled={rolling || !isReady}
            className="w-full h-16 text-lg font-bold"
            size="lg"
          >
            {rolling ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🎲</span>
                Rolling...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🎲</span>
                {isReady ? "Roll All Stats" : "Loading Dice..."}
              </span>
            )}
          </Button>
        )}

        {/* Stats Display */}
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {STAT_NAMES.map((stat) => {
                const value = stats[stat.key];
                const mod = getModifier(value);
                const quality = getStatQuality(value);
                const isRolling = rollingStat === stat.key;
                const isPrimary = primaryStat === stat.key;

                return (
                  <div
                    key={stat.key}
                    className={cn(
                      "relative p-4 rounded-lg border transition-all",
                      isPrimary
                        ? "bg-primary/10 border-primary/50"
                        : "bg-secondary/50 border-border/50",
                      isRolling && "animate-pulse"
                    )}
                  >
                    {isPrimary && (
                      <Badge
                        variant="default"
                        className="absolute -top-2 -right-2 text-[10px]"
                      >
                        Primary
                      </Badge>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{stat.label}</p>
                        <p className="text-xs text-muted-foreground">{stat.fullName}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-3xl font-bold",
                          isRolling ? "blur-sm" : quality.color
                        )}>
                          {value}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {getModifierString(mod)}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={(value / 18) * 100}
                      className="mt-2 h-1"
                    />
                  </div>
                );
              })}
            </div>

            {/* Total Points */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Points</span>
                <span className="text-2xl font-bold">{getTotalPoints()}</span>
              </div>
              <div className="mt-2">
                <Progress
                  value={(getTotalPoints() / 108) * 100}
                  className="h-2"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {!confirmed && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDice(true);
                    rollAllStats();
                  }}
                  disabled={rolling}
                  className="flex-1"
                >
                  🎲 Re-roll All
                </Button>
                <Button
                  onClick={confirmStats}
                  disabled={rolling}
                  className="flex-1"
                >
                  ✓ Confirm Stats
                </Button>
              </div>
            )}

            {confirmed && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 text-center">
                <p className="text-emerald-400 font-medium">
                  ✓ Stats confirmed! View your character sheet.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
