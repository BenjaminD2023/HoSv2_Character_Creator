"use client";

import { useEffect, useRef, useState } from "react";
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
  const initAttemptedRef = useRef(false);
  const { initDiceBox, isReady, isRolling, isError, error } = useDice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const portalTarget = mounted ? document.body : null;

  // STRICT: Only run initialization ONCE on mount
  useEffect(() => {
    if (mounted && containerRef.current && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      // Small delay to ensure DOM is ready and container has dimensions
      const timer = setTimeout(() => {
        initDiceBox(containerRef.current!);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]); // STRICT: Only depend on mounted, never re-initialize

  // Handle close - only when not rolling
  const handleClose = () => {
    if (visible && !isRolling && onClose) {
      onClose();
    }
  };

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 pointer-events-none transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {/* Toast notification */}
      <div
        className={cn(
          "pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 z-[60] transition-opacity duration-300",
          visible && isRolling ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background/95 border border-border/50 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
          <span className="animate-pulse">🎲</span>
          <span className="text-sm font-medium">Rolling dice...</span>
        </div>
      </div>

      {/* Canvas container - NEVER conditionally rendered, always mounted */}
      <div
        ref={containerRef}
        id="dice-box-container"
        className="fixed inset-0 pointer-events-none z-50 bg-transparent outline-none border-none"
        style={{
          width: "100vw",
          height: "100vh",
          pointerEvents: visible ? "auto" : "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      >
        {/* Canvas will be created here by DiceBox */}
      </div>

      {/* Click overlay - always rendered, never conditionally mounted */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-auto cursor-pointer transition-opacity duration-300",
          visible && !isRolling ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        style={{ zIndex: 52, background: "transparent" }}
      />

      {/* Loading indicator - visibility only, never unmounts */}
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center bg-background/90 pointer-events-auto transition-opacity duration-300",
          visible && !isReady && !isError ? "opacity-100 z-[53]" : "opacity-0 pointer-events-none z-0"
        )}
      >
        <div className="text-center space-y-2">
          <div className="animate-pulse text-4xl">🎲</div>
          <p className="text-muted-foreground text-sm">Loading 3D Dice...</p>
        </div>
      </div>

      {/* Error state - visibility only, never unmounts */}
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center bg-background/90 pointer-events-auto transition-opacity duration-300",
          visible && isError ? "opacity-100 z-[53]" : "opacity-0 pointer-events-none z-0"
        )}
      >
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

      {/* Close button - visibility only */}
      <button
        onClick={handleClose}
        className={cn(
          "pointer-events-auto absolute top-4 right-4 p-2 bg-background/90 hover:bg-muted rounded-full transition-colors border border-border/50 shadow-lg",
          visible && onClose ? "opacity-100 z-[54]" : "opacity-0 pointer-events-none z-0"
        )}
      >
        <X className="h-5 w-5" />
      </button>
    </div>,
    portalTarget
  );
}
