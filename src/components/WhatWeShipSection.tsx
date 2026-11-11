"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Lenis from "lenis";
import TileReveal from "./ui/tile-reveal";
import { ExperienceFeatureCarousel, CarouselImage } from "./ui/feature-carousel";
import { TechBadgeIcon } from "./ui/tech-badge-icons";
import { IconFolder } from "./ui/icon-folder";
import { SKILL_FOLDERS } from "./ui/skill-folder-data";

export interface ExperienceCardData {
  index: number;
  count: string;
  company: string;
  role: string;
  period: string;
  tagline: string;
  summary: string;
  contributions: string[];
  techStack: string[];
  images: CarouselImage[];
}

export const EXPERIENCE_DATA: ExperienceCardData[] = [
  {
    index: 1,
    count: "01",
    company: "InVizn",
    role: "AI/ML Intern",
    period: "JUN — AUG 2026",
    tagline: "Built intelligent products beyond the interface.",
    summary:
      "Worked on AI/ML-powered apps and full-stack solutions—contributed to multimodal RAG pipelines, contextual chatbots, Chrome extensions, cloud image-to-video generation, and internal CRM & analytics platforms.",
    contributions: [
      "Developed AI-powered applications and full-stack solutions.",
      "Built CRM, complaint management, and analytics platforms.",
      "Integrated user telemetry, heatmaps, and third-party APIs.",
    ],
    techStack: ["React", "FastAPI", "Python", "PostgreSQL", "AI/ML", "RAG"],
    images: [
      { src: "/assets/brandappart/card_1_img_1.webp", alt: "InVizn AI/ML workflow preview 1" },
      { src: "/assets/brandappart/card_1_img_2.webp", alt: "InVizn multimodal RAG pipeline preview" },
      { src: "/assets/brandappart/card_1_img_3.webp", alt: "InVizn full-stack interface showcase" },
      { src: "/assets/brandappart/card_1_img_4.webp", alt: "InVizn analytics & CRM dashboard" },
      { src: "/assets/brandappart/card_1_img_5.webp", alt: "InVizn Chrome extension & tooling" },
    ],
  },
  {
    index: 2,
    count: "02",
    company: "Freelance",
    role: "Web Developer",
    period: "APR — OCT 2026",
    tagline: "Turned creative ideas into functional digital experiences.",
    summary:
      "Delivered two production freelance web applications, translated Figma designs into responsive interfaces, and independently managed end-to-end frontend engineering through deployment.",
    contributions: [
      "Translated Figma designs into functional React applications.",
      "Developed responsive interfaces with a focus on UI/UX.",
      "Independently handled frontend implementation and deployment.",
    ],
    techStack: ["React.js", "JavaScript", "Figma", "HTML", "CSS"],
    images: [
      { src: "/assets/brandappart/card_2_img_1.webp", alt: "Freelance web project showcase 1" },
      { src: "/assets/brandappart/card_2_img_2.webp", alt: "Figma to React production UI" },
      { src: "/assets/brandappart/card_2_img_3.webp", alt: "Responsive multi-device layout" },
      { src: "/assets/brandappart/card_2_img_4.webp", alt: "Interactive frontend flow" },
      { src: "/assets/brandappart/card_2_img_5.webp", alt: "Deployed client web experience" },
    ],
  },
];

// Backward-compatible alias
export const SERVICES_DATA = EXPERIENCE_DATA;

export interface LeadershipRoleData {
  count: string;
  role: string;
  organization: string;
  summary: string;
  keyAreas: string[];
}

export const LEADERSHIP_ROLES_DATA: LeadershipRoleData[] = [
  {
    count: "01",
    role: "Placement Coordinator",
    organization: "AIML",
    summary:
      "Represented the AIML department in placement coordination and served as the communication link between students and the placement team.",
    keyAreas: [
      "Placement Coordination",
      "Communication",
      "Student Outreach",
      "Team Collaboration",
    ],
  },
  {
    count: "02",
    role: "VCP Tech",
    organization: "DJS SIGAI",
    summary:
      "Led technical heads at DJS SIGAI, overseeing chapter-wide strategy and directing execution across technical and digital initiatives.",
    keyAreas: ["Technical Leadership", "Team Oversight", "Strategic Direction", "Problem Solving"],
  },
  {
    count: "03",
    role: "Creatives Head",
    organization: "DJSCE eXpress",
    summary:
      "Headed the creative team of DJSCE eXpress, shaping the committee's visual identity through creative direction, design, and promotions.",
    keyAreas: [
      "Creative Direction",
      "Visual Design",
      "Branding",
      "Team Leadership",
    ],
  },
];

// Experience cutout tiles with background removed (ultra-crisp transparent WebP)
const EXPERIENCE_TILES = [
  "/assets/experience/1.webp",
  "/assets/experience/2.webp",
  "/assets/experience/3.webp",
  "/assets/experience/4.webp",
  "/assets/experience/5.webp",
  "/assets/experience/6.webp",
  "/assets/experience/7.webp",
  "/assets/experience/8.webp",
];

const CARD_ENTRY_START = 1.6;
const CARD_ACTIVE_START = 2.2;
const CARD_SECOND_STOP = CARD_ACTIVE_START + (EXPERIENCE_DATA.length - 1); // 3.2
const LEADERSHIP_TEXT_STOP = 4.2;
const LEADERSHIP_CARDS_STOP = 5.2;
const SKILLS_TEXT_STOP = 6.2;
const SKILLS_FOLDERS_STOP = 7.2;
const MAX_PROGRESS = SKILLS_FOLDERS_STOP;
const PIT_STOPS = [
  0.0,
  1.2,
  CARD_ACTIVE_START,
  CARD_SECOND_STOP,
  LEADERSHIP_TEXT_STOP,
  LEADERSHIP_CARDS_STOP,
  SKILLS_TEXT_STOP,
  SKILLS_FOLDERS_STOP,
] as const;

interface AnimatedHeadlineProps {
  animKey: number;
}

