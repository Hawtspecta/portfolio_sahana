"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface LampToggleProps {
  className?: string;
  onThemeChange?: (theme: "dark" | "light") => void;
  defaultTheme?: "dark" | "light";
}

export default function LampToggle({
  className = "",
  onThemeChange,
  defaultTheme = "light",
}: LampToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(defaultTheme);
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isSwinging, setIsSwinging] = useState(false);

  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const cordRef = useRef<HTMLDivElement>(null);
  const pullDistanceRef = useRef(0);
  const hasToggledOnPullRef = useRef(false);
  const lastDragEndTimeRef = useRef(0);

  const onThemeChangeRef = useRef(onThemeChange);
  useEffect(() => {
    onThemeChangeRef.current = onThemeChange;
  }, [onThemeChange]);

  // Synchronize theme with html attribute and localStorage
  useEffect(() => {
    const saved = localStorage.getItem("portfolio-theme") as "dark" | "light" | null;
    const initialTheme = saved || defaultTheme;
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setTimeout(() => {
      onThemeChangeRef.current?.(initialTheme);
    }, 0);
  }, [defaultTheme]);

  // Satisfying mechanical "snick-clack" sound effect using Web Audio API
  const playClickSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First click: pull release latch
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1400, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.02);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.02);

      // Second click: metallic contact snap
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(950, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.03);
        gain2.gain.setValueAtTime(0.25, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.03);
      }, 40);
    } catch {
      // AudioContext unavailable or muted
    }
  }, []);

  // Toggle theme state with spring recoil
  const toggleTheme = useCallback(() => {
    playClickSound();
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("portfolio-theme", next);
      return next;
    });

    // Notify listener safely outside React's render/updater phase
    setTimeout(() => {
      const current = (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "light";
      onThemeChangeRef.current?.(current);
    }, 0);

    // Gentle pendulum swing after release
    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 800);
  }, [playClickSound]);

  // Direct click: animated automatic pull & snap-back
  const handleClick = useCallback(() => {
    // Ignore synthetic click event fired immediately after a drag release
    if (isDraggingRef.current || Date.now() - lastDragEndTimeRef.current < 450) return;
    setIsPulling(true);
    setPullY(28);

    setTimeout(() => {
      toggleTheme();
      setPullY(0);
      setIsPulling(false);
    }, 140);
  }, [toggleTheme]);

  // Pointer drag handling: smooth elastic cord stretching
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasToggledOnPullRef.current = false;
    setIsPulling(true);
    startYRef.current = e.clientY;
    pullDistanceRef.current = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = Math.max(0, e.clientY - startYRef.current);
    // Rubber-band resistance curve up to 40px
    const clamped = Math.min(deltaY * 0.75, 40);
    pullDistanceRef.current = clamped;
    setPullY(clamped);

    // Tactile mechanical trip: when pulled past 20px, click and switch the light
    if (clamped >= 20 && !hasToggledOnPullRef.current) {
      hasToggledOnPullRef.current = true;
      toggleTheme();
    }
  }, [toggleTheme]);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsPulling(false);

      const didDrag = pullDistanceRef.current >= 6;
      if (didDrag) {
        lastDragEndTimeRef.current = Date.now();
      }

      // If released after pulling past 12px and not already toggled during the pull
      if (!hasToggledOnPullRef.current && pullDistanceRef.current >= 12) {
        hasToggledOnPullRef.current = true;
        toggleTheme();
      }

      // Elastic snap-back
      setPullY(0);
    },
    [toggleTheme]
  );

  const isLight = theme === "light";

  return (
    <div
      className={`fixed top-0 z-[65] pointer-events-none select-none transition-all duration-300 ${className}`}
      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))" }}
    >
      {/* Ambient Wind Breeze Sway: Very slow irregular pendulum drift anchored at ceiling fixture */}
      <div
        className="relative flex flex-col items-center origin-top will-change-transform"
        style={{
          transformOrigin: "50% 0px",
          animation: "lampWindBreeze 9s ease-in-out infinite",
          animationPlayState: isPulling ? "paused" : "running",
        }}
      >
          {/* Ambient Volumetric Light Cone when Lamp is ON */}
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-700 ease-out"
            style={{
              width: isLight ? "420px" : "0px",
              height: isLight ? "600px" : "0px",
              opacity: isLight ? 0.35 : 0,
              background:
                "radial-gradient(ellipse 65% 85% at 50% 0%, rgba(254, 240, 138, 0.45) 0%, rgba(251, 191, 36, 0.22) 40%, rgba(245, 158, 11, 0.08) 70%, transparent 100%)",
              filter: "blur(20px)",
              clipPath: "polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 28px, black 85%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 28px, black 85%, transparent 100%)",
            }}
          />

          {/* Upper End Optical Blur (matching portfolio tabs' smooth background blur) */}
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 w-48 sm:w-60 h-20 pointer-events-none z-10 transition-opacity duration-700 ${isLight ? "opacity-100" : "opacity-0"
              }`}
            style={{
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              maskImage:
                "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            }}
          />

          {/* Ceiling Cord / Wire */}
          <div className="w-[2px] h-9 sm:h-12 bg-gradient-to-b from-neutral-800 via-neutral-600 to-neutral-700 shadow-sm" />

          {/* Ceiling Mount Fixture */}
          <div className="w-5 h-2 -mt-1 rounded-t-sm bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 border-b border-amber-600/30" />

          {/* Vintage Conical Lampshade */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Shade Top Collar */}
            <div className="w-6 h-2 rounded-t-sm bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 border-t border-neutral-600" />

            {/* Main Lampshade (Trapezoid) */}
            <div
              className="w-16 h-10 transition-colors duration-500 relative flex items-end justify-center shadow-lg"
              style={{
                clipPath: "polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%)",
                background: isLight
                  ? "linear-gradient(180deg, #374151 0%, #1f2937 80%, #b45309 100%)"
                  : "linear-gradient(180deg, #1f2937 0%, #111827 90%, #0f172a 100%)",
              }}
            >
              {/* Subtle Shade Specular Highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent pointer-events-none" />
            </div>

            {/* Shade Brass Rim Ring */}
            <div
              className="w-[66px] h-1.5 -mt-0.5 rounded-full transition-colors duration-500 shadow-md"
              style={{
                background: isLight
                  ? "linear-gradient(90deg, #78350f 0%, #f59e0b 50%, #78350f 100%)"
                  : "linear-gradient(90deg, #374151 0%, #6b7280 50%, #374151 100%)",
              }}
            />
          </div>

          {/* Bulb & Socket Container */}
          <div className="relative -mt-1 flex flex-col items-center z-10">
            {/* Bulb Metallic Socket */}
            <div className="w-3.5 h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 rounded-sm" />

            {/* Glowing Incandescent Lamp Bulb */}
            <div
              className="w-6 h-7 rounded-b-full rounded-t-md transition-all duration-500 flex items-center justify-center relative"
              style={{
                background: isLight
                  ? "radial-gradient(circle at 50% 40%, #ffffff 0%, #fef08a 45%, #f59e0b 90%, #d97706 100%)"
                  : "radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.25) 0%, rgba(156, 163, 175, 0.2) 60%, rgba(75, 85, 99, 0.4) 100%)",
                boxShadow: isLight
                  ? "0 0 20px 4px rgba(251, 191, 36, 0.9), 0 0 45px 12px rgba(245, 158, 11, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.8)"
                  : "inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.5)",
                border: isLight ? "1px solid rgba(254, 240, 138, 0.8)" : "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              {/* Illuminated Filament Wire inside Bulb */}
              <div
                className="w-2.5 h-3 border-t-2 border-x transition-all duration-300 rounded-t-sm"
                style={{
                  borderColor: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.25)",
                  filter: isLight ? "drop-shadow(0 0 3px #ffffff)" : "none",
                }}
              />
            </div>
          </div>

          {/* Pull-Cord Mechanics & Chain Bead — ONLY part that is hoverable & interactive */}
          <div
            ref={cordRef}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="button"
            tabIndex={0}
            data-cursor-text={isLight ? "Pull to Dim" : "Pull to Glow"}
            aria-label={isLight ? "Click or pull lamp for Dark Mode" : "Click or pull lamp for Light Mode"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
            className={`pointer-events-auto relative z-20 flex flex-col items-center cursor-grab active:cursor-grabbing group p-2 -mt-1 touch-none origin-top transition-transform duration-200 hover:scale-110 active:scale-95 ${isSwinging
              ? "animate-[lampSwing_0.8s_ease-in-out]"
              : isPulling
                ? ""
                : "animate-[cordWindBreeze_9s_ease-in-out_infinite]"
              }`}
          >
            {/* Elastic Pull Cord (SVG with dynamic height) */}
            <svg
              width="20"
              height={46 + pullY}
              viewBox={`0 0 20 ${46 + pullY}`}
              className="overflow-visible pointer-events-none transition-[height] duration-75 ease-out"
            >
              {/* Beaded ball chain string */}
              <line
                x1="10"
                y1="0"
                x2="10"
                y2={34 + pullY}
                stroke={isLight ? "#fbbf24" : "#9ca3af"}
                strokeWidth="1.8"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                className="transition-colors duration-300"
              />
            </svg>

            {/* Solid Brass Pull Handle / Bead at End of Cord */}
            <div
              className="w-3.5 h-4.5 -mt-3.5 rounded-full transition-transform duration-75 flex flex-col items-center justify-center shadow-lg group-hover:scale-125 active:scale-95"
              style={{
                transform: `translateY(${pullY}px)`,
                background: isLight
                  ? "linear-gradient(135deg, #fef08a 0%, #f59e0b 60%, #b45309 100%)"
                  : "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 60%, #4b5563 100%)",
                boxShadow: isLight
                  ? "0 0 12px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0, 0, 0, 0.4)"
                  : "0 2px 5px rgba(0, 0, 0, 0.6)",
                border: isLight ? "1px solid #fde047" : "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {/* Handle Grip Detail Rings */}
              <div className="w-2 h-0.5 bg-black/20 rounded-full mb-0.5" />
              <div className="w-1.5 h-0.5 bg-black/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

