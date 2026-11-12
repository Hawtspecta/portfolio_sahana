"use client";

import { useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";
import { lenisSmoothRocketEase } from "@/lib/lenis";

const TOTAL_FRAMES = 106;
const TRANSITION_RUNWAY_PX = 2000;
const FRAME_PATH = "/assets/transition/ezgif-frame-";
const FRAME_EXT = ".webp";

export interface FastForwardHandoff {
  startTime: number;
  totalDurationMs: number;
  heroFraction: number;
}

interface AboutTransitionProps {
  isActive: boolean;
  canPreload?: boolean;
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
  canPreload = true,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const localLenisRef = useRef<Lenis | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const initialFrame =
    isPortfolioActive || (targetProgress != null && targetProgress >= 0.98)
      ? TOTAL_FRAMES - 1
      : targetProgress != null
      ? Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1))))
      : 0;
  const targetFrameRef = useRef(initialFrame);
  const smoothFrameRef = useRef(initialFrame);
  const lastDrawnFrameRef = useRef(-1);
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
    } else if (isActive) {
      // Returning to transition from Portfolio: ensure we are cleanly anchored at the last frame
      if (targetFrameRef.current > TOTAL_FRAMES - 1) {
        targetFrameRef.current = TOTAL_FRAMES - 1;
      }
      wakeAnimationRef.current?.();
    }
  }, [isPortfolioActive, isActive]);

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

  // ─── 1. Resize Canvas with Optimal Crisp Buffer (fast 60/120fps) ──
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

  // ─── 2. Draw Frame to Canvas (Crisp Single Frame, Zero Ghosting) ───
  const drawFrame = useCallback((frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIndex)));
    if (!force && idx === lastDrawnFrameRef.current) return;

    let drawIdx = idx;
    let targetImg: HTMLImageElement | undefined = imagesRef.current[drawIdx];
    if (!targetImg || !targetImg.complete || targetImg.naturalWidth === 0) {
      targetImg = undefined;
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (idx - offset >= 0) {
          const prevImg = imagesRef.current[idx - offset];
          if (prevImg && prevImg.complete && prevImg.naturalWidth > 0) {
            drawIdx = idx - offset;
            targetImg = prevImg;
            break;
          }
        }
        if (idx + offset < TOTAL_FRAMES) {
          const nextImg = imagesRef.current[idx + offset];
          if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
            drawIdx = idx + offset;
            targetImg = nextImg;
            break;
          }
        }
      }
    }

    if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
      if (!force && drawIdx === lastDrawnFrameRef.current) return;
      lastDrawnFrameRef.current = drawIdx;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
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
      // Guard against disrupting active backward wheel scrub near handoff frame (e.g. 104/105)
      if (
        frame >= TOTAL_FRAMES - 2 &&
        targetFrameRef.current < TOTAL_FRAMES - 1 &&
        smoothFrameRef.current < TOTAL_FRAMES - 1
      ) {
        onProgressChangeRef.current?.(targetProgress);
        return;
      }
      targetFrameRef.current = frame;
      smoothFrameRef.current = frame;
      lastDrawnFrameRef.current = frame;
      drawFrame(frame);
      if (localLenisRef.current) {
        localLenisRef.current.scrollTo(targetProgress * TRANSITION_RUNWAY_PX, {
          immediate: true,
          force: true,
        });
      }
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
    const startFrame = Math.max(0, Math.min(TOTAL_FRAMES - 2, Math.round(smoothFrameRef.current)));
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

    const durationMs = 1100;
    const startTime = performance.now();
    let lastEmittedPct = -1;

    const fastForwardStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = lenisSmoothRocketEase(progress);
      const currentFrame = Math.min(lastFrameIndex, Math.round(startFrame + framesToFastForward * easedProgress));

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      drawFrame(currentFrame);
      const nextRatio = currentFrame / lastFrameIndex;
      if (nextRatio - lastEmittedPct >= 0.04 || currentFrame >= lastFrameIndex) {
        lastEmittedPct = nextRatio;
        onProgressChangeRef.current?.(nextRatio);
      }

      if (progress < 1 && currentFrame < lastFrameIndex) {
        fastForwardAnimIdRef.current = requestAnimationFrame(fastForwardStep);
      } else {
        fastForwardAnimIdRef.current = null;
        isFastForwardingRef.current = false;
        targetFrameRef.current = lastFrameIndex;
        smoothFrameRef.current = lastFrameIndex;
        drawFrame(lastFrameIndex);
        if (localLenisRef.current) {
          localLenisRef.current.scrollTo(TRANSITION_RUNWAY_PX, { immediate: true, force: true });
        }
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

  // ─── 4. Staged trickle-preload of 106 transition frames (zero Hero/cursor stutter) ───
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

    // All transition frames are already cached by SplashScreen; populate imagesRef immediately so Skip never hits blank end frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      loadFrame(i);
    }

    const handleWindowResize = () => {
      resizeCanvas();
      drawFrame(lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0, true);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [canPreload, drawFrame, resizeCanvas]);

  // ─── 5. Unified Lenis Smooth Scroll Lifecycle (100% Lenis-Driven) ───
  useEffect(() => {
    if (!isActive || isPortfolioActive) {
      if (localLenisRef.current) {
        localLenisRef.current.destroy();
        localLenisRef.current = null;
      }
      return;
    }

    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    const containerEl = containerRef.current;
    if (!wrapper || !content || !containerEl) return;

    resizeCanvas();
    drawFrame(smoothFrameRef.current || 0, true);
    isScrolledBackRef.current = false;
    transitionCooldownRef.current = Date.now() + 450;

    const syncContentHeight = () => {
      const baseH = wrapper.clientHeight || window.innerHeight || 720;
      content.style.height = `${Math.ceil(baseH + TRANSITION_RUNWAY_PX)}px`;
    };
    syncContentHeight();

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

    const transLenis = new Lenis({
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
    localLenisRef.current = transLenis;

    const initialScroll = (smoothFrameRef.current / (TOTAL_FRAMES - 1)) * TRANSITION_RUNWAY_PX;
    if (initialScroll > 0) {
      transLenis.scrollTo(initialScroll, { immediate: true, force: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      syncContentHeight();
      transLenis.resize();
    });
    resizeObserver.observe(wrapper);

    const unsubscribeScroll = transLenis.on("scroll", ({ scroll }) => {
      if (isPortfolioActiveRef.current || isFastForwardingRef.current) return;

      const progress = Math.max(0, Math.min(1, scroll / TRANSITION_RUNWAY_PX));
      const frameIdx = Math.round(progress * (TOTAL_FRAMES - 1));

      targetFrameRef.current = frameIdx;
      smoothFrameRef.current = frameIdx;

      if (frameIdx !== lastDrawnFrameRef.current) {
        drawFrame(frameIdx);
        onProgressChangeRef.current?.(progress);
      }

      if (
        !isPortfolioActiveRef.current &&
        Date.now() > scrollBackCooldownRef.current &&
        progress >= 0.996
      ) {
        targetFrameRef.current = TOTAL_FRAMES - 1;
        smoothFrameRef.current = TOTAL_FRAMES - 1;
        drawFrame(TOTAL_FRAMES - 1);
        onProgressChangeRef.current?.(1);
        onLandingCompleteRef.current?.();
      }
    });

    const unsubscribeVirtual = transLenis.on("virtual-scroll", ({ deltaY }) => {
      if (!isActive || isPortfolioActiveRef.current || isFastForwardingRef.current) return;
      if (
        deltaY < -2 &&
        Date.now() > transitionCooldownRef.current &&
        transLenis.scroll <= 3 &&
        !isScrolledBackRef.current
      ) {
        isScrolledBackRef.current = true;
        onScrollBackToHeroRef.current?.();
      }
    });

    // Keyboard navigation (ArrowDown, ArrowUp, PageDown, PageUp, Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isPortfolioActiveRef.current || isFastForwardingRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        transLenis.scrollTo(Math.min(TRANSITION_RUNWAY_PX, transLenis.scroll + 220), {
          duration: 0.7,
        });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (
          Date.now() > transitionCooldownRef.current &&
          transLenis.scroll <= 3 &&
          !isScrolledBackRef.current
        ) {
          isScrolledBackRef.current = true;
          onScrollBackToHeroRef.current?.();
        } else {
          transLenis.scrollTo(Math.max(0, transLenis.scroll - 220), {
            duration: 0.7,
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unsubscribeScroll();
      unsubscribeVirtual();
      resizeObserver.disconnect();
      transLenis.destroy();
      if (localLenisRef.current === transLenis) {
        localLenisRef.current = null;
      }
    };
  }, [isActive, isPortfolioActive, lenis, drawFrame, resizeCanvas]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 w-full h-full overflow-hidden select-none ${
        isActive
          ? "opacity-100 pointer-events-auto visible"
          : "opacity-0 pointer-events-none invisible"
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
