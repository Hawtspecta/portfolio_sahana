import { useSyncExternalStore } from "react";
import Lenis from "lenis";

let globalLenis: Lenis | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeLenis(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLenisSnapshot(): Lenis | null {
  return globalLenis;
}

export function useLenis(): Lenis | null {
  return useSyncExternalStore(subscribeLenis, getLenisSnapshot, () => null);
}

export function initGlobalLenis(): () => void {
  if (typeof window === "undefined") return () => {};

  if (!globalLenis) {
    globalLenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      syncTouch: true,
    });
    notify();
  }

  let rafId: number;
  const raf = (time: number) => {
    globalLenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  const handleResize = () => {
    globalLenis?.resize();
  };
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    cancelAnimationFrame(rafId);
    if (globalLenis) {
      globalLenis.destroy();
      globalLenis = null;
      notify();
    }
  };
}

