"use client";

import * as React from "react";

/* ------------------------------------------------------------------ */
/*  Icon Folder — retro archival kraft-and-cream framed folder with    */
/*  3D hinged opening front pocket, multi-sheet inserts, glossy        */
/*  colored skill badges, and bidirectional chip-to-icon hover pop.    */
/* ------------------------------------------------------------------ */

export type FolderIcon = {
  /** Image URL of an icon (square works best). */
  src?: string;
  /** Or any custom SVG / React node. */
  node?: React.ReactNode;
  /** Tile background behind `node`. */
  background?: string;
  label?: string;
};

export type IconFolderProps = {
  title?: string;
  tags?: string[];
  icons?: FolderIcon[];
  /** Explicit open state override or initial state. */
  defaultOpen?: boolean;
  /** Controlled entrance trigger (falls back to IntersectionObserver if omitted). */
  isRevealed?: boolean;
  /** Entrance stagger delay in seconds when revealed. */
  revealDelay?: number;
  /** Horizontal distance between fanned icons, px. */
  spread?: number;
  /** Small icon pill in the bottom-right corner of the folder. */
  showPill?: boolean;
  className?: string;
};

/* folder outlines: front pocket has its tab on the left, back plate on the right */
const pathL = (w: number, h: number, r: number, d: number, tw: number, s: number) =>
  `M0 ${r}A${r} ${r} 0 0 1 ${r} 0L${tw} 0C${tw + s * 0.55} 0 ${tw + s * 0.45} ${d} ${tw + s} ${d}L${w - r} ${d}A${r} ${r} 0 0 1 ${w} ${d + r}L${w} ${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}L${r} ${h}A${r} ${r} 0 0 1 0 ${h - r}Z`;
const pathR = (w: number, h: number, r: number, d: number, tw: number, s: number) => {
  const x = w - tw;
  return `M0 ${d + r}A${r} ${r} 0 0 1 ${r} ${d}L${x - s} ${d}C${x - s * 0.45} ${d} ${x - s * 0.55} 0 ${x} 0L${w - r} 0A${r} ${r} 0 0 1 ${w} ${r}L${w} ${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}L${r} ${h}A${r} ${r} 0 0 1 0 ${h - r}Z`;
};

function useShape(
  ref: React.RefObject<HTMLDivElement | null>,
  make: (w: number, h: number) => string
) {
  const [d, setD] = React.useState("");
  const makeRef = React.useRef(make);
  React.useEffect(() => {
    makeRef.current = make;
  }, [make]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setD(makeRef.current(el.offsetWidth, el.offsetHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return d;
}

const emptySubscribe = () => () => {};
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return emptySubscribe();
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    () => false
  );
}

function Tile({ icon }: { icon: FolderIcon }) {
  return (
    <div
      className="relative grid h-full w-full place-items-center overflow-hidden rounded-[inherit]"
      style={{
        background: icon.src ? undefined : icon.background ?? "#FFF3D6",
        boxShadow:
          "0 14px 26px var(--sf-tile-shadow), 0 0 0 1.5px var(--sf-tile-ring), inset 0 1.5px 0 rgba(255,248,232,0.45)",
      }}
    >
      {icon.src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={icon.src} alt="" draggable={false} className="h-full w-full object-cover" />
      ) : (
        icon.node
      )}
    </div>
  );
}

