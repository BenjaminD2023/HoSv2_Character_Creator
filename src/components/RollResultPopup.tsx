"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, Sparkles, Skull } from "lucide-react";

// Performance-optimized glow component using CSS transforms only
function CritGlow({ isCrit, isCritFail }: { isCrit: boolean; isCritFail: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-500",
        isCrit ? "opacity-100" : "opacity-0"
      )}
      style={{
        background: isCrit
          ? "radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.4) 0%, transparent 60%)"
          : isCritFail
          ? "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.4) 0%, transparent 60%)"
          : "none",
        transform: "translateZ(0)", // Force GPU layer
        willChange: "opacity",
      }}
    />
  );
}

export type RollType = "strength" | "intelligence" | "athletics" | "initiative" | "charisma" | "damage" | "save";

interface RollResult {
  label: string;
  naturalRoll: number;
  modifier: number;
  total: number;
  type: RollType;
  diceSize?: number;
  crit?: boolean;
  critFail?: boolean;
}

interface RollResultPopupProps {
  result: RollResult | null;
  onClose: () => void;
}

const TYPE_COLORS: Record<RollType, string> = {
  strength: "#E63946",
  intelligence: "#3A86FF",
  athletics: "#2A9D2A",
  initiative: "#2A9D2A",
  charisma: "#F4D03F",
  damage: "#E63946",
  save: "#9B59B6",
};

