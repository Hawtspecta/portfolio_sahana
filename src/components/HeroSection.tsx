"use client";

import { useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";

const TOTAL_FRAMES = 80;
const FRAME_PATH = "/assets/hero_frames/ezgif-frame-";
const FRAME_EXT = ".png";

interface HeroSectionProps {
  isActive: boolean;
  isAboutActive?: boolean;
  onHeroComplete?: () => void;
  onScrollPastHero?: () => void;
  onScrollBackToSplash?: () => void;
}

export default function HeroSection({
  isActive,
  isAboutActive = false,
  onHeroComplete,
  onScrollPastHero,
  onScrollBackToSplash,
}: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lenisRef = useRef<Lenis | null>(null);

  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(0);
  const isPlayingForwardRef = useRef(false);
  const forwardAnimIdRef = useRef<number | null>(null);
  const scrubAnimIdRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const isScrolledBackRef = useRef(false);
  const isAboutActiveRef = useRef(isAboutActive);

  const onHeroCompleteRef = useRef(onHeroComplete);
  useEffect(() => {
    onHeroCompleteRef.current = onHeroComplete;
  }, [onHeroComplete]);

  const onScrollPastHeroRef = useRef(onScrollPastHero);
  useEffect(() => {
    onScrollPastHeroRef.current = onScrollPastHero;
  }, [onScrollPastHero]);

  const onScrollBackToSplashRef = useRef(onScrollBackToSplash);
  useEffect(() => {
    onScrollBackToSplashRef.current = onScrollBackToSplash;
  }, [onScrollBackToSplash]);

  const imagesLoadedRef = useRef(false);

  // ─── 1. Draw Frame to Canvas with High DPI & Glitch Protection ─────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const targetW = Math.round(window.innerWidth * dpr);
    const targetH = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

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

  // When About transition is active, keep Hero painted at final typewriter frame 80 for zero-blink return
  useEffect(() => {
    isAboutActiveRef.current = isAboutActive;
    if (isAboutActive) {
      targetFrameRef.current = TOTAL_FRAMES - 1;
      smoothFrameRef.current = TOTAL_FRAMES - 1;
      drawFrame(TOTAL_FRAMES - 1);
      hasCompletedRef.current = true;
    }
  }, [isAboutActive, drawFrame]);

  // ─── 2. Preload and pre-decode all 80 hero PNG frames ─────────────
  useEffect(() => {
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
  }, [drawFrame]);

  // ─── 3. Auto-play forward from start to frame 80 ──────────────────
  const playForward = useCallback((startFrame: number) => {
    if (forwardAnimIdRef.current) {
      cancelAnimationFrame(forwardAnimIdRef.current);
      forwardAnimIdRef.current = null;
    }

    isPlayingForwardRef.current = true;
    const targetIndex = TOTAL_FRAMES - 1;
    const framesToPlay = targetIndex - startFrame;
    if (framesToPlay <= 0) {
      isPlayingForwardRef.current = false;
      hasCompletedRef.current = true;
      onHeroCompleteRef.current?.();
      return;
    }

    // Natural typewriter pace: 30fps -> ~2.6s
    const durationMs = Math.round((framesToPlay / 30) * 1000);
    const startTime = performance.now();

    const step = (now: number) => {
      if (!isPlayingForwardRef.current) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentFrame = Math.min(
        targetIndex,
        Math.round(startFrame + (targetIndex - startFrame) * progress)
      );

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      drawFrame(currentFrame);

      if (progress < 1 && currentFrame < targetIndex) {
        forwardAnimIdRef.current = requestAnimationFrame(step);
      } else {
        forwardAnimIdRef.current = null;
        isPlayingForwardRef.current = false;
        hasCompletedRef.current = true;
        targetFrameRef.current = targetIndex;
        smoothFrameRef.current = targetIndex;
        drawFrame(targetIndex);
        onHeroCompleteRef.current?.();
      }
    };

    forwardAnimIdRef.current = requestAnimationFrame(step);
  }, [drawFrame]);

  // ─── 4. Lenis Smooth Scroll Lifecycle ─────────────────────────────
  useEffect(() => {
    if (!isActive) {
      if (forwardAnimIdRef.current) {
        cancelAnimationFrame(forwardAnimIdRef.current);
        forwardAnimIdRef.current = null;
      }
      if (scrubAnimIdRef.current) {
        cancelAnimationFrame(scrubAnimIdRef.current);
        scrubAnimIdRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      isPlayingForwardRef.current = false;
      return;
    }

    isScrolledBackRef.current = false;

    // If entering fresh from splash, start at frame 0 and play forward
    if (!hasCompletedRef.current) {
      targetFrameRef.current = 0;
      smoothFrameRef.current = 0;
      drawFrame(0);
      playForward(0);
    } else {
      // Re-entering from About transition: sit at final frame 80
      targetFrameRef.current = TOTAL_FRAMES - 1;
      smoothFrameRef.current = TOTAL_FRAMES - 1;
      drawFrame(TOTAL_FRAMES - 1);
    }

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.15,
    });
    lenisRef.current = lenis;

    // Handle scroll input through Lenis virtual scroll
    lenis.on("virtual-scroll", ({ deltaY }) => {
      // Yield to About transition when active
      if (isAboutActiveRef.current) return;

      // If user scrolls UP (backward):
      if (deltaY < -4) {
        // Stop forward auto-playback if still playing
        if (isPlayingForwardRef.current) {
          isPlayingForwardRef.current = false;
          if (forwardAnimIdRef.current) {
            cancelAnimationFrame(forwardAnimIdRef.current);
            forwardAnimIdRef.current = null;
          }
        }

        hasCompletedRef.current = false;
        const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.05);
        targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);

        // If scrubbed to start (frame 0) and user continues scrolling UP:
        if (targetFrameRef.current <= 0.5 && deltaY < -4 && !isScrolledBackRef.current) {
          isScrolledBackRef.current = true;
          onScrollBackToSplashRef.current?.();
        }
      } else if (deltaY > 6) {
        // If user scrolls DOWN (forward):
        if (hasCompletedRef.current || targetFrameRef.current >= TOTAL_FRAMES - 1.5) {
          // At end of hero: advance to About transition
          onScrollPastHeroRef.current?.();
        } else {
          // Scrub forward towards frame 80
          const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.05);
          targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + deltaFrames);

          if (targetFrameRef.current >= TOTAL_FRAMES - 1) {
            hasCompletedRef.current = true;
            onHeroCompleteRef.current?.();
          }
        }
      }
    });

    // Continuous 60fps/120fps display refresh lerp loop
    const raf = (time: number) => {
      lenis.raf(time);

      if (!isPlayingForwardRef.current) {
        const diff = targetFrameRef.current - smoothFrameRef.current;
        if (Math.abs(diff) > 0.02) {
          smoothFrameRef.current += diff * 0.26;
        } else {
          smoothFrameRef.current = targetFrameRef.current;
        }

        const frameToDraw = Math.min(
          TOTAL_FRAMES - 1,
          Math.max(0, Math.round(smoothFrameRef.current))
        );

        if (frameToDraw !== lastDrawnFrameRef.current) {
          drawFrame(frameToDraw);
        }
      }

      scrubAnimIdRef.current = requestAnimationFrame(raf);
    };

    scrubAnimIdRef.current = requestAnimationFrame(raf);

    const handleResize = () => {
      lenis.resize();
      drawFrame(lastDrawnFrameRef.current || 0);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (forwardAnimIdRef.current) cancelAnimationFrame(forwardAnimIdRef.current);
      if (scrubAnimIdRef.current) cancelAnimationFrame(scrubAnimIdRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isActive, drawFrame, playForward]);

  // Click on hero canvas fast-forwards to completed frame 80
  const handleCanvasClick = useCallback(() => {
    if (hasCompletedRef.current) return;
    if (isPlayingForwardRef.current) {
      isPlayingForwardRef.current = false;
      if (forwardAnimIdRef.current) {
        cancelAnimationFrame(forwardAnimIdRef.current);
        forwardAnimIdRef.current = null;
      }
    }
    const lastIndex = TOTAL_FRAMES - 1;
    targetFrameRef.current = lastIndex;
    smoothFrameRef.current = lastIndex;
    drawFrame(lastIndex);
    hasCompletedRef.current = true;
    onHeroCompleteRef.current?.();
  }, [drawFrame]);

  return (
    <div
      className={`fixed inset-0 w-full h-full select-none bg-black ${
        isActive
          ? `opacity-100 ${isAboutActive ? "pointer-events-none z-30" : "pointer-events-auto z-40"}`
          : "opacity-0 pointer-events-none z-0"
      }`}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full object-fill cursor-pointer block select-none"
      />
    </div>
  );
}

