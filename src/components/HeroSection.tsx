"use client";

import { useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";
import { lenisSmoothRocketEase } from "@/lib/lenis";

const TOTAL_FRAMES = 119;
const FRAME_PATH = "/assets/hero_frames/ezgif-frame-";
const FRAME_EXT = ".webp";

export interface FastForwardHandoff {
  startTime: number;
  totalDurationMs: number;
  heroFraction: number;
}

interface HeroSectionProps {
  isActive: boolean;
  isAboutActive?: boolean;
  onHeroComplete?: () => void;
  onScrollPastHero?: () => void;
  onFastForwardComplete?: (handoff?: FastForwardHandoff) => void;
  onProgressChange?: (progress: number) => void;
  targetProgress?: number | null;
  lenis?: Lenis | null;
  fastForwardTrigger?: number;
}

export default function HeroSection({
  isActive,
  isAboutActive = false,
  onHeroComplete,
  onScrollPastHero,
  onFastForwardComplete,
  onProgressChange,
  targetProgress,
  lenis,
  fastForwardTrigger,
}: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(0);
  const scrubAnimIdRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const isAboutActiveRef = useRef(isAboutActive);
  const wasAboutActiveRef = useRef(false);
  const isFastForwardingRef = useRef(false);
  const transitionCooldownRef = useRef(0);

  const onHeroCompleteRef = useRef(onHeroComplete);
  useEffect(() => {
    onHeroCompleteRef.current = onHeroComplete;
  }, [onHeroComplete]);

  const onScrollPastHeroRef = useRef(onScrollPastHero);
  useEffect(() => {
    onScrollPastHeroRef.current = onScrollPastHero;
  }, [onScrollPastHero]);

  const onFastForwardCompleteRef = useRef(onFastForwardComplete);
  useEffect(() => {
    onFastForwardCompleteRef.current = onFastForwardComplete;
  }, [onFastForwardComplete]);

  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const targetProgressRef = useRef(targetProgress);
  useEffect(() => {
    targetProgressRef.current = targetProgress;
  }, [targetProgress]);

  const imagesLoadedRef = useRef(false);
  const loadedCountRef = useRef(0);

  // ─── 1. Resize Canvas with Hardware-Accelerated Capped DPR ─────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetW = Math.round(window.innerWidth * dpr);
    const targetH = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "medium";
      }
    }
  }, []);

  // ─── 2. Draw Frame to Canvas with Bilinear Smoothing ────────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetImg = imagesRef.current[frameIndex];
    if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
      lastDrawnFrameRef.current = frameIndex;
      ctx.drawImage(targetImg, 0, 0, canvas.width, canvas.height);
    } else {
      // Retain last successfully drawn frame so there is NEVER a black flash or glitch
      const fallbackImg = imagesRef.current[lastDrawnFrameRef.current || 0];
      if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
        ctx.drawImage(fallbackImg, 0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Handle external navigation target progress
  useEffect(() => {
    if (targetProgress != null && isActive && !isAboutActive) {
      const frame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1)))
      );
      targetFrameRef.current = frame;
      smoothFrameRef.current = frame;
      lastDrawnFrameRef.current = frame;
      drawFrame(frame);
      onProgressChangeRef.current?.(targetProgress);
      if (targetProgress >= 0.99) {
        hasCompletedRef.current = true;
        onHeroCompleteRef.current?.();
      }
    }
  }, [targetProgress, isActive, isAboutActive, drawFrame]);

  // ─── Rocket Fast-Forward (Sequentially scrubs all 119 hero frames at rocket speed) ───
  const fastForwardAnimIdRef = useRef<number | null>(null);
  const lastHandledTriggerRef = useRef(0);

  useEffect(() => {
    if (!fastForwardTrigger || !isActive || isAboutActive) return;
    if (lastHandledTriggerRef.current === fastForwardTrigger) return;
    lastHandledTriggerRef.current = fastForwardTrigger;

    if (fastForwardAnimIdRef.current) {
      cancelAnimationFrame(fastForwardAnimIdRef.current);
      fastForwardAnimIdRef.current = null;
    }

    const lastFrameIndex = TOTAL_FRAMES - 1;
    const startFrame = Math.max(0, Math.min(TOTAL_FRAMES - 2, Math.round(smoothFrameRef.current)));
    const framesToFastForward = lastFrameIndex - startFrame;
    const aboutFrames = 105;
    const totalFrames = framesToFastForward + aboutFrames;
    const heroFraction = totalFrames > 0 ? framesToFastForward / totalFrames : 0;
    const totalDurationMs = 1450;

    isFastForwardingRef.current = true;

    if (framesToFastForward <= 1) {
      isFastForwardingRef.current = false;
      targetFrameRef.current = lastFrameIndex;
      smoothFrameRef.current = lastFrameIndex;
      drawFrame(lastFrameIndex);
      onProgressChangeRef.current?.(1);
      hasCompletedRef.current = true;
      onHeroCompleteRef.current?.();
      onFastForwardCompleteRef.current?.({
        startTime: performance.now(),
        totalDurationMs: 1000,
        heroFraction: 0,
      });
      return;
    }

    const startTime = performance.now();

    const fastForwardStep = (now: number) => {
      const elapsed = now - startTime;
      const globalProgress = Math.min(elapsed / totalDurationMs, 1);
      // Lenis-powered effortless rocket takeoff and seamless cruise S-curve
      const globalEased = lenisSmoothRocketEase(globalProgress);
      const heroLocalProgress = heroFraction > 0 ? Math.min(1, globalEased / heroFraction) : 1;
      const currentFrame = Math.min(lastFrameIndex, Math.round(startFrame + framesToFastForward * heroLocalProgress));

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      drawFrame(currentFrame);
      onProgressChangeRef.current?.(currentFrame / lastFrameIndex);

      if (globalEased < heroFraction && currentFrame < lastFrameIndex) {
        fastForwardAnimIdRef.current = requestAnimationFrame(fastForwardStep);
      } else {
        fastForwardAnimIdRef.current = null;
        isFastForwardingRef.current = false;
        targetFrameRef.current = lastFrameIndex;
        smoothFrameRef.current = lastFrameIndex;
        drawFrame(lastFrameIndex);
        onProgressChangeRef.current?.(1);
        hasCompletedRef.current = true;
        onHeroCompleteRef.current?.();
        // Seamless handoff: pass the exact trajectory clock & fraction to About Transition
        onFastForwardCompleteRef.current?.({
          startTime,
          totalDurationMs,
          heroFraction,
        });
      }
    };

    fastForwardAnimIdRef.current = requestAnimationFrame(fastForwardStep);

    return () => {
      if (fastForwardAnimIdRef.current) {
        cancelAnimationFrame(fastForwardAnimIdRef.current);
        fastForwardAnimIdRef.current = null;
      }
      isFastForwardingRef.current = false;
    };
  }, [fastForwardTrigger, isActive, isAboutActive, drawFrame]);

  // When About transition is active, keep Hero painted at final typewriter frame for zero-blink return
  useEffect(() => {
    isAboutActiveRef.current = isAboutActive;
    if (isAboutActive) {
      targetFrameRef.current = TOTAL_FRAMES - 1;
      smoothFrameRef.current = TOTAL_FRAMES - 1;
      drawFrame(TOTAL_FRAMES - 1);
    }
  }, [isAboutActive, drawFrame]);

    // ─── 3. Preload and pre-decode all 80 hero PNG frames ─────────────
    useEffect(() => {
      resizeCanvas();
      let loaded = 0;
      const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new window.Image();
        img.src = `${FRAME_PATH}${String(i).padStart(3, "0")}${FRAME_EXT}`;

        if ("decode" in img) {
          img.decode().catch(() => { });
        }

        const handleLoad = () => {
          loaded++;
          loadedCountRef.current = loaded;
          if (loaded >= 5) {
            drawFrame(0);
          }
          if (loaded === TOTAL_FRAMES) {
            imagesLoadedRef.current = true;
            drawFrame(lastDrawnFrameRef.current || 0);
          }
        };
        img.onload = handleLoad;
        img.onerror = handleLoad;
        images[i - 1] = img;
      }

      imagesRef.current = images;

    const handleWindowResize = () => {
      resizeCanvas();
      drawFrame(lastDrawnFrameRef.current || 0);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [drawFrame, resizeCanvas]);

  // ─── 4. Unified Lenis Smooth Scroll Lifecycle (100% Scroll-Based) ───
  useEffect(() => {
    if (!isActive || isAboutActive) {
      if (scrubAnimIdRef.current) {
        cancelAnimationFrame(scrubAnimIdRef.current);
        scrubAnimIdRef.current = null;
      }
      wasAboutActiveRef.current = isAboutActive;
      return;
    }

    resizeCanvas();

    // If returning from About, place at frame TOTAL_FRAMES - 4 ready to scrub backward
    if (wasAboutActiveRef.current) {
      transitionCooldownRef.current = Date.now() + 450;
      if (targetProgressRef.current == null) {
        const returnIndex = Math.max(0, TOTAL_FRAMES - 4);
        targetFrameRef.current = returnIndex;
        smoothFrameRef.current = returnIndex;
        drawFrame(returnIndex);
        hasCompletedRef.current = false;
      }
    }
    wasAboutActiveRef.current = false;

    // Continuous 60fps/120fps display refresh lerp loop
    const raf = () => {
      if (!isFastForwardingRef.current) {
        const diff = targetFrameRef.current - smoothFrameRef.current;
        if (Math.abs(diff) > 0.015) {
          smoothFrameRef.current += diff * 0.18;
        } else {
          smoothFrameRef.current = targetFrameRef.current;
        }

        const frameToDraw = Math.min(
          TOTAL_FRAMES - 1,
          Math.max(0, Math.round(smoothFrameRef.current))
        );

        if (frameToDraw !== lastDrawnFrameRef.current) {
          drawFrame(frameToDraw);
          const p = Math.min(1, Math.max(0, frameToDraw / (TOTAL_FRAMES - 1)));
          onProgressChangeRef.current?.(p);
        }
      }

      scrubAnimIdRef.current = requestAnimationFrame(raf);
    };

    scrubAnimIdRef.current = requestAnimationFrame(raf);

    // Listen to unified Lenis virtual-scroll
    let unsubscribeVirtualScroll: (() => void) | null = null;
    if (lenis) {
      unsubscribeVirtualScroll = lenis.on("virtual-scroll", ({ deltaY }) => {
        if (!isActive || isAboutActiveRef.current || isFastForwardingRef.current) return;

        // Upward scroll (scrub backward)
        if (deltaY < -3) {
          hasCompletedRef.current = false;
          const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.08);
          targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);
        } else if (deltaY > 3) {
          // Downward scroll (scrub forward)
          if (
            Date.now() > transitionCooldownRef.current &&
            targetFrameRef.current >= TOTAL_FRAMES - 1 &&
            deltaY > 5
          ) {
            onScrollPastHeroRef.current?.();
          } else {
            const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.08);
            targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + deltaFrames);

            if (targetFrameRef.current >= TOTAL_FRAMES - 1) {
              hasCompletedRef.current = true;
              onHeroCompleteRef.current?.();
            }
          }
        }
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isAboutActiveRef.current || isFastForwardingRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        if (
          Date.now() > transitionCooldownRef.current &&
          targetFrameRef.current >= TOTAL_FRAMES - 1
        ) {
          onScrollPastHeroRef.current?.();
        } else {
          targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + 6);
          if (targetFrameRef.current >= TOTAL_FRAMES - 1) {
            hasCompletedRef.current = true;
            onHeroCompleteRef.current?.();
          }
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        targetFrameRef.current = Math.max(0, targetFrameRef.current - 6);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (unsubscribeVirtualScroll) unsubscribeVirtualScroll();
      if (scrubAnimIdRef.current) cancelAnimationFrame(scrubAnimIdRef.current);
    };
  }, [isActive, isAboutActive, lenis, drawFrame, resizeCanvas]);

  return (
    <div
      className={`fixed inset-0 w-full h-full select-none bg-black transition-opacity duration-700 ease-in-out ${isActive
          ? `opacity-100 ${isAboutActive ? "pointer-events-none z-30" : "pointer-events-auto z-40"}`
          : "opacity-0 pointer-events-none z-0"
        }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-fill cursor-default block select-none"
      />
    </div>
  );
}
