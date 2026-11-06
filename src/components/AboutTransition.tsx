"use client";

import { useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";
import { lenisSmoothRocketEase } from "@/lib/lenis";

const TOTAL_FRAMES = 106;
const FRAME_PATH = "/assets/transition/ezgif-frame-";
const FRAME_EXT = ".webp";

export interface FastForwardHandoff {
  startTime: number;
  totalDurationMs: number;
  heroFraction: number;
}

interface AboutTransitionProps {
  isActive: boolean;
  onProgressChange?: (progress: number) => void;
  onScrollBackToHero?: () => void;
  targetProgress?: number | null;
  lenis?: Lenis | null;
  fastForwardTrigger?: number;
  handoff?: FastForwardHandoff | null;
}

export default function AboutTransition({
  isActive,
  onProgressChange,
  onScrollBackToHero,
  targetProgress,
  lenis,
  fastForwardTrigger,
  handoff,
}: AboutTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(0);
  const animIdRef = useRef<number | null>(null);
  const isScrolledBackRef = useRef(false);
  const isFastForwardingRef = useRef(false);
  const transitionCooldownRef = useRef(0);

  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const targetProgressRef = useRef(targetProgress);
  useEffect(() => {
    targetProgressRef.current = targetProgress;
  }, [targetProgress]);

  const onScrollBackToHeroRef = useRef(onScrollBackToHero);
  useEffect(() => {
    onScrollBackToHeroRef.current = onScrollBackToHero;
  }, [onScrollBackToHero]);

  const imagesLoadedRef = useRef(false);

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
    }
  }, []);

  // ─── 2. Draw Frame to Canvas with Bilinear Filtering (Zero Lag) ────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";

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
    if (targetProgress != null && isActive) {
      const frame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1)))
      );
      targetFrameRef.current = frame;
      smoothFrameRef.current = frame;
      lastDrawnFrameRef.current = frame;
      drawFrame(frame);
      onProgressChangeRef.current?.(targetProgress);
    }
  }, [targetProgress, isActive, drawFrame]);

  // ─── Rocket Fast-Forward (Seamless glide into retro PC with cushioned landing) ───
  const fastForwardAnimIdRef = useRef<number | null>(null);
  const lastHandledTriggerRef = useRef(0);
  const fastForwardTriggerRef = useRef(fastForwardTrigger);
  useEffect(() => {
    fastForwardTriggerRef.current = fastForwardTrigger;
  }, [fastForwardTrigger]);
  const handoffRef = useRef(handoff);
  useEffect(() => {
    handoffRef.current = handoff;
  }, [handoff]);

  useEffect(() => {
    if (!fastForwardTrigger || !isActive) return;
    if (lastHandledTriggerRef.current === fastForwardTrigger) return;
    lastHandledTriggerRef.current = fastForwardTrigger;

    if (fastForwardAnimIdRef.current) {
      cancelAnimationFrame(fastForwardAnimIdRef.current);
      fastForwardAnimIdRef.current = null;
    }

    const lastFrameIndex = TOTAL_FRAMES - 1;
    const currentHandoff = handoffRef.current;
    const startFrame = currentHandoff ? 0 : Math.max(0, Math.min(TOTAL_FRAMES - 2, Math.round(smoothFrameRef.current)));
    const framesToFastForward = lastFrameIndex - startFrame;

    isFastForwardingRef.current = true;

    if (framesToFastForward <= 1) {
      isFastForwardingRef.current = false;
      targetFrameRef.current = lastFrameIndex;
      smoothFrameRef.current = lastFrameIndex;
      drawFrame(lastFrameIndex);
      onProgressChangeRef.current?.(1);
      return;
    }

    const hasHandoff = currentHandoff && currentHandoff.heroFraction < 1;
    const startTime = hasHandoff ? currentHandoff.startTime : performance.now();
    const totalDurationMs = hasHandoff ? currentHandoff.totalDurationMs : 1000;
    const heroFraction = hasHandoff ? currentHandoff.heroFraction : 0;

    const fastForwardStep = (now: number) => {
      const elapsed = now - startTime;
      const globalProgress = Math.min(elapsed / totalDurationMs, 1);
      // Lenis-powered effortless rocket flight and soft landing touchdown S-curve
      const globalEased = lenisSmoothRocketEase(globalProgress);

      const aboutProgress = heroFraction < 1
        ? Math.max(0, Math.min(1, (globalEased - heroFraction) / (1 - heroFraction)))
        : 1;

      const currentFrame = Math.min(lastFrameIndex, Math.round(startFrame + framesToFastForward * aboutProgress));

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      drawFrame(currentFrame);
      onProgressChangeRef.current?.(currentFrame / lastFrameIndex);

      if (globalProgress < 1 && currentFrame < lastFrameIndex) {
        fastForwardAnimIdRef.current = requestAnimationFrame(fastForwardStep);
      } else {
        fastForwardAnimIdRef.current = null;
        isFastForwardingRef.current = false;
        targetFrameRef.current = lastFrameIndex;
        smoothFrameRef.current = lastFrameIndex;
        drawFrame(lastFrameIndex);
        onProgressChangeRef.current?.(1);
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
  }, [fastForwardTrigger, isActive, drawFrame]);

  // ─── 4. Preload and pre-decode all 106 transition PNG frames ───────
  useEffect(() => {
    resizeCanvas();
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.src = `${FRAME_PATH}${String(i).padStart(3, "0")}${FRAME_EXT}`;

      if ("decode" in img) {
        img.decode().catch(() => {});
      }

      const handleLoad = () => {
        loaded++;
        if (loaded >= 5 && !imagesLoadedRef.current) {
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

  // ─── 5. Unified Lenis Virtual Scroll Lifecycle ────────────────────
  useEffect(() => {
    if (!isActive) {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      return;
    }

    resizeCanvas();
    isScrolledBackRef.current = false;
    transitionCooldownRef.current = Date.now() + 450;

    // Reset to start on entering About transition (only when entering via normal scroll, not in fast forward and not when dragging via scrollbar)
    if (!handoffRef.current && !fastForwardTriggerRef.current && targetProgressRef.current == null) {
      targetFrameRef.current = 1;
      smoothFrameRef.current = 1;
      lastDrawnFrameRef.current = 1;
      drawFrame(1);
      onProgressChangeRef.current?.(1 / (TOTAL_FRAMES - 1));
    }

    // Continuous liquid-smooth lerp animation loop (60fps/120fps)
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
          const progress = Math.min(
            1,
            Math.max(0, frameToDraw / (TOTAL_FRAMES - 1))
          );
          onProgressChangeRef.current?.(progress);
        }
      }

      animIdRef.current = requestAnimationFrame(raf);
    };

    animIdRef.current = requestAnimationFrame(raf);

    // Listen to unified Lenis virtual-scroll
    let unsubscribeVirtualScroll: (() => void) | null = null;
    if (lenis) {
      unsubscribeVirtualScroll = lenis.on("virtual-scroll", ({ deltaY }) => {
        if (!isActive || isFastForwardingRef.current) return;

        if (deltaY > 0) {
          // Downward scroll: advance smoothly towards retro PC (frame 105)
          const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.05);
          targetFrameRef.current = Math.min(
            TOTAL_FRAMES - 1,
            targetFrameRef.current + deltaFrames
          );
        } else if (deltaY < 0) {
          // Upward scroll: scrub backward towards hero
          const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.05);
          targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);

          // If scrubbed to beginning and continuing upward, return to Hero
          if (
            Date.now() > transitionCooldownRef.current &&
            targetFrameRef.current <= 0.2 &&
            deltaY < -5 &&
            !isScrolledBackRef.current
          ) {
            isScrolledBackRef.current = true;
            onScrollBackToHeroRef.current?.();
          }
        }
      });
    }

    // Keyboard navigation (ArrowDown, ArrowUp, PageDown, PageUp, Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        targetFrameRef.current = Math.min(
          TOTAL_FRAMES - 1,
          targetFrameRef.current + 4
        );
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        targetFrameRef.current = Math.max(0, targetFrameRef.current - 4);
        if (targetFrameRef.current <= 0.2 && !isScrolledBackRef.current) {
          isScrolledBackRef.current = true;
          onScrollBackToHeroRef.current?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (unsubscribeVirtualScroll) unsubscribeVirtualScroll();
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    };
  }, [isActive, lenis, drawFrame, resizeCanvas]);

  return (
    <div
      className={`fixed inset-0 z-50 w-full h-full overflow-hidden select-none ${
        isActive
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-fill cursor-default block select-none"
      />
    </div>
  );
}
