"use client";

import { useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";

const TOTAL_FRAMES = 106;
const FRAME_PATH = "/assets/transition/ezgif-frame-";
const FRAME_EXT = ".png";

interface AboutTransitionProps {
  isActive: boolean;
  onProgressChange?: (progress: number) => void;
  onScrollBackToHero?: () => void;
}

export default function AboutTransition({
  isActive,
  onProgressChange,
  onScrollBackToHero,
}: AboutTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lenisRef = useRef<Lenis | null>(null);

  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(0);
  const animIdRef = useRef<number | null>(null);
  const isScrolledBackRef = useRef(false);

  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const onScrollBackToHeroRef = useRef(onScrollBackToHero);
  useEffect(() => {
    onScrollBackToHeroRef.current = onScrollBackToHero;
  }, [onScrollBackToHero]);

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

  // ─── 2. Preload and pre-decode all 106 transition PNG frames ───────
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.src = `${FRAME_PATH}${String(i).padStart(3, "0")}${FRAME_EXT}`;

      // Decode off the main thread for glitch-free 60fps/120fps scrubbing
      if ("decode" in img) {
        img.decode().catch(() => { });
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
  }, [drawFrame]);

  // ─── 3. Initialize Lenis Smooth Scroll when Active ─────────────────
  useEffect(() => {
    if (!isActive) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      return;
    }

    // Scroll window to top on entering About transition
    window.scrollTo(0, 0);
    targetFrameRef.current = 0;
    smoothFrameRef.current = 0;
    lastDrawnFrameRef.current = 0;
    isScrolledBackRef.current = false;
    drawFrame(0);

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

    // Map Lenis scroll position to frame index
    lenis.on("scroll", (e) => {
      const progress = Math.min(1, Math.max(0, e.progress));
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
      onProgressChangeRef.current?.(progress);
    });

    // Detect scroll-up past top boundary to return back to hero/splash
    lenis.on("virtual-scroll", ({ deltaY }) => {
      if (
        (lenis.scroll <= 4 || smoothFrameRef.current <= 0.8) &&
        deltaY < -4 &&
        !isScrolledBackRef.current
      ) {
        drawFrame(0);
        window.scrollTo(0, 0);
        isScrolledBackRef.current = true;
        onScrollBackToHeroRef.current?.();
      }
    });

    // Continuous smooth animation loop
    const raf = (time: number) => {
      lenis.raf(time);

      // Lerp frame interpolation for liquid-smooth 60fps/120fps display refresh
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

      animIdRef.current = requestAnimationFrame(raf);
    };

    animIdRef.current = requestAnimationFrame(raf);

    const handleResize = () => {
      lenis.resize();
      drawFrame(lastDrawnFrameRef.current || 0);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isActive, drawFrame]);

  // Click on canvas smoothly scrolls forward to the final retro computer frame
  const handleCanvasClick = useCallback(() => {
    if (!lenisRef.current) return;
    if (smoothFrameRef.current < TOTAL_FRAMES - 5) {
      lenisRef.current.scrollTo("bottom", { duration: 1.4 });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isActive ? "block pointer-events-auto" : "hidden pointer-events-none"
        }`}
      style={{ height: "280vh" }}
    >
      {/* Fixed viewport holding the 106-frame canvas */}
      <div className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none pointer-events-auto">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full object-fill cursor-pointer block select-none"
        />
      </div>
    </div>
  );
}