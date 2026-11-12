"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const getIsMobile = () => {
  const narrow = window.innerWidth < 768;
  const coarse = window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024;
  return narrow || coarse;
};

export default function MobileNotice() {
  const isMobile = useSyncExternalStore(subscribe, getIsMobile, () => false);
  const [dismissed, setDismissed] = useState(false);

  if (!isMobile || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Desktop recommended"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1c0f08]/92 backdrop-blur-md p-6 select-none"
    >
      <div className="w-full max-w-sm rounded-xl border-2 border-[#4a2c1d] bg-[#fbf6ec] text-[#2b180e] p-6 shadow-[6px_6px_0_#4a2c1d] text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#4a2c1d] bg-[#fdf6ec]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>

        <h2
          className="text-xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Open on Desktop or Laptop
        </h2>
        <p
          className="text-sm text-[#3d2314]/90 leading-relaxed mb-5"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          This interactive 3D portfolio is designed for a larger screen, mouse, and keyboard. Please switch to a desktop or laptop for the best experience.
        </p>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-full px-4 py-2.5 rounded-full border-2 border-[#4a2c1d] bg-[#2b180e] text-[#fbf6ec] text-xs font-bold uppercase tracking-wider hover:bg-[#3d2314] active:scale-95 transition-all cursor-pointer"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
}

