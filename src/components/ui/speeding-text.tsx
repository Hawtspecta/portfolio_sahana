"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParsedMetric {
  isNumeric: boolean;
  prefix: string;
  target: number;
  decimals: number;
  suffix: string;
}

function parseMetricValue(raw: string): ParsedMetric {
  const match = raw.match(/^([^\d.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return { isNumeric: false, prefix: "", target: 0, decimals: 0, suffix: raw };
  }
  const [, prefix, numStr, suffix] = match;
  const dotIdx = numStr.indexOf(".");
  const decimals = dotIdx >= 0 ? numStr.length - dotIdx - 1 : 0;
  return {
    isNumeric: true,
    prefix,
    target: parseFloat(numStr),
    decimals,
    suffix,
  };
}

export interface SpeedingTextProps {
  /** Target formatted string (e.g. "94%", "92.33%", "9.5") */
  value: string;
  /** Optional word sequence to blur-cycle through if animating text instead of metrics */
  words?: string[];
  /** Triggers the speed-blur roll when true */
  isActive?: boolean;
  /** Entrance delay in milliseconds */
  delay?: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Replay on hover */
  replayOnHover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Kinetic speeding text/number counter with directional vertical SVG motion blur
 * and velocity-coupled trail streak.
 */
export function SpeedingText({
  value,
  words,
  isActive = true,
  delay = 220,
  duration = 880,
  replayOnHover = true,
  className,
  style,
}: SpeedingTextProps) {
  const rawId = useId();
  const filterId = `speed-blur-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const textRef = useRef<HTMLSpanElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  const parsed = useMemo(() => parseMetricValue(value), [value]);

  const cancelAnim = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    runningRef.current = false;
  }, []);

  const resetRestVisual = useCallback((display: string) => {
    if (textRef.current) {
      textRef.current.textContent = display;
      textRef.current.style.transform = "translate3d(0, 0, 0) scaleY(1)";
      textRef.current.style.opacity = "1";
    }
    if (ghostRef.current) {
      ghostRef.current.textContent = "";
      ghostRef.current.style.opacity = "0";
    }
    if (blurRef.current) {
      blurRef.current.setAttribute("stdDeviation", "0 0");
    }
  }, []);

  const runSpeedRoll = useCallback(
    (fromRatio = 0, rollDuration = duration) => {
      cancelAnim();

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        resetRestVisual(value);
        return;
      }

      runningRef.current = true;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, Math.max(0, elapsed / rollDuration));

        // Rapid initial velocity with crisp exponential deceleration lock-in
        const eased = 1 - Math.pow(1 - t, 3.6);
        // Instantaneous velocity envelope peaking early and decaying smoothly to 0 at t=1
        const velocity = Math.sin(Math.PI * Math.pow(t, 0.48)) * (1 - t * 0.65);
        const blurY = Math.max(0, velocity * 6.2);

        let currentText = value;
        if (words && words.length > 1) {
          const idx = Math.min(words.length - 1, Math.floor(eased * words.length));
          currentText = t >= 1 ? value : words[idx];
        } else if (parsed.isNumeric) {
          const currentNum = parsed.target * (fromRatio + (1 - fromRatio) * eased);
          const formatted =
            parsed.decimals > 0
              ? currentNum.toFixed(parsed.decimals)
              : Math.round(currentNum).toString();
          currentText = `${parsed.prefix}${formatted}${parsed.suffix}`;
        }

        if (textRef.current) {
          textRef.current.textContent = t >= 1 ? value : currentText;
          const stretchY = 1 + velocity * 0.16;
          const shiftY = velocity * -1.8;
          textRef.current.style.transform = `translate3d(0, ${shiftY.toFixed(2)}px, 0) scaleY(${stretchY.toFixed(3)})`;
        }

        if (ghostRef.current) {
          if (velocity > 0.08 && t < 0.96) {
            ghostRef.current.textContent = currentText;
            ghostRef.current.style.opacity = Math.min(0.32, velocity * 0.36).toFixed(2);
            ghostRef.current.style.transform = `translate3d(0, ${(velocity * 5.2).toFixed(2)}px, 0) scaleY(${(1 + velocity * 0.22).toFixed(3)})`;
          } else {
            ghostRef.current.textContent = "";
            ghostRef.current.style.opacity = "0";
          }
        }

        if (blurRef.current) {
          blurRef.current.setAttribute(
            "stdDeviation",
            t >= 0.98 ? "0 0" : `0 ${blurY.toFixed(2)}`
          );
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          runningRef.current = false;
          rafRef.current = 0;
          resetRestVisual(value);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [cancelAnim, duration, parsed, resetRestVisual, value, words]
  );

  useEffect(() => {
    cancelAnim();

    if (!isActive) {
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      runSpeedRoll(0, duration);
    }, delay);

    return cancelAnim;
  }, [isActive, delay, duration, cancelAnim, runSpeedRoll]);

  const handleMouseEnter = () => {
    if (!replayOnHover || !isActive || runningRef.current) return;
    runSpeedRoll(0.38, Math.round(duration * 0.65));
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      className={cn(
        "relative inline-grid place-items-center overflow-visible align-baseline",
        className
      )}
      style={style}
    >
      {/* Hidden directional vertical blur SVG filter */}
      <svg aria-hidden="true" className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id={filterId} x="-20%" y="-120%" width="140%" height="340%">
            <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      {/* Width-locking invisible placeholder prevents badge width jitter during numeric roll */}
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 opacity-0 pointer-events-none select-none whitespace-nowrap"
      >
        {value}
      </span>

      {/* Motion trail ghost layer */}
      <span
        ref={ghostRef}
        aria-hidden="true"
        className="col-start-1 row-start-1 pointer-events-none select-none whitespace-nowrap opacity-0 will-change-transform"
        style={{ filter: `url(#${filterId})` }}
      />

      {/* Primary speeding text */}
      <span
        ref={textRef}
        className="col-start-1 row-start-1 whitespace-nowrap will-change-transform"
        style={{ filter: `url(#${filterId})` }}
      >
        {value}
      </span>
    </span>
  );
}

export default SpeedingText;
