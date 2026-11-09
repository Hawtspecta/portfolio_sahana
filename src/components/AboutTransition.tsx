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
  isPortfolioActive?: boolean;
  portfolioScrollPos?: number;
  onProgressChange?: (progress: number) => void;
  onLandingComplete?: () => void;
  onScrollBackToHero?: () => void;
  targetProgress?: number | null;
  lenis?: Lenis | null;
  fastForwardTrigger?: number;
  handoff?: FastForwardHandoff | null;
}

export default function AboutTransition({
  isActive,
  isPortfolioActive,
  portfolioScrollPos = 0,
  onProgressChange,
  onLandingComplete,
  onScrollBackToHero,
  targetProgress,
  lenis,
  fastForwardTrigger,
  handoff,
}: AboutTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const initialFrame =
    isPortfolioActive || (targetProgress != null && targetProgress >= 0.98)
      ? TOTAL_FRAMES - 1
      : targetProgress != null
      ? Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1))))
      : 0;
  const targetFrameRef = useRef(initialFrame);
  const smoothFrameRef = useRef(initialFrame);
  const lastDrawnFrameRef = useRef(initialFrame);
  const hasDrawnInitialRef = useRef(false);
  const animIdRef = useRef<number | null>(null);
  const isScrolledBackRef = useRef(false);
  const isFastForwardingRef = useRef(false);
  const transitionCooldownRef = useRef(0);
  const aboutHoldUntilRef = useRef(0);
  const scrollBackAccumulatorRef = useRef(0);
  const scrollBackCooldownRef = useRef(0);
  const isLandingRef = useRef(false);

  const isPortfolioActiveRef = useRef(isPortfolioActive);
  isPortfolioActiveRef.current = isPortfolioActive;
  useEffect(() => {
    isPortfolioActiveRef.current = isPortfolioActive;
    if (isPortfolioActive) {
      // Lock target frame cleanly at the end
      targetFrameRef.current = TOTAL_FRAMES - 1;
      smoothFrameRef.current = TOTAL_FRAMES - 1;
    }
  }, [isPortfolioActive]);

  const portfolioScrollPosRef = useRef(portfolioScrollPos);
  useEffect(() => {
    // When returning from Projects (1) to About (0), hold About firmly so momentum doesn't reverse transition
    if (portfolioScrollPosRef.current === 1 && portfolioScrollPos === 0) {
      aboutHoldUntilRef.current = Date.now() + 850;
      scrollBackAccumulatorRef.current = 0;
      targetFrameRef.current = TOTAL_FRAMES - 1;
      smoothFrameRef.current = TOTAL_FRAMES - 1;
    }
    portfolioScrollPosRef.current = portfolioScrollPos;
  }, [portfolioScrollPos]);

  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const onLandingCompleteRef = useRef(onLandingComplete);
  useEffect(() => {
    onLandingCompleteRef.current = onLandingComplete;
  }, [onLandingComplete]);

  const targetProgressRef = useRef(targetProgress);
  useEffect(() => {
    targetProgressRef.current = targetProgress;
  }, [targetProgress]);

  const onScrollBackToHeroRef = useRef(onScrollBackToHero);
  useEffect(() => {
    onScrollBackToHeroRef.current = onScrollBackToHero;
  }, [onScrollBackToHero]);

  const wakeAnimationRef = useRef<(() => void) | null>(null);
  const processDeltaRef = useRef<((deltaY: number) => void) | null>(null);

  const imagesLoadedRef = useRef(false);

  // ─── 1. Resize Canvas with Native High-DPI Retina Buffer ─────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(window.innerWidth * dpr);
    const targetH = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }, []);

  // ─── 2. Draw Frame to Canvas with High Quality Filtering ────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const targetImg = imagesRef.current[frameIndex];
    if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
      lastDrawnFrameRef.current = frameIndex;
      ctx.drawImage(targetImg, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Handle external navigation target progress
  useEffect(() => {
    if (targetProgress != null && isActive) {
      isLandingRef.current = false;
      const frame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1)))
      );
      targetFrameRef.current = frame;
      smoothFrameRef.current = frame;
      lastDrawnFrameRef.current = frame;
      drawFrame(frame);
      scrollBackCooldownRef.current = Date.now() + 450;
      onProgressChangeRef.current?.(targetProgress);
      wakeAnimationRef.current?.();
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
      onLandingCompleteRef.current?.();
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
        onLandingCompleteRef.current?.();
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
        if (loaded >= 5 && !hasDrawnInitialRef.current && lastDrawnFrameRef.current === 0) {
          hasDrawnInitialRef.current = true;
          drawFrame(0);
        }
        if (loaded === TOTAL_FRAMES) {
          imagesLoadedRef.current = true;
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
      wakeAnimationRef.current = null;
      return;
    }

    resizeCanvas();
    isScrolledBackRef.current = false;
    transitionCooldownRef.current = Date.now() + 450;

    // Reset to start on entering About transition (only on initial mount when entering via normal scroll, not in fast forward and not when dragging via scrollbar)
    if (
      !hasDrawnInitialRef.current &&
      !handoffRef.current &&
      !fastForwardTriggerRef.current &&
      targetProgressRef.current == null &&
      !isPortfolioActiveRef.current &&
      targetFrameRef.current <= 1
    ) {
      hasDrawnInitialRef.current = true;
      targetFrameRef.current = 1;
      smoothFrameRef.current = 1;
      lastDrawnFrameRef.current = 1;
      drawFrame(1);
      onProgressChangeRef.current?.(1 / (TOTAL_FRAMES - 1));
    }

    // Continuous liquid-smooth lerp loop (60fps/120fps)
    const raf = () => {
      if (!isFastForwardingRef.current) {
        const diff = targetFrameRef.current - smoothFrameRef.current;
        if (Math.abs(diff) > 0.015) {
          smoothFrameRef.current += diff * 0.24;
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

      // If at rest at the final frame in Portfolio section, sleep RAF loop to free 100% GPU/CPU
      if (
        !isLandingRef.current &&
        isPortfolioActiveRef.current &&
        smoothFrameRef.current >= TOTAL_FRAMES - 1.05 &&
        Math.abs(targetFrameRef.current - smoothFrameRef.current) < 0.05
      ) {
        animIdRef.current = null;
        return;
      }

      animIdRef.current = requestAnimationFrame(raf);
    };

    animIdRef.current = requestAnimationFrame(raf);

    const wakeAnimation = () => {
      if (!animIdRef.current) {
        animIdRef.current = requestAnimationFrame(raf);
      }
    };
    wakeAnimationRef.current = wakeAnimation;

    // Unified scroll processor for wheel, virtual-scroll, keys, and touch
    const processDelta = (deltaY: number) => {
      if (!isActive || isFastForwardingRef.current) return;

      // When Portfolio section is active, PortfolioSection manages its own scroll state
      if (isPortfolioActiveRef.current) {
        targetFrameRef.current = TOTAL_FRAMES - 1;
        smoothFrameRef.current = TOTAL_FRAMES - 1;
        return;
      }

      wakeAnimation();

      if (deltaY > 0) {
        // Scrolling DOWN / FORWARD towards About / PC
        isLandingRef.current = false;
        isScrolledBackRef.current = false;

        const deltaFrames = Math.max(0.6, Math.min(8, Math.abs(deltaY) * 0.08));
        const nextTarget = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + deltaFrames);
        targetFrameRef.current = nextTarget;

        // Only complete landing when user actively drives forward to the final frame (105)
        // and scroll-back cooldown has passed:
        if (Date.now() > scrollBackCooldownRef.current && nextTarget >= TOTAL_FRAMES - 1) {
          targetFrameRef.current = TOTAL_FRAMES - 1;
          smoothFrameRef.current = TOTAL_FRAMES - 1;
          drawFrame(TOTAL_FRAMES - 1);
          onProgressChangeRef.current?.(1);
          onLandingCompleteRef.current?.();
        }
      } else if (deltaY < 0) {
        // Scrolling UP / BACKWARD towards Hero
        isLandingRef.current = false;

        if (targetFrameRef.current > TOTAL_FRAMES - 1) {
          targetFrameRef.current = TOTAL_FRAMES - 1;
        }

        const deltaFrames = Math.max(0.6, Math.min(8, Math.abs(deltaY) * 0.08));
        targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);

        // If scrubbed to beginning and continuing upward, return to Hero
        if (
          Date.now() > transitionCooldownRef.current &&
          targetFrameRef.current <= 0.2 &&
          deltaY < -3 &&
          !isScrolledBackRef.current
        ) {
          isScrolledBackRef.current = true;
          onScrollBackToHeroRef.current?.();
        }
      }
    };

    processDeltaRef.current = processDelta;

    // Direct wheel handler for the window: reliable, captures 100% of wheel events exactly once
    const handleWindowWheel = (e: WheelEvent) => {
      if (!isActive || isPortfolioActiveRef.current || isFastForwardingRef.current) return;
      processDelta(e.deltaY);
    };
    window.addEventListener("wheel", handleWindowWheel, { passive: true });

    // Keyboard navigation (ArrowDown, ArrowUp, PageDown, PageUp, Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isPortfolioActiveRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        processDelta(35);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        processDelta(-35);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      processDeltaRef.current = null;
      window.removeEventListener("wheel", handleWindowWheel);
      window.removeEventListener("keydown", handleKeyDown);
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      wakeAnimationRef.current = null;
    };
  }, [isActive, lenis, drawFrame, resizeCanvas]);

  return (
    <div
      className={`fixed inset-0 z-50 w-full h-full overflow-hidden select-none ${
        isActive
          ? "opacity-100 pointer-events-auto visible"
          : "opacity-0 pointer-events-none invisible"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-fill cursor-default block select-none render-high-quality"
      />
      <div
        className="absolute inset-0 pointer-events-none video-corner-overlay"
        aria-hidden="true"
      />
    </div>
  );
}
