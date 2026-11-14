"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CircularGallery, {
  CircularGalleryHandle,
  CircularGalleryItem,
} from "@/components/ui/CircularGallery";

export interface AchievementCardData {
  count: string;
  title: string;
  badge: string;
  organization?: string;
  summary: string;
  accentHex: string;
  accentSoftHex: string;
  emblem: "trophy" | "pixel" | "crest";
}

export const ACHIEVEMENTS_DATA: AchievementCardData[] = [
  {
    count: "01",
    title: "CODE FOR GOOD 2026",
    badge: "FINALIST",
    organization: "JPMorgan Chase",
    summary:
      "Selected as a finalist in JPMorgan Chase’s global hackathon, developing an AI-powered employability platform to address real-world challenges.",
    accentHex: "#b67e36",
    accentSoftHex: "#f3e1c3",
    emblem: "trophy",
  },
  {
    count: "02",
    title: "PIXEL PARANOIA 2026",
    badge: "RUNNER-UP",
    summary:
      "Designed and developed an accessible digital wallet concept, focusing on inclusive design and seamless user experience.",
    accentHex: "#9e5a34",
    accentSoftHex: "#f2d9c8",
    emblem: "pixel",
  },
  {
    count: "03",
    title: "CODEQUEST",
    badge: "3RD PLACE",
    summary:
      "Recognised for developing AI LawBot, an AI-powered solution designed to make legal information more accessible and easier to understand.",
    accentHex: "#7c4e2d",
    accentSoftHex: "#ead6c2",
    emblem: "crest",
  },
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawEmblemArt(
  ctx: CanvasRenderingContext2D,
  emblem: AchievementCardData["emblem"],
  cx: number,
  cy: number,
  accentHex: string,
  accentSoftHex: string
) {
  ctx.save();

  // Concentric vintage seal rings + radial rays
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    ctx.strokeStyle = "rgba(139, 94, 60, 0.16)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 116, cy + Math.sin(angle) * 116);
    ctx.lineTo(cx + Math.cos(angle) * 148, cy + Math.sin(angle) * 148);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.fillStyle = accentSoftHex;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#4a2c1d";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 98, 0, Math.PI * 2);
  ctx.setLineDash([7, 7]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = accentHex;
  ctx.stroke();
  ctx.setLineDash([]);

  // Center illustration per achievement
  ctx.strokeStyle = "#2b180e";
  ctx.fillStyle = accentHex;
  ctx.lineWidth = 4;

  if (emblem === "trophy") {
    // Classic trophy cup
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy - 42);
    ctx.lineTo(cx + 42, cy - 42);
    ctx.quadraticCurveTo(cx + 40, cy + 12, cx, cy + 20);
    ctx.quadraticCurveTo(cx - 40, cy + 12, cx - 42, cy - 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Handles
    ctx.beginPath();
    ctx.arc(cx - 44, cy - 18, 16, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 44, cy - 18, 16, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    // Stem + base
    ctx.fillStyle = "#4a2c1d";
    ctx.fillRect(cx - 8, cy + 20, 16, 26);
    drawRoundedRect(ctx, cx - 34, cy + 44, 68, 16, 6);
    ctx.fill();
    ctx.stroke();
  } else if (emblem === "pixel") {
    // Layered geometric pixel star / award badge
    const pts = 8;
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const rad = i % 2 === 0 ? 58 : 30;
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#fdf6ec";
    ctx.fill();
    ctx.stroke();
  } else {
    // Ribbon medallion + 3rd place crest
    ctx.fillStyle = "#4a2c1d";
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 16);
    ctx.lineTo(cx - 38, cy + 68);
    ctx.lineTo(cx - 12, cy + 54);
    ctx.lineTo(cx, cy + 68);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 24, cy + 16);
    ctx.lineTo(cx + 38, cy + 68);
    ctx.lineTo(cx + 12, cy + 54);
    ctx.lineTo(cx, cy + 68);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fdf6ec";
    ctx.font = 'bold 34px "Space Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("#3", cx, cy - 6);
  }

  ctx.restore();
}

const achievementTextureCache = new Map<string, string>();

function renderAchievementCardTexture(item: AchievementCardData): string {
  const cacheKey = `${item.count}_${item.title}`;
  if (achievementTextureCache.has(cacheKey)) {
    return achievementTextureCache.get(cacheKey)!;
  }
  const W = 840;
  const H = 1080;
  const scale = 1.25;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(scale, scale);

  // Outer kraft window frame matching experience_tab.webp
  ctx.fillStyle = "#fdf6ec";
  ctx.fillRect(0, 0, W, H);

  const pad = 20;
  drawRoundedRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 36);
  ctx.fillStyle = "#d9c4a9";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#4a2c1d";
  ctx.stroke();

  // Inner archival poster paper
  const innerX = 48;
  const innerY = 122;
  const innerW = W - 96;
  const innerH = H - 166;
  drawRoundedRect(ctx, innerX, innerY, innerW, innerH, 24);
  const paperGrad = ctx.createLinearGradient(0, innerY, 0, innerY + innerH);
  paperGrad.addColorStop(0, "#fffaf2");
  paperGrad.addColorStop(1, "#f6ead9");
  ctx.fillStyle = paperGrad;
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#7c5840";
  ctx.stroke();

  // Subtle decorative double inner poster border
  drawRoundedRect(ctx, innerX + 18, innerY + 18, innerW - 36, innerH - 36, 16);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "rgba(124, 88, 64, 0.35)";
  ctx.stroke();

  // Subtle corner dot accents inside poster
  ctx.fillStyle = item.accentHex;
  for (const [dx, dy] of [
    [innerX + 40, innerY + 40],
    [innerX + innerW - 40, innerY + 40],
    [innerX + 40, innerY + innerH - 40],
    [innerX + innerW - 40, innerY + innerH - 40],
  ]) {
    ctx.beginPath();
    ctx.arc(dx, dy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Retro window header dots + file badge
  ctx.fillStyle = "#684a2c";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(64 + i * 32, 71, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#4a2c1d";
  ctx.font = 'bold 26px "Space Mono", monospace';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`WIN_${item.count}.json`, W - 60, 71);

  const centerX = W / 2;

  // Placement ribbon pill at top center
  ctx.font = 'bold 26px "Space Mono", monospace';
  const badgeW = ctx.measureText(item.badge).width + 64;
  drawRoundedRect(ctx, centerX - badgeW / 2, innerY + 56, badgeW, 52, 26);
  ctx.fillStyle = item.accentHex;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#2b180e";
  ctx.stroke();
  ctx.fillStyle = "#fdf6ec";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(item.badge, centerX, innerY + 83);

  // Illustrated center seal emblem
  drawEmblemArt(ctx, item.emblem, centerX, innerY + 300, item.accentHex, item.accentSoftHex);

  // Bold achievement title (name only — full details shown on expand!)
  ctx.fillStyle = "#2b180e";
  ctx.font = 'bold 58px "Special Elite", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const maxTextW = innerW - 104;
  const titleLines = wrapText(ctx, item.title, maxTextW);
  let titleY = innerY + 492;
  for (const line of titleLines) {
    ctx.fillText(line, centerX, titleY);
    titleY += 68;
  }

  if (item.organization) {
    ctx.fillStyle = "#7c4e2d";
    ctx.font = 'italic 700 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(item.organization, centerX, titleY + 10);
  }

  // Bottom prompt pill ("CLICK TO EXPAND ↗")
  const pillW = 310;
  const pillH = 48;
  const pillY = innerY + innerH - 92;
  drawRoundedRect(ctx, centerX - pillW / 2, pillY, pillW, pillH, 24);
  ctx.fillStyle = "#efe0ce";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#8b5e3c";
  ctx.stroke();
  ctx.fillStyle = "#4a2c1d";
  ctx.font = 'bold 21px "Space Mono", monospace';
  ctx.textBaseline = "middle";
  ctx.fillText("CLICK FOR DETAILS ↗", centerX, pillY + pillH / 2 + 1);

  const dataUrl = canvas.toDataURL("image/png");
  achievementTextureCache.set(cacheKey, dataUrl);
  return dataUrl;
}

export interface AchievementsGalleryHandle {
  scrollByWheel: (deltaY: number) => void;
}

interface AchievementsGalleryProps {
  isVisible: boolean;
  isInteractive?: boolean;
  onExitDown?: () => void;
  onExitUp?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const AchievementsGallery = forwardRef<
  AchievementsGalleryHandle,
  AchievementsGalleryProps
>(function AchievementsGallery(
  {
    isVisible,
    isInteractive = false,
    onExitDown,
    onExitUp,
    onExpandedChange,
  },
  ref
) {
  const galleryRef = useRef<CircularGalleryHandle>(null);
  const [items, setItems] = useState<CircularGalleryItem[]>([]);
  const [textColor, setTextColor] = useState("#2b180e");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeIndexRef = useRef(0);
  const isExpandedRef = useRef(false);
  const wheelAccRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const boundaryLockUntilRef = useRef(0);
  const entrySlotRef = useRef<number | null>(null);
  const currentSlotRef = useRef(0);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const rendered: CircularGalleryItem[] = ACHIEVEMENTS_DATA.map((ach) => ({
        image: renderAchievementCardTexture(ach),
        text: `${ach.title} — ${ach.badge}`,
        description: ach.organization
          ? `${ach.organization} · ${ach.summary}`
          : ach.summary,
        alt: `${ach.title} — ${ach.badge}`,
      }));
      setItems(rendered);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const syncThemeColor = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setTextColor(theme === "dark" ? "#fbf6ec" : "#2b180e");
    };
    const rafId = requestAnimationFrame(syncThemeColor);
    const obs = new MutationObserver(syncThemeColor);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isInteractive) {
      wheelAccRef.current = 0;
      boundaryLockUntilRef.current = Date.now() + 300;
      entrySlotRef.current = null;
    }
  }, [isInteractive]);

  const handleActiveChange = useCallback((idx: number) => {
    if (
      idx !== activeIndexRef.current &&
      (idx === 0 || idx === ACHIEVEMENTS_DATA.length - 1)
    ) {
      boundaryLockUntilRef.current = Date.now() + 600;
      wheelAccRef.current = 0;
    }
    activeIndexRef.current = idx;
    setActiveIndex(idx);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      isExpandedRef.current = open;
      setIsExpanded(open);
      wheelAccRef.current = 0;
      onExpandedChange?.(open);
    },
    [onExpandedChange]
  );

  const scrollByWheel = useCallback(
    (deltaY: number) => {
      if (isExpandedRef.current || !isVisible || !isInteractive) return;
      if (Math.abs(deltaY) < 1) return;

      const now = Date.now();
      if (entrySlotRef.current === null) {
        entrySlotRef.current = Math.round(currentSlotRef.current);
      }

      const requiredSlots = ACHIEVEMENTS_DATA.length; // 1 full pass through all 3 cards
      const deltaSlots = currentSlotRef.current - entrySlotRef.current;

      if (deltaY > 0 && deltaSlots >= requiredSlots) {
        if (now < boundaryLockUntilRef.current) {
          wheelAccRef.current = 0;
          return;
        }
        wheelAccRef.current = Math.max(0, wheelAccRef.current) + deltaY;
        if (wheelAccRef.current >= 60) {
          wheelAccRef.current = 0;
          lastStepTimeRef.current = now;
          onExitDown?.();
        }
        return;
      }

      if (deltaY < 0 && deltaSlots <= 0.1) {
        if (now < boundaryLockUntilRef.current) {
          wheelAccRef.current = 0;
          return;
        }
        wheelAccRef.current = Math.min(0, wheelAccRef.current) + deltaY;
        if (wheelAccRef.current <= -60) {
          wheelAccRef.current = 0;
          lastStepTimeRef.current = now;
          onExitUp?.();
        }
        return;
      }

      wheelAccRef.current = 0;
      const status = galleryRef.current?.scrollBy(deltaY);
      if (status) {
        currentSlotRef.current = status.slot;
        const nextDelta = status.slot - entrySlotRef.current;
        if (
          (deltaY > 0 && nextDelta >= requiredSlots) ||
          (deltaY < 0 && nextDelta <= 0.1)
        ) {
          boundaryLockUntilRef.current = now + 180;
        }
      }
    },
    [isInteractive, isVisible, onExitDown, onExitUp]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollByWheel,
    }),
    [scrollByWheel]
  );

  if (!items.length) {
    return <div className="w-full h-[420px] sm:h-[470px] md:h-[510px]" />;
  }

  const activeAchievement = ACHIEVEMENTS_DATA[activeIndex] ?? ACHIEVEMENTS_DATA[0];

  const renderSummaryWithHighlight = (summary: string) => {
    const marker = "AI LawBot";
    if (!summary.includes(marker)) return summary;
    const parts = summary.split(marker);
    return (
      <>
        {parts[0]}
        <strong className="font-bold text-[#2b180e]">{marker}</strong>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="relative w-full h-[400px] sm:h-[450px] md:h-[490px]">
        <CircularGallery
          ref={galleryRef}
          items={items}
          bend={2.4}
          textColor={textColor}
          borderRadius={0.05}
          scrollSpeed={1.35}
          scrollEase={0.065}
          itemSize={1.18}
          itemAspect={0.78}
          gap={0.36}
          wave={0.65}
          fadeEdges={0.06}
          shadow={0.28}
          showTitles={false}
          showCaption={false}
          openShiftX={-0.17}
          dpr={2}
          loop={true}
          autoScroll={0}
          openOnClick={true}
          snap={true}
          onActiveChange={handleActiveChange}
          onOpenChange={handleOpenChange}
        />

        {isExpanded && activeAchievement && (
          <div
            onWheel={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="pointer-events-auto absolute right-4 sm:right-10 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 hover:-translate-y-[calc(50%+6px)] w-[88%] sm:w-[46%] md:w-[43%] max-w-[460px] z-20 rounded-md border-2 border-[#4a2c1d] bg-[#fdf6ec] p-5 sm:p-6 text-[#2b180e] shadow-[5px_5px_0px_#4a2c1d] hover:shadow-[7px_9px_0px_#4a2c1d] transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span
                className="inline-block rounded-sm border border-[#4a2c1d] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.16em] uppercase"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  backgroundColor: activeAchievement.accentSoftHex,
                  color: "#4a2c1d",
                }}
              >
                {activeAchievement.badge}
              </span>
              <span
                className="text-[11px] tracking-[0.18em] uppercase opacity-70"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                #{activeAchievement.count}
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-normal tracking-wide text-[#2b180e] mb-1"
              style={{ fontFamily: "'Special Elite', cursive" }}
            >
              {activeAchievement.title}
            </h3>

            {activeAchievement.organization && (
              <p
                className="text-xs sm:text-sm italic font-medium text-[#7c4e2d] mb-3"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {activeAchievement.organization}
              </p>
            )}

            <div className="h-[1px] w-full bg-[#4a2c1d]/20 my-3" />

            <p
              className="text-sm sm:text-[15px] leading-relaxed text-[#3d2314]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {renderSummaryWithHighlight(activeAchievement.summary)}
            </p>

            <p
              className="mt-4 text-[10px] tracking-[0.16em] uppercase text-[#7c4e2d]/80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Click card or press Esc to close
            </p>
          </div>
        )}
      </div>

      {/* Carousel counter matching MY CREATIONS.EXE */}
      <div
        className={`mt-1 flex items-center justify-center gap-3 transition-opacity duration-200 ${
          isExpanded ? "pointer-events-none opacity-40" : "pointer-events-auto"
        }`}
      >
        {ACHIEVEMENTS_DATA.map((ach, idx) => (
          <button
            key={ach.count}
            type="button"
            disabled={isExpanded}
            aria-label={`Go to ${ach.title}`}
            onClick={() => galleryRef.current?.goTo(idx)}
            style={{
              backgroundColor: "var(--exp-headline-color, #4a2c1d)",
              opacity: idx === activeIndex ? 1 : 0.32,
            }}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer hover:opacity-75 ${
              idx === activeIndex ? "w-6" : "w-2"
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
          {activeIndex + 1} / {ACHIEVEMENTS_DATA.length} ACHIEVEMENTS
        </span>
      </div>
    </div>
  );
});

export default AchievementsGallery;
