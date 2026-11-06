"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

interface SideScrollBarProps {
  progress: number; // 0.0 to 1.0
  isVisible: boolean;
  onScrollToProgress?: (targetProgress: number) => void;
}

export default function SideScrollBar({
  progress,
  isVisible,
  onScrollToProgress,
}: SideScrollBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const startPointerYRef = useRef(0);
  const startProgressRef = useRef(0);

  const onScrollToProgressRef = useRef(onScrollToProgress);
  useEffect(() => {
    onScrollToProgressRef.current = onScrollToProgress;
  }, [onScrollToProgress]);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  // While dragging, use dragProgress so thumb follows cursor with 1:1 responsiveness
  const displayProgress = isDragging && dragProgress !== null ? dragProgress : clampedProgress;

  // Calculate progress from a clientY position on the track
  const getProgressFromY = useCallback((clientY: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = clientY - rect.top;
    const trackH = rect.height;
    const thumbH = Math.max(52, trackH * 0.12);
    const available = trackH - thumbH;
    if (available <= 0) return 0;

    return Math.min(1, Math.max(0, (clickY - thumbH / 2) / available));
  }, []);

  // Handle pointer down anywhere on the scrollbar track or thumb
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    e.preventDefault();
    e.stopPropagation();

    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const trackH = rect.height;
    const thumbH = Math.max(52, trackH * 0.12);
    const available = trackH - thumbH;

    startPointerYRef.current = e.clientY;
    startProgressRef.current = clampedProgress;

    const currentThumbTop = clampedProgress * available;
    const clickY = e.clientY - rect.top;

    // If clicking directly on track away from thumb, jump immediately
    if (clickY < currentThumbTop || clickY > currentThumbTop + thumbH) {
      const targetProg = getProgressFromY(e.clientY);
      startProgressRef.current = targetProg;
      setDragProgress(targetProg);
      onScrollToProgressRef.current?.(targetProg);
    } else {
      setDragProgress(clampedProgress);
    }

    setIsDragging(true);
  };

  // Window-level dragging for 100% reliable tracking across the entire screen
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const trackH = rect.height;
      const thumbH = Math.max(52, trackH * 0.12);
      const available = trackH - thumbH;
      if (available <= 0) return;

      const deltaY = e.clientY - startPointerYRef.current;
      const deltaProgress = deltaY / available;
      const nextProgress = Math.min(1, Math.max(0, startProgressRef.current + deltaProgress));

      setDragProgress(nextProgress);
      onScrollToProgressRef.current?.(nextProgress);
    };

    const handleWindowPointerUp = () => {
      setIsDragging(false);
      setDragProgress(null);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-6 bottom-6 sm:top-10 sm:bottom-10 right-2 sm:right-3.5 z-[80] w-6 sm:w-7 flex justify-center items-stretch rounded-full transition-all duration-200 select-none cursor-pointer touch-none ${
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll bar"
      style={{ touchAction: "none" }}
    >
      {/* Background track pill */}
      <div
        className={`absolute inset-y-0 w-3.5 sm:w-4.5 rounded-full transition-colors duration-200 ${
          isHovered || isDragging ? "bg-black/[0.07] backdrop-blur-[2px]" : "bg-transparent"
        }`}
      />

      {/* Precision Scrollbar Thumb - Floating Curved Pill */}
      <div
        className={`absolute w-2.5 sm:w-3.5 rounded-full transition-[background-color,box-shadow,width] duration-150 cursor-grab active:cursor-grabbing pointer-events-none ${
          isDragging
            ? "bg-neutral-900 shadow-md ring-1 ring-black/10 w-3 sm:w-4"
            : isHovered
            ? "bg-neutral-800/80 shadow-sm w-3 sm:w-4"
            : "bg-neutral-800/40"
        }`}
        style={{
          height: "12vh",
          minHeight: "52px",
          top: `calc(${displayProgress} * (100% - max(52px, 12vh)))`,
        }}
      />
    </div>
  );
}