export function RollResultPopup({ result, onClose }: RollResultPopupProps) {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isCrit = result?.crit || false;
  const isCritFail = result?.critFail || false;

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setShow(false);
    // Wait for fade animation to finish before calling onClose
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [isClosing, onClose]);

  useEffect(() => {
    if (result) {
      setShow(true);
      setIsClosing(false);

      // Auto-close after appropriate time
      const timeout = setTimeout(() => {
        handleClose();
      }, isCrit || isCritFail ? 4000 : 3000);

      return () => clearTimeout(timeout);
    }
  }, [result, isCrit, isCritFail, handleClose]);

  if (!result) return null;

  const color = TYPE_COLORS[result.type];
  const modPositive = result.modifier >= 0;

  return (
    <>
      {/* Full screen cinematic effect for crits */}
      {(isCrit || isCritFail) && (
        <div
          onClick={handleClose}
          className={cn(
            "fixed inset-0 z-[200] transition-opacity duration-500 cursor-pointer",
            show ? "opacity-100" : "opacity-0",
            isClosing && "opacity-0"
          )}
        >
          {/* Background flash - simplified, no blur */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              isCrit && "bg-gradient-to-b from-yellow-500/20 via-amber-500/10 to-transparent",
              isCritFail && "bg-gradient-to-b from-red-600/30 via-red-900/20 to-transparent"
            )}
          />

          {/* Static glow effect instead of animated particles */}
          <CritGlow isCrit={isCrit} isCritFail={isCritFail} />

          {/* Center banner for crit */}
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-transform duration-500",
              show ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
          >
            <div
              className={cn(
                "px-12 py-6 rounded-2xl border-2",
                isCrit && "bg-gradient-to-r from-yellow-500/90 via-amber-500/90 to-yellow-500/90 border-yellow-300 shadow-2xl shadow-yellow-500/50",
                isCritFail && "bg-gradient-to-r from-red-600/90 via-red-800/90 to-red-600/90 border-red-400 shadow-2xl shadow-red-600/50"
              )}
            >
              <div className="flex items-center gap-4">
                {isCrit && <Sparkles className="w-12 h-12 text-white" />}
                {isCritFail && <Skull className="w-12 h-12 text-white" />}
                <div>
                  <p className={cn("text-4xl font-black text-white uppercase tracking-wider", isCrit && "text-shadow-lg")}>
                    {isCrit ? "Critical Success!" : "Critical Fail!"}
                  </p>
                  <p className="text-xl text-white/90 font-bold mt-1">
                    Rolled a {result.naturalRoll}!
                  </p>
                </div>
                {isCrit && <Sparkles className="w-12 h-12 text-white" />}
                {isCritFail && <Skull className="w-12 h-12 text-white" />}
              </div>
            </div>
          </div>

          {/* Vignette effect - simplified */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isCrit
                ? "radial-gradient(circle at center, transparent 30%, rgba(234, 179, 8, 0.2) 70%, rgba(234, 179, 8, 0.3) 100%)"
                : "radial-gradient(circle at center, transparent 30%, rgba(220, 38, 38, 0.3) 70%, rgba(220, 38, 38, 0.4) 100%)",
            }}
          />
        </div>
      )}

      {/* Bottom right popup - always visible for non-crits, fades out after crit animation */}
      <div
        onClick={handleClose}
        className={cn(
          "fixed bottom-4 right-4 z-[150] transition-transform transition-opacity duration-300 cursor-pointer",
          show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
          isClosing && "opacity-0"
        )}
      >
        <div
          className={cn(
            "relative rounded-xl border overflow-hidden shadow-2xl",
            isCrit && "border-yellow-500/50 shadow-yellow-500/30",
            isCritFail && "border-red-500/50 shadow-red-500/30",
            !isCrit && !isCritFail && "border-white/10 shadow-black/50"
          )}
          style={{
            background: isCrit
              ? "linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(0, 0, 0, 0.95))"
              : isCritFail
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(0, 0, 0, 0.95))"
              : "linear-gradient(135deg, rgba(30, 30, 35, 0.98), rgba(10, 10, 12, 0.99))",
          }}
        >
          {/* Glow border */}
          <div
            className="absolute inset-0 rounded-xl opacity-50"
            style={{
              background: isCrit
                ? "linear-gradient(135deg, rgba(234, 179, 8, 0.5), transparent)"
                : isCritFail
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.5), transparent)"
                : `linear-gradient(135deg, ${color}40, transparent)`,
            }}
          />

          <div className="relative p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: isCrit || isCritFail
                      ? isCrit ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)"
                      : `${color}30`,
                    color: isCrit ? "#FDE047" : isCritFail ? "#FCA5A5" : color,
                  }}
                >
                  {isCrit && <Sparkles className="w-4 h-4" />}
                  {isCritFail && <Skull className="w-4 h-4" />}
                  {!isCrit && !isCritFail && <span className="text-sm font-bold">d{result.diceSize || 20}</span>}
                </div>
                <p className="text-sm font-semibold text-white">{result.label}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Roll Result */}
            <div className="flex items-center justify-center gap-3">
              {/* Natural Roll */}
              <div className="text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Natural</p>
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border transition-transform duration-200",
                    isCrit && "bg-yellow-500 border-yellow-400 text-black scale-105",
                    isCritFail && "bg-red-600 border-red-500 text-white scale-105",
                    !isCrit && !isCritFail && "bg-gray-800 border-white/20 text-white"
                  )}
                >
                  {result.naturalRoll}
                </div>
              </div>

              {/* Modifier */}
              {result.modifier !== 0 && (
                <>
                  <div className="text-lg text-white/40 font-light">+</div>
                  <div className="text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Mod</p>
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold border",
                        modPositive
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-red-500/20 border-red-500/40 text-red-400"
                      )}
                    >
                      {modPositive ? `+${result.modifier}` : result.modifier}
                    </div>
                  </div>
                </>
              )}

              {/* Total */}
              <div className="text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total</p>
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold border-2",
                    isCrit && "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-black",
                    isCritFail && "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white",
                    !isCrit && !isCritFail && "bg-gradient-to-br from-gray-700 to-gray-800 border-white/30 text-white"
                  )}
                  style={!isCrit && !isCritFail ? { boxShadow: `0 0 20px ${color}30` } : {}}
                >
                  {result.total}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
