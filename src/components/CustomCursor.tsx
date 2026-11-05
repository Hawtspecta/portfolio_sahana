"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// High-resolution 128x128 20-frame Dancing Kitten animation extracted from master .ani
const FRAMES = Array.from({ length: 20 }, (_, i) => `/assets/cursor/kitten-${i}.png`);

// High-resolution 128x128 cat paw pointer
const POINTER_SRC = "/assets/cursor/paw-pointer.png";

function useIsFinePointer() {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia("(pointer: fine)");
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  );
}

/**
 * Custom animated cursor:
 * - Default cursor: Large 80x80 animated Dancing Kitten meme cursor (20 frames @ ~83ms)
 * - Pointer cursor: Large 80x80 cute Cat Paw pointer
 * - Smooth in-place zoom-in / zoom-out on click around the exact hotspot
 * - Rock-solid click point stability with zero displacement
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isPointerRef = useRef(false);
  const frameRef = useRef(0);
  const isSupported = useIsFinePointer();

  useEffect(() => {
    if (!isSupported) return;

    // Preload frames to guarantee zero stutter
    FRAMES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
    const pImg = new window.Image();
    pImg.src = POINTER_SRC;

    document.documentElement.classList.add("has-custom-cursor");

    const cursor = cursorRef.current;
    const scaleWrapper = scaleRef.current;
    if (!cursor || !scaleWrapper) return;

    let posX = -100;
    let posY = -100;

    const getMetrics = () => {
      if (isPointerRef.current) {
        // 128x128 cat paw with hotspot at topmost toe bean apex
        return {
          offsetX: 46,
          offsetY: 6,
          src: POINTER_SRC,
        };
      }
      // 128x128 Dancing Kitten with hotspot at arrow pointer tip
      return {
        offsetX: 2,
        offsetY: 2,
        src: FRAMES[frameRef.current],
      };
    };

    const updatePosition = () => {
      if (!cursor || !scaleWrapper) return;
      const { offsetX, offsetY } = getMetrics();

      cursor.style.transform = `translate3d(${posX - offsetX}px, ${posY - offsetY}px, 0)`;

      // Set transform-origin strictly to the active tip so click zooms never shift the point
      scaleWrapper.style.transformOrigin = `${offsetX}px ${offsetY}px`;
    };

    const handlePointerMove = (e: PointerEvent) => {
      posX = e.clientX;
      posY = e.clientY;
      cursor.style.opacity = "1";

      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest(
        'a, button, [role="button"], input, select, textarea, .cursor-pointer, [data-cursor="pointer"]'
      );

      if (interactive !== isPointerRef.current) {
        isPointerRef.current = interactive;
        const { src } = getMetrics();
        if (imgRef.current) {
          imgRef.current.src = src;
        }
      }

      updatePosition();
    };

    // Zoom in on click down strictly centered on the hotspot
    const handlePointerDown = () => {
      if (scaleWrapper) {
        const { offsetX, offsetY } = getMetrics();
        scaleWrapper.style.transformOrigin = `${offsetX}px ${offsetY}px`;
        scaleWrapper.style.transform = "scale(0.82)";
      }
    };

    // Zoom out back to normal on release
    const handlePointerUp = () => {
      if (scaleWrapper) {
        scaleWrapper.style.transform = "scale(1)";
      }
    };

    const handleMouseLeave = () => {
      if (cursor) cursor.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      if (cursor) cursor.style.opacity = "1";
    };

    // Animate dancing kitten frames at ~83ms matching .ani jifRate (5 jiffies)
    const animInterval = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % FRAMES.length;
      if (!isPointerRef.current && imgRef.current) {
        imgRef.current.src = FRAMES[frameRef.current];
      }
    }, 83);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      clearInterval(animInterval);
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[999999] opacity-0 will-change-transform"
      style={{
        width: "128px",
        height: "128px",
      }}
    >
      {/* Inner wrapper handles zoom-in / zoom-out around the exact hotspot */}
      <div
        ref={scaleRef}
        className="w-full h-full transition-transform duration-100 ease-out will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={FRAMES[0]}
          alt=""
          className="w-full h-full object-contain select-none"
        />
      </div>
    </div>
  );
}
