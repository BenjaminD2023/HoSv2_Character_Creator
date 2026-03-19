"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDice } from "@/contexts";
import { cn } from "@/lib/utils";
import { X, AlertCircle } from "lucide-react";

interface DiceCanvasProps {
  className?: string;
  visible?: boolean;
  onClose?: () => void;
}

export function DiceCanvas({ className, visible = true, onClose }: DiceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { initDiceBox, isReady, isRolling, isError, error } = useDice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const portalTarget = mounted ? document.body : null;

  useEffect(() => {
    if (mounted && containerRef.current && !isReady && !isError) {
      // Small delay to ensure DOM is ready and container has dimensions
      const timer = setTimeout(() => {
        initDiceBox(containerRef.current!);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initDiceBox, isReady, isError, mounted]);

  // Handle close
  const handleClose = useCallback(() => {
    if (visible && !isRolling && onClose) {
      onClose();
    }
  }, [visible, isRolling, onClose]);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 pointer-events-none transition-opacity",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {/* Toast notification */}
      {visible && isRolling && (
        <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-background/90 backdrop-blur-md border border-border/50 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="animate-spin">🎲</span>
            <span className="text-sm font-medium">Rolling dice...</span>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        id="dice-box-container"
        className={cn(
          "absolute inset-0",
          visible
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        style={{
          background: "transparent",
          width: "100vw",
          height: "100vh",
          zIndex: 51,
        }}
      >
        {/* Canvas will be created here by DiceBox */}
      </div>

      {/* Click overlay - covers everything to catch clicks when rolling is done */}
      {visible && !isRolling && (
        <div
          className="fixed inset-0 pointer-events-auto cursor-pointer animate-decompose"
          onClick={handleClose}
          style={{ zIndex: 52, background: 'transparent' }}
        />
      )}

      {/* Loading indicator */}
      {visible && !isReady && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto" style={{ zIndex: 53 }}>
          <div className="text-center space-y-2">
            <div className="animate-spin text-4xl">🎲</div>
            <p className="text-muted-foreground text-sm">Loading 3D Dice...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {visible && isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto" style={{ zIndex: 53 }}>
          <div className="text-center space-y-3 max-w-md px-4">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <div>
              <p className="font-medium text-foreground">Failed to load 3D Dice</p>
              <p className="text-muted-foreground text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => containerRef.current && initDiceBox(containerRef.current)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Close button */}
      {visible && onClose && (
        <button
          onClick={handleClose}
          className="pointer-events-auto absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-muted rounded-full transition-colors border border-border/50 shadow-lg"
          style={{ zIndex: 54 }}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>,
    portalTarget
  );
}