export function IconFolder({
  title = "Skills",
  tags = [],
  icons = [],
  defaultOpen = false,
  isRevealed,
  revealDelay = 0,
  spread = 60,
  showPill = true,
  className = "",
}: IconFolderProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const frontRef = React.useRef<HTMLDivElement>(null);
  const backRef = React.useRef<HTMLDivElement>(null);

  const [ioShown, setIoShown] = React.useState(false);
  const [open, setOpen] = React.useState(defaultOpen);
  const [prevDefaultOpen, setPrevDefaultOpen] = React.useState(defaultOpen);
  if (defaultOpen !== prevDefaultOpen) {
    setPrevDefaultOpen(defaultOpen);
    setOpen(defaultOpen);
  }

  const [hover, setHover] = React.useState(false);
  const [hi, setHi] = React.useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  React.useEffect(() => {
    if (isRevealed !== undefined) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIoShown(true);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isRevealed]);

  const shown = isRevealed ?? ioShown;

  const frontD = useShape(frontRef, (w, h) => pathL(w, h, 22, 22, Math.round(w * 0.42), 42));
  const backD = useShape(backRef, (w, h) => pathR(w, h, 22, 22, Math.round(w * 0.38), 42));

  const n = icons.length;
  const rs = n > 1 ? 22 / (n - 1) : 0;
  const wide = open || hover;
  const lift = wide;
  const ease = "cubic-bezier(.2,.8,.2,1)";
  const popEase = "cubic-bezier(0.34, 1.45, 0.64, 1)";
  const toggle = () => setOpen((o) => !o);

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`${title}: ${tags.join(", ")}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => {
        setHover(false);
        setHi(null);
      }}
      className={`skill-folder-card relative isolate h-[214px] sm:h-[222px] w-full max-w-[420px] cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent] focus-visible:rounded-3xl focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 ${className}`}
      style={{
        color: "var(--sf-ink)",
        outlineColor: "var(--sf-focus)",
        perspective: "900px",
        zIndex: lift ? 20 : undefined,
        opacity: shown || reduced ? 1 : 0,
        transform:
          shown || reduced
            ? lift
              ? "translateY(-8px) scale(1.02)"
              : "none"
            : "translateY(34px) scale(.92)",
        transition: reduced
          ? "none"
          : `transform .85s ${ease} ${shown ? `${revealDelay}s` : "0s"}, opacity .55s ease ${shown ? `${revealDelay}s` : "0s"}`,
      }}
    >
      <style>{`
        .skill-folder-card {
          --sf-ink: #2b180e;
          --sf-chip-bg: #efe0ce;
          --sf-chip-border: #d5bba0;
          --sf-chip-ink: #4a2c1d;
          --sf-back: #caa982;
          --sf-back-edge: #4a2c1d;
          --sf-sheet-1: #fffcf7;
          --sf-sheet-2: #f4e6d4;
          --sf-sheet-border: #b89875;
          --sf-sheet-line: rgba(139, 94, 60, 0.14);
          --sf-front: #d8bc99;
          --sf-front-inset: #fdf6ec;
          --sf-front-inset-border: #b89875;
          --sf-front-edge: #4a2c1d;
          --sf-hardware: #6b442d;
          --sf-pill-bg: #efe0ce;
          --sf-pill-border: #d5bba0;
          --sf-tile-ring: rgba(43, 24, 14, 0.16);
          --sf-tile-shadow: rgba(43, 24, 14, 0.3);
          --sf-folder-shadow: drop-shadow(0 16px 26px rgba(43, 24, 14, 0.28)) drop-shadow(0 5px 10px rgba(43, 24, 14, 0.16));
          --sf-folder-shadow-lift: drop-shadow(0 24px 38px rgba(43, 24, 14, 0.34)) drop-shadow(0 8px 16px rgba(43, 24, 14, 0.2));
          --sf-focus: #8b5e3c;
        }

        html[data-theme="dark"] .skill-folder-card,
        html.dark .skill-folder-card {
          /* Keep physical kraft-and-cream folder palette identical in dark mode */
          --sf-tile-shadow: rgba(0, 0, 0, 0.42);
          --sf-folder-shadow: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.55)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
          --sf-folder-shadow-lift: drop-shadow(0 26px 42px rgba(0, 0, 0, 0.65)) drop-shadow(0 10px 18px rgba(0, 0, 0, 0.42));
        }
      `}</style>

      {/* back kraft folder flap — wrapper applies drop shadow outside clipPath so bottom stays crisply cut */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[10px] z-0"
        style={{
          filter: lift ? "var(--sf-folder-shadow-lift)" : "var(--sf-folder-shadow)",
          transition: reduced ? "none" : `filter .45s ${ease}`,
        }}
      >
        <div
          ref={backRef}
          className="h-full w-full"
          style={{
            backgroundColor: "var(--sf-back)",
            clipPath: backD ? `path('${backD}')` : undefined,
          }}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path d={backD} fill="none" stroke="var(--sf-back-edge)" strokeWidth="2.8" />
          </svg>
          {/* Minimal retro rivet bar on upper-right tab ear */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-[9px] h-[5px] w-12 rounded-full opacity-70"
            style={{ backgroundColor: "var(--sf-hardware)" }}
          />
        </div>
      </div>

      {/* double layered cream ruled notebook paper inserts peeking behind icons (stays cream in dark mode) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-[1] left-[10%] right-[8%] top-[24px] h-[104px] rounded-xl border transition-transform duration-500"
        style={{
          backgroundColor: "var(--sf-sheet-2)",
          borderColor: "var(--sf-sheet-border)",
          boxShadow: "0 4px 10px rgba(43, 24, 14, 0.14)",
          transform: wide ? "translateY(-10px) rotate(2.2deg)" : "translateY(0px) rotate(1.1deg)",
          transitionTimingFunction: ease,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-[2] left-[7%] right-[11%] top-[30px] h-[106px] rounded-xl border transition-transform duration-500"
        style={{
          backgroundColor: "var(--sf-sheet-1)",
          borderColor: "var(--sf-sheet-border)",
          boxShadow: "0 5px 12px rgba(43, 24, 14, 0.16)",
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 15px, var(--sf-sheet-line) 15px, var(--sf-sheet-line) 16px)",
          transform: wide ? "translateY(-12px) rotate(-2deg)" : "translateY(0px) rotate(-1deg)",
          transitionTimingFunction: ease,
        }}
      />

      {/* fanned vibrant skill tiles — deeply tucked inside pocket until hovered */}
      <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
        {icons.map((icon, i) => {
          const k = i - (n - 1) / 2;
          const gap = wide ? spread * 1.18 : spread * 0.92;
          const restY = 44 + k * k * 4; // deep inside 130px pocket (bottom hidden behind pocket!)
          const openY = -12 + k * k * 7; // springs cleanly upward on hover/click
          const y = wide ? openY : restY;
          const rot = k * rs * (wide ? 1.25 : 0.85);
          const isIconActive = hi === i;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-[20px] -ml-[40px] h-[80px] w-[80px] rounded-[21px] [backface-visibility:hidden]"
              style={{
                zIndex: isIconActive ? 8 : undefined,
                opacity: shown || reduced ? 1 : 0,
                transform:
                  shown || reduced
                    ? `translate3d(${k * gap}px, ${y}px, 0) rotate(${rot}deg)`
                    : `translate3d(${k * spread * 0.5}px, 90px, 0) scale(0.85)`,
                transition: reduced ? "none" : `transform ${wide ? 0.55 : 0.85}s ${wide ? popEase : ease}, opacity .5s`,
                transitionDelay: reduced ? "0s" : wide ? `${i * 0.035}s` : `${revealDelay + 0.22 + i * 0.07}s`,
              }}
            >
              <div
                className="pointer-events-auto relative h-full w-full rounded-[inherit]"
                onPointerEnter={(e) => e.pointerType === "mouse" && setHi(i)}
                onPointerLeave={() => setHi((h) => (h === i ? null : h))}
                style={{
                  transform: isIconActive
                    ? `translateY(-28px) rotate(${-rot}deg) scale(1.14)`
                    : hi !== null
                      ? "scale(.94)"
                      : "none",
                  filter: hi !== null && !isIconActive ? "saturate(.7) brightness(.88)" : "none",
                  transition: reduced ? "none" : `transform .45s ${popEase}, filter .3s ease`,
                }}
              >
                <Tile icon={icon} />
                {icon.label && (
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide leading-4 shadow-md"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      background: "var(--sf-pill-bg)",
                      borderColor: "var(--sf-focus)",
                      color: "var(--sf-ink)",
                      opacity: isIconActive ? 1 : 0,
                      transform: `translateX(-50%) translateY(${isIconActive ? 0 : 6}px)`,
                      transition: reduced ? "none" : `opacity .25s ease, transform .35s ${ease}`,
                    }}
                  >
                    {icon.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* tactile kraft frame + recessed cream inner plate front pocket — wrapper holds 3D shadow cleanly over clipped pocket */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[130px]"
        style={{
          transformOrigin: "center bottom",
          transform: lift ? "rotateX(-13deg) translateY(4px)" : "rotateX(0deg) translateY(0px)",
          filter: lift
            ? "drop-shadow(0 -5px 12px rgba(43, 24, 14, 0.22)) drop-shadow(0 12px 20px rgba(43, 24, 14, 0.28))"
            : "drop-shadow(0 -3px 8px rgba(43, 24, 14, 0.14)) drop-shadow(0 8px 14px rgba(43, 24, 14, 0.2))",
          transition: reduced ? "none" : `transform .55s ${ease}, filter .45s ${ease}`,
        }}
      >
        <div
          ref={frontRef}
          className="pointer-events-auto relative h-full w-full overflow-hidden"
          style={{
            backgroundColor: "var(--sf-front)",
            clipPath: frontD ? `path('${frontD}')` : undefined,
          }}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path d={frontD} fill="none" stroke="var(--sf-front-edge)" strokeWidth="3" />
          </svg>

          {/* Retro window control marks on folder top shoulder */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-[28px] flex items-center gap-1.5 opacity-75"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--sf-hardware)" }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--sf-hardware)" }} />
          </div>

          {/* Recessed cream paper card inset inside the tan kraft folder frame */}
          <div
            className="absolute inset-x-3.5 bottom-3 top-[34px] rounded-[15px] border px-4 py-2.5 flex flex-col justify-between"
            style={{
              backgroundColor: "var(--sf-front-inset)",
              borderColor: "var(--sf-front-inset-border)",
              boxShadow: "inset 0 2px 5px rgba(43, 24, 14, 0.08), 0 1px 0 rgba(255, 252, 247, 0.65)",
            }}
          >
            <div className="flex items-start justify-between gap-2 pr-8">
              <h3
                className="m-0 text-[1.24rem] font-bold leading-[24px] tracking-tight"
                style={{ fontFamily: "'Special Elite', cursive", color: "var(--sf-ink)" }}
              >
                {title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pr-24">
              {tags.map((tag, tagIdx) => {
                const matchedIdx = icons.findIndex((ic) => ic.label === tag);
                const iconIdx = matchedIdx >= 0 ? matchedIdx : tagIdx;
                const isHighlighted = hi === iconIdx;
                return (
                  <span
                    key={tag}
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse") {
                        setHi(iconIdx);
                      }
                    }}
                    onPointerLeave={() => setHi((h) => (h === iconIdx ? null : h))}
                    className="h-6 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 transition-all duration-200"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      background: "var(--sf-chip-bg)",
                      borderColor: isHighlighted ? "var(--sf-focus)" : "var(--sf-chip-border)",
                      color: isHighlighted ? "var(--sf-ink)" : "var(--sf-chip-ink)",
                      transform: isHighlighted ? "translateY(-1px)" : "none",
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Bottom-right mini dock preview pill */}
          {showPill && (
            <span
              className="absolute bottom-5 right-5 flex h-[28px] items-center gap-1 rounded-full border px-1.5 shadow-sm"
              style={{ background: "var(--sf-pill-bg)", borderColor: "var(--sf-pill-border)" }}
              aria-hidden="true"
            >
              {icons.map((icon, i) => (
                <span
                  key={i}
                  className="block h-[18px] w-[18px] overflow-hidden rounded-[5px] transition-transform duration-200"
                  style={{ transform: hi === i ? "scale(1.18)" : "none" }}
                >
                  <span
                    className="grid h-full w-full place-items-center [&_svg]:h-[76%] [&_svg]:w-[76%]"
                    style={{ background: icon.src ? undefined : icon.background }}
                  >
                    {icon.src ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={icon.src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      icon.node
                    )}
                  </span>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default IconFolder;
