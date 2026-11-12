"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/** A photo pinned to a spread. x / y / w are percentages of the whole spread. */
export type JournalPrint = {
  src: string;
  alt?: string;
  x: number;
  y: number;
  w: number;
  rotate?: number;
  caption?: string;
  /** A strip of washi tape across the top instead of a polaroid border. */
  tape?: boolean;
};

/** A handwritten note on a spread. x / y / w are percentages of the whole spread. */
export type JournalNote = {
  x: number;
  y: number;
  w: number;
  title?: string;
  body?: string;
  rotate?: number;
  /** "card" sits on a torn paper slip; "ink" writes straight onto the photo. */
  style?: "card" | "ink";
};

export type CertificateSpreadData = {
  count: string;
  badge: string;
  title: string;
  issuer: string;
  date: string;
  highlights: string[];
  image: string;
  accentSoftHex?: string;
  spreadBg?: string;
  tapeColor?: string;
};

/** One open double page. The image runs across both pages and folds at the spine. */
export type JournalSpread = {
  id?: string;
  label?: string;
  image?: string;
  alt?: string;
  imagePosition?: string;
  /** Paper colour when there is no image, or under it while it loads. */
  paper?: string;
  prints?: JournalPrint[];
  notes?: JournalNote[];
  certificate?: CertificateSpreadData;
};

export type JournalAction = "prev" | "next" | "more" | "share" | "delete" | "add";

export interface JournalSpreadCarouselProps {
  spreads: JournalSpread[];
  title?: string;
  /** The line under the title. Defaults to the page count. */
  meta?: string;
  height?: string;
  initialIndex?: number;
  /** Milliseconds between automatic page turns; false turns it off. Stops on the first touch. */
  autoPlay?: number | false;
  onIndexChange?: (index: number) => void;
  onAction?: (action: JournalAction, index: number) => void;
  onExpandChange?: (expanded: boolean) => void;
  isVisible?: boolean;
  className?: string;
}

// #region pose
const OPEN = 0; // flat at rest so the centered certificate renders pixel-sharp without 3D rasterization blur
const SIDE = 80; // how far a stacked page turns towards the middle
const FOLD = 174; // a page folding shut over its partner

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Spread shape for a stage: wide open book on desktop, taller on portrait phones. */
export function spreadAspect(stageW: number, stageH: number): number {
  return stageW < 640 && stageH > stageW ? 0.95 : 1.56;
}

/** Spread width for a stage, keeping room for the side stacks. */
export function spreadWidth(stageW: number, stageH: number): number {
  if (stageW <= 0 || stageH <= 0) return 0;
  const narrow = stageW < 640;
  return Math.round(
    Math.min(
      stageW * (narrow ? 0.94 : 0.86),
      stageH * 0.98 * spreadAspect(stageW, stageH),
      1160
    )
  );
}

/**
 * Where spread `p` steps from the centre sits. 0 is open in the middle; ±1 is the first
 * page of each stack, and further ones step outwards and back.
 */
export function poseFor(p: number, w: number) {
  const d = Math.abs(p);
  const a = d < 1 ? d : 1;
  const s = p < 0 ? -1 : 1;
  const out = d > 1 ? d - 1 : 0;
  const x = s * (a * (w * 0.5 + w * 0.035) + out * w * 0.06);
  const z = -(a * w * 0.42 + out * w * 0.065);
  const fold = a * a;
  const left = p > 0 ? OPEN + (FOLD - OPEN) * fold : OPEN + (SIDE - OPEN) * a;
  const right =
    p < 0 ? -(OPEN + (FOLD - OPEN) * fold) : -(OPEN + (SIDE - OPEN) * a);
  const shade = (deg: number) => clamp((Math.abs(deg) - OPEN) / 95, 0, 0.55);
  return {
    x,
    z,
    left,
    right,
    shadeLeft: shade(left),
    shadeRight: shade(right),
    opacity: clamp(7.2 - d, 0, 1),
    hidden: d > 7.2,
  };
}

/** Where a drag lets go: the nearest spread, nudged by the flick. */
export function settle(pos: number, velocity: number, n: number): number {
  return clamp(
    Math.round(pos + clamp(velocity * 0.18, -1.5, 1.5)),
    0,
    Math.max(0, n - 1)
  );
}

