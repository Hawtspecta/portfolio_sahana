/**
 * Global In-Memory Frame Cache & Prioritized Asset Pipeline
 *
 * Solves cold-cache glitches and low-bandwidth stutter:
 * 1. Single source of truth for all decoded HTMLImageElements (zero duplicate fetches or decodes).
 * 2. Keyframe-strided preloading: distributes milestone frames across the entire runway first,
 *    guaranteeing a valid nearby frame is ALWAYS available even on 3G or if the user scrubs immediately.
 * 3. Dynamic listener notifications: notifies active canvas components the instant a requested frame arrives.
 * 4. Priority tiering: Splash -> Hero Keyframes -> Transition Keyframes -> Full Hero -> Full Transition -> Idle Assets.
 */

export const SPLASH_START_FRAME = 6;
export const SPLASH_END_FRAME = 201;
export const TOTAL_SPLASH_FRAMES = SPLASH_END_FRAME - SPLASH_START_FRAME + 1; // 196

export const TOTAL_HERO_FRAMES = 119;
export const TOTAL_TRANSITION_FRAMES = 106;

export const SPLASH_FRAME_PATH = "/assets/splash_frames/ezgif-frame-";
export const HERO_FRAME_PATH = "/assets/hero_frames/ezgif-frame-";
export const TRANSITION_FRAME_PATH = "/assets/transition/ezgif-frame-";

export const CRITICAL_ASSETS = [
  "/assets/cursor/paw-pointer.png",
  "/assets/cursor/roblox-cursor.png",
  "/assets/transition/bg_port.webp",
  "/assets/transition/pc.webp",
  "/assets/skip button.png",
];

// In-memory singletons across the entire page lifecycle
const splashImages: (HTMLImageElement | null)[] = new Array(TOTAL_SPLASH_FRAMES).fill(null);
const heroImages: (HTMLImageElement | null)[] = new Array(TOTAL_HERO_FRAMES).fill(null);
const transitionImages: (HTMLImageElement | null)[] = new Array(TOTAL_TRANSITION_FRAMES).fill(null);

export type SectionType = "splash" | "hero" | "transition";
type FrameReadyListener = (section: SectionType, index: number, img: HTMLImageElement) => void;

const listeners = new Set<FrameReadyListener>();

export function subscribeFrameReady(listener: FrameReadyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyFrameReady(section: SectionType, index: number, img: HTMLImageElement) {
  listeners.forEach((listener) => {
    try {
      listener(section, index, img);
    } catch {
      // Ignore listener error
    }
  });
}

/** Returns the exact array reference for direct canvas lookups */
export function getSplashImages(): (HTMLImageElement | null)[] {
  return splashImages;
}

export function getHeroImages(): (HTMLImageElement | null)[] {
  return heroImages;
}

export function getTransitionImages(): (HTMLImageElement | null)[] {
  return transitionImages;
}

/**
 * Finds the exact image if loaded, or radiates outward (offset ±1, ±2...)
 * to find the nearest loaded frame. This guarantees zero blank frames even on low net.
 */
export function getBestAvailableFrame(
  images: (HTMLImageElement | null)[],
  targetIndex: number,
  totalFrames: number
): { img: HTMLImageElement | null; actualIndex: number; isExact: boolean } {
  const clamped = Math.max(0, Math.min(totalFrames - 1, Math.round(targetIndex)));
  const exactImg = images[clamped];
  if (exactImg && exactImg.complete && exactImg.naturalWidth > 0) {
    return { img: exactImg, actualIndex: clamped, isExact: true };
  }

  // Radiate outwards to find nearest loaded keyframe
  for (let offset = 1; offset < totalFrames; offset++) {
    const prev = clamped - offset;
    if (prev >= 0) {
      const img = images[prev];
      if (img && img.complete && img.naturalWidth > 0) {
        return { img, actualIndex: prev, isExact: false };
      }
    }
    const next = clamped + offset;
    if (next < totalFrames) {
      const img = images[next];
      if (img && img.complete && img.naturalWidth > 0) {
        return { img, actualIndex: next, isExact: false };
      }
    }
  }

  return { img: null, actualIndex: -1, isExact: false };
}

// Low-network detection helper
function getNetworkConcurrency(): number {
  if (typeof navigator !== "undefined" && "connection" in navigator) {
    const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") {
      return 3;
    }
    if (conn?.effectiveType === "3g") {
      return 4;
    }
  }
  return 6;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preloading Pipeline
// ─────────────────────────────────────────────────────────────────────────────

let isSplashPreloading = false;
let isHeroPreloading = false;
let isTransitionPreloading = false;
let isIdlePreloaded = false;

/** Preloads all splash frames + critical UI assets with progress tracking */
export function preloadSplashFrames(
  onProgress: (percent: number, loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (isSplashPreloading && splashImages[0]?.complete) {
      resolve();
      return;
    }
    isSplashPreloading = true;

    const totalToLoad = TOTAL_SPLASH_FRAMES + CRITICAL_ASSETS.length;
    let completed = 0;

    const handleItemDone = () => {
      completed++;
      const pct = Math.min(100, Math.round((completed / totalToLoad) * 100));
      onProgress(pct, completed, totalToLoad);
      if (completed >= totalToLoad) {
        resolve();
      }
    };

    // Preload critical icons/textures in parallel
    CRITICAL_ASSETS.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      if ("decode" in img) img.decode().catch(() => {});
      img.onload = handleItemDone;
      img.onerror = handleItemDone;
    });

    // Build splash frame tasks
    const frameIndices: number[] = [];
    for (let i = 0; i < TOTAL_SPLASH_FRAMES; i++) {
      frameIndices.push(i);
    }

    const concurrency = getNetworkConcurrency();
    let cursor = 0;

    const runWorker = () => {
      if (cursor >= frameIndices.length) return;
      const i = frameIndices[cursor++];
      const frameNum = SPLASH_START_FRAME + i;
      const url = `${SPLASH_FRAME_PATH}${String(frameNum).padStart(3, "0")}.webp`;

      const img = new window.Image();
      img.src = url;
      if ("decode" in img) img.decode().catch(() => {});

      img.onload = () => {
        splashImages[i] = img;
        notifyFrameReady("splash", i, img);
        handleItemDone();
        runWorker();
      };
      img.onerror = () => {
        handleItemDone();
        runWorker();
      };
    };

    for (let w = 0; w < Math.min(concurrency, frameIndices.length); w++) {
      runWorker();
    }
  });
}

