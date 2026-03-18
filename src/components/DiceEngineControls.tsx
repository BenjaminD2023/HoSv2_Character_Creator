"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDice } from "@/contexts";

export function DiceEngineControls() {
  const { restartDiceEngine, isRolling } = useDice();
  const [isRestarting, setIsRestarting] = useState(false);

  const onRestart = async () => {
    if (isRestarting) return;
    setIsRestarting(true);
    try {
      await restartDiceEngine();
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[90] pointer-events-auto">
      <Button
        variant="outline"
        size="sm"
        className="bg-background/95 backdrop-blur-sm border-border/70 shadow-2xl ring-1 ring-primary/30"
        onClick={onRestart}
        disabled={isRestarting}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {isRestarting ? "Restarting Dice..." : "Restart Dice Engine"}
      </Button>
    </div>
  );
}