function AnimatedHeadline({ animKey }: AnimatedHeadlineProps) {
  const line1Words = ["WHAT'S", "HER"];
  const line2Words = ["EXPERIENCE", "THOUGH?"];

  let letterCount = 0;

  return (
    <>
      <style>{`
        @keyframes typewriterCharPop {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.88);
            filter: blur(6px);
          }
          65% {
            opacity: 1;
            transform: translateY(-2px) scale(1.03);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0px);
          }
        }

        .typewriter-char {
          opacity: 0;
          animation: typewriterCharPop 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes typewriterCaretBlink {
          0%, 45% {
            opacity: 0.85;
          }
          50%, 95% {
            opacity: 0;
          }
          100% {
            opacity: 0.85;
          }
        }

        .typewriter-caret {
          opacity: 0;
          animation: typewriterCharPop 0.3s ease-out forwards, typewriterCaretBlink 0.9s step-end infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .typewriter-char, .typewriter-caret {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <h2
        key={animKey}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-normal leading-[1.05] select-none text-center transition-colors duration-500"
        style={{
          fontFamily: "'Special Elite', cursive",
          color: "var(--exp-headline-color, #2b180e)",
          textShadow: "var(--exp-text-shadow, none)",
        }}
      >
        <span
          className="block text-2xl sm:text-3xl md:text-4xl mb-2 font-semibold transition-colors duration-500"
          style={{ color: "var(--exp-eyebrow-color, #4a2c1d)" }}
        >
          {line1Words.map((word, wordIdx) => (
            <span key={`w1-${wordIdx}`} className="inline-block whitespace-nowrap mx-1.5 first:ml-0 last:mr-0">
              {word.split("").map((char, charIdx) => {
                const delay = 100 + letterCount * 36;
                letterCount++;
                return (
                  <span
                    key={`c1-${charIdx}`}
                    className="inline-block will-change-transform will-change-opacity typewriter-char"
                    style={{
                      animationDelay: `${delay}ms`,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          ))}
        </span>

        <span
          className="block drop-shadow-sm font-extrabold transition-colors duration-500"
          style={{ color: "var(--exp-headline-color, #2b180e)" }}
        >
          {line2Words.map((word, wordIdx) => (
            <span key={`w2-${wordIdx}`} className="inline-block whitespace-nowrap mx-2 first:ml-0 last:mr-0">
              {word.split("").map((char, charIdx) => {
                const delay = 160 + letterCount * 36;
                letterCount++;
                return (
                  <span
                    key={`c2-${charIdx}`}
                    className="inline-block will-change-transform will-change-opacity typewriter-char"
                    style={{
                      animationDelay: `${delay}ms`,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          ))}
          <span
            className="inline-block ml-1 font-normal opacity-75 typewriter-caret transition-colors duration-500"
            style={{
              color: "var(--exp-caret-color, #2b180e)",
              animationDelay: `${160 + letterCount * 36 + 100}ms`,
            }}
          >
            _
          </span>
        </span>
      </h2>
    </>
  );
}

function AnimatedLeadershipStatement({ animKey }: AnimatedHeadlineProps) {
  const eyebrowWords = ["LEADERSHIP", "&", "INITIATIVE"];
  const quoteWords = [
    "Beyond",
    "building",
    "things,",
    "I've",
    "also",
    "taken",
    "up",
    "roles",
    "that",
    "taught",
    "me",
    "to",
    "lead,",
    "collaborate,",
    "and",
    "take",
    "initiative.",
  ];

  let letterCount = 0;

  return (
    <div key={animKey} className="flex flex-col items-center text-center select-none max-w-4xl mx-auto px-4">
      <p
        className="text-lg sm:text-xl md:text-2xl font-bold tracking-wider uppercase mb-4 transition-colors duration-500"
        style={{
          fontFamily: "'Special Elite', cursive",
          color: "var(--exp-eyebrow-color, #4a2c1d)",
          textShadow: "var(--exp-text-shadow, none)",
        }}
      >
        {eyebrowWords.map((word, wIdx) => (
          <span key={`le-${wIdx}`} className="inline-block whitespace-nowrap mx-1.5 first:ml-0 last:mr-0">
            {word.split("").map((char, cIdx) => {
              const delay = 80 + letterCount * 32;
              letterCount++;
              return (
                <span
                  key={`lec-${cIdx}`}
                  className="inline-block will-change-transform will-change-opacity typewriter-char"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
        <span
          className="inline-block ml-1 font-normal opacity-80 typewriter-caret"
          style={{
            color: "var(--exp-caret-color, #2b180e)",
            animationDelay: `${120 + letterCount * 32}ms`,
          }}
        >
          _
        </span>
      </p>

      <h2
        className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-normal leading-[1.32] tracking-tight transition-colors duration-500 drop-shadow-sm"
        style={{
          fontFamily: "'Special Elite', cursive",
          color: "var(--exp-headline-color, #2b180e)",
          textShadow: "var(--exp-text-shadow, none)",
        }}
      >
        {quoteWords.map((word, wIdx) => (
          <span
            key={`lq-${wIdx}`}
            className="inline-block whitespace-nowrap mx-[0.22em] will-change-transform will-change-opacity typewriter-char"
            style={{ animationDelay: `${260 + wIdx * 52}ms` }}
          >
            {word}
          </span>
        ))}
      </h2>
    </div>
  );
}

function AnimatedSkillsStatement({ animKey }: AnimatedHeadlineProps) {
  const quoteWords = ["Okay...", "what's", "in", "her", "toolkit?"];
  let charCount = 0;

  return (
    <div key={animKey} className="flex flex-col items-center text-center select-none max-w-3xl mx-auto px-4">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-extrabold leading-[1.15] tracking-normal transition-colors duration-500 drop-shadow-sm"
        style={{
          fontFamily: "'Special Elite', cursive",
          color: "var(--exp-headline-color, #2b180e)",
          textShadow: "var(--exp-text-shadow, none)",
        }}
      >
        {quoteWords.map((word, wIdx) => (
          <span key={`sk-${wIdx}`} className="inline-block whitespace-nowrap mx-[0.18em]">
            {word.split("").map((char, cIdx) => {
              const delay = 100 + charCount * 28;
              charCount++;
              return (
                <span
                  key={`skc-${cIdx}`}
                  className="inline-block will-change-transform will-change-opacity typewriter-char"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
        <span
          className="inline-block ml-1 font-normal opacity-80 typewriter-caret"
          style={{
            color: "var(--exp-caret-color, #2b180e)",
            animationDelay: `${140 + charCount * 28}ms`,
          }}
        >
          _
        </span>
      </h2>

      <p
        className="text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-lg mx-auto mt-5 transition-colors duration-500 typewriter-char"
        style={{
          fontFamily: "'Special Elite', cursive",
          color: "var(--exp-subtext-color, #3d2314)",
          textShadow: "var(--exp-text-shadow, none)",
          animationDelay: `${220 + charCount * 28}ms`,
        }}
      >
        Just a glimpse of what I can do.
      </p>
    </div>
  );
}

function ContributionSpotlight({
  contributions,
  isActive,
  label = "KEY CONTRIBUTIONS",
  animationDelay = "310ms",
}: {
  contributions: string[];
  isActive: boolean;
  label?: string;
  animationDelay?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isActive || isPaused || contributions.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % contributions.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [isActive, isPaused, contributions.length]);

  const total = contributions.length;

  return (
    <div
      className="exp-card-text-item rounded-2xl px-3.5 sm:px-4 py-2.5 transition-colors duration-200 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_2px_10px_rgba(43,24,14,0.04)]"
      style={{
        backgroundColor: "rgba(248, 237, 224, 0.78)",
        border: "1px solid #e1ccb5",
        animationDelay,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={(e) => {
        e.stopPropagation();
        setActiveIdx((prev) => (prev + 1) % total);
      }}
      title={`Click to cycle ${label.toLowerCase()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="text-[10px] sm:text-[10.5px] font-bold tracking-[0.14em] uppercase flex items-center gap-1.5"
          style={{ fontFamily: "'Space Mono', monospace", color: "#6b442d" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b5e3c]" />
          <span>{label}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {contributions.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`View ${label.toLowerCase()} ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === activeIdx
                ? "w-4 bg-[#4a2c1d]"
                : "w-1.5 bg-[#2b180e]/20 hover:bg-[#2b180e]/45"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Silky overlapping vertical conveyor-belt crossfade (zero snap cut, no tick mark) */}
      <div className="relative w-full h-[44px] sm:h-[28px] overflow-hidden">
        {contributions.map((item, idx) => {
          const isCurrent = idx === activeIdx;
          const isPrev = idx === (activeIdx - 1 + total) % total;

          let translateY = "100%";
          if (isCurrent) translateY = "0%";
          else if (isPrev && total > 1) translateY = "-100%";

          const shouldAnimate = isCurrent || isPrev;

          return (
            <div
              key={idx}
              className="absolute inset-0 flex items-center text-[13.5px] sm:text-[14.5px] font-medium leading-snug"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "#2b180e",
                transform: `translate3d(0, ${translateY}, 0)`,
                opacity: isCurrent ? 1 : 0,
                transition: shouldAnimate
                  ? "transform 720ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
                pointerEvents: isCurrent ? "auto" : "none",
              }}
            >
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WhatWeShipSectionProps {
  isActive: boolean;
  onScrollUpToCreations?: () => void;
  activeCardIndex?: number;
  onActiveCardChange?: (index: number) => void;
  externalStopRequest?: { stop: number; id: number } | null;
  onSectionZoneChange?: (zone: "experience" | "skills") => void;
}

export default function WhatWeShipSection({
  isActive,
  onScrollUpToCreations,
  activeCardIndex: externalActiveIndex,
  onActiveCardChange,
  externalStopRequest,
  onSectionZoneChange,
}: WhatWeShipSectionProps) {
  // Master sequence progression driven by Lenis Smooth Scroll:
  // 0.0 -> 1.0: Tile Reveal animation (tiles fly in, zoom past screen)
  // 1.0 -> 1.6: Final text stage (headline lifts up, children text reveals cleanly, NO CARDS on screen)
  // 1.6 -> 2.2: Tactile transition -> TileReveal slides up and Cards arena enters
  // 2.2 -> 3.2: Card 01 (2.2) -> Card 02 (3.2) with compulsory Pit Stops & tactile control
  const RUNWAY_PER_UNIT = 800;
  const [masterProgress, setMasterProgress] = useState(0.0);
  const currentProgressRef = useRef(0.0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Animated appearing entrance for the initial text every time Section 3 is entered
  const [animKey, setAnimKey] = useState(0);
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  if (isActive !== prevIsActive) {
    setPrevIsActive(isActive);
    if (isActive) {
      setAnimKey((prev) => prev + 1);
    }
  }

  // Synced entrance for Leadership & Initiative statement stage (matches exact visibility window 3.55 -> 4.85)
  const isLeadershipTextEntered = masterProgress >= 3.55 && masterProgress <= 4.85;
  const [leadershipAnimKey, setLeadershipAnimKey] = useState(0);
  const [prevLeadershipEntered, setPrevLeadershipEntered] = useState(false);
  if (isLeadershipTextEntered !== prevLeadershipEntered) {
    setPrevLeadershipEntered(isLeadershipTextEntered);
    if (isLeadershipTextEntered) {
      setLeadershipAnimKey((prev) => prev + 1);
    }
  }

  // Synced entrance for Skills toolkit intro stage (matches exact visibility window 5.55 -> 6.85)
  const isSkillsTextEntered = masterProgress >= 5.55 && masterProgress <= 6.85;
  const [skillsAnimKey, setSkillsAnimKey] = useState(0);
  const [prevSkillsEntered, setPrevSkillsEntered] = useState(false);
  if (isSkillsTextEntered !== prevSkillsEntered) {
    setPrevSkillsEntered(isSkillsTextEntered);
    if (isSkillsTextEntered) {
      setSkillsAnimKey((prev) => prev + 1);
    }
  }

  const scrollUpReturnAccumulatorRef = useRef(0);
  const lastVirtualDirRef = useRef(0);
  const lastWheelEventTimeRef = useRef(0);
  const gestureStartProgRef = useRef(0);
  const idleSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticGlideRef = useRef(false);
  const hasTriggeredCardEntryRef = useRef(false);
  const hasTriggeredLeadershipCardsRef = useRef(false);
  const hasTriggeredSkillsFoldersRef = useRef(false);

  const onActiveCardChangeRef = useRef(onActiveCardChange);
  const onScrollUpToCreationsRef = useRef(onScrollUpToCreations);
  const onSectionZoneChangeRef = useRef(onSectionZoneChange);
  const lastReportedZoneRef = useRef<"experience" | "skills">("experience");
  useEffect(() => {
    onActiveCardChangeRef.current = onActiveCardChange;
    onScrollUpToCreationsRef.current = onScrollUpToCreations;
    onSectionZoneChangeRef.current = onSectionZoneChange;
  }, [onActiveCardChange, onScrollUpToCreations, onSectionZoneChange]);

  // Smooth, non-jarring glide helper for clicks, dock links, and keyboard shortcuts
  const scrollToStop = useCallback((stop: number, duration = 1.05, lock = false) => {
    const clampedStop = Math.max(0, Math.min(MAX_PROGRESS, stop));
    if (idleSettleTimerRef.current) {
      clearTimeout(idleSettleTimerRef.current);
      idleSettleTimerRef.current = null;
    }
    const lenis = lenisRef.current;
    if (!lenis) return;

    gestureStartProgRef.current = clampedStop;
    isProgrammaticGlideRef.current = true;
    lenis.scrollTo(clampedStop * RUNWAY_PER_UNIT, {
      duration,
      lock,
      force: true,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      onComplete: () => {
        isProgrammaticGlideRef.current = false;
      },
    });
  }, []);

  // Initialize scoped Lenis smooth-scroll instance for Experience section
  useEffect(() => {
    const sectionEl = sectionRef.current;
    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    if (!sectionEl || !wrapper || !content) return;

    const syncContentHeight = () => {
      const baseH = wrapper.clientHeight || window.innerHeight || 720;
      content.style.height = `${Math.ceil(baseH + MAX_PROGRESS * RUNWAY_PER_UNIT)}px`;
    };
    syncContentHeight();

    const lenis = new Lenis({
      wrapper,
      content,
      eventsTarget: sectionEl,
      lerp: 0.095,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.78,
      touchMultiplier: 1.0,
      syncTouch: true,
      overscroll: false,
      autoRaf: true,
    });
    lenisRef.current = lenis;

    if (currentProgressRef.current > 0) {
      lenis.scrollTo(currentProgressRef.current * RUNWAY_PER_UNIT, { immediate: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      syncContentHeight();
      lenis.resize();
    });
    resizeObserver.observe(wrapper);

    const unsubscribeVirtual = lenis.on("virtual-scroll", ({ deltaY }) => {
      if (idleSettleTimerRef.current) {
        clearTimeout(idleSettleTimerRef.current);
        idleSettleTimerRef.current = null;
      }

      isProgrammaticGlideRef.current = false;

      const now = performance.now();
      if (now - lastWheelEventTimeRef.current > 360) {
        gestureStartProgRef.current = currentProgressRef.current;
      }
      lastWheelEventTimeRef.current = now;

      if (Math.abs(deltaY) > 0.5) {
        lastVirtualDirRef.current = Math.sign(deltaY);
      }

      // Return up to Creations when scrolling up at top of Section 3
      if (lenis.scroll <= 4 && deltaY < -10) {
        scrollUpReturnAccumulatorRef.current += deltaY;
        if (scrollUpReturnAccumulatorRef.current <= -50) {
          scrollUpReturnAccumulatorRef.current = 0;
          onScrollUpToCreationsRef.current?.();
        }
      } else {
        scrollUpReturnAccumulatorRef.current = 0;
      }

      // Destination-only frame settle: once scrolling stops, center a tab only if it is
      // already almost in view AND was scrolled into from elsewhere (never bounces back).
      idleSettleTimerRef.current = setTimeout(() => {
        if (isProgrammaticGlideRef.current) return;
        const prog = currentProgressRef.current;
        if (prog < 1.02) return;

        let nearestStop = 1.2;
        let minDist = Infinity;
        for (const stop of PIT_STOPS) {
          if (stop === 0.0) continue;
          const dist = Math.abs(prog - stop);
          if (dist < minDist) {
            minDist = dist;
            nearestStop = stop;
          }
        }

        const scrolledIntoTargetFromOutside =
          Math.abs(gestureStartProgRef.current - nearestStop) >= 0.24;

        if (scrolledIntoTargetFromOutside && minDist > 0.008 && minDist <= 0.28) {
          lenis.scrollTo(nearestStop * RUNWAY_PER_UNIT, {
            lerp: 0.075,
            lock: false,
          });
        }
      }, 420);
    });

    const unsubscribeScroll = lenis.on("scroll", ({ scroll }) => {
      const prog = Math.max(0, Math.min(MAX_PROGRESS, scroll / RUNWAY_PER_UNIT));
      currentProgressRef.current = prog;
      setMasterProgress(prog);

      if (prog <= 1.21) {
        hasTriggeredCardEntryRef.current = false;
      }
      if (prog <= LEADERSHIP_TEXT_STOP + 0.01) {
        hasTriggeredLeadershipCardsRef.current = false;
      }
      if (prog <= SKILLS_TEXT_STOP + 0.01) {
        hasTriggeredSkillsFoldersRef.current = false;
      }

      if (prog >= CARD_ACTIVE_START - 0.2) {
        const cardIdx = Math.max(
          0,
          Math.min(SERVICES_DATA.length - 1, Math.round(prog - CARD_ACTIVE_START))
        );
        onActiveCardChangeRef.current?.(cardIdx);
      }

      const nextZone: "experience" | "skills" =
        prog >= SKILLS_TEXT_STOP - 0.55 ? "skills" : "experience";
      if (nextZone !== lastReportedZoneRef.current) {
        lastReportedZoneRef.current = nextZone;
        onSectionZoneChangeRef.current?.(nextZone);
      }

      if (isProgrammaticGlideRef.current) return;

      // Once scrolling down past the Final Text stage, smoothly advance into Tab 1
      if (
        !hasTriggeredCardEntryRef.current &&
        lastVirtualDirRef.current > 0 &&
        prog > 1.24 &&
        prog < CARD_ACTIVE_START - 0.12
      ) {
        hasTriggeredCardEntryRef.current = true;
        scrollToStop(CARD_ACTIVE_START, 0.9, false);
        return;
      }

      // Once scrolling down past the Leadership Text Reveal, smoothly advance to the 3 Small Cards
      if (
        !hasTriggeredLeadershipCardsRef.current &&
        lastVirtualDirRef.current > 0 &&
        prog > LEADERSHIP_TEXT_STOP + 0.04 &&
        prog < LEADERSHIP_CARDS_STOP - 0.12
      ) {
        hasTriggeredLeadershipCardsRef.current = true;
        scrollToStop(LEADERSHIP_CARDS_STOP, 0.9, false);
        return;
      }

      // Once scrolling down past the Skills Text Reveal, smoothly advance to the Skill Folders
      if (
        !hasTriggeredSkillsFoldersRef.current &&
        lastVirtualDirRef.current > 0 &&
        prog > SKILLS_TEXT_STOP + 0.04 &&
        prog < SKILLS_FOLDERS_STOP - 0.12
      ) {
        hasTriggeredSkillsFoldersRef.current = true;
        scrollToStop(SKILLS_FOLDERS_STOP, 0.9, false);
      }
    });

    return () => {
      if (idleSettleTimerRef.current) clearTimeout(idleSettleTimerRef.current);
      unsubscribeVirtual();
      unsubscribeScroll();
      resizeObserver.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [scrollToStop]);

  // Pause nested Lenis when Section 3 is inactive so sibling sections aren't affected
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (isActive) {
      lenis.start();
      lenis.resize();
    } else {
      if (currentProgressRef.current < 0.12) {
        lenis.scrollTo(0, { immediate: true, force: true });
      }
      lenis.stop();
    }
  }, [isActive]);

  // Programmatic jump from dock card selection
  const prevExternalIndexRef = useRef(externalActiveIndex);
  useEffect(() => {
    if (externalActiveIndex !== undefined && externalActiveIndex !== prevExternalIndexRef.current) {
      prevExternalIndexRef.current = externalActiveIndex;
      if (
        !isProgrammaticGlideRef.current &&
        Math.round(currentProgressRef.current - CARD_ACTIVE_START) !== externalActiveIndex
      ) {
        scrollToStop(CARD_ACTIVE_START + externalActiveIndex, 1.05, false);
      }
    }
  }, [externalActiveIndex, scrollToStop]);

  // Programmatic jump to any named Experience / Leadership / Skills stop from Dock navbar
  const prevStopRequestIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (externalStopRequest && externalStopRequest.id !== prevStopRequestIdRef.current) {
      prevStopRequestIdRef.current = externalStopRequest.id;
      scrollToStop(externalStopRequest.stop, 1.05, false);
    }
  }, [externalStopRequest, scrollToStop]);

  // Interactive target setter for clicking peeking cards
  const setTargetCardIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(SERVICES_DATA.length - 1, index));
      scrollToStop(CARD_ACTIVE_START + clamped, 1.15, true);
    },
    [scrollToStop]
  );

  // Custom pill cursor tracking like Brand Appart
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  // Keyboard navigation within Section 3 routed through Lenis
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const cur = currentProgressRef.current;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") {
        const nextStop = PIT_STOPS.find((stop) => stop > cur + 0.08);
        if (nextStop !== undefined) {
          e.preventDefault();
          scrollToStop(nextStop, 1.0, false);
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") {
        const prevStop = [...PIT_STOPS].reverse().find((stop) => stop < cur - 0.08);
        if (prevStop !== undefined) {
          e.preventDefault();
          scrollToStop(prevStop, 1.0, false);
        } else {
          e.preventDefault();
          onScrollUpToCreationsRef.current?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, scrollToStop]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  // Derive sub-progress values:
  // 1. Tile Reveal animation progress (0.0 to 1.0 with tiny deadzone so micro-scroll never peeks tiles/shadows)
  const tileRevealProgress =
    masterProgress <= 0.015 ? 0 : Math.min(1.0, (masterProgress - 0.015) / 0.985);

  // 2. Stage transition between TileReveal and Experience Cards (1.6 -> 2.2), and fading out after Card 02 (3.2 -> 4.05):
  let tileRevealY = 0;
  let tileRevealOpacity = 1;
  let cardsStageY = 100;
  let cardsOpacity = 0;
  let isCardsVisible = false;

  if (masterProgress <= CARD_ENTRY_START) {
    tileRevealY = 0;
    tileRevealOpacity = 1;
    cardsStageY = 100;
    cardsOpacity = 0;
    isCardsVisible = false;
  } else if (masterProgress <= CARD_ACTIVE_START) {
    const t = (masterProgress - CARD_ENTRY_START) / (CARD_ACTIVE_START - CARD_ENTRY_START);
    tileRevealY = -t * 100; // slides up off screen
    tileRevealOpacity = Math.max(0, 1 - t);
    cardsStageY = (1 - t) * 100; // slides up into screen
    cardsOpacity = t;
    isCardsVisible = true;
  } else if (masterProgress <= 4.05) {
    tileRevealY = -100;
    tileRevealOpacity = 0;
    cardsStageY = 0;
    cardsOpacity = masterProgress <= 3.75 ? 1 : Math.max(0, 1 - (masterProgress - 3.75) / 0.3);
    isCardsVisible = cardsOpacity > 0;
  } else {
    tileRevealY = -100;
    tileRevealOpacity = 0;
    cardsStageY = 0;
    cardsOpacity = 0;
    isCardsVisible = false;
  }

  // Fade/lift MY JOURNEY.log heading cleanly once Card 02 begins tilting out toward Leadership text reveal
  const journeyHeadingExitT = Math.max(0, Math.min(1, (masterProgress - 3.25) / 0.45));

  // 3. Experience Cards scroll progression (0.0 -> 1.0 across 2 experiences, 1.0 -> 2.0 Card 02 tilts out)
  const cardsScrollProgress = Math.max(0, masterProgress - CARD_ACTIVE_START);
  const isCardsInteractive =
    masterProgress >= CARD_ACTIVE_START - 0.1 && masterProgress <= CARD_SECOND_STOP + 0.35;
  const activeFocusCardIdx =
    masterProgress >= CARD_ENTRY_START + 0.15 && masterProgress <= CARD_SECOND_STOP + 0.55
      ? Math.max(0, Math.min(EXPERIENCE_DATA.length - 1, Math.round(cardsScrollProgress)))
      : -1;

  // 4. Leadership Text Reveal interlude stage (3.55 -> 4.2 enter, 4.2 -> 4.85 exit upward)
  let leadershipTextY = 60;
  let leadershipTextOpacity = 0;
  let isLeadershipTextVisible = false;

  if (masterProgress >= 3.55 && masterProgress < LEADERSHIP_TEXT_STOP) {
    const t = (masterProgress - 3.55) / (LEADERSHIP_TEXT_STOP - 3.55);
    leadershipTextY = (1 - t) * 35;
    leadershipTextOpacity = t;
    isLeadershipTextVisible = true;
  } else if (masterProgress >= LEADERSHIP_TEXT_STOP && masterProgress <= 4.85) {
    const t = (masterProgress - LEADERSHIP_TEXT_STOP) / 0.65;
    leadershipTextY = -t * 100;
    leadershipTextOpacity = Math.max(0, 1 - t);
    isLeadershipTextVisible = leadershipTextOpacity > 0;
  }

  // 5. Three-in-line Leadership & Initiative small cards stage (4.55 -> 5.2 enter, 5.2 -> 5.85 exit)
  const leadershipCardsT = Math.max(0, Math.min(1, (masterProgress - 4.55) / 0.65));
  const leadershipCardsExitT = Math.max(0, Math.min(1, (masterProgress - LEADERSHIP_CARDS_STOP) / 0.65));
  const isLeadershipCardsVisible = leadershipCardsT > 0 && leadershipCardsExitT < 1;
  const isLeadershipCardsInteractive = masterProgress >= 4.9 && masterProgress <= 5.55;
  const isLeadershipCardsFocused = masterProgress >= 4.82 && masterProgress <= 5.65;

  // 6. Skills Text Reveal interlude stage (5.55 -> 6.2 enter, 6.2 -> 6.85 exit upward)
  let skillsTextY = 60;
  let skillsTextOpacity = 0;
  let isSkillsTextVisible = false;

  if (masterProgress >= 5.55 && masterProgress < SKILLS_TEXT_STOP) {
    const t = (masterProgress - 5.55) / (SKILLS_TEXT_STOP - 5.55);
    skillsTextY = (1 - t) * 35;
    skillsTextOpacity = t;
    isSkillsTextVisible = true;
  } else if (masterProgress >= SKILLS_TEXT_STOP && masterProgress <= 6.85) {
    const t = (masterProgress - SKILLS_TEXT_STOP) / 0.65;
    skillsTextY = -t * 100;
    skillsTextOpacity = Math.max(0, 1 - t);
    isSkillsTextVisible = skillsTextOpacity > 0;
  }

  // 7. Skills 4-Folder Toolkit Grid stage (6.55 -> 7.2 enter)
  const skillsFoldersT = Math.max(0, Math.min(1, (masterProgress - 6.55) / 0.65));
  const isSkillsFoldersVisible = skillsFoldersT > 0;
  const isSkillsFoldersInteractive = masterProgress >= 6.85;
  const areSkillFoldersRevealed = masterProgress >= 6.82;

  return (
    <div
      ref={sectionRef}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className={`relative w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-4 select-none overflow-visible ${isActive ? "pointer-events-auto" : "pointer-events-none"
        }`}
    >
      {/* Hidden Lenis Smooth Scroll Runway backing Section 3 */}
      <div
        ref={scrollWrapperRef}
        aria-hidden="true"
        className="absolute inset-0 overflow-y-auto overflow-x-hidden opacity-0 pointer-events-none no-scrollbar z-0"
      >
        <div ref={scrollContentRef} className="w-full" />
      </div>
      <style>{`
        @keyframes expCardTextReveal {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes expWordReveal {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes expDatePop {
          0% {
            opacity: 0;
            transform: translateX(14px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes expHighlightSweep {
          0% {
            opacity: 0;
            transform: scaleX(0);
          }
          100% {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes expSlideFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-14px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes expTechPillPop {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .leadership-drop-card-0,
        .leadership-drop-card-1,
        .leadership-drop-card-2 {
          --card-drop-x: 0%;
        }

        @media (min-width: 768px) {
          .leadership-drop-card-0 { --card-drop-x: 105%; }
          .leadership-drop-card-1 { --card-drop-x: 0%; }
          .leadership-drop-card-2 { --card-drop-x: -105%; }
        }

        .exp-card-text-item,
        .exp-word-item,
        .exp-date-pill,
        .exp-tech-pill {
          opacity: 0.18;
        }

        .exp-highlight-bar {
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left center;
        }

        .exp-card-focused .exp-card-text-item {
          animation: expCardTextReveal 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .exp-card-focused .exp-word-item {
          animation: expWordReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .exp-card-focused .exp-date-pill {
          animation: expDatePop 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .exp-card-focused .exp-highlight-bar {
          animation: expHighlightSweep 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .exp-card-focused .exp-tech-pill {
          animation: expTechPillPop 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .leadership-drop-card-0,
        .leadership-drop-card-1,
        .leadership-drop-card-2 {
          --card-drop-x: 0%;
        }

        @media (min-width: 768px) {
          .leadership-drop-card-0 { --card-drop-x: 105%; }
          .leadership-drop-card-1 { --card-drop-x: 0%; }
          .leadership-drop-card-2 { --card-drop-x: -105%; }
        }

        .exp-card-text-item,
          .exp-word-item,
          .exp-date-pill,
          .exp-highlight-bar,
          .exp-tech-pill,
          .exp-card-focused .exp-card-text-item,
          .exp-card-focused .exp-word-item,
          .exp-card-focused .exp-date-pill,
          .exp-card-focused .exp-highlight-bar,
          .exp-card-focused .exp-tech-pill {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>
      {/* ─── 1. TILE REVEAL COMPONENT & AUTHENTIC TEXT REVEAL ─── */}
      {/* Exact component from React Bits Pro: image tiles fly in on scroll to reveal headline and content */}
      <div
        className="absolute inset-0 z-10 overflow-hidden will-change-transform"
        style={{
          transform: `translate3d(0, ${tileRevealY}%, 0)`,
          opacity: tileRevealOpacity,
          visibility: tileRevealOpacity > 0 ? "visible" : "hidden",
          pointerEvents: masterProgress < CARD_ENTRY_START ? "auto" : "none",
        }}
      >
        <TileReveal
          images={EXPERIENCE_TILES}
          progress={tileRevealProgress}
          scrub={0}
          columns={4}
          gap={28}
          gridWidth={880}
          tileAspect={1.0}
          tileRadius={0}
          grayscale={false}
          direction="alternate"
          stagger={0.06}
          overlap={0.6}
          zoom={2.05}
          spread={0.4}
          contentGap={24}
          headline={<AnimatedHeadline animKey={animKey} />}
          backgroundColor="transparent"
          className="w-full h-full"
        >
          <div className="flex flex-col items-center gap-3 select-none">
            <p
              className="text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-lg mx-auto transition-colors duration-500"
              style={{
                fontFamily: "'Special Elite', cursive",
                color: "var(--exp-subtext-color, #3d2314)",
                textShadow: "var(--exp-text-shadow, none)",
              }}
            >
              The roles, teams, and opportunities that have shaped my journey.
            </p>
            <button
              type="button"
              onClick={() => {
                scrollToStop(CARD_ACTIVE_START, 1.15, true);
              }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm mt-3 animate-bounce"
              style={{
                fontFamily: "'Special Elite', cursive",
                color: "var(--exp-pill-color, #2b180e)",
                borderColor: "var(--exp-pill-border, #2b180e)",
                borderWidth: "1.5px",
                borderStyle: "solid",
                backgroundColor: "var(--exp-pill-bg, rgba(43, 24, 14, 0.08))",
              }}
            >
              <span>Scroll down to see</span>
              <span>↓</span>
            </button>
          </div>
        </TileReveal>
      </div>

      {/* ─── Custom Floating Pill Cursor for Cards (Brand Appart: "Explore experience ➔") ─── */}
      {isHoveringStack && isCardsInteractive && (
        <div
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
          className="fixed z-50 hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-neutral-950 text-[11px] font-bold tracking-tight uppercase shadow-2xl pointer-events-none transition-transform duration-75 ease-out"
        >
          <span>Explore experience</span>
          <svg width="12" height="12" viewBox="0 0 12 13" fill="none" className="stroke-current stroke-[2.5]">
            <path d="M10 6.2973L2 6.2973" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 8.7974C7.5 8.7974 10 6.9562 10 6.2974C10 5.6386 7.5 3.7974 7.5 3.7974" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* ─── 2. Exact Brand Appart 3D Tiles Stack Arena ─── */}
      {/* APPEARS AFTER SCROLLING DOWN FROM THE FINAL TEXT (masterProgress >= 1.6 -> 2.2) */}
      <div
        className="c-tiles-stack w-[94vw] max-w-[1220px] flex-1 my-auto relative flex flex-col items-start justify-center overflow-visible"
        style={{
          transform: `translate3d(0, ${cardsStageY}%, 0)`,
          opacity: cardsOpacity,
          visibility: isCardsVisible ? "visible" : "hidden",
          pointerEvents: isCardsInteractive ? "auto" : "none",
        }}
        onMouseEnter={() => setIsHoveringStack(true)}
        onMouseLeave={() => setIsHoveringStack(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Heading: MY JOURNEY.log (Matched with MY CREATIONS.EXE above) */}
        <div
          className="relative z-10 w-full flex flex-col items-start justify-start text-left pl-2 sm:pl-4 pt-2 sm:pt-3 mb-0 pointer-events-none select-none will-change-transform"
          style={{
            opacity: 1 - journeyHeadingExitT,
            transform: `translate3d(0, ${-journeyHeadingExitT * 28}px, 0)`,
          }}
        >
          <h2
            className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight drop-shadow-sm mb-0.5 creations-heading transition-colors duration-500"
            style={{
              fontFamily: "'Special Elite', cursive",
              color: "var(--exp-headline-color, #2b180e)",
              textShadow: "var(--exp-text-shadow, none)",
            }}
          >
            MY JOURNEY.log
          </h2>
          <p
            className="text-xs sm:text-sm font-mono tracking-wide creations-subheading transition-colors duration-500"
            style={{
              fontFamily: "'Special Elite', cursive",
              color: "var(--exp-subtext-color, #3d2314)",
            }}
          >
            Scroll through milestones &bull; Roles &amp; experiences
          </p>
        </div>

        <div
          className="tiles_stack_list relative z-20 w-[95%] mx-auto h-[min(585px,70vh)] min-h-[460px] mt-1 sm:mt-2 overflow-visible"
          style={{
            perspective: "1200px",
            transformStyle: "preserve-3d",
          }}
        >
          {EXPERIENCE_DATA.map((card, idx) => {
            const diff = cardsScrollProgress - idx;
            const isFocusedCard = idx === activeFocusCardIdx;
            const isResting = Math.abs(diff) <= 0.005;

            // ─── 3D Tilting Upward Exit + Angled/Blurred Right-Peeking Next Tab ───
            let cardTransform = "none";
            let cardFilter = "none";
            let titleTransform = "none";
            let contentTransform = "none";
            let cardOpacity = 1;
            let isHidden = false;

            if (diff > 0.005) {
              // Active card tilts backward in 3D as it launches upward off screen
              const ty = -diff * 145; // in vh
              const rx = Math.min(24, diff * 18); // tilt backward up to 24deg
              const tz = diff * 12; // subtle perspective push
              cardTransform = `translate3d(0, ${ty}vh, ${tz}px) rotateX(${rx}deg)`;
              titleTransform = `translate3d(0, ${-diff * 110}px, 0) rotateX(${diff * 36}deg)`;
              contentTransform = `translate3d(0, ${-diff * 60}px, 0) rotateX(${diff * 30}deg)`;

              if (diff >= 1.25) {
                isHidden = true;
              }
            } else if (!isResting) {
              // Next tab peeks behind slightly to the right, angled, and softly blurred
              const offset = -diff;
              const txPct = offset * 3.6;
              const tyPct = offset * 1.4;
              const tz = -offset * 40;
              const scale = 1 - offset * 0.04;
              const rz = offset * 3.2;
              cardTransform = `translate3d(${txPct}%, ${tyPct}%, ${tz}px) scale(${scale}) rotateZ(${rz}deg)`;

              // Clear blur cleanly ahead of landing so incoming card settles razor-sharp
              const blurPx = Math.max(0, (offset - 0.18) * 6.5);
              cardFilter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : "none";

              if (diff <= -1.5) {
                cardOpacity = 0;
                isHidden = true;
              } else if (diff <= -1.0) {
                cardOpacity = Math.max(0, (1.5 + diff) / 0.5) * 0.85;
              } else {
                cardOpacity = 0.85 + (1 - offset) * 0.15;
              }
            }

            const zIndex = EXPERIENCE_DATA.length - idx + 10;
            const isClickableStackItem = diff < -0.15 && cardOpacity > 0.25 && isCardsInteractive;

            return (
              <div
                key={card.index}
                className="tiles_stack_item absolute inset-0 w-full h-full"
                style={{
                  transform: cardTransform,
                  transformOrigin: "center center",
                  transformStyle: isResting ? "flat" : "preserve-3d",
                  filter: cardFilter,
                  zIndex,
                  opacity: cardOpacity,
                  visibility: isHidden ? "hidden" : "visible",
                  pointerEvents: Math.abs(diff) < 0.25 ? "auto" : isClickableStackItem ? "auto" : "none",
                  cursor: isClickableStackItem ? "pointer" : "default",
                }}
                onClick={() => {
                  if (isClickableStackItem) {
                    setTargetCardIndex(idx);
                  }
                }}
              >
                {/* ─── Experience Folder Tab Card: Isolated Background + Crisp Vector Text ─── */}
                <div
                  className={`experience-tab-card w-full h-full select-none relative ${isFocusedCard ? "exp-card-focused" : ""
                    }`}
                >
                  {/* Isolated Background Graphic & Drop-Shadow (never rasterizes or blurs the text layer!) */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: "url('/assets/experience_tab.webp?v=4')",
                      backgroundSize: "100% 100%",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      filter: "drop-shadow(0 22px 38px rgba(0,0,0,0.45))",
                    }}
                  />

                  {/* ─── Strictly Constrained Beige Paper Safe-Zone (100% inside beige background) ─── */}
                  <div
                    className="absolute flex flex-col lg:flex-row items-stretch justify-between gap-4 sm:gap-5 lg:gap-6 overflow-y-auto lg:overflow-hidden no-scrollbar px-3 sm:px-5 py-1"
                    style={{
                      top: "22%",
                      bottom: "14%",
                      left: "6%",
                      right: "6%",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      WebkitFontSmoothing: "antialiased",
                    }}
                  >
                    {/* ══ LEFT COLUMN (~64%): Editorial Typography + Layered Text Animations ══ */}
                    <div className="w-full lg:w-[64%] flex flex-col justify-between min-w-0 lg:pr-1">
                      {/* Header + Period Capsule + Tagline (with 3D Upward Tilt Parallax) */}
                      <div
                        className="service-card-title relative flex flex-col flex-shrink-0"
                        style={{
                          transform: titleTransform,
                          transformOrigin: "center top",
                        }}
                      >
                        <div className="flex flex-nowrap items-start sm:items-center justify-between gap-2.5">
                          <h3
                            className="min-w-0 text-lg sm:text-xl md:text-[1.45rem] lg:text-[1.52rem] xl:text-[1.72rem] font-bold tracking-tight leading-[1.15] flex flex-wrap items-baseline gap-x-1.5"
                            style={{ fontFamily: "'Special Elite', cursive", color: "#2b180e" }}
                          >
                            <span
                              className="exp-word-item inline-block text-base sm:text-lg md:text-xl font-bold"
                              style={{
                                fontFamily: "'Space Mono', monospace",
                                color: "#7c5840",
                                animationDelay: "30ms",
                              }}
                            >
                              {card.count}.
                            </span>
                            {[card.company, "—", ...card.role.split(" ")].map((word, wIdx) => (
                              <span
                                key={wIdx}
                                className="exp-word-item inline-block"
                                style={{ animationDelay: `${75 + wIdx * 55}ms` }}
                              >
                                {word}
                              </span>
                            ))}
                          </h3>

                          <span
                            className="exp-date-pill inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider px-2.5 sm:px-3 py-1 rounded-full flex-shrink-0 whitespace-nowrap shadow-[0_1px_4px_rgba(43,24,14,0.06)]"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: "#4a2c1d",
                              backgroundColor: "#efe0ce",
                              border: "1px solid #dec9b2",
                              animationDelay: "220ms",
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-75"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="3" />
                              <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            <span>{card.period}</span>
                          </span>
                        </div>

                        <div className="relative inline-block self-start mt-1">
                          <p
                            className="exp-card-text-item text-sm sm:text-[15px] font-medium leading-snug"
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              color: "#6b442d",
                              animationDelay: "260ms",
                            }}
                          >
                            {card.tagline}
                          </p>
                          <div
                            className="exp-highlight-bar h-[2px] w-full rounded-full mt-0.5 bg-gradient-to-r from-[#8b5e3c]/60 via-[#c28e64]/45 to-transparent"
                            style={{ animationDelay: "340ms" }}
                          />
                        </div>
                      </div>

                      {/* Middle: Breathable Summary & Single-Contribution Spotlight (3D Upward Tilt Parallax) */}
                      <div
                        className="service-card-content flex flex-col justify-center gap-3.5 sm:gap-4 my-auto py-2"
                        style={{
                          transform: contentTransform,
                          transformOrigin: "center center",
                        }}
                      >
                        <p
                          className="exp-card-text-item text-[13.5px] sm:text-[14px] md:text-[14.5px] leading-[1.58] font-normal"
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: "#3d2314",
                            animationDelay: "260ms",
                          }}
                        >
                          {card.summary}
                        </p>

                        <ContributionSpotlight
                          contributions={card.contributions}
                          isActive={isActive && isFocusedCard}
                        />
                      </div>

                      {/* Bottom: Strictly Single-Line Rounded Capsule Tech Stack */}
                      <div
                        className="exp-card-text-item inline-flex flex-nowrap items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0 self-start max-w-full overflow-x-auto no-scrollbar shadow-[0_2px_10px_rgba(43,24,14,0.05)]"
                        style={{
                          backgroundColor: "rgba(248, 237, 224, 0.92)",
                          border: "1px solid #dec9b2",
                          animationDelay: "500ms",
                        }}
                      >
                        <div className="flex items-center pr-0.5 pl-0.5 flex-shrink-0">
                          <span
                            className="text-[10px] font-bold tracking-wide uppercase whitespace-nowrap"
                            style={{ fontFamily: "'Space Mono', monospace", color: "#5d4332" }}
                          >
                            TECH STACK:
                          </span>
                        </div>

                        <span className="w-px h-3.5 bg-[#d6bfa7] flex-shrink-0" />

                        <div className="flex flex-nowrap items-center gap-1 flex-shrink-0">
                          {card.techStack.map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="exp-tech-pill inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-default"
                              style={{
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                color: "#2b180e",
                                backgroundColor: "#efe0ce",
                                border: "1px solid #e2ceb7",
                                animationDelay: `${550 + tIdx * 45}ms`,
                              }}
                            >
                              <TechBadgeIcon name={tech} />
                              <span>{tech}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ══ RIGHT COLUMN (~36%): Interactive 3D Feature Image Carousel ══ */}
                    <div
                      className="w-full lg:w-[36%] flex items-center justify-center flex-shrink-0 lg:border-l lg:border-[#2b180e]/10 lg:pl-3"
                      style={{
                        transform: contentTransform,
                      }}
                    >
                      <ExperienceFeatureCarousel
                        images={card.images}
                        isActive={isActive && isFocusedCard}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. LEADERSHIP & INITIATIVE INTERLUDE TEXT REVEAL (masterProgress 3.55 -> 4.2 -> 4.85) ─── */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 sm:px-10 will-change-transform"
        style={{
          transform: `translate3d(0, ${leadershipTextY}%, 0)`,
          opacity: leadershipTextOpacity,
          visibility: isLeadershipTextVisible ? "visible" : "hidden",
          pointerEvents:
            masterProgress >= 3.85 && masterProgress < 4.55 ? "auto" : "none",
        }}
      >
        {isLeadershipTextVisible && (
          <AnimatedLeadershipStatement animKey={leadershipAnimKey} />
        )}

        <button
          type="button"
          onClick={() => {
            scrollToStop(LEADERSHIP_CARDS_STOP, 1.0, false);
          }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm mt-7 animate-bounce"
          style={{
            fontFamily: "'Special Elite', cursive",
            color: "var(--exp-pill-color, #2b180e)",
            borderColor: "var(--exp-pill-border, #2b180e)",
            borderWidth: "1.5px",
            borderStyle: "solid",
            backgroundColor: "var(--exp-pill-bg, rgba(43, 24, 14, 0.08))",
          }}
        >
          <span>Scroll down to see</span>
          <span>↓</span>
        </button>
      </div>

      {/* ─── 4. THREE-IN-LINE LEADERSHIP & COMMUNITY CARDS (masterProgress 4.55 -> 5.2 -> 5.85) ─── */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 pt-3 sm:pt-4 pb-3 overflow-y-auto md:overflow-hidden no-scrollbar"
        style={{
          opacity: Math.min(1, leadershipCardsT * 2) * (1 - leadershipCardsExitT),
          visibility: isLeadershipCardsVisible ? "visible" : "hidden",
          pointerEvents: isLeadershipCardsInteractive ? "auto" : "none",
        }}
      >
        <div className="w-[94vw] max-w-[1220px] mx-auto flex flex-col items-start justify-center my-auto">
          {/* Section Heading (consistent with MY CREATIONS.EXE & MY JOURNEY.log) */}
          <div
            className="w-full flex flex-col items-start justify-start text-left pl-1 sm:pl-2 mb-2.5 sm:mb-3 pointer-events-none select-none"
            style={{
              opacity: Math.min(1, leadershipCardsT * 1.6) * Math.max(0, 1 - leadershipCardsExitT * 1.4),
              transform:
                leadershipCardsT >= 0.995 && leadershipCardsExitT <= 0.005
                  ? undefined
                  : `translate3d(0, ${(-(1 - leadershipCardsT) * 26 - leadershipCardsExitT * 32).toFixed(1)}px, 0)`,
            }}
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight drop-shadow-sm mb-0.5 creations-heading transition-colors duration-500"
              style={{
                fontFamily: "'Special Elite', cursive",
                color: "var(--exp-headline-color, #2b180e)",
                textShadow: "var(--exp-text-shadow, none)",
              }}
            >
              BEYOND CODE.log
            </h2>
            <p
              className="text-xs sm:text-sm font-mono tracking-wide creations-subheading transition-colors duration-500"
              style={{
                fontFamily: "'Special Elite', cursive",
                color: "var(--exp-subtext-color, #3d2314)",
              }}
            >
              Leadership, collaboration &amp; campus initiatives
            </p>
          </div>

          {/* 3 Small Experience Cards falling from one top-center point into 3 side-by-side positions */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full items-stretch"
            style={{ perspective: "1200px" }}
          >
            {LEADERSHIP_ROLES_DATA.map((item, idx) => {
              const cardDelay = idx * 95;
              const roleTokens = item.role.split(" ");
              const dropOffset = idx === 1 ? 0 : idx === 0 ? 0.08 : 0.16;
              const rawProgress = Math.max(
                0,
                Math.min(1, (leadershipCardsT - dropOffset) / (1 - dropOffset))
              );
              const easeDrop = 1 - Math.pow(1 - rawProgress, 3);
              const dropFactor = 1 - easeDrop;
              const isExitingLeadership = leadershipCardsExitT > 0.005;
              const isRestingDrop = rawProgress >= 0.995 && !isExitingLeadership;

              const tyPx = isExitingLeadership ? -leadershipCardsExitT * 280 : -dropFactor * 340;
              const scale = isExitingLeadership ? 1 - leadershipCardsExitT * 0.12 : 0.62 + 0.38 * easeDrop;
              const rotX = isExitingLeadership ? leadershipCardsExitT * 20 : -dropFactor * 22;
              const rotZ = isExitingLeadership ? 0 : dropFactor * (idx === 0 ? -11 : idx === 1 ? 2.5 : 11);

              const cardDropTransform = isRestingDrop
                ? undefined
                : isExitingLeadership
                  ? `translate3d(0, ${tyPx.toFixed(1)}px, 0) scale(${scale.toFixed(4)}) rotateX(${rotX.toFixed(2)}deg)`
                  : `translate3d(calc(${dropFactor.toFixed(4)} * var(--card-drop-x, 0%)), ${tyPx.toFixed(1)}px, 0) scale(${scale.toFixed(4)}) rotateX(${rotX.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;

              return (
                <div
                  key={item.count}
                  className={`group experience-tab-card leadership-drop-card-${idx} relative w-full h-[min(385px,53vh)] min-h-[325px] select-none ${isRestingDrop ? "transition-transform duration-300 ease-out hover:-translate-y-2" : ""
                    } ${isLeadershipCardsFocused ? "exp-card-focused" : ""}`}
                  style={{
                    transform: cardDropTransform,
                    transformOrigin: "center top",
                    opacity: Math.min(1, rawProgress * 2.2) * Math.max(0, 1 - leadershipCardsExitT * 1.15),
                  }}
                >
                  {/* Isolated Small Card Window Graphic & Drop-Shadow (never blurs text!) */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none transition-[filter] duration-300 group-hover:brightness-[1.01]"
                    style={{
                      backgroundImage: "url('/assets/small_experience.webp')",
                      backgroundSize: "100% 100%",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.36))",
                    }}
                  />

                  {/* Generous Safe-Zone Padding Inside Cream Frame (17.5% top, 11% bottom, 14.5% sides) */}
                  <div
                    className="absolute flex flex-col justify-between gap-2 overflow-y-auto no-scrollbar py-0.5"
                    style={{
                      top: "17.5%",
                      bottom: "11%",
                      left: "14.5%",
                      right: "14.5%",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      WebkitFontSmoothing: "antialiased",
                    }}
                  >
                    {/* Header: Single-line Role + Committee Name on next line (no dash, distinct accent color/size) */}
                    <div className="flex flex-col flex-shrink-0">
                      <h3
                        className="text-[1.02rem] sm:text-[1.08rem] lg:text-[1.14rem] font-bold tracking-tight leading-[1.2] flex flex-wrap items-baseline gap-x-1.5"
                        style={{ fontFamily: "'Special Elite', cursive", color: "#2b180e" }}
                      >
                        <span
                          className="exp-word-item inline-block text-sm sm:text-[0.98rem] font-bold"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: "#7c5840",
                            animationDelay: `${cardDelay + 30}ms`,
                          }}
                        >
                          {item.count}.
                        </span>
                        {roleTokens.map((word, wIdx) => (
                          <span
                            key={wIdx}
                            className="exp-word-item inline-block"
                            style={{ animationDelay: `${cardDelay + 70 + wIdx * 45}ms` }}
                          >
                            {word}
                          </span>
                        ))}
                      </h3>

                      <div className="relative inline-block self-start mt-1.5">
                        <p
                          className="exp-card-text-item text-xs sm:text-[13px] font-bold tracking-[0.06em]"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: "#8b5e3c",
                            animationDelay: `${cardDelay + 210}ms`,
                          }}
                        >
                          {item.organization}
                        </p>
                        <div
                          className="exp-highlight-bar h-[2px] w-full rounded-full mt-1 bg-gradient-to-r from-[#8b5e3c]/65 via-[#c28e64]/45 to-transparent"
                          style={{ animationDelay: `${cardDelay + 290}ms` }}
                        />
                      </div>
                    </div>

                    {/* Middle: Concise Role Summary (matched font size across Experience & Initiative cards) */}
                    <p
                      className="exp-card-text-item text-[13.5px] sm:text-[14px] md:text-[14.5px] leading-[1.58] font-normal"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: "#3d2314",
                        animationDelay: `${cardDelay + 260}ms`,
                      }}
                    >
                      {item.summary}
                    </p>

                    {/* Bottom: Rotating KEY AREAS Spotlight (identical to KEY CONTRIBUTIONS) */}
                    <div className="flex-shrink-0 pt-0.5">
                      <ContributionSpotlight
                        contributions={item.keyAreas}
                        isActive={isActive && isLeadershipCardsFocused}
                        label="KEY AREAS"
                        animationDelay={`${cardDelay + 360}ms`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 5. SKILLS TOOLKIT INTERLUDE TEXT REVEAL (masterProgress 5.55 -> 6.2 -> 6.85) ─── */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 sm:px-10 will-change-transform"
        style={{
          transform: `translate3d(0, ${skillsTextY}%, 0)`,
          opacity: skillsTextOpacity,
          visibility: isSkillsTextVisible ? "visible" : "hidden",
          pointerEvents:
            masterProgress >= 5.85 && masterProgress < 6.55 ? "auto" : "none",
        }}
      >
        {isSkillsTextVisible && (
          <AnimatedSkillsStatement animKey={skillsAnimKey} />
        )}

        <button
          type="button"
          onClick={() => {
            scrollToStop(SKILLS_FOLDERS_STOP, 1.0, false);
          }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm mt-7 animate-bounce"
          style={{
            fontFamily: "'Special Elite', cursive",
            color: "var(--exp-pill-color, #2b180e)",
            borderColor: "var(--exp-pill-border, #2b180e)",
            borderWidth: "1.5px",
            borderStyle: "solid",
            backgroundColor: "var(--exp-pill-bg, rgba(43, 24, 14, 0.08))",
          }}
        >
          <span>Scroll down to see</span>
          <span>↓</span>
        </button>
      </div>

      {/* ─── 6. SKILLS TOOLKIT FOLDERS STAGE (masterProgress 6.55 -> 7.2) ─── */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 pt-2 sm:pt-3 pb-3 overflow-y-auto md:overflow-visible no-scrollbar will-change-transform"
        style={{
          transform: `translate3d(0, ${(1 - skillsFoldersT) * 28}%, 0)`,
          opacity: skillsFoldersT,
          visibility: isSkillsFoldersVisible ? "visible" : "hidden",
          pointerEvents: isSkillsFoldersInteractive ? "auto" : "none",
        }}
      >
        <div className="w-[94vw] max-w-[960px] mx-auto flex flex-col items-start justify-center my-auto">
          {/* Section Heading (consistent with MY CREATIONS.EXE, MY JOURNEY.log, BEYOND CODE.log) */}
          <div className="w-full flex flex-col items-start justify-start text-left pl-1 sm:pl-2 mb-3 sm:mb-4 pointer-events-none select-none">
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight drop-shadow-sm mb-0.5 creations-heading transition-colors duration-500"
              style={{
                fontFamily: "'Special Elite', cursive",
                color: "var(--exp-headline-color, #2b180e)",
                textShadow: "var(--exp-text-shadow, none)",
              }}
            >
              TOOLKIT.sys
            </h2>
            <p
              className="text-xs sm:text-sm font-mono tracking-wide creations-subheading transition-colors duration-500"
              style={{
                fontFamily: "'Special Elite', cursive",
                color: "var(--exp-subtext-color, #3d2314)",
              }}
            >
              Languages, frameworks &amp; AI stack &bull; Hover or click a folder
            </p>
          </div>

          {/* 4 Studio Paper Icon Folders (2x2 clean grid, fanned icons open on hover/click) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-5 sm:gap-y-6 w-full place-items-center overflow-visible">
            {SKILL_FOLDERS.map((folder, idx) => (
              <IconFolder
                key={folder.id}
                title={folder.title}
                tags={folder.tags}
                icons={folder.icons}
                spread={58}
                isRevealed={areSkillFoldersRevealed}
                revealDelay={idx * 0.09}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
