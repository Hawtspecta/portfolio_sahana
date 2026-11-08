"use client";

import { useCallback, useSyncExternalStore } from "react";
import NextImage from "next/image";
import skipButtonImg from "../../public/assets/skip button.png";

const desktopSkipStyle: React.CSSProperties = {
  left: "85.5%",
  top: "76.8%",
  width: "10.4%",
  height: "12.8%",
};

const mobileSkipStyle: React.CSSProperties = {
  left: "70%",
  top: "90%",
  width: "22%",
  height: "8.5%",
};

function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    () => (typeof window !== "undefined" ? window.innerWidth < 768 : false),
    () => false
  );
}

interface RocketBoostSkipProps {
  isVisible: boolean;
  onSkip: () => void;
}

export default function RocketBoostSkip({
  isVisible,
  onSkip,
}: RocketBoostSkipProps) {
  const isMobile = useIsMobile();

  const triggerHaptics = useCallback(() => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(30);
      } catch {}
    }
  }, []);

  const handleClick = useCallback(() => {
    triggerHaptics();
    onSkip();
  }, [triggerHaptics, onSkip]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none transition-opacity duration-300 opacity-100"
    >
      <button
        onClick={handleClick}
        className="absolute cursor-pointer pointer-events-auto transition-transform duration-200 hover:scale-105 active:scale-95"
        style={isMobile ? mobileSkipStyle : desktopSkipStyle}
        aria-label="Skip to next section"
      >
        <div className="relative w-full h-full animate-stop-motion">
          <NextImage
            src={skipButtonImg}
            alt="Skip"
            fill
            priority
            unoptimized
            className="object-contain render-high-quality"
          />
        </div>
      </button>
    </div>
  );
}
