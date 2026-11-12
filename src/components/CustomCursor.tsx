"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// High-resolution 128x128 20-frame Dancing Kitten animation extracted from master .ani
const FRAMES = Array.from({ length: 20 }, (_, i) => `/assets/cursor/kitten-${i}.png`);

// High-resolution 128x128 cat paw pointer
const POINTER_SRC = "/assets/cursor/paw-pointer.png";

// Pixel-perfect authentic Roblox 2013 cursor (uploaded by user)
const ROBLOX_ARROW_SRC = "/assets/cursor/roblox-cursor.png";

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
  const badgeRef = useRef<HTMLDivElement>(null);
  const isPointerRef = useRef(false);
  const frameRef = useRef(0);
  const isSupported = useIsFinePointer();

  useEffect(() => {
    if (!isSupported) return;

    // Preload and decode cursor frames to guarantee zero stutter
    FRAMES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      if ("decode" in img) {
        img.decode().catch(() => {});
      }
    });
    const pImg = new window.Image();
    pImg.src = POINTER_SRC;
    if ("decode" in pImg) {
      pImg.decode().catch(() => {});
    }

    document.documentElement.classList.add("has-custom-cursor");

    const cursor = cursorRef.current;
    const scaleWrapper = scaleRef.current;
    if (!cursor || !scaleWrapper) return;

    let posX = -100;
    let posY = -100;

    const getMetrics = () => {
      const isExpandedView = !!document.querySelector('[data-project-expanded="true"]');
      if (isExpandedView && !isPointerRef.current) {
        // Authentic Roblox 2013 cursor with hotspot at top apex (2, 1) rendered at sleek 30px size
        return {
          offsetX: 1,
          offsetY: 1,
          width: 30,
          height: 30,
          src: ROBLOX_ARROW_SRC,
        };
      }
      if (isPointerRef.current) {
        // 128x128 cat paw with hotspot at topmost toe bean apex
        return {
          offsetX: 46,
          offsetY: 6,
          width: 128,
          height: 128,
          src: POINTER_SRC,
        };
      }
      // 128x128 Dancing Kitten with hotspot at arrow pointer tip
      return {
        offsetX: 2,
        offsetY: 2,
        width: 128,
        height: 128,
        src: FRAMES[frameRef.current],
      };
    };

    const updatePosition = () => {
      if (!cursor || !scaleWrapper) return;
      const { offsetX, offsetY, width, height } = getMetrics();

      cursor.style.transform = `translate3d(${posX - offsetX}px, ${posY - offsetY}px, 0)`;
      cursor.style.width = `${width}px`;
      cursor.style.height = `${height}px`;

      // Set transform-origin strictly to the active tip so click zooms never shift the point
      scaleWrapper.style.transformOrigin = `${offsetX}px ${offsetY}px`;
    };

    const handlePointerMove = (e: PointerEvent) => {
      posX = e.clientX;
      posY = e.clientY;

      const target = e.target as HTMLElement | null;

      // Check if user is anywhere inside the live expanded project view
      const isExpandedView = !!document.querySelector('[data-project-expanded="true"]');
      const interactive = !!target?.closest(
        'a, button, [role="button"], input, select, textarea, .cursor-pointer, [data-cursor="pointer"]'
      );

      // When the live project is expanded:
      // - When hovering over interactive portfolio buttons (Go Back, Open Site, etc.): show Cat Paw pointer
      // - When on regular portfolio controls/bar: show ONLY the clean arrow pointer (NO dancing kitten!)
      // - When inside the website iframe: hide portfolio cursor so website's own cursor shows
      if (isExpandedView) {
        const isInsideNativeSite = !!target?.closest('.native-site-cursor, iframe');
        if (isInsideNativeSite) {
          cursor.style.opacity = "0";
          return;
        }

        cursor.style.opacity = "1";

        if (interactive) {
          isPointerRef.current = true;
          if (imgRef.current) {
            imgRef.current.src = POINTER_SRC;
            imgRef.current.className = "w-full h-full object-contain select-none render-high-quality";
          }
        } else {
          isPointerRef.current = false;
          if (imgRef.current) {
            imgRef.current.src = ROBLOX_ARROW_SRC;
            imgRef.current.className = "w-full h-full object-contain select-none render-pixelated";
          }
        }
      } else {
        // Outside expanded view: Normal portfolio behavior
        const isInsideNativeSite = !!target?.closest('.native-site-cursor, iframe');
        if (isInsideNativeSite) {
          cursor.style.opacity = "0";
          return;
        }

        cursor.style.opacity = "1";

        if (interactive !== isPointerRef.current) {
          isPointerRef.current = interactive;
          const { src } = getMetrics();
          if (imgRef.current) {
            imgRef.current.src = src;
            imgRef.current.className = "w-full h-full object-contain select-none render-high-quality";
          }
        }
      }

      // Check for custom cursor text
      const cursorTextEl = target?.closest<HTMLElement>('[data-cursor-text]');
      const text = cursorTextEl ? cursorTextEl.getAttribute('data-cursor-text') || '' : '';
      if (badgeRef.current) {
        if (text) {
          badgeRef.current.textContent = text;
          badgeRef.current.style.opacity = '1';
          badgeRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
        } else {
          badgeRef.current.style.opacity = '0';
          badgeRef.current.style.transform = 'translate3d(0, 6px, 0) scale(0.75)';
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
      const isExpandedView = !!document.querySelector('[data-project-expanded="true"]');
      if (!isPointerRef.current && !isExpandedView && imgRef.current) {
        imgRef.current.src = FRAMES[frameRef.current];
      }
    }, 83);

    window.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointerup", handlePointerUp, { capture: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      clearInterval(animInterval);
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", handlePointerMove, { capture: true } as EventListenerOptions);
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true } as EventListenerOptions);
      window.removeEventListener("pointerup", handlePointerUp, { capture: true } as EventListenerOptions);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[999999] opacity-0 transition-opacity duration-200 ease-out will-change-transform"
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

      {/* Cute Rounded Cursor Text Pill (Frosted dark pill, clean shadow, zero color tint) */}
      <div
        ref={badgeRef}
        className="absolute left-[64px] top-[46px] pointer-events-none px-3.5 py-1.5 rounded-full text-[12px] font-sans font-medium tracking-wide text-white/95 bg-black/85 backdrop-blur-md border border-white/15 shadow-[0_6px_20px_rgba(0,0,0,0.5)] whitespace-nowrap opacity-0 transition-all duration-200 cubic-bezier(0.34,1.56,0.64,1) will-change-transform flex items-center gap-1.5"
        style={{
          transform: 'translate3d(0, 6px, 0) scale(0.75)',
        }}
      />
    </div>
  );
}