/** Tween length for a jump of `steps` spreads; longer jumps riffle faster per page. */
export function durationFor(steps: number): number {
  return steps <= 0 ? 0 : Math.round(560 * Math.sqrt(Math.min(steps, 12)));
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
// #endregion

const CSS =
  ".jsc-root{position:relative;width:100%;display:grid;grid-template-rows:minmax(0,1fr) auto;overflow:visible;" +
  "background:transparent;color:var(--exp-headline-color,#2b180e);" +
  "font-family:'Plus Jakarta Sans',sans-serif;outline:none;user-select:none;-webkit-user-select:none;container-type:inline-size}" +
  ".jsc-root:focus-visible{outline:none}" +
  ".jsc-stage{position:relative;min-height:0;touch-action:pan-y;cursor:grab}" +
  ".jsc-stage[data-drag]{cursor:grabbing}" +
  ".jsc-floor{position:absolute;left:50%;top:50%;width:calc(var(--jsc-w) * 1.18);height:calc(var(--jsc-h) * .52);transform:translate(-50%,calc(var(--jsc-h) * .25));" +
  "background:rgba(43,24,14,.32);opacity:.55;filter:blur(calc(var(--jsc-w) * .028));border-radius:calc(var(--jsc-w) * .04);pointer-events:none}" +
  ".jsc-view{position:absolute;inset:0;perspective:calc(var(--jsc-w) * 2.35);perspective-origin:50% 48%}" +
  ".jsc-scene{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}" +
  ".jsc-item{position:absolute;left:0;top:0;transform-style:preserve-3d;visibility:hidden}" +
  ".jsc-page{position:absolute;top:calc(var(--jsc-h) * -.5);width:calc(var(--jsc-w) * .5);height:var(--jsc-h);overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;" +
  "background:#faf0df;box-shadow:0 16px 36px rgba(43,24,14,.24)}" +
  ".jsc-page[data-side=l]{left:calc(var(--jsc-w) * -.5);transform-origin:100% 50%;border-radius:calc(var(--jsc-w) * .024) 0 0 calc(var(--jsc-w) * .024)}" +
  ".jsc-page[data-side=r]{left:0;transform-origin:0 50%;border-radius:0 calc(var(--jsc-w) * .024) calc(var(--jsc-w) * .024) 0}" +
  ".jsc-sheet{position:absolute;top:0;width:var(--jsc-w);height:var(--jsc-h);pointer-events:inherit;background:#faf0df}" +
  ".jsc-page[data-side=l]>.jsc-sheet{left:0}" +
  ".jsc-page[data-side=r]>.jsc-sheet{left:calc(var(--jsc-w) * -.5)}" +
  ".jsc-bg{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".jsc-gutter{display:none}" +
  ".jsc-shade{position:absolute;inset:0;background:#2b180e;opacity:var(--jsc-s,0);pointer-events:none}" +
  ".jsc-cert-spread{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:4% 5% 5.5%}" +
  ".jsc-cert-stage{position:relative;width:88%;height:88%;display:flex;align-items:center;justify-content:center;padding:1.4%;background:#fffdf9;border-radius:8px;box-shadow:0 14px 30px rgba(20,10,4,.28);pointer-events:inherit;transition:transform .25s ease}" +
  ".jsc-item[aria-hidden=false] .jsc-cert-stage{cursor:pointer}" +
  ".jsc-item[aria-hidden=false]:hover .jsc-cert-stage{transform:translateY(-4px) scale(1.01)}" +
  ".jsc-cert-tape-l,.jsc-cert-tape-r{position:absolute;top:-11px;width:62px;height:20px;border-radius:2px;opacity:.92;box-shadow:0 2px 6px rgba(20,10,4,.22);pointer-events:none}" +
  ".jsc-cert-tape-l{left:7%;transform:rotate(-8deg)}" +
  ".jsc-cert-tape-r{right:7%;transform:rotate(7deg)}" +
  ".jsc-cert-img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;border-radius:4px}" +
  ".jsc-cert-stamp{position:absolute;bottom:2.8%;right:5%;display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:#fdf6ec;box-shadow:0 3px 10px rgba(20,10,4,.24);font-family:'Space Mono',monospace;font-size:clamp(9px,0.95cqi,11px);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2b180e}" +
  ".jsc-cert-seal{position:absolute;bottom:2.8%;left:5%;display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(253,246,236,.92);box-shadow:0 3px 10px rgba(20,10,4,.2);font-family:'Special Elite',cursive;font-size:clamp(10px,1cqi,12px);color:#2b180e}" +
  ".jsc-bar{display:flex;align-items:center;justify-content:center;gap:clamp(10px,1.2cqi,16px);padding:8px 0 2px;position:relative;z-index:2}" +
  ".jsc-btn{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:1.5px solid #4a2c1d;padding:0;cursor:pointer;color:#2b180e;background:#fdf6ec;" +
  "box-shadow:2px 2px 0 #4a2c1d;transition:transform .2s cubic-bezier(.2,.7,.2,1),background .2s,opacity .2s}" +
  ".jsc-btn:hover:not(:disabled){transform:translateY(-2px);background:#f3e1c3}" +
  ".jsc-btn:active:not(:disabled){transform:scale(.94)}" +
  ".jsc-btn:disabled{opacity:.38;cursor:not-allowed;box-shadow:none}" +
  ".jsc-btn svg{width:45%;height:45%}" +
  ".jsc-btn:focus-visible{outline:none}" +
  ".jsc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.jsc-btn{transition:none}}";

function Sheet({ spread }: { spread: JournalSpread }) {
  if (spread.certificate) {
    const c = spread.certificate;
    const tapeBg = c.tapeColor ?? "#eab65c";
    return (
      <div className="jsc-sheet" style={{ background: c.spreadBg ?? spread.paper ?? "#c96444" }}>
        <div className="jsc-cert-spread" style={{ background: c.spreadBg ?? spread.paper ?? "#c96444" }}>
          <div className="jsc-cert-stage cursor-pointer" role="button" aria-label={`Inspect ${c.title}`}>
            <span className="jsc-cert-tape-l" style={{ backgroundColor: tapeBg }} aria-hidden="true" />
            <span className="jsc-cert-tape-r" style={{ backgroundColor: tapeBg }} aria-hidden="true" />
            <img
              className="jsc-cert-img"
              src={c.image}
              alt={spread.alt ?? c.title}
              draggable={false}
              decoding="async"
            />
          </div>
          <span className="jsc-cert-seal">
            #{c.count} &bull; {c.issuer}
          </span>
          <span
            className="jsc-cert-stamp"
            style={{ background: c.accentSoftHex ?? "#f3e1c3" }}
          >
            {c.badge}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="jsc-sheet" style={{ background: spread.paper ?? "#fdf6ec" }}>
      {spread.image ? (
        <img
          className="jsc-bg"
          src={spread.image}
          alt=""
          draggable={false}
          decoding="async"
          style={{ maxWidth: "none", objectPosition: spread.imagePosition }}
        />
      ) : null}
    </div>
  );
}

export default function JournalSpreadCarousel({
  spreads,
  title = "CERTIFICATIONS.TXT",
  height = "460px",
  initialIndex = 0,
  autoPlay = false,
  onIndexChange,
  onExpandChange,
  isVisible = true,
  className,
}: JournalSpreadCarouselProps) {
  const n = spreads.length;
  const start = clamp(Math.round(initialIndex), 0, Math.max(0, n - 1));
  const [index, setIndex] = React.useState(start);
  const [reduced, setReduced] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [expandedCert, setExpandedCert] =
    React.useState<CertificateSpreadData | null>(null);

  const closeExpanded = React.useCallback(() => {
    setExpandedCert(null);
    onExpandChange?.(false);
  }, [onExpandChange]);

  React.useEffect(() => {
    if (!expandedCert) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeExpanded();
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [expandedCert, closeExpanded]);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const items = React.useRef<(HTMLDivElement | null)[]>([]);
  const pages = React.useRef<(HTMLDivElement | null)[]>([]);
  const width = React.useRef(0);
  const pos = React.useRef(start);
  const target = React.useRef(start);
  const tween = React.useRef<null | {
    from: number;
    to: number;
    t0: number;
    dur: number;
    ease: (t: number) => number;
  }>(null);
  const raf = React.useRef(0);
  const drag = React.useRef<null | {
    id: number;
    x: number;
    from: number;
    lastX: number;
    lastT: number;
    v: number;
    moved: boolean;
  }>(null);
  const touched = React.useRef(false);
  const reducedRef = React.useRef(false);
  const onIndexRef = React.useRef(onIndexChange);
  React.useEffect(() => {
    onIndexRef.current = onIndexChange;
  }, [onIndexChange]);

  const paint = React.useCallback(() => {
    const w = width.current;
    if (!w) return;
    for (let i = 0; i < items.current.length; i++) {
      const el = items.current[i];
      if (!el) continue;
      const q = poseFor(i - pos.current, w);
      if (q.hidden) {
        el.style.visibility = "hidden";
        continue;
      }
      const isSettledCenter = Math.abs(i - pos.current) < 0.002;
      el.style.visibility = "visible";
      el.style.opacity = String(q.opacity);
      el.style.transform = isSettledCenter
        ? "none"
        : "translate3d(" + q.x.toFixed(2) + "px,0," + q.z.toFixed(2) + "px)";
      const l = pages.current[i * 2];
      const r = pages.current[i * 2 + 1];
      if (l) {
        l.style.transform = isSettledCenter
          ? "none"
          : "rotateY(" + q.left.toFixed(2) + "deg)";
        l.style.setProperty("--jsc-s", q.shadeLeft.toFixed(3));
      }
      if (r) {
        r.style.transform = isSettledCenter
          ? "none"
          : "rotateY(" + q.right.toFixed(2) + "deg)";
        r.style.setProperty("--jsc-s", q.shadeRight.toFixed(3));
      }
    }
  }, []);

  const frameRef = React.useRef<(t: number) => void>(() => {});
  const frame = React.useCallback(
    (t: number) => {
      raf.current = 0;
      const tw = tween.current;
      if (tw) {
        const k = tw.dur > 0 ? clamp((t - tw.t0) / tw.dur, 0, 1) : 1;
        pos.current = tw.from + (tw.to - tw.from) * tw.ease(k);
        if (k >= 1) tween.current = null;
      }
      paint();
      if (tween.current) raf.current = requestAnimationFrame((ts) => frameRef.current(ts));
    },
    [paint]
  );
  React.useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  const kick = React.useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame((ts) => frameRef.current(ts));
  }, []);

  const go = React.useCallback(
    (to: number, ease = easeInOut) => {
      const next = clamp(to, 0, Math.max(0, n - 1));
      if (next !== target.current) {
        target.current = next;
        setIndex(next);
        onIndexRef.current?.(next);
      }
      const dur = reducedRef.current
        ? 0
        : durationFor(Math.abs(next - pos.current));
      tween.current = {
        from: pos.current,
        to: next,
        t0: performance.now(),
        dur,
        ease,
      };
      kick();
    },
    [n, kick]
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  React.useEffect(() => {
    const stage = stageRef.current;
    const root = rootRef.current;
    if (!stage || !root) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: sw, height: sh } = entry.contentRect;
      const w = spreadWidth(sw, sh);
      width.current = w;
      root.style.setProperty("--jsc-w", w + "px");
      root.style.setProperty(
        "--jsc-h",
        Math.round(w / spreadAspect(sw, sh)) + "px"
      );
      paint();
    });
    ro.observe(stage);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [paint]);

  React.useEffect(() => {
    if (pos.current > n - 1) go(n - 1);
    else paint();
  }, [n, go, paint]);

  // Reveal animation: riffle from the back of the book to the first certificate on entry
  const wasVisibleRef = React.useRef(false);
  React.useEffect(() => {
    if (isVisible && !wasVisibleRef.current) {
      wasVisibleRef.current = true;
      if (!reducedRef.current && n > 1 && !touched.current) {
        tween.current = null;
        pos.current = n - 1;
        target.current = n - 1;
        paint();
        const rafId = requestAnimationFrame(() => {
          go(0);
        });
        return () => cancelAnimationFrame(rafId);
      }
    } else if (!isVisible) {
      wasVisibleRef.current = false;
      touched.current = false;
    }
  }, [isVisible, n, go, paint]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!autoPlay || reduced || n < 2 || !root) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(root);
    const id = window.setInterval(() => {
      if (touched.current || !visible || document.hidden || drag.current) return;
      go(target.current >= n - 1 ? 0 : target.current + 1);
    }, autoPlay);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, [autoPlay, reduced, n, go]);

  const stop = () => {
    touched.current = true;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || n < 1) return;
    stop();
    tween.current = null;
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      from: pos.current,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const w = width.current;
    if (!d || d.id !== e.pointerId || !w) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v =
      d.v * 0.6 + (-(e.clientX - d.lastX) / (w * 0.42) / (dt / 1000)) * 0.4;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    pos.current = clamp(d.from - dx / (w * 0.42), -0.3, n - 0.7);
    kick();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (!isVisible) return;
    if (d.moved) {
      go(settle(pos.current, d.v, n), easeOut);
      return;
    }
    const hit = (e.target as HTMLElement).closest("[data-i]");
    const i = hit ? Number(hit.getAttribute("data-i")) : target.current;
    if (
      i === target.current &&
      (e.target as HTMLElement).closest(".jsc-cert-stage") &&
      spreads[i]?.certificate
    ) {
      setExpandedCert(spreads[i].certificate ?? null);
      onExpandChange?.(true);
      return;
    }
    go(i);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
    };
    if (e.target !== e.currentTarget) return;
    if (e.key in map) go(target.current + map[e.key]);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(n - 1);
    else return;
    e.preventDefault();
    stop();
  };

  const wheel = React.useRef({ acc: 0, at: 0 });
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.stopPropagation();
      const w = wheel.current;
      w.acc += e.deltaX;
      if (Math.abs(w.acc) < 40 || e.timeStamp - w.at < 320) return;
      touched.current = true;
      w.at = e.timeStamp;
      go(target.current + (w.acc > 0 ? 1 : -1));
      w.acc = 0;
    };
    stage.addEventListener("wheel", onWheel, { passive: true });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [go]);

  const current = spreads[index];

  return (
    <div
      ref={rootRef}
      className={"jsc-root" + (className ? " " + className : "")}
      style={{ height, pointerEvents: isVisible ? undefined : "none" }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      <style>{CSS}</style>

      <div
        ref={stageRef}
        className="jsc-stage"
        data-drag={dragging ? "" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="jsc-floor" aria-hidden="true" />
        <div className="jsc-view">
          <div className="jsc-scene">
            {spreads.map((s, i) => (
              <div
                key={s.id ?? i}
                ref={(el) => {
                  items.current[i] = el;
                }}
                className="jsc-item"
                data-i={i}
                role="group"
                aria-roledescription="spread"
                aria-label={
                  (s.label ?? "Spread " + (i + 1)) + ", " + (i + 1) + " of " + n
                }
                aria-hidden={i !== index}
              >
                {s.alt ? <span className="jsc-sr">{s.alt}</span> : null}
                {(["l", "r"] as const).map((side, k) => (
                  <div
                    key={side}
                    ref={(el) => {
                      pages.current[i * 2 + k] = el;
                    }}
                    className="jsc-page"
                    data-side={side}
                  >
                    <Sheet spread={s} />
                    <div className="jsc-gutter" />
                    <div className="jsc-shade" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Archival Book Controls matching MY CREATIONS.EXE & WINS.JSON */}
      <div className="jsc-bar">
        <button
          type="button"
          className="jsc-btn"
          aria-label="Previous certificate"
          disabled={index <= 0}
          onClick={() => {
            stop();
            go(index - 1);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 px-2">
          {spreads.map((s, idx) => (
            <button
              key={s.id ?? idx}
              type="button"
              aria-label={`Open ${s.label ?? `Certificate ${idx + 1}`}`}
              onClick={() => {
                stop();
                go(idx);
              }}
              style={{
                backgroundColor: "var(--exp-headline-color, #4a2c1d)",
                opacity: idx === index ? 1 : 0.32,
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer hover:opacity-75 ${
                idx === index ? "w-6" : "w-2"
              }`}
            />
          ))}
          <span
            className="ml-2 text-[11px] font-mono tracking-widest uppercase portfolio-tabs-counter transition-colors duration-500"
            style={{
              fontFamily: "'Special Elite', cursive",
              color: "var(--exp-subtext-color, #3d2314)",
            }}
          >
            {index + 1} / {n} CERTIFICATES
          </span>
        </div>

        <button
          type="button"
          className="jsc-btn"
          aria-label="Next certificate"
          disabled={index >= n - 1}
          onClick={() => {
            stop();
            go(index + 1);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <p className="jsc-sr" aria-live="polite">
        {current
          ? (current.label ?? "Spread " + (index + 1)) +
            ", " +
            (index + 1) +
            " of " +
            n
          : ""}
      </p>

      {typeof document !== "undefined" && isVisible && expandedCert
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={expandedCert.title}
              onClick={closeExpanded}
              onWheel={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1c0f08]/75 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center rounded-lg bg-[#fffdf9] p-2 sm:p-3 border-2 border-[#4a2c1d] shadow-[0_24px_60px_rgba(15,8,4,0.5)]"
              >
                <button
                  type="button"
                  onClick={closeExpanded}
                  aria-label="Close certificate preview"
                  className="absolute -top-3.5 -right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#4a2c1d] bg-[#fdf6ec] text-[#2b180e] shadow-[2px_2px_0_#4a2c1d] hover:bg-[#f3e1c3] cursor-pointer transition-transform hover:scale-105"
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
                <img
                  src={expandedCert.image}
                  alt={expandedCert.title}
                  className="max-w-[88vw] max-h-[82vh] w-auto h-auto object-contain rounded"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
