"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CharacterClass } from "@/app/page";

interface ClassSelectorProps {
  classes: CharacterClass[];
  selectedClass?: CharacterClass;
  onSelect: (characterClass: CharacterClass) => void;
}

export function ClassSelector({ classes, selectedClass, onSelect }: ClassSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {classes.map((characterClass) => {
        const isSelected = selectedClass?.id === characterClass.id;

        return (
          <Card
            key={characterClass.id}
            className={cn(
              "cursor-pointer transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group",
              isSelected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                : "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            )}
            onClick={() => onSelect(characterClass)}
          >
            {/* Class Header with Gradient */}
            <div
              className={cn(
                "h-24 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
                characterClass.color
              )}
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
              </div>

              <span className="text-5xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                {characterClass.icon}
              </span>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-white/20 text-white border-0">
                    Selected
                  </Badge>
                </div>
              )}
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                {characterClass.name}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {characterClass.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Hit Die */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hit Die</span>
                <Badge variant="secondary">d{characterClass.hitDie}</Badge>
              </div>

              {/* Primary Stat */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Primary Ability</span>
                <Badge variant="outline" className="capitalize">
                  {characterClass.primaryStat}
                </Badge>
              </div>

              {/* Saving Throws */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Saving Throws</span>
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

              {/* Skills */}
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Class Skills</span>
                <div className="flex flex-wrap gap-1">
                  {characterClass.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                variant={isSelected ? "default" : "outline"}
                className="w-full"
                size="sm"
              >
                {isSelected ? "Selected" : "Select Class"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
