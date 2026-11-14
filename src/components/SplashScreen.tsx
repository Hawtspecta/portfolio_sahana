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
import {
  getSplashImages,
  getBestAvailableFrame,
  preloadSplashFrames,
  preloadHeroFrames,
  preloadTransitionFrames,
  preloadIdleAssets,
  subscribeFrameReady,
  TOTAL_SPLASH_FRAMES,
  SPLASH_START_FRAME,
  SPLASH_END_FRAME,
} from "@/lib/frameCache";

const START_FRAME = SPLASH_START_FRAME;
const END_FRAME = SPLASH_END_FRAME;

const TOTAL_FRAMES = TOTAL_SPLASH_FRAMES; // 196 frames starting from frame 6
const FULL_AUDIO_DURATION = 6.7; // original 201 frames duration in seconds
const AUDIO_START_OFFSET = ((START_FRAME - 1) / 201) * FULL_AUDIO_DURATION; // ~0.167s
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
 * Continuous Video-Style Splash Screen:
 * - Plays automatically from frame 6 through frame 201 like a cinematic video.
 * - Audio plays synchronously from start to end.
 * - Zero scroll required — transitions into Hero automatically on completion.
 * - Fast-forward rocket button remains fully functional to skip ahead smoothly at any time.
 */
export default function SplashScreen({
  onComplete,
  onLastFrameChange,
  isHeroActive = false,
  isAboutActive = false,
  onProgressChange,
  targetProgress,
  fastForwardTrigger,
  onReady,
}: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initialFrame = isHeroActive || isAboutActive || (targetProgress != null && targetProgress >= 0.98)
    ? TOTAL_FRAMES - 1
    : 0;
  const currentRenderedFrameRef = useRef(initialFrame);
  const targetFrameRef = useRef(initialFrame);
  const smoothFrameRef = useRef(initialFrame);

  const isFastForwardingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const activeAnimIdRef = useRef<number | null>(null);
  const lastFrameStateRef = useRef(false);
  const hasReachedLastFrameRef = useRef(isHeroActive || isAboutActive);
  const wasHeroActiveRef = useRef(isHeroActive || isAboutActive);
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
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const hasDrawnFirstFrameRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);

  // ─── Resize Canvas with Optimal Crisp Buffer ─────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetW = Math.round(window.innerWidth * dpr);
    const targetH = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctxRef.current = canvas.getContext("2d", { alpha: false });
    }
  }, []);

  // ─── Draw a specific frame onto the canvas ────────────────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current || (ctxRef.current = canvas.getContext("2d", { alpha: false }));
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const { img, actualIndex } = getBestAvailableFrame(getSplashImages(), frameIndex, TOTAL_FRAMES);
    if (img && img.complete && img.naturalWidth > 0) {
      currentRenderedFrameRef.current = actualIndex;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Synchronize Hero state
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
      isPlayingRef.current = false;
      isFastForwardingRef.current = false;
      if (wasHeroActiveRef.current) {
        const returnIndex = Math.max(0, TOTAL_FRAMES - 1);
        targetFrameRef.current = returnIndex;
        smoothFrameRef.current = returnIndex;
        currentRenderedFrameRef.current = returnIndex;
        drawFrame(returnIndex);
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

      if (audioRef.current) {
        const audioTime = AUDIO_START_OFFSET + targetProgress * (AUDIO_END_TIME - AUDIO_START_OFFSET);
        audioRef.current.currentTime = Math.min(AUDIO_END_TIME, Math.max(AUDIO_START_OFFSET, audioTime));
      }

      if (frameIndex >= TOTAL_FRAMES - 2) {
        hasReachedLastFrameRef.current = true;
        lastFrameStateRef.current = true;
        onLastFrameChange?.(true);
        onCompleteRef.current?.();
      }
    }
  }, [targetProgress, isHeroActive, isAboutActive, drawFrame, onLastFrameChange]);

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
      onLastFrameChange?.(true);
      onCompleteRef.current?.();
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
      currentRenderedFrameRef.current = currentFrame;
      drawFrame(currentFrame);
      const nextRatio = currentFrame / (TOTAL_FRAMES - 1);
      if (nextRatio - lastEmittedPct >= 0.04 || currentFrame >= lastFrameIndex) {
        lastEmittedPct = nextRatio;
        onProgressChangeRef.current?.(nextRatio);
      }

      // Smoothly fade out audio in tandem with rocket flight
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.volume = Math.min(1, Math.max(0, 1 - progress * 1.5));
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
        onLastFrameChange?.(true);
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
  }, [fastForwardTrigger, isHeroActive, isAboutActive, drawFrame, onLastFrameChange]);

  // ─── Play Splash as Continuous Video (from Start to End) ─────────
  const startVideoPlayback = useCallback(() => {
    if (isHeroActiveRef.current || isAboutActiveRef.current || isFastForwardingRef.current) return;
    if (hasReachedLastFrameRef.current) return;

    if (activeAnimIdRef.current) {
      cancelAnimationFrame(activeAnimIdRef.current);
      activeAnimIdRef.current = null;
    }

    const startIndex = Math.min(TOTAL_FRAMES - 2, Math.max(0, currentRenderedFrameRef.current));
    const targetIndex = TOTAL_FRAMES - 1;
    const remainingFraction = (targetIndex - startIndex) / (TOTAL_FRAMES - 1);
    const totalDurationMs = (AUDIO_END_TIME - AUDIO_START_OFFSET) * 1000;
    const durationMs = Math.max(200, totalDurationMs * remainingFraction);

    isPlayingRef.current = true;

    const audio = audioRef.current;
    if (audio) {
      try {
        const audioStartTime =
          AUDIO_START_OFFSET + (startIndex / (TOTAL_FRAMES - 1)) * (AUDIO_END_TIME - AUDIO_START_OFFSET);
        audio.currentTime = audioStartTime;
        audio.playbackRate = 1.0;
        audio.volume = 1.0;
        audio.play().then(() => {
          setNeedsAudioUnlock(false);
        }).catch(() => {
          // Autoplay policy blocked initial sound until user gesture; show subtle prompt
          setNeedsAudioUnlock(true);
        });
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
      onProgressChangeRef.current?.(currentFrame / (TOTAL_FRAMES - 1));

      if (progress < 1 && currentFrame < targetIndex) {
        activeAnimIdRef.current = requestAnimationFrame(step);
      } else {
        activeAnimIdRef.current = null;
        isPlayingRef.current = false;
        targetFrameRef.current = targetIndex;
        smoothFrameRef.current = targetIndex;
        currentRenderedFrameRef.current = targetIndex;
        drawFrame(targetIndex);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = AUDIO_END_TIME;
        }

        hasReachedLastFrameRef.current = true;
        lastFrameStateRef.current = true;
        onLastFrameChange?.(true);
        onCompleteRef.current?.();
      }
    };

    activeAnimIdRef.current = requestAnimationFrame(step);
  }, [drawFrame, onLastFrameChange]);

  // Un-mute / unlock / play audio on user interaction (including during loading)
  const handleUserGesture = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlayingRef.current) {
      // Unlock audio context silently during loading so autoplay succeeds when video starts
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.muted = false;
        audio.currentTime = AUDIO_START_OFFSET;
        setNeedsAudioUnlock(false);
      }).catch(() => {
        audio.muted = false;
      });
      return;
    }

    if (audio.paused) {
      const currentProgress = currentRenderedFrameRef.current / (TOTAL_FRAMES - 1);
      audio.currentTime = AUDIO_START_OFFSET + currentProgress * (AUDIO_END_TIME - AUDIO_START_OFFSET);
      audio.muted = false;
      audio.volume = 1;
      audio.play().then(() => {
        setNeedsAudioUnlock(false);
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (!mounted || isHeroActive || isAboutActive) return;

    const handlePointerOrKey = () => {
      handleUserGesture();
    };

    window.addEventListener("pointerdown", handlePointerOrKey, { passive: true });
    window.addEventListener("touchstart", handlePointerOrKey, { passive: true });
    window.addEventListener("click", handlePointerOrKey, { passive: true });
    window.addEventListener("keydown", handlePointerOrKey, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerOrKey);
      window.removeEventListener("touchstart", handlePointerOrKey);
      window.removeEventListener("click", handlePointerOrKey);
      window.removeEventListener("keydown", handlePointerOrKey);
    };
  }, [mounted, isHeroActive, isAboutActive, handleUserGesture]);

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

  // ─── Preload all frames & site assets during loading hamster ──────
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    const isSkippingSplash = wasHeroActiveRef.current || isHeroActiveRef.current;
    let minHamsterElapsed = isSkippingSplash;
    let splashAssetsReady = isSkippingSplash;

    const tryStartSplash = () => {
      if (cancelled || hasStartedPlaybackRef.current) return;
      if (!splashAssetsReady || !minHamsterElapsed) return;
      hasStartedPlaybackRef.current = true;
      setReady(true);
      onReadyRef.current?.();
      resizeCanvas();
      if (!wasHeroActiveRef.current && !isHeroActiveRef.current) {
        targetFrameRef.current = 0;
        smoothFrameRef.current = 0;
        currentRenderedFrameRef.current = 0;
        drawFrame(0);
      }
      // Fire keyframe background preloads immediately for butter-smooth Hero & Transition
      preloadHeroFrames();
      preloadTransitionFrames();
      preloadIdleAssets();
    };

    const hamsterTimer = setTimeout(() => {
      minHamsterElapsed = true;
      tryStartSplash();
    }, 2400);

    // Subscribe to first frame and early buffer
    const unsub = subscribeFrameReady((section, index) => {
      if (cancelled) return;
      if (section === "splash") {
        if (!hasDrawnFirstFrameRef.current && index === 0) {
          hasDrawnFirstFrameRef.current = true;
          setFirstFrameReady(true);
          resizeCanvas();
          if (!wasHeroActiveRef.current && !isHeroActiveRef.current) {
            targetFrameRef.current = 0;
            smoothFrameRef.current = 0;
            currentRenderedFrameRef.current = 0;
            drawFrame(0);
          }
        }
      }
    });

    preloadSplashFrames((percent) => {
      if (!cancelled) {
        setLoadProgress(percent);
      }
    }).then(() => {
      if (!cancelled) {
        splashAssetsReady = true;
        tryStartSplash();
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(hamsterTimer);
      unsub();
    };
  }, [mounted, drawFrame, resizeCanvas]);

  // ─── Auto-start video playback when ready ─────────────────────────
  useEffect(() => {
    if (ready && !isHeroActive && !isAboutActive && !hasReachedLastFrameRef.current) {
      startVideoPlayback();
    }
  }, [ready, isHeroActive, isAboutActive, startVideoPlayback]);

  // ─── Window Resize Handler ────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
      drawFrame(currentRenderedFrameRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resizeCanvas, drawFrame]);

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      if (activeAnimIdRef.current) {
        cancelAnimationFrame(activeAnimIdRef.current);
        activeAnimIdRef.current = null;
      }
      isPlayingRef.current = false;
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!mounted) {
    if (isHeroActive || isAboutActive) {
      return <div className="h-screen bg-black" />;
    }
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none">
        <div
          aria-label="Orange and tan hamster running in a metal wheel"
          role="img"
          className="wheel-and-hamster"
        >
          <div className="wheel" />
          <div className="hamster">
            <div className="hamster__body">
              <div className="hamster__head">
                <div className="hamster__ear" />
                <div className="hamster__eye" />
                <div className="hamster__nose" />
              </div>
              <div className="hamster__limb hamster__limb--fr" />
              <div className="hamster__limb hamster__limb--fl" />
              <div className="hamster__limb hamster__limb--br" />
              <div className="hamster__limb hamster__limb--bl" />
              <div className="hamster__tail" />
            </div>
          </div>
          <div className="spoke" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-2">
          <p
            className="text-xs sm:text-sm text-[#fbf6ec]/80 font-mono tracking-widest uppercase animate-pulse"
            style={{ fontFamily: "'Special Elite', cursive" }}
          >
            Loading experience...
          </p>
          <div className="w-40 sm:w-48 h-1 bg-white/15 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#fbf6ec]/80 rounded-full transition-all duration-200"
              style={{ width: "0%" }}
            />
          </div>
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#fbf6ec]/20 bg-white/5 text-[#fbf6ec]/75">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-[#fbf6ec]/85"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span
              className="text-[11px] sm:text-xs tracking-wider uppercase"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Turn on volume for best experience
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-30 w-full h-full overflow-hidden select-none bg-black"
    >
      {/* Fixed canvas — the continuous video viewport & portfolio background */}
      <canvas
        ref={canvasRef}
        onClick={handleUserGesture}
        className="fixed inset-0 w-full h-full z-0 block cursor-default render-high-quality"
      />

      {/* Hamster Wheel Loading Animation — visible while splash screen frames are loading */}
      {!ready && !isHeroActive && !isAboutActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black pointer-events-none transition-opacity duration-300">
          <div
            aria-label="Orange and tan hamster running in a metal wheel"
            role="img"
            className="wheel-and-hamster"
          >
            <div className="wheel" />
            <div className="hamster">
              <div className="hamster__body">
                <div className="hamster__head">
                  <div className="hamster__ear" />
                  <div className="hamster__eye" />
                  <div className="hamster__nose" />
                </div>
                <div className="hamster__limb hamster__limb--fr" />
                <div className="hamster__limb hamster__limb--fl" />
                <div className="hamster__limb hamster__limb--br" />
                <div className="hamster__limb hamster__limb--bl" />
                <div className="hamster__tail" />
              </div>
            </div>
            <div className="spoke" />
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p
              className="text-xs sm:text-sm text-[#fbf6ec]/80 font-mono tracking-widest uppercase animate-pulse"
              style={{ fontFamily: "'Special Elite', cursive" }}
            >
              Loading experience... {loadProgress > 0 ? `${loadProgress}%` : ""}
            </p>
            <div className="w-40 sm:w-48 h-1 bg-white/15 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#fbf6ec]/80 rounded-full transition-all duration-200"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#fbf6ec]/20 bg-white/5 text-[#fbf6ec]/75">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[#fbf6ec]/85"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <span
                className="text-[11px] sm:text-xs tracking-wider uppercase"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Turn on volume for best experience
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle prompt if browser autoplay policy blocked initial sound */}
      {ready && needsAudioUnlock && !isHeroActive && !isAboutActive && (
        <button
          type="button"
          onClick={handleUserGesture}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/65 hover:bg-black/80 text-[#fbf6ec] border border-[#fbf6ec]/25 backdrop-blur-md shadow-lg transition-all duration-300 animate-pulse cursor-pointer"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span
            className="text-[11px] tracking-wider uppercase"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Click anywhere for sound
          </span>
        </button>
      )}
    </div>
  );
}
