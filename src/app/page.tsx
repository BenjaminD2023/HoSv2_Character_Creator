"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatsRoller } from "@/components/StatsRoller";
import { ClassSelector } from "@/components/ClassSelector";
import { CharacterSheet } from "@/components/CharacterSheet";

export type CharacterClass = {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  primaryStat: string;
  saves: string[];
  skills: string[];
  icon: string;
  color: string;
};

export type CharacterStats = {
  strength: number;
  intelligence: number;
  athletics: number;
};

export type CharacterData = {
  name: string;
  class?: CharacterClass;
  stats?: CharacterStats;
  level: number;
  hitPoints?: number;
};

const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: "fighter",
    name: "Fighter",
    description: "Masters of martial combat, skilled with all manner of weapons and armor. They are the frontline warriors who protect their allies.",
    hitDie: 10,
    primaryStat: "strength",
    saves: ["strength", "athletics"],
    skills: ["Combat", "Defense", "Tactics", "Endurance"],
    icon: "⚔️",
    color: "from-red-700 to-rose-900",
  },
  {
    id: "archer",
    name: "Archer",
    description: "Expert marksmen who strike from a distance with deadly precision. They prefer to eliminate threats before they can close in.",
    hitDie: 8,
    primaryStat: "athletics",
    saves: ["athletics", "intelligence"],
    skills: ["Marksmanship", "Stealth", "Tracking", "Survival"],
    icon: "🏹",
    color: "from-green-700 to-emerald-900",
  },
  {
    id: "wizard",
    name: "Wizard",
    description: "Scholars of arcane magic who wield powerful spells. Their vast knowledge makes them formidable opponents.",
    hitDie: 6,
    primaryStat: "intelligence",
    saves: ["intelligence", "athletics"],
    skills: ["Arcana", "Spellcasting", "Lore", "Alchemy"],
    icon: "🔮",
    color: "from-purple-700 to-violet-900",
  },
  {
    id: "priest",
    name: "Priest",
    description: "Devoted servants of divine powers who channel holy magic to heal allies and smite enemies.",
    hitDie: 8,
    primaryStat: "intelligence",
    saves: ["intelligence", "strength"],
    skills: ["Divine Magic", "Healing", "Religion", "Leadership"],
    icon: "🕯️",
    color: "from-amber-700 to-orange-900",
  },
  {
    id: "bard",
    name: "Bard",
    description: "Wandering performers who use music, storytelling, and charm to inspire allies and manipulate foes.",
    hitDie: 8,
    primaryStat: "athletics",
    saves: ["athletics", "intelligence"],
    skills: ["Performance", "Persuasion", "Lore", "Streetwise"],
    icon: "🎵",
    color: "from-pink-700 to-rose-900",
  },
];

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [character, setCharacter] = useState<CharacterData>({
    name: "",
    level: 1,
  });

  const handleNameChange = (name: string) => {
    setCharacter((prev) => ({ ...prev, name }));
  };

  const handleClassSelect = (characterClass: CharacterClass) => {
    setCharacter((prev) => ({ ...prev, class: characterClass }));
  };

  const handleStatsRolled = (stats: CharacterStats) => {
    // House of Shadows: HP = Hit Die + modifier based on class's primary stat
    const primaryStat = character.class?.primaryStat;
    let modifier = 0;

    if (primaryStat === "strength") {
      modifier = Math.floor((stats.strength - 10) / 2);
    } else if (primaryStat === "athletics") {
      modifier = Math.floor((stats.athletics - 10) / 2);
    } else if (primaryStat === "intelligence") {
      modifier = Math.floor((stats.intelligence - 10) / 2);
    }

    const hitDie = character.class?.hitDie || 8;
    const hitPoints = hitDie + Math.max(0, modifier);

    setCharacter((prev) => ({
      ...prev,
      stats,
      hitPoints,
    }));
  };

  const handleReset = () => {
    setCharacter({
      name: "",
      level: 1,
    });
    setStep(1);
  };

  const canProceedToStep2 = character.name.trim().length > 0;
  const canProceedToStep3 = character.class !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-900 flex items-center justify-center animate-pulse-glow">
              <span className="text-xl">🌑</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight glow-text">
                House of Shadows
              </h1>
              <p className="text-xs text-muted-foreground">Character Creator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={step >= 1 ? "default" : "secondary"} className="cursor-pointer" onClick={() => setStep(1)}>
                1. Identity
              </Badge>
              <div className="w-4 h-px bg-border" />
              <Badge variant={step >= 2 ? "default" : "secondary"} className={canProceedToStep2 ? "cursor-pointer" : "opacity-50"} onClick={() => canProceedToStep2 && setStep(2)}>
                2. Class
              </Badge>
              <div className="w-4 h-px bg-border" />
              <Badge variant={step >= 3 ? "default" : "secondary"} className={canProceedToStep3 ? "cursor-pointer" : "opacity-50"} onClick={() => canProceedToStep3 && setStep(3)}>
                3. Stats
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Step 1: Name & Identity */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold glow-text">Who are you?</h2>
              <p className="text-muted-foreground">Enter your character&apos;s name to begin their dark journey.</p>
            </div>

            <Card className="max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Character Name</CardTitle>
                <CardDescription>
                  Choose a name worthy of the shadows...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter name..."
                  value={character.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="w-full"
                  size="lg"
                >
                  Continue to Class Selection
                </Button>
              </CardContent>
            </Card>

            {/* Quick name suggestions */}
            <div className="max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-2">Suggested names:</p>
              <div className="flex flex-wrap gap-2">
                {["Malachar", "Vespera", "Thorne", "Seraphine", "Grimwald", "Noctis", "Morgath", "Lilith"].map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleNameChange(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Class Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold glow-text">Choose Your Path</h2>
                <p className="text-muted-foreground">
                  Welcome, <span className="text-primary font-medium">{character.name}</span>. Select your calling...
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>

            <ClassSelector
              classes={CHARACTER_CLASSES}
              selectedClass={character.class}
              onSelect={handleClassSelect}
            />

            {character.class && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(3)} size="lg">
                  Continue to Stats
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Stats & Finalize */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold glow-text">Forge Your Stats</h2>
                <p className="text-muted-foreground">
                  Roll the dice to determine your character&apos;s abilities.
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatsRoller
                onStatsRolled={handleStatsRolled}
                primaryStat={character.class?.primaryStat}
              />

              {character.stats && (
                <CharacterSheet
                  character={character}
                  onReset={handleReset}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>House of Shadows RPG &copy; 2024 - Enter the darkness</p>
        </div>
      </footer>
    </div>
  );
}
