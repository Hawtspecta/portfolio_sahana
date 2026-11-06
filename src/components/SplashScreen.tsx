"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import Lenis from "lenis";
import { lenisSmoothRocketEase } from "@/lib/lenis";

const START_FRAME = 6;
const CHECKPOINT_FRAME = 76; // Part 2 starts from frame 76
const END_FRAME = 201;

const CHECKPOINT_INDEX = CHECKPOINT_FRAME - START_FRAME; // 76 - 6 = 70
const TOTAL_FRAMES = END_FRAME - START_FRAME + 1; // 196 frames starting from frame 6
const FULL_AUDIO_DURATION = 6.7; // original 201 frames duration in seconds
const AUDIO_START_OFFSET = ((START_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~0.167s
const AUDIO_CHECKPOINT_TIME = ((CHECKPOINT_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~2.50s (frame 76)
const AUDIO_END_TIME = ((END_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~6.667s
const AUDIO_SRC = "/assets/splash-audio.mp3";

const FRAME_PATH = "/assets/splash_frames/ezgif-frame-";
const FRAME_EXT = ".webp";

const emptySubscribe = () => () => { };

function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface SplashScreenProps {
  onComplete?: () => void;
  onLastFrameChange?: (isLastFrame: boolean) => void;
  isHeroActive?: boolean;
  isAboutActive?: boolean;
  lenis?: Lenis | null;
  onProgressChange?: (progress: number) => void;
  targetProgress?: number | null;
  fastForwardTrigger?: number;
  onReady?: () => void;
}

/**
 * Cinematic trigger-based splash screen:
 * - Part 1 (frames 6 to 76): plays automatically with audio up to frame 76 checkpoint.
 * - Frame 76 checkpoint: audio pauses and stops.
 * - Part 2 (frames 76 to 201): 100% scroll-based only, zero sound, liquid frame scrubbing.
 * - Skip button: fast-forwards smoothly to frame 201 at any time.
 */
export default function SplashScreen({
  onComplete,
  onLastFrameChange,
  isHeroActive = false,
  isAboutActive = false,
  lenis,
  onProgressChange,
  targetProgress,
  fastForwardTrigger,
  onReady,
}: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentRenderedFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);

  const isFastForwardingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isCooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAnimIdRef = useRef<number | null>(null);
  const scrubAnimIdRef = useRef<number | null>(null);
  const lastFrameStateRef = useRef(false);
  const hasReachedLastFrameRef = useRef(false);
  const wasHeroActiveRef = useRef(false);
  const transitionCooldownRef = useRef(0);
  const lastHandledTriggerRef = useRef(0);

  const isHeroActiveRef = useRef(isHeroActive);
  useEffect(() => {
    isHeroActiveRef.current = isHeroActive;
  }, [isHeroActive]);

  const isAboutActiveRef = useRef(isAboutActive);
  useEffect(() => {
    isAboutActiveRef.current = isAboutActive;
  }, [isAboutActive]);

  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const onLastFrameChangeRef = useRef(onLastFrameChange);
  useEffect(() => {
    onLastFrameChangeRef.current = onLastFrameChange;
  }, [onLastFrameChange]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const mounted = useHasMounted();

  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

    // ─── Resize Canvas with Hardware-Accelerated Capped DPR ─────────
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

    // ─── Draw a specific frame onto the canvas ────────────────────────
    const drawFrame = useCallback((frameIndex: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";

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
      if (isHeroActive) {
        if (activeAnimIdRef.current) {
          cancelAnimationFrame(activeAnimIdRef.current);
          activeAnimIdRef.current = null;
        }
        isPlayingRef.current = false;
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        const lastIndex = TOTAL_FRAMES - 1;
        targetFrameRef.current = lastIndex;
        smoothFrameRef.current = lastIndex;
        currentRenderedFrameRef.current = lastIndex;
        drawFrame(lastIndex);
        wasHeroActiveRef.current = true;
      } else {
        isCooldownRef.current = false;
        isPlayingRef.current = false;
        isFastForwardingRef.current = false;
        if (cooldownTimerRef.current) {
          clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
        // ONLY when returning from Hero (i.e. wasHeroActiveRef.current was true)
        if (wasHeroActiveRef.current) {
          transitionCooldownRef.current = Date.now() + 450;
          const returnIndex = Math.max(0, TOTAL_FRAMES - 4);
          targetFrameRef.current = returnIndex;
          smoothFrameRef.current = returnIndex;
          currentRenderedFrameRef.current = returnIndex;
          drawFrame(returnIndex);
          requestAnimationFrame(() => {
            setShowScrollHint(false);
          });
        }
        wasHeroActiveRef.current = false;
      }
    }, [isHeroActive, ready, drawFrame]);

    // Handle external scrollbar scrubbing target progress
    useEffect(() => {
      if (targetProgress != null && !isHeroActive && !isAboutActive) {
        if (activeAnimIdRef.current) {
          cancelAnimationFrame(activeAnimIdRef.current);
          activeAnimIdRef.current = null;
        }
        isPlayingRef.current = false;
        const frameIndex = Math.min(
          TOTAL_FRAMES - 1,
          Math.max(0, Math.round(targetProgress * (TOTAL_FRAMES - 1)))
        );
        targetFrameRef.current = frameIndex;
        smoothFrameRef.current = frameIndex;
        currentRenderedFrameRef.current = frameIndex;
        drawFrame(frameIndex);
        onProgressChangeRef.current?.(targetProgress);
        if (frameIndex >= TOTAL_FRAMES - 2) {
          hasReachedLastFrameRef.current = true;
          lastFrameStateRef.current = true;
          onLastFrameChangeRef.current?.(true);
          onCompleteRef.current?.();
        }
      }
    }, [targetProgress, isHeroActive, isAboutActive, drawFrame]);

    // ─── Rocket Fast-Forward (Sequentially scrubs all splash frames at rocket speed) ───
    useEffect(() => {
      if (!fastForwardTrigger || isHeroActive || isAboutActive) return;
      if (lastHandledTriggerRef.current === fastForwardTrigger) return;
      lastHandledTriggerRef.current = fastForwardTrigger;

      if (activeAnimIdRef.current) {
        cancelAnimationFrame(activeAnimIdRef.current);
        activeAnimIdRef.current = null;
      }
      isPlayingRef.current = false;
      isFastForwardingRef.current = true;
      requestAnimationFrame(() => {
        setShowScrollHint(false);
      });

      const lastFrameIndex = TOTAL_FRAMES - 1;
      const startFrame = Math.max(0, Math.min(TOTAL_FRAMES - 2, Math.round(smoothFrameRef.current)));
      const framesToFastForward = lastFrameIndex - startFrame;

      if (framesToFastForward <= 1) {
        isFastForwardingRef.current = false;
        targetFrameRef.current = lastFrameIndex;
        smoothFrameRef.current = lastFrameIndex;
        currentRenderedFrameRef.current = lastFrameIndex;
        drawFrame(lastFrameIndex);
        onProgressChangeRef.current?.(1);
        hasReachedLastFrameRef.current = true;
        lastFrameStateRef.current = true;
        onLastFrameChangeRef.current?.(true);
        onCompleteRef.current?.();
        return;
      }

      const durationMs = 1100;
      const startTime = performance.now();

      const fastForwardStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Lenis-powered effortless rocket takeoff and cushioned landing S-curve
        const easedProgress = lenisSmoothRocketEase(progress);
        const currentFrame = Math.min(lastFrameIndex, Math.round(startFrame + framesToFastForward * easedProgress));

        targetFrameRef.current = currentFrame;
        smoothFrameRef.current = currentFrame;
        currentRenderedFrameRef.current = currentFrame;
        drawFrame(currentFrame);
        onProgressChangeRef.current?.(currentFrame / (TOTAL_FRAMES - 1));

        // Smoothly fade out audio in tandem with the rocket flight
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.volume = Math.max(0, 1 - progress * 1.5);
        }

        if (progress < 1 && currentFrame < lastFrameIndex) {
          activeAnimIdRef.current = requestAnimationFrame(fastForwardStep);
        } else {
          activeAnimIdRef.current = null;
          isFastForwardingRef.current = false;
          targetFrameRef.current = lastFrameIndex;
          smoothFrameRef.current = lastFrameIndex;
          currentRenderedFrameRef.current = lastFrameIndex;
          drawFrame(lastFrameIndex);

          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.volume = 1;
          }

          hasReachedLastFrameRef.current = true;
          lastFrameStateRef.current = true;
          onLastFrameChangeRef.current?.(true);
          onCompleteRef.current?.();
        }
      };

      activeAnimIdRef.current = requestAnimationFrame(fastForwardStep);

      return () => {
        if (activeAnimIdRef.current) {
          cancelAnimationFrame(activeAnimIdRef.current);
          activeAnimIdRef.current = null;
        }
        isFastForwardingRef.current = false;
      };
    }, [fastForwardTrigger, isHeroActive, isAboutActive, drawFrame]);

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
        // Advance forward to frame 76 checkpoint with audio
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

            if (audioRef.current) {
              audioRef.current.pause();
            }

            isCooldownRef.current = true;
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = setTimeout(() => {
              isCooldownRef.current = false;
            }, 300);
          }
        );
      } else if (currentFrame < TOTAL_FRAMES - 1) {
        // Part 2 is 100% scroll-based only (zero audio)
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + 8);
        if (targetFrameRef.current >= TOTAL_FRAMES - 1) {
          hasReachedLastFrameRef.current = true;
          lastFrameStateRef.current = true;
          onLastFrameChange?.(true);
          onComplete?.();
        }
      } else {
        // Already at frame 201 (Hero screen)
        if (Date.now() > transitionCooldownRef.current) {
          hasReachedLastFrameRef.current = true;
          lastFrameStateRef.current = true;
          onLastFrameChange?.(true);
          onComplete?.();
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
      }

      targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);
    }, [ready, onLastFrameChange]);

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
            onReadyRef.current?.();
            resizeCanvas();
            if (!wasHeroActiveRef.current && !isHeroActiveRef.current) {
              targetFrameRef.current = 0;
              smoothFrameRef.current = 0;
              currentRenderedFrameRef.current = 0;
              drawFrame(0);
              setShowScrollHint(true);
            }
          }
        };
        img.onload = handleImageLoad;
        img.onerror = handleImageLoad;
        images[i] = img;
      }
  }, [mounted, drawFrame, resizeCanvas]);

  // ─── Lenis Virtual Scroll & Continuous Lerp Loop ───────────────────
  useEffect(() => {
    if (!ready || isHeroActive || isAboutActive) {
      if (scrubAnimIdRef.current) {
        cancelAnimationFrame(scrubAnimIdRef.current);
        scrubAnimIdRef.current = null;
      }
      return;
    }

    resizeCanvas();

    // Continuous 60fps/120fps display refresh lerp animation loop
    const raf = () => {
      if (!isPlayingRef.current && !isFastForwardingRef.current) {
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

        if (frameToDraw !== currentRenderedFrameRef.current) {
          currentRenderedFrameRef.current = frameToDraw;
          drawFrame(frameToDraw);

          // Audio: Strictly zero sound in Part 2 (frame >= CHECKPOINT_INDEX)
          if (audioRef.current) {
            if (frameToDraw >= CHECKPOINT_INDEX) {
              if (!audioRef.current.paused) {
                audioRef.current.pause();
              }
            } else if (isPlayingRef.current) {
              const progress = frameToDraw / (TOTAL_FRAMES - 1);
              audioRef.current.currentTime =
                AUDIO_START_OFFSET + progress * (AUDIO_END_TIME - AUDIO_START_OFFSET);
            }
          }

          onProgressChangeRef.current?.(frameToDraw / (TOTAL_FRAMES - 1));
        }

        // Show "Scroll to explore" at start (frame 6) and throughout part 2 (from frame 76 to end)
        if (frameToDraw <= 1 || frameToDraw >= CHECKPOINT_INDEX - 1) {
          setShowScrollHint(true);
        } else if (isPlayingRef.current) {
          setShowScrollHint(false);
        }
      }

      scrubAnimIdRef.current = requestAnimationFrame(raf);
    };

    scrubAnimIdRef.current = requestAnimationFrame(raf);

    // Listen to unified Lenis virtual-scroll
    let unsubscribeVirtualScroll: (() => void) | null = null;
    if (lenis) {
      unsubscribeVirtualScroll = lenis.on("virtual-scroll", ({ deltaY }) => {
        // Yield completely when Hero or About transition is active
        if (isHeroActiveRef.current || isAboutActiveRef.current) return;

        if (targetFrameRef.current < CHECKPOINT_INDEX) {
          // Part 1: triggers forward playback to frame 76 checkpoint with audio
          if (deltaY > 5) {
            triggerForward();
          } else if (deltaY < -4) {
            const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.05);
            scrubBackward(deltaFrames);
          }
        } else {
          // Part 2: 100% SCROLL-BASED ONLY (no sound, smooth liquid frame scrubbing)
          if (deltaY > 0) {
            const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.08);
            targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + deltaFrames);

            if (
              Date.now() > transitionCooldownRef.current &&
              targetFrameRef.current >= TOTAL_FRAMES - 1 &&
              deltaY > 5
            ) {
              hasReachedLastFrameRef.current = true;
              lastFrameStateRef.current = true;
              onLastFrameChange?.(true);
              onComplete?.();
            }
          } else if (deltaY < 0) {
            const deltaFrames = Math.max(0.6, Math.abs(deltaY) * 0.08);
            targetFrameRef.current = Math.max(0, targetFrameRef.current - deltaFrames);
          }
        }
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHeroActiveRef.current || isAboutActiveRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        if (targetFrameRef.current < CHECKPOINT_INDEX) {
          triggerForward();
        } else {
          targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, targetFrameRef.current + 6);
          if (
            Date.now() > transitionCooldownRef.current &&
            targetFrameRef.current >= TOTAL_FRAMES - 1
          ) {
            hasReachedLastFrameRef.current = true;
            lastFrameStateRef.current = true;
            onLastFrameChange?.(true);
            onComplete?.();
          }
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (targetFrameRef.current < CHECKPOINT_INDEX) {
          scrubBackward(3.5);
        } else {
          targetFrameRef.current = Math.max(0, targetFrameRef.current - 6);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

        const handleResize = () => {
          resizeCanvas();
          drawFrame(currentRenderedFrameRef.current);
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("resize", handleResize);
          if (unsubscribeVirtualScroll) unsubscribeVirtualScroll();
          if (activeAnimIdRef.current) cancelAnimationFrame(activeAnimIdRef.current);
          if (scrubAnimIdRef.current) cancelAnimationFrame(scrubAnimIdRef.current);
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        };
}, [ready, isHeroActive, isAboutActive, lenis, triggerForward, scrubBackward, drawFrame, resizeCanvas, onLastFrameChange, onComplete]);

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
      className="fixed inset-0 w-full h-full z-0 block cursor-default"
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

    {/* Scroll hint — shown before scrolling (frame 6) and throughout part 2 */}
    {ready && showScrollHint && (
      <div
        onClick={triggerForward}
        className="fixed bottom-9 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-auto cursor-default select-none"
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