/**
 * Preloads Hero frames using Strided Keyframing:
 * Round 1: Keyframes spaced every 5 frames across 0..118 (gives instant full-runway coverage in ~2s).
 * Round 2: Interleaved sub-keyframes (every 2nd frame).
 * Round 3: All remaining frames to reach 100% full density.
 */
export function preloadHeroFrames(): void {
  if (typeof window === "undefined" || isHeroPreloading) return;
  isHeroPreloading = true;

  const keyframes: number[] = [];
  const secondary: number[] = [];
  const remaining: number[] = [];
  const visited = new Set<number>();

  // Round 1: Keyframes spaced by 5 (0, 5, 10, ... 118)
  for (let i = 0; i < TOTAL_HERO_FRAMES; i += 5) {
    keyframes.push(i);
    visited.add(i);
  }
  if (!visited.has(TOTAL_HERO_FRAMES - 1)) {
    keyframes.push(TOTAL_HERO_FRAMES - 1);
    visited.add(TOTAL_HERO_FRAMES - 1);
  }

  // Round 2: Every 2nd frame (2, 7, 12, ...)
  for (let i = 2; i < TOTAL_HERO_FRAMES; i += 5) {
    if (!visited.has(i)) {
      secondary.push(i);
      visited.add(i);
    }
  }

  // Round 3: Everything else
  for (let i = 0; i < TOTAL_HERO_FRAMES; i++) {
    if (!visited.has(i)) {
      remaining.push(i);
    }
  }

  const prioritizedSequence = [...keyframes, ...secondary, ...remaining];
  const concurrency = getNetworkConcurrency();
  let cursor = 0;

  const runWorker = () => {
    if (cursor >= prioritizedSequence.length) return;
    const index = prioritizedSequence[cursor++];
    const frameNum = index + 1; // 1..119
    const url = `${HERO_FRAME_PATH}${String(frameNum).padStart(3, "0")}.webp`;

    if (heroImages[index]?.complete && heroImages[index]?.naturalWidth! > 0) {
      runWorker();
      return;
    }

    const img = new window.Image();
    img.src = url;
    if ("decode" in img) img.decode().catch(() => {});

    img.onload = () => {
      heroImages[index] = img;
      notifyFrameReady("hero", index, img);
      runWorker();
    };
    img.onerror = () => {
      runWorker();
    };
  };

  for (let w = 0; w < Math.min(concurrency, prioritizedSequence.length); w++) {
    runWorker();
  }
}

