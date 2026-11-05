"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import NextImage from "next/image";
import Lenis from "lenis";

const START_FRAME = 6;
const CHECKPOINT_FRAME = 88;
const END_FRAME = 201;

const CHECKPOINT_INDEX = CHECKPOINT_FRAME - START_FRAME; // 88 - 6 = 82
const TOTAL_FRAMES = END_FRAME - START_FRAME + 1; // 196 frames starting from frame 6
const FULL_AUDIO_DURATION = 6.7; // original 201 frames duration in seconds
const AUDIO_START_OFFSET = ((START_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~0.167s
const AUDIO_CHECKPOINT_TIME = ((CHECKPOINT_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~2.900s
const AUDIO_END_TIME = ((END_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~6.667s
const AUDIO_SRC = "/assets/splash-audio.mp3";

const FRAME_PATH = "/assets/splash_frames/ezgif-frame-";
const FRAME_EXT = ".png";

const emptySubscribe = () => () => { };

function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    () => window.innerWidth < 768,
    () => false
  );
}

interface SplashScreenProps {
  onComplete?: () => void;
  onLastFrameChange?: (isLastFrame: boolean) => void;
  isHeroActive?: boolean;
  onScrollPastHero?: () => void;
  isAboutActive?: boolean;
  onScrollBackFromAbout?: () => void;
}

/**
 * Cinematic trigger-based splash screen with liquid Lenis backward scrubbing:
 * - Forward trigger 1 (scroll down/swipe up/click): plays Part 1 automatically from current frame to frame 88.
 * - Frame 88 checkpoint: automatically pauses, "Scroll to explore" hint reappears.
 * - Forward trigger 2 (scroll down/swipe up/click): plays Part 2 automatically from current frame to frame 201 (end).
 * - Backward scroll: liquid-smooth frame-by-frame scrub driven by Lenis virtual physics.
 * - Skip button: fast-forwards smoothly to frame 201 at any time.
 */
export default function SplashScreen({
  onComplete,
  onLastFrameChange,
  isHeroActive = false,
  onScrollPastHero,
  isAboutActive = false,
  onScrollBackFromAbout,
}: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const currentRenderedFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);

  const isFastForwardingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isCooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAnimIdRef = useRef<number | null>(null);
  const scrubAnimIdRef = useRef<number | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFrameStateRef = useRef(false);
  const hasReachedLastFrameRef = useRef(false);

  const isAboutActiveRef = useRef(isAboutActive);
  useEffect(() => {
    isAboutActiveRef.current = isAboutActive;
  }, [isAboutActive]);

  const onScrollBackFromAboutRef = useRef(onScrollBackFromAbout);
  useEffect(() => {
    onScrollBackFromAboutRef.current = onScrollBackFromAbout;
  }, [onScrollBackFromAbout]);

  const onScrollPastHeroRef = useRef(onScrollPastHero);
  useEffect(() => {
    onScrollPastHeroRef.current = onScrollPastHero;
  }, [onScrollPastHero]);

  const mounted = useHasMounted();
  const isMobile = useIsMobile();

  // Desktop skip button layout: fixed directly to screen
  const desktopSkipStyle: React.CSSProperties = {
    left: "85.5%",
    top: "76.8%",
    width: "10.4%",
    height: "12.8%",
  };

  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // ─── Draw a specific frame onto the canvas ────────────────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Use devicePixelRatio so 4K images render at full native display resolution
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
      currentRenderedFrameRef.current = frameIndex;
      ctx.drawImage(targetImg, 0, 0, canvas.width, canvas.height);
    } else {
      const fallbackImg = imagesRef.current[currentRenderedFrameRef.current];
      if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
        ctx.drawImage(fallbackImg, 0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Synchronize Hero state: when scrolling back into Splash from Hero, sit ready at frame 201
  useEffect(() => {
    lastFrameStateRef.current = !!isHeroActive;
    if (!isHeroActive && hasReachedLastFrameRef.current && ready) {
      const lastIndex = TOTAL_FRAMES - 1;
      targetFrameRef.current = lastIndex;
      smoothFrameRef.current = lastIndex;
      currentRenderedFrameRef.current = lastIndex;
      drawFrame(lastIndex);
      setShowSkipButton(true);
      setShowScrollHint(false);
    }
  }, [isHeroActive, ready, drawFrame]);

  // ─── Smooth Audio Fade Helper ────────────────────────────────────
  const fadeAudioTo = useCallback((targetVol: number, durationMs = 200, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const steps = 12;
    const stepDuration = durationMs / steps;
    const startVol = audio.volume;
    const diff = targetVol - startVol;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const nextVol = Math.max(0, Math.min(1, startVol + (diff * (currentStep / steps))));
      audio.volume = nextVol;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        audio.volume = targetVol;
        if (onDone) onDone();
      }
    }, stepDuration);
  }, []);

  // ─── Forward Segment Playback ────────────────────────────────────
  const playSegment = useCallback((
    startIndex: number,
    targetIndex: number,
    startAudioTime: number,
    endAudioTime: number,
    durationMs: number,
    onFinish: () => void
  ) => {
    if (activeAnimIdRef.current) {
      cancelAnimationFrame(activeAnimIdRef.current);
      activeAnimIdRef.current = null;
    }

    isPlayingRef.current = true;
    setShowScrollHint(false);

    const audio = audioRef.current;
    if (audio) {
      try {
        audio.currentTime = startAudioTime;
        audio.playbackRate = 1.0;
        audio.volume = 1.0;
        audio.play().catch(() => { });
      } catch { }
    }

    const startTime = performance.now();

    const step = (now: number) => {
      if (!isPlayingRef.current) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentFrame = Math.min(
        targetIndex,
        Math.round(startIndex + (targetIndex - startIndex) * progress)
      );

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      currentRenderedFrameRef.current = currentFrame;
      drawFrame(currentFrame);

      if (progress < 1 && currentFrame < targetIndex) {
        activeAnimIdRef.current = requestAnimationFrame(step);
      } else {
        activeAnimIdRef.current = null;
        targetFrameRef.current = targetIndex;
        smoothFrameRef.current = targetIndex;
        currentRenderedFrameRef.current = targetIndex;
        drawFrame(targetIndex);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = endAudioTime;
        }

        isPlayingRef.current = false;
        onFinish();
      }
    };

    activeAnimIdRef.current = requestAnimationFrame(step);
  }, [drawFrame]);

  // ─── Trigger Forward (Advance to next checkpoint or end) ───────────
  const triggerForward = useCallback(() => {
    if (!ready || isPlayingRef.current || isFastForwardingRef.current || isCooldownRef.current) {
      return;
    }

    const currentFrame = currentRenderedFrameRef.current;

    if (currentFrame < CHECKPOINT_INDEX) {
      // Advance forward to frame 88 checkpoint
      const startIndex = currentFrame;
      const targetIndex = CHECKPOINT_INDEX;
      const framesToPlay = targetIndex - startIndex;
      const durationMs = Math.round((framesToPlay / 30) * 1000);

      const startAudioTime = AUDIO_START_OFFSET +
        (startIndex / (TOTAL_FRAMES - 1)) * (AUDIO_END_TIME - AUDIO_START_OFFSET);
      const endAudioTime = AUDIO_CHECKPOINT_TIME;

      playSegment(
        startIndex,
        targetIndex,
        startAudioTime,
        endAudioTime,
        durationMs,
        () => {
          setShowScrollHint(true);

          isCooldownRef.current = true;
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            isCooldownRef.current = false;
          }, 400);
        }
      );
    } else if (currentFrame < TOTAL_FRAMES - 1) {
      // Advance forward from frame 88 to frame 201 (end)
      const startIndex = currentFrame;
      const targetIndex = TOTAL_FRAMES - 1;
      const framesToPlay = targetIndex - startIndex;
      const durationMs = Math.round((framesToPlay / 30) * 1000);

      const startAudioTime = AUDIO_START_OFFSET +
        (startIndex / (TOTAL_FRAMES - 1)) * (AUDIO_END_TIME - AUDIO_START_OFFSET);
      const endAudioTime = AUDIO_END_TIME;

      playSegment(
        startIndex,
        targetIndex,
        startAudioTime,
        endAudioTime,
        durationMs,
        () => {
          setShowSkipButton(false);
          setShowScrollHint(false);
          hasReachedLastFrameRef.current = true;
          lastFrameStateRef.current = true;
          onLastFrameChange?.(true);
          onComplete?.();

          isCooldownRef.current = true;
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            isCooldownRef.current = false;
          }, 600);
        }
      );
    } else {
      // Already at frame 201 (Hero screen)
      hasReachedLastFrameRef.current = true;
      lastFrameStateRef.current = true;
      onLastFrameChange?.(true);
      if (!isAboutActiveRef.current) {
        onScrollPastHeroRef.current?.();
      }
    }
  }, [ready, playSegment, onComplete, onLastFrameChange]);

  // ─── Scrub Backward Frame-by-Frame with Smooth Physics ────────────
  const scrubBackward = useCallback((deltaFrames: number) => {
    if (!ready || isFastForwardingRef.current) return;

    // Immediately stop forward playback if any
    if (activeAnimIdRef.current) {
      cancelAnimationFrame(activeAnimIdRef.current);
      activeAnimIdRef.current = null;
    }
    isPlayingRef.current = false;

    // Pause audio
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    if (lastFrameStateRef.current) {
      lastFrameStateRef.current = false;
      onLastFrameChange?.(false);
      setShowSkipButton(true);
    }

    targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);
  }, [ready, onLastFrameChange]);

  // ─── Skip: Fast-forwards all frames sequentially to the last frame ───
  const handleSkip = useCallback(() => {
    if (isFastForwardingRef.current) return;
    isFastForwardingRef.current = true;
    setShowScrollHint(false);

    if (activeAnimIdRef.current) {
      cancelAnimationFrame(activeAnimIdRef.current);
      activeAnimIdRef.current = null;
    }

    const lastFrameIndex = TOTAL_FRAMES - 1;
    const startFrame = currentRenderedFrameRef.current;
    const framesToFastForward = lastFrameIndex - startFrame;

    if (framesToFastForward <= 0) {
      isFastForwardingRef.current = false;
      setShowSkipButton(false);
      hasReachedLastFrameRef.current = true;
      lastFrameStateRef.current = true;
      onLastFrameChange?.(true);
      onComplete?.();
      return;
    }

    const durationMs = 1200; // Cinematic fast-forward duration
    const startTime = performance.now();
    fadeAudioTo(0, durationMs);

    const fastForwardStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const frameDelta = Math.round(framesToFastForward * Math.pow(progress, 1.15));
      const currentFrame = Math.min(startFrame + frameDelta, lastFrameIndex);

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      currentRenderedFrameRef.current = currentFrame;
      drawFrame(currentFrame);

      if (progress < 1 && currentFrame < lastFrameIndex) {
        requestAnimationFrame(fastForwardStep);
      } else {
        isFastForwardingRef.current = false;
        targetFrameRef.current = lastFrameIndex;
        smoothFrameRef.current = lastFrameIndex;
        currentRenderedFrameRef.current = lastFrameIndex;
        drawFrame(lastFrameIndex);
        setShowSkipButton(false);
        hasReachedLastFrameRef.current = true;
        lastFrameStateRef.current = true;
        onLastFrameChange?.(true);
        onComplete?.();

        isCooldownRef.current = true;
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          isCooldownRef.current = false;
        }, 600);

        const audio = audioRef.current;
        if (audio) {
          audio.pause();
        }
      }
    };

    requestAnimationFrame(fastForwardStep);
  }, [drawFrame, fadeAudioTo, onComplete, onLastFrameChange]);

  // ─── Initialize audio ─────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    const audio = new Audio(AUDIO_SRC);
    audio.preload = "auto";
    audio.volume = 1;
    if ("preservesPitch" in audio) {
      audio.preservesPitch = true;
    }
    audioRef.current = audio;

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      audio.src = "";
    };
  }, [mounted]);

  // ─── Preload all frames ───────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const frameNum = START_FRAME + i;
      const img = new window.Image();
      img.src = `${FRAME_PATH}${String(frameNum).padStart(3, "0")}${FRAME_EXT}`;

      if ("decode" in img) {
        img.decode().catch(() => { });
      }

      const handleImageLoad = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setReady(true);
          drawFrame(0);
        }
      };
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad;
      images[i] = img;
    }
  }, [mounted, drawFrame]);

  // ─── Lenis Virtual Scroll & Continuous Lerp Loop ───────────────────
  useEffect(() => {
    if (!ready) return;

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

    lenis.on("virtual-scroll", ({ deltaY }) => {
      // Yield completely when Hero or About transition is active
      if (lastFrameStateRef.current || isAboutActiveRef.current) return;

      if (deltaY > 8) {
        if (targetFrameRef.current >= TOTAL_FRAMES - 2) {
          hasReachedLastFrameRef.current = true;
          lastFrameStateRef.current = true;
          onLastFrameChange?.(true);
        } else {
          triggerForward();
        }
      } else if (deltaY < -4) {
        const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.05);
        scrubBackward(deltaFrames);
      }
    });

    // Continuous 60fps/120fps display refresh lerp animation loop
    const raf = (time: number) => {
      lenis.raf(time);

      if (!isPlayingRef.current && !isFastForwardingRef.current) {
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

        if (frameToDraw !== currentRenderedFrameRef.current) {
          currentRenderedFrameRef.current = frameToDraw;
          drawFrame(frameToDraw);

          // Sync audio timestamp to frame
          if (audioRef.current) {
            const progress = frameToDraw / (TOTAL_FRAMES - 1);
            audioRef.current.currentTime =
              AUDIO_START_OFFSET + progress * (AUDIO_END_TIME - AUDIO_START_OFFSET);
          }
        }

        // Show "Scroll to explore" when resting at start (0) or checkpoint (82)
        if (
          frameToDraw <= 1 ||
          (frameToDraw >= CHECKPOINT_INDEX - 1 && frameToDraw <= CHECKPOINT_INDEX + 1)
        ) {
          setShowScrollHint(true);
        } else {
          setShowScrollHint(false);
        }
      }

      scrubAnimIdRef.current = requestAnimationFrame(raf);
    };

    scrubAnimIdRef.current = requestAnimationFrame(raf);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (lastFrameStateRef.current || isAboutActiveRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        triggerForward();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrubBackward(3.5);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleResize = () => {
      lenis.resize();
      drawFrame(currentRenderedFrameRef.current);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      if (activeAnimIdRef.current) cancelAnimationFrame(activeAnimIdRef.current);
      if (scrubAnimIdRef.current) cancelAnimationFrame(scrubAnimIdRef.current);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [ready, triggerForward, scrubBackward, drawFrame]);

  if (!mounted) {
    return <div className="h-screen bg-black" />;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-30 w-full h-full overflow-hidden select-none bg-black"
    >
      {/* Fixed canvas — the persistent frame viewport & portfolio background */}
      <canvas
        ref={canvasRef}
        onClick={triggerForward}
        className="fixed inset-0 w-full h-full z-0 block cursor-pointer"
      />

      {/* Loading indicator */}
      {!ready && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-white/60 text-sm font-mono">
              Loading {loadProgress}%
            </p>
          </div>
        </div>
      )}

      {/* Skip button — present in all frames except the last frame */}
      {ready && showSkipButton && (
        <div className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-300">
          {isMobile ? (
            <button
              onClick={handleSkip}
              className="absolute cursor-pointer pointer-events-auto transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                left: "70%",
                top: "90%",
                width: "22%",
                height: "8.5%",
              }}
              aria-label="Fast forward to end"
            >
              <div className="relative w-full h-full animate-stop-motion">
                <NextImage
                  src="/assets/skip button.png"
                  alt="Skip"
                  fill
                  priority
                  sizes="(max-width: 768px) 25vw, 200px"
                  className="object-contain"
                />
              </div>
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="absolute cursor-pointer pointer-events-auto transition-transform duration-200 hover:scale-105 active:scale-95"
              style={desktopSkipStyle}
              aria-label="Fast forward to end"
            >
              <div className="relative w-full h-full animate-stop-motion">
                <NextImage
                  src="/assets/skip button.png"
                  alt="Skip"
                  fill
                  priority
                  sizes="200px"
                  className="object-contain"
                />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Scroll hint — shown before scrolling (frame 6) and at frame 88 checkpoint */}
      {ready && showSkipButton && showScrollHint && (
        <div
          onClick={triggerForward}
          className="fixed bottom-9 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-auto cursor-pointer select-none"
        >
          <div className="flex flex-col items-center gap-1.5 text-neutral-900 hover:text-black transition-all hover:scale-105 active:scale-95">
            <span className="text-sm sm:text-base font-bold font-mono tracking-widest uppercase drop-shadow-sm">
              Scroll to explore
            </span>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
