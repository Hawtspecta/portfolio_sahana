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
const END_FRAME = 201;

const TOTAL_FRAMES = END_FRAME - START_FRAME + 1; // 196 frames starting from frame 6
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

    // ─── Resize Canvas with Native High-DPI Retina Buffer ─────────
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

    // ─── Draw a specific frame onto the canvas ────────────────────────
    const drawFrame = useCallback((frameIndex: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

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

        const fastForwardStep = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          const easedProgress = lenisSmoothRocketEase(progress);
          const currentFrame = Math.min(lastFrameIndex, Math.round(startFrame + framesToFastForward * easedProgress));

      targetFrameRef.current = currentFrame;
      smoothFrameRef.current = currentFrame;
      currentRenderedFrameRef.current = currentFrame;
      drawFrame(currentFrame);
      onProgressChangeRef.current?.(currentFrame / (TOTAL_FRAMES - 1));

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
        audio.play().catch(() => {
          // Autoplay policy might block initial sound until user gesture; video frames continue smoothly
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

// Un-mute / play audio on user interaction if browser blocked auto-audio
const handleUserGesture = useCallback(() => {
  const audio = audioRef.current;
  if (audio && audio.paused && isPlayingRef.current) {
    const currentProgress = currentRenderedFrameRef.current / (TOTAL_FRAMES - 1);
    audio.currentTime = AUDIO_START_OFFSET + currentProgress * (AUDIO_END_TIME - AUDIO_START_OFFSET);
    audio.play().catch(() => { });
  }
}, []);

useEffect(() => {
  if (!ready || isHeroActive || isAboutActive) return;

  const handlePointerOrKey = () => {
    handleUserGesture();
  };

window.addEventListener("pointerdown", handlePointerOrKey, { passive: true });
window.addEventListener("keydown", handlePointerOrKey, { passive: true });
return () => {
  window.removeEventListener("pointerdown", handlePointerOrKey);
  window.removeEventListener("keydown", handlePointerOrKey);
};
  }, [ready, isHeroActive, isAboutActive, handleUserGesture]);

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
                }
          }
        };
        img.onload = handleImageLoad;
        img.onerror = handleImageLoad;
        images[i] = img;
      }
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
          return <div className="h-screen bg-black" />;
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
        </div>
      );
}