/**
 * Preloads Transition frames using the same Strided Keyframing technique.
 */
export function preloadTransitionFrames(): void {
  if (typeof window === "undefined" || isTransitionPreloading) return;
  isTransitionPreloading = true;

  const keyframes: number[] = [];
  const secondary: number[] = [];
  const remaining: number[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < TOTAL_TRANSITION_FRAMES; i += 5) {
    keyframes.push(i);
    visited.add(i);
  }
  if (!visited.has(TOTAL_TRANSITION_FRAMES - 1)) {
    keyframes.push(TOTAL_TRANSITION_FRAMES - 1);
    visited.add(TOTAL_TRANSITION_FRAMES - 1);
  }

  for (let i = 2; i < TOTAL_TRANSITION_FRAMES; i += 5) {
    if (!visited.has(i)) {
      secondary.push(i);
      visited.add(i);
    }
  }

  for (let i = 0; i < TOTAL_TRANSITION_FRAMES; i++) {
    if (!visited.has(i)) {
      remaining.push(i);
    }
  }

  const prioritizedSequence = [...keyframes, ...secondary, ...remaining];
  const concurrency = getNetworkConcurrency();
  let cursor = 0;

  const runWorker = () => {
    if (cursor >= prioritizedSequence.length) return;
    const index = prioritizedSequence[cursor++];
    const frameNum = index + 1; // 1..106
    const url = `${TRANSITION_FRAME_PATH}${String(frameNum).padStart(3, "0")}.webp`;

    if (transitionImages[index]?.complete && transitionImages[index]?.naturalWidth! > 0) {
      runWorker();
      return;
    }

    const img = new window.Image();
    img.src = url;
    if ("decode" in img) img.decode().catch(() => {});

    img.onload = () => {
      transitionImages[index] = img;
      notifyFrameReady("transition", index, img);
      runWorker();
    };
    img.onerror = () => {
      runWorker();
    };
  };

  for (let w = 0; w < Math.min(concurrency, prioritizedSequence.length); w++) {
    runWorker();
  }
}

/** Preloads heavy portfolio/experience images ONLY when the browser is idle */
export function preloadIdleAssets(): void {
  if (typeof window === "undefined" || isIdlePreloaded) return;
  isIdlePreloaded = true;

  const backgroundAssets = [
    "/assets/experience_tab.webp",
    "/assets/small_experience.webp",
    "/assets/project_tab_lawbot.png",
    "/assets/project_tab_ufi.png",
    "/assets/project_tab_brew.png",
    "/assets/project_tab_india.png",
    "/assets/project_tab_resume.png",
    "/assets/raw_project_tab_lawbot.png",
    "/assets/raw_project_tab_ufi.png",
    "/assets/raw_project_tab_brew.png",
    "/assets/raw_project_tab_india.png",
    "/assets/raw_project_tab_resume.png",
    "/assets/experience/1.webp",
    "/assets/experience/2.webp",
    "/assets/experience/3.webp",
    "/assets/experience/4.webp",
    "/assets/experience/5.webp",
    "/assets/experience/6.webp",
    "/assets/experience/7.webp",
    "/assets/experience/8.webp",
    "/assets/invizn/boho_mehfil_screenshot_upscaled.png",
    "/assets/invizn/Pastel Wedding Venue Design Studio.png",
    "/assets/invizn/venue_arch_upscaled_2x.jpg",
    "/assets/invizn/wedding_stage_upscaled_2x.jpg",
    "/assets/freelance/glamator_spotlight.jpg",
    "/assets/freelance/myriad_ecosystem.png",
    "/assets/freelance/myriad_journey.jpg",
    "/assets/freelance/myriad_services.png",
    "/assets/certificates/adf-certificate.png",
    "/assets/certificates/google-aiml-certificate.png",
    "/assets/certificates/jpmc-software-engineering.png",
    "/assets/certificates/nptel-cert.png",
  ];

  const scheduleTask = () => {
    let index = 0;
    const loadNext = () => {
      if (index >= backgroundAssets.length) return;
      const url = backgroundAssets[index++];
      const img = new window.Image();
      img.src = url;
      img.onload = loadNext;
      img.onerror = loadNext;
    };
    loadNext();
  };

  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(scheduleTask);
  } else {
    setTimeout(scheduleTask, 3000);
  }
}
