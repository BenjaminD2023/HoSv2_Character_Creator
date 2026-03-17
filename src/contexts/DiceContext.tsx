"use client";

import React, { createContext, useContext, useRef, useState, useCallback } from "react";

interface DiceResult {
  value: number;
  modifier?: number;
}

interface DiceRollValue {
  value: number;
}

interface DiceBoxInstance {
  init: () => Promise<void>;
  roll: (notation: string) => Promise<DiceRollValue[]>;
  show?: () => void;
}

type DiceBoxConstructor = new (config: Record<string, unknown>) => DiceBoxInstance;
type DiceBoxModule = {
  default?: DiceBoxConstructor;
  DiceBox?: DiceBoxConstructor;
};

interface DiceContextType {
  isReady: boolean;
  isRolling: boolean;
  isError: boolean;
  error: string | null;
  results: Map<string, DiceResult>;
  rollDice: (notation: string, callback?: (results: DiceResult[]) => void) => Promise<DiceResult[]>;
  initDiceBox: (canvasContainer: HTMLDivElement) => Promise<void>;
}

const DiceContext = createContext<DiceContextType | null>(null);

// Track initialization state across Strict Mode remounts
let isInitializing = false;

function syncDiceCanvasSize(container: HTMLDivElement | null) {
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  if (width <= 0 || height <= 0) return;

  const canvases = container.querySelectorAll("canvas");
  canvases.forEach((canvas) => {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  });
}

export function DiceProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Map<string, DiceResult>>(new Map());
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);

  const initDiceBox = useCallback(async (canvasContainer: HTMLDivElement) => {
    // Prevent double initialization from React Strict Mode
    if (diceBoxRef.current || isInitializing) {
      console.log("DiceBox initialization skipped - already initialized or in progress");
      return;
    }

    isInitializing = true;

    try {
      console.log("Starting DiceBox initialization...");

      // Dynamic import to avoid SSR issues
      const diceBoxModule = await import("@3d-dice/dice-box");
      const DiceBox = diceBoxModule.default ?? (diceBoxModule as unknown as { DiceBox: unknown }).DiceBox;

      if (!DiceBox) {
        throw new Error("DiceBox constructor was not found in @3d-dice/dice-box module");
      }

      // Ensure container has dimensions
      const rect = canvasContainer.getBoundingClientRect();
      console.log("Container dimensions:", rect.width, "x", rect.height);

      if (rect.width === 0 || rect.height === 0) {
        console.warn("Canvas container has zero dimensions, delaying initialization");
        // Delay and retry
        setTimeout(() => {
          initDiceBox(canvasContainer);
        }, 100);
        return;
      }

      const config = {
        assetPath: "/assets/dice-box/",
        gravity: 1,
        startPosition: { x: 0, y: 10, z: 0 },
        throwForce: 8,
        spinForce: 15,
        scale: 6,
        theme: "diceOfRolling",
        themeColor: "#8b0000",
        offscreen: false,
        onRollComplete: (rollResults: unknown[]) => {
          console.log("Roll complete:", rollResults);
        },
      };

      const diceBox = new DiceBox("#dice-box-container", config);

      console.log("DiceBox instance created, calling init()...");
      await diceBox.init();
      console.log("DiceBox initialized successfully");

      syncDiceCanvasSize(canvasContainer);
      requestAnimationFrame(() => syncDiceCanvasSize(canvasContainer));

      window.dispatchEvent(new Event("resize"));

      if (typeof diceBox.show === "function") {
        diceBox.show();
      }

      diceBoxRef.current = diceBox;
      setIsReady(true);
      setIsError(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to initialize dice box:", err);
      setIsError(true);
      setError(`Failed to initialize dice: ${errorMessage}`);
    } finally {
      isInitializing = false;
    }
  }, []);

  const rollDice = useCallback(
    async (notation: string, callback?: (results: DiceResult[]) => void): Promise<DiceResult[]> => {
      if (!diceBoxRef.current || isRolling) return [];

      setIsRolling(true);

      try {
        const canvasContainer = document.getElementById("dice-box-container") as HTMLDivElement | null;
        syncDiceCanvasSize(canvasContainer);

        if (typeof diceBoxRef.current.show === "function") {
          diceBoxRef.current.show();
        }

        const rollResult = await diceBoxRef.current.roll(notation);

        // Parse results - dice-box returns an array of roll results
        const parsedResults: DiceResult[] = rollResult.map((roll) => ({
          value: roll.value,
        }));

        // Update results map with timestamp as key
        const newResults = new Map(results);
        newResults.set(Date.now().toString(), parsedResults[0] || { value: 0 });
        setResults(newResults);

        if (callback) {
          callback(parsedResults);
        }

        return parsedResults;
      } catch (error) {
        console.error("Roll failed:", error);
        return [];
      } finally {
        setIsRolling(false);
      }
    },
    [isRolling, results]
  );

  return (
    <DiceContext.Provider value={{ isReady, isRolling, isError, error, results, rollDice, initDiceBox }}>
      {children}
    </DiceContext.Provider>
  );
}

export function useDice() {
  const context = useContext(DiceContext);
  if (!context) {
    throw new Error("useDice must be used within a DiceProvider");
  }
  return context;
}
