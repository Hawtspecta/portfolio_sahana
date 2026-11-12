"use client";

import { useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";
import { lenisSmoothRocketEase } from "@/lib/lenis";

const TOTAL_FRAMES = 119;
const HERO_RUNWAY_PX = 2200;
const FRAME_PATH = "/assets/hero_frames/ezgif-frame-";
const FRAME_EXT = ".webp";

export interface FastForwardHandoff {
  startTime: number;
  totalDurationMs: number;
  heroFraction: number;
}

interface HeroSectionProps {
  isActive: boolean;
  canPreload?: boolean;
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
  canPreload = true,
  isAboutActive = false,
  onHeroComplete,
  onScrollPastHero,
  onFastForwardComplete,
  onProgressChange,
  targetProgress,
  fastForwardTrigger,
}: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const localLenisRef = useRef<Lenis | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const initialFrame = isAboutActive
    ? TOTAL_FRAMES - 1
    : targetProgress != null
    ? Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1))))
    : 0;
  const targetFrameRef = useRef(initialFrame);
  const smoothFrameRef = useRef(initialFrame);
  const lastDrawnFrameRef = useRef(-1);
  const hasDrawnInitialRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const isAboutActiveRef = useRef(isAboutActive);
  const wasAboutActiveRef = useRef(false);
  const isFastForwardingRef = useRef(false);
  const transitionCooldownRef = useRef(0);
  const lastWheelScrubTimeRef = useRef(0);

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

  // ─── 1. Resize Canvas with Optimal Crisp Buffer (fast 60/120fps) ──
  const resizeCanvas = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetW = Math.round(window.innerWidth * dpr);
    const targetH = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
      return true;
    }
    return false;
  }, []);

  // ─── 2. Draw Frame to Canvas (Crisp Single Frame, Zero Ghosting) ───
  const drawFrame = useCallback((frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIndex)));
    if (!force && idx === lastDrawnFrameRef.current) return;

    const targetImg = imagesRef.current[idx];
    if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
      lastDrawnFrameRef.current = idx;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(targetImg, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Handle external navigation target progress (guarded against racing active wheel scrub)
  useEffect(() => {
    if (targetProgress != null && isActive && !isAboutActive) {
      // Never let an async React prop update fight recent direct wheel scrubbing
      if (Date.now() - lastWheelScrubTimeRef.current < 220) {
        onProgressChangeRef.current?.(targetFrameRef.current / (TOTAL_FRAMES - 1));
        return;
      }
      const frame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1)))
      );
      targetFrameRef.current = frame;
      smoothFrameRef.current = frame;
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

    // ─── 3. Staged trickle-preload of 119 hero frames (zero Splash/cursor stutter) ───
    useEffect(() => {
      if (!canPreload) return;
      resizeCanvas();
      let loaded = 0;
      let cancelled = false;
      const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
      imagesRef.current = images;

      const loadFrame = (i: number) => {
        if (cancelled) return;
        const img = new window.Image();
        img.src = `${FRAME_PATH}${String(i).padStart(3, "0")}${FRAME_EXT}`;
        if ("decode" in img) {
          img.decode().catch(() => {});
        }

        const handleLoad = () => {
          loaded++;
          loadedCountRef.current = loaded;
          if (lastDrawnFrameRef.current < 0) {
            const targetIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(smoothFrameRef.current)));
            const targetImg = images[targetIdx];
            if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
              hasDrawnInitialRef.current = true;
              drawFrame(targetIdx, true);
            }
          }
          if (loaded === TOTAL_FRAMES) {
            imagesLoadedRef.current = true;
          }
        };
        img.onload = handleLoad;
        img.onerror = handleLoad;
        images[i - 1] = img;
      };

      // Load first 12 frames immediately so Hero's entry is instant
      for (let i = 1; i <= Math.min(12, TOTAL_FRAMES); i++) {
        loadFrame(i);
      }

      // Trickle remaining frames in small batches so Splash playback & cursor never stutter
      let nextIdx = 13;
      const trickleTimer = setInterval(() => {
        if (cancelled || nextIdx > TOTAL_FRAMES) {
          clearInterval(trickleTimer);
          return;
        }
        const end = Math.min(TOTAL_FRAMES, nextIdx + 5);
        for (let i = nextIdx; i <= end; i++) {
          loadFrame(i);
        }
        nextIdx = end + 1;
      }, 90);

      const handleWindowResize = () => {
        resizeCanvas();
        drawFrame(lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0, true);
      };
      window.addEventListener("resize", handleWindowResize);
      return () => {
        cancelled = true;
        clearInterval(trickleTimer);
        window.removeEventListener("resize", handleWindowResize);
      };
    }, [canPreload, drawFrame, resizeCanvas]);

  // ─── 4. Unified Lenis Smooth Scroll Lifecycle (100% Lenis-Driven) ───
  useEffect(() => {
    if (!isActive || isAboutActive) {
      if (localLenisRef.current) {
        localLenisRef.current.destroy();
        localLenisRef.current = null;
      }
      wasAboutActiveRef.current = isAboutActive;
      return;
    }

    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    const containerEl = containerRef.current;
    if (!wrapper || !content || !containerEl) return;

    resizeCanvas();
    drawFrame(smoothFrameRef.current || 0, true);

    const syncContentHeight = () => {
      const baseH = wrapper.clientHeight || window.innerHeight || 720;
      content.style.height = `${Math.ceil(baseH + HERO_RUNWAY_PX)}px`;
    };
    syncContentHeight();

    // Returning from About: anchor seamlessly at final hero frame (only if not already scrubbed earlier)
    if (wasAboutActiveRef.current) {
      transitionCooldownRef.current = Date.now() + 450;
      if (
        targetProgressRef.current == null &&
        targetFrameRef.current >= TOTAL_FRAMES - 1 &&
        smoothFrameRef.current >= TOTAL_FRAMES - 1
      ) {
        const returnIndex = TOTAL_FRAMES - 1;
        targetFrameRef.current = returnIndex;
        smoothFrameRef.current = returnIndex;
        drawFrame(returnIndex);
        hasCompletedRef.current = false;
      }
    }
    wasAboutActiveRef.current = false;

    const heroLenis = new Lenis({
      wrapper,
      content,
      eventsTarget: containerEl,
      lerp: 0.085,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.0,
      syncTouch: true,
      overscroll: false,
      autoRaf: true,
    });
    localLenisRef.current = heroLenis;

    const initialScroll = (smoothFrameRef.current / (TOTAL_FRAMES - 1)) * HERO_RUNWAY_PX;
    if (initialScroll > 0) {
      heroLenis.scrollTo(initialScroll, { immediate: true, force: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      syncContentHeight();
      heroLenis.resize();
    });
    resizeObserver.observe(wrapper);

    const unsubscribeScroll = heroLenis.on("scroll", ({ scroll }) => {
      if (isAboutActiveRef.current || isFastForwardingRef.current) return;
      lastWheelScrubTimeRef.current = Date.now();

      const progress = Math.max(0, Math.min(1, scroll / HERO_RUNWAY_PX));
      const frameIdx = Math.round(progress * (TOTAL_FRAMES - 1));

      targetFrameRef.current = frameIdx;
      smoothFrameRef.current = frameIdx;

      if (frameIdx !== lastDrawnFrameRef.current) {
        drawFrame(frameIdx);
        onProgressChangeRef.current?.(progress);
      }

      if (progress >= 0.995 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onHeroCompleteRef.current?.();
      } else if (progress < 0.98) {
        hasCompletedRef.current = false;
      }
    });

    const unsubscribeVirtual = heroLenis.on("virtual-scroll", ({ deltaY }) => {
      if (!isActive || isAboutActiveRef.current || isFastForwardingRef.current) return;
      if (
        deltaY > 2 &&
        Date.now() > transitionCooldownRef.current &&
        heroLenis.scroll >= HERO_RUNWAY_PX - 3
      ) {
        onScrollPastHeroRef.current?.();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isAboutActiveRef.current || isFastForwardingRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        if (
          Date.now() > transitionCooldownRef.current &&
          heroLenis.scroll >= HERO_RUNWAY_PX - 3
        ) {
          onScrollPastHeroRef.current?.();
        } else {
          heroLenis.scrollTo(Math.min(HERO_RUNWAY_PX, heroLenis.scroll + 220), {
            duration: 0.7,
          });
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        heroLenis.scrollTo(Math.max(0, heroLenis.scroll - 220), {
          duration: 0.7,
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unsubscribeScroll();
      unsubscribeVirtual();
      resizeObserver.disconnect();
      heroLenis.destroy();
      if (localLenisRef.current === heroLenis) {
        localLenisRef.current = null;
      }
    };
  }, [isActive, isAboutActive, drawFrame, resizeCanvas]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full select-none bg-black transition-opacity duration-700 ease-in-out ${isActive
          ? `opacity-100 ${isAboutActive ? "pointer-events-none z-30" : "pointer-events-auto z-40"}`
          : "opacity-0 pointer-events-none z-0"
        }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-fill cursor-default block select-none pointer-events-none render-high-quality"
      />
      <div
        className="absolute inset-0 pointer-events-none video-corner-overlay"
        aria-hidden="true"
      />
      <div
        ref={scrollWrapperRef}
        className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div ref={scrollContentRef} className="w-full pointer-events-none" />
      </div>
    </div>
  );
}
