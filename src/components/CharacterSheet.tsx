"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type CharacterData = {
  name: string;
  class?: {
    name: string;
    hitDie: number;
    primaryStat: string;
    saves: string[];
    skills: string[];
    icon: string;
    color: string;
    description: string;
  };
  stats?: {
    strength: number;
    intelligence: number;
    athletics: number;
  };
  level: number;
  hitPoints?: number;
};

interface CharacterSheetProps {
  character: CharacterData;
  onReset: () => void;
}

const STAT_NAMES = [
  { key: "strength", label: "STR", fullName: "Strength" },
  { key: "intelligence", label: "INT", fullName: "Intelligence" },
  { key: "athletics", label: "ATH", fullName: "Athletics" },
] as const;

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

function getModifierString(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function CharacterSheet({ character, onReset }: CharacterSheetProps) {
  const { name, class: characterClass, stats, level, hitPoints } = character;

  if (!characterClass || !stats) {
    return null;
  }

  const proficiencyBonus = Math.floor((level - 1) / 4) + 2;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header with Class Gradient */}
      <div
        className={cn(
          "h-32 bg-gradient-to-br relative",
          characterClass.color
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex items-end gap-4">
            <span className="text-6xl">{characterClass.icon}</span>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{name}</h2>
              <p className="text-white/80">Level {level} {characterClass.name}</p>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* HP & Proficiency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Hit Points
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {hitPoints}
            </p>
            <p className="text-xs text-muted-foreground">
              d{characterClass.hitDie} + {characterClass.primaryStat.slice(0, 3).toUpperCase()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Proficiency
            </p>
            <p className="text-3xl font-bold text-primary">
              +{proficiencyBonus}
            </p>
            <p className="text-xs text-muted-foreground">
              Level {level}
            </p>
          </div>
        </div>

        {/* Ability Scores */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Ability Scores
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {STAT_NAMES.map((stat) => {
              const value = stats[stat.key];
              const mod = getModifier(value);
              const isPrimary = characterClass.primaryStat === stat.key;

              return (
                <div
                  key={stat.key}
                  className={cn(
                    "p-3 rounded-lg border text-center",
                    isPrimary
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/30 border-border/30"
                  )}
                >
                  <p className={cn(
                    "text-xs font-medium",
                    isPrimary ? "text-primary" : "text-muted-foreground"
                  )}>
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold">{value}</p>
                  <p className={cn(
                    "text-sm",
                    mod >= 0 ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {getModifierString(mod)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Class Features */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Class Features
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Hit Die</span>
              <Badge variant="secondary">d{characterClass.hitDie}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Primary Ability</span>
              <Badge variant="outline" className="capitalize">
                {characterClass.primaryStat}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Saves</span>
              <div className="flex gap-1">
                {characterClass.saves.map((save) => (
                  <Badge
                    key={save}
                    variant="secondary"
                    className="text-[10px] capitalize"
                  >
                    {save.slice(0, 3).toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Class Skills
          </h3>
          <div className="flex flex-wrap gap-1">
            {characterClass.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{characterClass.description}&rdquo;
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-1"
          >
            Create New Character
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              // Copy to clipboard or export functionality could go here
              const characterData = JSON.stringify(character, null, 2);
              navigator.clipboard.writeText(characterData);
              alert("Character data copied to clipboard!");
            }}
          >
            Export Character
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
