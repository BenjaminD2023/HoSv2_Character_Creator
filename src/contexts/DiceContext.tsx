"use client";

import React, { createContext, useContext, useRef, useState, useCallback } from "react";

interface DiceResult {
  value: number;
  modifier?: number;
  rolls?: number[];
}

interface DiceRollValue {
  value: number;
  rolls?: number[];
  modifier?: number;
}

interface DiceRollOptions {
  theme?: string;
  themeColor?: string;
  newStartPoint?: boolean;
}

interface DiceBatchItem {
  notation: string;
  options?: DiceRollOptions;
}

interface DiceBoxInstance {
  init: () => Promise<void>;
  roll: (notation: string, options?: DiceRollOptions) => Promise<DiceRollValue[]>;
  add?: (notation: string, options?: DiceRollOptions) => Promise<DiceRollValue[]>;
  clear?: () => void;
  hide?: () => void;
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
  rollDice: (notation: string, options?: DiceRollOptions) => Promise<DiceResult[]>;
  rollDiceBatch: (items: DiceBatchItem[]) => Promise<DiceResult[][]>;
  initDiceBox: (canvasContainer: HTMLDivElement) => Promise<void>;
  clearDice: () => void;
  restartDiceEngine: () => Promise<void>;
}

const DiceContext = createContext<DiceContextType | null>(null);

function syncDiceCanvasSize(container: HTMLDivElement | null) {
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  if (width <= 0 || height <= 0) return;

  const canvases = container.querySelectorAll("canvas");
  canvases.forEach((canvas) => {
    // OffscreenCanvas transferred contexts can't have width/height set directly
    try {
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    } catch {
      // Canvas is controlled by OffscreenCanvas, skip direct resize
    }

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
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const initDiceBox = useCallback(async (canvasContainer: HTMLDivElement) => {
    // STRICT: Never re-initialize if already initialized or initializing
    if (hasInitializedRef.current || isInitializingRef.current || diceBoxRef.current) {
      console.log("DiceBox initialization skipped - already initialized");
      return;
    }

    canvasContainerRef.current = canvasContainer;
    isInitializingRef.current = true;

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
        container: "#dice-box-container",
        assetPath: "/assets/dice-box/",
        gravity: 1,
        startPosition: { x: 0, y: 8, z: 0 },
        throwForce: 5,
        spinForce: 8,
        scale: 5,
        theme: "smooth",
        themeColor: "#D62828",
        preloadThemes: ["smooth"],
        shadowOpacity: 0.3,
        lightIntensity: 0.8,
        // Transparent background - no clear color
        transparent: true,
        backgroundColor: "transparent",
        onRollComplete: (rollResults: unknown[]) => {
          console.log("Roll complete:", rollResults);
        },
      };

      const diceBox = new DiceBox(config) as unknown as DiceBoxInstance;

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
      hasInitializedRef.current = true; // STRICT: Mark as initialized
      setIsReady(true);
      setIsError(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to initialize dice box:", err);
      setIsError(true);
      setError(`Failed to initialize dice: ${errorMessage}`);
    } finally {
      isInitializingRef.current = false;
    }
  }, []);

  const rollDice = useCallback(
    async (notation: string, options?: DiceRollOptions): Promise<DiceResult[]> => {
      if (!diceBoxRef.current || isRolling) return [];

      setIsRolling(true);

      try {
        // STRICT: Do NOT sync canvas size or call show() here - just roll on existing instance
        const rollResult = await diceBoxRef.current.roll(notation, options);

        // Parse results - dice-box returns an array of roll results
        const parsedResults: DiceResult[] = rollResult.map((roll) => ({
          value: roll.value,
        }));

        // Update results map with timestamp as key
        const newResults = new Map(results);
        newResults.set(Date.now().toString(), parsedResults[0] || { value: 0 });
        setResults(newResults);

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

  const rollDiceBatch = useCallback(
    async (items: DiceBatchItem[]): Promise<DiceResult[][]> => {
      if (!diceBoxRef.current || isRolling || items.length === 0) return [];

      setIsRolling(true);

      try {
        const [first, ...rest] = items;

        const firstRollPromise = diceBoxRef.current.roll(first.notation, first.options);

        const additionalPromises = rest.map((item) => {
          if (typeof diceBoxRef.current!.add === "function") {
            return diceBoxRef.current!.add(item.notation, {
              ...item.options,
              newStartPoint: false,
            });
          }
          return diceBoxRef.current!.roll(item.notation, item.options);
        });

        const allPromises = [firstRollPromise, ...additionalPromises];
        const rollResults = await Promise.all(allPromises);

        const parsedGroups: DiceResult[][] = rollResults.map((group) =>
          group.map((die) => ({
            value: die.value,
            rolls: die.rolls,
            modifier: die.modifier,
          }))
        );

        const firstDie = parsedGroups[0]?.[0] ?? { value: 0 };
        const newResults = new Map<string, DiceResult>();
        newResults.set(Date.now().toString(), firstDie);
        setResults(newResults);

        return parsedGroups;
      } catch (error) {
        console.error("Batch roll failed:", error);
        return [];
      } finally {
        setIsRolling(false);
      }
    },
    [isRolling, results]
  );

  const clearDice = useCallback(() => {
    if (!diceBoxRef.current) return;
    if (typeof diceBoxRef.current.clear === "function") {
      diceBoxRef.current.clear();
    }
  }, []);

  const restartDiceEngine = useCallback(async () => {
    const container = canvasContainerRef.current;

    try {
      // Force-clear transient states so restart works even if a roll promise is stuck
      setIsRolling(false);
      isInitializingRef.current = false;
      setIsError(false);
      setError(null);
      setIsReady(false);

      if (diceBoxRef.current) {
        if (typeof diceBoxRef.current.clear === "function") {
          diceBoxRef.current.clear();
        }
        if (typeof diceBoxRef.current.hide === "function") {
          diceBoxRef.current.hide();
        }
      }

      diceBoxRef.current = null;

      if (!container) {
        window.dispatchEvent(new Event("dice-engine-restarted"));
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 120));
      await initDiceBox(container);
      window.dispatchEvent(new Event("dice-engine-restarted"));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setIsError(true);
      setError(`Failed to restart dice engine: ${errorMessage}`);
      window.dispatchEvent(new Event("dice-engine-restarted"));
    }
  }, [initDiceBox]);

  return (
    <DiceContext.Provider value={{ isReady, isRolling, isError, error, results, rollDice, rollDiceBatch, initDiceBox, clearDice, restartDiceEngine }}>
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
