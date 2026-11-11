"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import TextType from "@/components/TextType";
import LetterGlitch from "@/components/LetterGlitch";
import FlexCarousel, { FlexCarouselHandle } from "@/components/FlexCarousel";
import ScrollExpand, { ScrollExpandHandle } from "@/components/ScrollExpand";
import MagicBento from "@/components/MagicBento";
import { getMagicBentoItems } from "@/data/projectData";
import Dock, { DockItemData } from "@/components/Dock";
import WhatWeShipSection from "@/components/WhatWeShipSection";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CodeIcon,
  Folder01Icon,
  Home01Icon,
  Layers01Icon,
  Mail01Icon,
  MusicNote03Icon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";

interface PortfolioSectionProps {
  isActive: boolean;
  externalScrollProgress?: number | null;
  onPortfolioProgressChange?: (progress: number) => void;
  onScrollBackToTransition?: () => void;
  onScrollToHeroStart?: () => void;
  onExpandedStateChange?: (isExpanded: boolean) => void;
}

// PC content bounds within pc.png (1920x1080), as percentages
// Measured from pixel analysis: top=220 left=244 bottom=858 right=1006
const PC_LEFT = (244 / 1920) * 100; // ~12.7%
const PC_TOP = (220 / 1080) * 100; // ~20.4%
const PC_WIDTH = ((1006 - 244) / 1920) * 100; // ~39.7%
const PC_HEIGHT = ((858 - 220) / 1080) * 100; // ~59.1%

const ABOUT_SENTENCES = [
  "I'm Sahana, a curious mind with endless interests.",
  "I build things with code and a little creativity.",
  "I love experimenting with AI and technology.",
  "I create, design, and obsess over details.",
  "I love challenges and learning new things.",
  "A little bit of everything. That's me.",
];

const PROJECT_ITEMS = [
  {
    src: "/assets/project_tab_lawbot.webp",
    alt: "AI Law Bot",
    title: "AI LAW BOT",
    subtitle: "Legal Intelligence Platform",
    expandSrc: "/assets/raw_project_tab_lawbot.webp",
    demoUrl: "https://ai-law-bot-nu.vercel.app/",
  },
  {
    src: "/assets/project_tab_ufi.webp",
    alt: "UFI",
    title: "UFI",
    subtitle: "Next-Gen Web Platform",
    expandSrc: "/assets/raw_project_tab_ufi.webp",
    demoUrl: "https://ufi-omega.vercel.app/",
  },
  {
    src: "/assets/project_tab_brew.webp",
    alt: "Urban Brew",
    title: "URBAN BREW",
    subtitle: "Artisanal Coffee & Experience",
    expandSrc: "/assets/raw_project_tab_brew.webp",
    demoUrl: "https://urban-brew-ten.vercel.app/",
  },
  {
    src: "/assets/project_tab_india.webp",
    alt: "India Connect Hub",
    title: "INDIA CONNECT HUB",
    subtitle: "Community & Network Hub",
    expandSrc: "/assets/raw_project_tab_india.webp",
    demoUrl: "https://india-connect-hub.vercel.app/",
  },
  {
    src: "/assets/project_tab_resume.webp",
    alt: "AI Resume Analyzer",
    title: "AI RESUME ANALYZER",
    subtitle: "Career & Resume Optimization",
    expandSrc: "/assets/raw_project_tab_resume.webp",
    demoUrl: "https://ai-resume-analyzer-dun-one.vercel.app/",
  },
];

function ProjectsIntroHeadline({ animKey }: { animKey: number }) {
  const quoteWords = ["Mmm...", "let's", "see", "what", "she's", "been", "cooking."];

  let charCount = 0;

  return (
    <div key={animKey} className="flex flex-col items-center text-center select-none max-w-3xl mx-auto px-4">
      <style>{`
        @keyframes projCharPop {
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

        .proj-typewriter-char {
          opacity: 0;
          animation: projCharPop 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes projCaretBlink {
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

        .proj-typewriter-caret {
          opacity: 0;
          animation: projCharPop 0.3s ease-out forwards, projCaretBlink 0.9s step-end infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .proj-typewriter-char,
          .proj-typewriter-caret {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <h2
        className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-extrabold leading-[1.15] tracking-normal transition-colors duration-500 drop-shadow-sm"
        style={{
          fontFamily: "'Special Elite', cursive",
          color: "var(--exp-headline-color, #2b180e)",
          textShadow: "var(--exp-text-shadow, none)",
        }}
      >
        {quoteWords.map((word, wIdx) => (
          <span key={`pq-${wIdx}`} className="inline-block whitespace-nowrap mx-[0.18em]">
            {word.split("").map((char, cIdx) => {
              const delay = 140 + charCount * 26;
              charCount++;
              return (
                <span
                  key={`pqc-${cIdx}`}
                  className="inline-block will-change-transform will-change-opacity proj-typewriter-char"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
        <span
          className="inline-block ml-1 font-normal opacity-80 proj-typewriter-caret"
          style={{
            color: "var(--exp-caret-color, #2b180e)",
            animationDelay: `${180 + charCount * 26}ms`,
          }}
        >
          _
        </span>
      </h2>
    </div>
  );
}

export default function PortfolioSection({
  isActive,
  externalScrollProgress,
  onPortfolioProgressChange,
  onScrollBackToTransition,
  onScrollToHeroStart,
  onExpandedStateChange,
}: PortfolioSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [entered, setEntered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof PROJECT_ITEMS[0] | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [projectsStage, setProjectsStage] = useState<"intro" | "carousel">("intro");
  const projectsStageRef = useRef<"intro" | "carousel">("intro");
  useEffect(() => {
    projectsStageRef.current = projectsStage;
  }, [projectsStage]);
  const [sectionZone, setSectionZone] = useState<"experience" | "skills">("experience");
  const [whatWeShipStopRequest, setWhatWeShipStopRequest] = useState<{ stop: number; id: number } | null>(null);
  const [expandProgress, setExpandProgress] = useState(0);
  const initialExpandedRef = useRef(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const isInfoOpenRef = useRef(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoadingTimeout = useCallback(() => {
    setIsIframeLoading(true);
    setShowLoader(false);
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current);
    }
    // Only show the hamster wheel loader if loading takes more than 300ms
    loaderTimerRef.current = setTimeout(() => {
      setShowLoader(true);
    }, 300);
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current);
      loaderTimerRef.current = null;
    }
    setIsIframeLoading(false);
    setShowLoader(false);
  }, []);

  useEffect(() => {
    isInfoOpenRef.current = isInfoOpen;
  }, [isInfoOpen]);

  useEffect(() => {
    if (selectedProject) {
      startLoadingTimeout();
    }
  return () => {
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current);
    }
  };
}, [selectedProject?.title, startLoadingTimeout]);
const scrollExpandRef = useRef<ScrollExpandHandle>(null);
const carouselRef = useRef<FlexCarouselHandle>(null);
const [prevActive, setPrevActive] = useState(isActive);

const hitRef = useRef<HTMLDivElement>(null);
const videoRef = useRef<HTMLVideoElement>(null);
const [pcVideoSrc, setPcVideoSrc] = useState("/assets/transition/pc_click.mp4");
const pcVideoBlobUrlRef = useRef<string | null>(null);
const isVideoPlayingRef = useRef(false);
const enteredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  isVideoPlayingRef.current = isVideoPlaying;
}, [isVideoPlaying]);

// Pre-buffer full pc_click.mp4 (moov atom sits at EOF) into an in-memory Blob URL so 1st click plays with zero range-request stalls
useEffect(() => {
  let cancelled = false;
  const controller = new AbortController();

  const timer = setTimeout(() => {
    fetch("/assets/transition/pc_click.mp4", { signal: controller.signal })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        const objectUrl = URL.createObjectURL(blob);
        pcVideoBlobUrlRef.current = objectUrl;
        if (!isVideoPlayingRef.current) {
          setPcVideoSrc(objectUrl);
        }
      })
      .catch(() => {});
  }, 400);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    controller.abort();
    if (pcVideoBlobUrlRef.current) {
      URL.revokeObjectURL(pcVideoBlobUrlRef.current);
      pcVideoBlobUrlRef.current = null;
    }
  };
}, []);

// Vertical scroll state: 0 = at PC (About Me), 1 = at Creations (MY CREATIONS.EXE), 2 = at What We Ship
const [scrollPos, setScrollPos] = useState(() => {
  if (externalScrollProgress != null) {
    return externalScrollProgress >= 1.4 ? 2 : externalScrollProgress >= 0.5 ? 1 : 0;
  }
  return 0;
});
const scrollPosRef = useRef(scrollPos);
useEffect(() => {
  scrollPosRef.current = scrollPos;
}, [scrollPos]);

// Restore saved project viewer state on mount (runs exclusively on client in-tab reload, preventing hydration mismatch)
useEffect(() => {
  try {
    localStorage.removeItem("portfolio_saved_state");
    const raw = sessionStorage.getItem("portfolio_saved_state");
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved) return;

    if (saved.expandedProjectTitle) {
      const found = PROJECT_ITEMS.find((p) => p.title === saved.expandedProjectTitle);
      if (found) {
        setSelectedProject(found);
        const idx = PROJECT_ITEMS.findIndex((p) => p.title === saved.expandedProjectTitle);
        if (idx >= 0) setCurrentTab(idx);
        if (saved.isLiveExpanded) {
          initialExpandedRef.current = true;
          setExpandProgress(1);
        }
        if (saved.isInfoOpen) {
          setIsInfoOpen(true);
        }
        setScrollPos(1);
        scrollPosRef.current = 1;
        setProjectsStage("carousel");
        projectsStageRef.current = "carousel";
      }
    } else if (saved.section === "services" || saved.portfolioScrollProgress >= 1.5) {
      setScrollPos(2);
      scrollPosRef.current = 2;
    } else if (saved.section === "projects") {
      setScrollPos(1);
      scrollPosRef.current = 1;
    }
    if (saved.isVideoPlaying) {
      setIsVideoPlaying(true);
    }
  } catch { }
}, []);
const [servicesCardIndex, setServicesCardIndex] = useState(0);
const arrivalLockUntilRef = useRef(0);
const aboutArrivalCooldownUntilRef = useRef(0);
const hasStoppedAtAboutRef = useRef(false);
const scrollDownAccumulatorRef = useRef(0);
const scrollDownResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const scrollUpAccumulatorRef = useRef(0);
const scrollUpResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const scrollDownToServicesAccumulatorRef = useRef(0);

const onPortfolioProgressChangeRef = useRef(onPortfolioProgressChange);
useEffect(() => {
  onPortfolioProgressChangeRef.current = onPortfolioProgressChange;
}, [onPortfolioProgressChange]);

const onScrollBackToTransitionRef = useRef(onScrollBackToTransition);
useEffect(() => {
  onScrollBackToTransitionRef.current = onScrollBackToTransition;
}, [onScrollBackToTransition]);

const onExpandedStateChangeRef = useRef(onExpandedStateChange);
useEffect(() => {
  onExpandedStateChangeRef.current = onExpandedStateChange;
}, [onExpandedStateChange]);

useEffect(() => {
  const isExpanded = (!!selectedProject && expandProgress >= 0.95) || isVideoPlaying;
  onExpandedStateChangeRef.current?.(isExpanded);
}, [selectedProject, expandProgress, isVideoPlaying]);

// Save expanded project & modal state to session storage
useEffect(() => {
  try {
    const existingRaw = sessionStorage.getItem("portfolio_saved_state");
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    const updated = {
      ...existing,
      expandedProjectTitle: selectedProject ? selectedProject.title : null,
      isLiveExpanded: selectedProject ? expandProgress >= 0.95 : false,
      isInfoOpen: selectedProject ? isInfoOpen : false,
      isVideoPlaying: isVideoPlaying,
    };

    sessionStorage.setItem("portfolio_saved_state", JSON.stringify(updated));
  } catch { }
}, [selectedProject, expandProgress, isInfoOpen, isVideoPlaying]);

const isFirstMountRef = useRef(true);
useEffect(() => {
  isFirstMountRef.current = false;
}, []);

// Sync external scrollbar target progress (0.0 to 2.0)
const [prevExternalProgress, setPrevExternalProgress] = useState(externalScrollProgress);
if (externalScrollProgress !== prevExternalProgress) {
  setPrevExternalProgress(externalScrollProgress);
  if (externalScrollProgress != null && isActive) {
    const nextPos = externalScrollProgress >= 1.4 ? 2 : externalScrollProgress >= 0.5 ? 1 : 0;
    if (nextPos >= 1 && scrollPos === 0 && !isFirstMountRef.current) {
      arrivalLockUntilRef.current = Date.now() + 600;
    }
    if (nextPos >= 1) {
      hasStoppedAtAboutRef.current = true;
    }
    setScrollPos(nextPos);
  }
}

const updateScrollPos = useCallback((newPos: number, nextProjectsStage?: "intro" | "carousel") => {
  scrollPosRef.current = newPos;
  if (newPos >= 1) {
    arrivalLockUntilRef.current = Date.now() + 650;
  }
  if (newPos === 1) {
    const stage = nextProjectsStage ?? "intro";
    projectsStageRef.current = stage;
    setProjectsStage(stage);
  }
  setScrollPos(newPos);
  onPortfolioProgressChangeRef.current?.(newPos);
}, []);

// Centralized upward transition: Creations (MY CREATIONS.EXE) -> About (WHO'S BEHIND THE SCREEN?)
// Compulsorily stops at About and absorbs the remaining swipe inertia for 850ms
const handleScrollUpToAbout = useCallback(() => {
  if (scrollPosRef.current === 0) {
    return;
  }

  // Switch to About section (Section 0)
  updateScrollPos(0);
  // Brief cooldown so incoming swipe momentum doesn't skip past About immediately
  aboutArrivalCooldownUntilRef.current = Date.now() + 450;
  scrollDownAccumulatorRef.current = 0;
  scrollUpAccumulatorRef.current = 0;
}, [updateScrollPos]);

const enterProjectsCarousel = useCallback(() => {
  projectsStageRef.current = "carousel";
  setProjectsStage("carousel");
  arrivalLockUntilRef.current = Date.now() + 650;
  scrollDownToServicesAccumulatorRef.current = 0;
}, []);

const handleScrollUpFromCarousel = useCallback(() => {
  if (projectsStageRef.current === "intro") {
    handleScrollUpToAbout();
    return;
  }
  projectsStageRef.current = "intro";
  setProjectsStage("intro");
  arrivalLockUntilRef.current = Date.now() + 650;
}, [handleScrollUpToAbout]);

const isProjectsIntroVisible = isActive && scrollPos === 1 && projectsStage === "intro";
const [projectsIntroAnimKey, setProjectsIntroAnimKey] = useState(0);
const [prevProjectsIntroVisible, setPrevProjectsIntroVisible] = useState(false);
if (isProjectsIntroVisible !== prevProjectsIntroVisible) {
  setPrevProjectsIntroVisible(isProjectsIntroVisible);
  if (isProjectsIntroVisible) {
    setProjectsIntroAnimKey((prev) => prev + 1);
  }
}

const jumpToWhatWeShipStop = useCallback(
  (stop: number) => {
    updateScrollPos(2);
    setWhatWeShipStopRequest({ stop, id: Date.now() + Math.random() });
  },
  [updateScrollPos]
);

const glyph = useCallback((icon: any) => <HugeiconsIcon icon={icon} size="1.25em" strokeWidth={1.8} />, []);
const [isMusicActive, setIsMusicActive] = useState(true);

const dockItems: DockItemData[] = useMemo(() => [
  {
    icon: glyph(Home01Icon),
    label: 'Home',
    onClick: () => {
      onScrollToHeroStart?.();
    },
    menu: [
      { label: 'Hero (1st Frame)', onClick: () => onScrollToHeroStart?.() },
      { separator: true },
      { label: "Who's Behind the Screen", onClick: () => updateScrollPos(0) },
      { label: 'My Creations.exe (5 Projects)', onClick: () => updateScrollPos(1, "carousel") },
      { label: 'My Experience (2 Roles)', onClick: () => jumpToWhatWeShipStop(2.2) },
      { label: 'My Toolkit (4 Skill Folders)', onClick: () => jumpToWhatWeShipStop(7.2) },
    ]
  },
  {
    icon: glyph(UserCircle02Icon),
    label: 'About',
    active: scrollPos === 0,
    onClick: () => {
      updateScrollPos(0);
    },
    menu: [
      { label: "Who's Behind the Screen?", onClick: () => updateScrollPos(0) },
      { separator: true },
      { label: 'Back to Hero', onClick: () => onScrollToHeroStart?.() },
      { label: 'Go to My Creations (5)', onClick: () => updateScrollPos(1) },
      { label: 'Go to Experience (2)', onClick: () => jumpToWhatWeShipStop(2.2) },
      { label: 'Go to Skills (4)', onClick: () => jumpToWhatWeShipStop(7.2) },
    ]
  },
  {
    icon: glyph(Folder01Icon),
    label: 'Projects',
    badge: 5,
    active: scrollPos === 1,
    onClick: () => {
      updateScrollPos(1);
    },
    menu: [
      { label: 'My Creations.exe (5 Projects)', onClick: () => updateScrollPos(1, "carousel") },
      { separator: true },
      { label: '1. AI Law Bot', onClick: () => { updateScrollPos(1, "carousel"); setCurrentTab(0); } },
      { label: '2. UFI Platform', onClick: () => { updateScrollPos(1, "carousel"); setCurrentTab(1); } },
      { label: '3. Urban Brew', onClick: () => { updateScrollPos(1, "carousel"); setCurrentTab(2); } },
      { label: '4. India Connect Hub', onClick: () => { updateScrollPos(1, "carousel"); setCurrentTab(3); } },
      { label: '5. AI Resume Analyzer', onClick: () => { updateScrollPos(1, "carousel"); setCurrentTab(4); } },
    ]
  },
  {
    icon: glyph(Layers01Icon),
    label: 'Experience',
    badge: 2,
    active: scrollPos === 2 && sectionZone === "experience",
    onClick: () => {
      if (sectionZone === "skills") {
        jumpToWhatWeShipStop(2.2);
      } else {
        updateScrollPos(2);
      }
    },
    menu: [
      { label: 'My Experience (2 Roles)', onClick: () => jumpToWhatWeShipStop(2.2) },
      { separator: true },
      { label: '01. InVizn — AI/ML Intern', onClick: () => jumpToWhatWeShipStop(2.2) },
      { label: '02. Freelance — Web Developer', onClick: () => jumpToWhatWeShipStop(3.2) },
      { label: '03. Leadership & Initiatives', onClick: () => jumpToWhatWeShipStop(5.2) },
    ]
  },
  {
    icon: glyph(CodeIcon),
    label: 'Skills',
    badge: 4,
    active: scrollPos === 2 && sectionZone === "skills",
    onClick: () => {
      jumpToWhatWeShipStop(7.2);
    },
    menu: [
      { label: 'My Toolkit (4 Folders)', onClick: () => jumpToWhatWeShipStop(7.2) },
      { separator: true },
      { label: '01. Programming', onClick: () => jumpToWhatWeShipStop(7.2) },
      { label: '02. Frontend', onClick: () => jumpToWhatWeShipStop(7.2) },
      { label: '03. Backend', onClick: () => jumpToWhatWeShipStop(7.2) },
      { label: '04. AI / ML', onClick: () => jumpToWhatWeShipStop(7.2) },
    ]
  },
  { separator: true },
  {
    icon: glyph(Mail01Icon),
    label: 'Mail',
    onClick: () => {
      window.location.href = "mailto:sahanasnayak@gmail.com";
    },
    menu: [
      { label: 'Compose Email', onClick: () => { window.location.href = "mailto:sahanasnayak@gmail.com"; } },
      { separator: true },
      { label: 'Copy Email Address', onClick: () => { navigator.clipboard?.writeText("sahanasnayak@gmail.com"); } }
    ]
  },
  {
    icon: glyph(MusicNote03Icon),
    label: isMusicActive ? 'Music' : 'Music (Muted)',
    className: isMusicActive ? '' : 'opacity-70',
    onClick: () => {
      setIsMusicActive(prev => !prev);
    },
    menu: [
      { label: isMusicActive ? 'Mute Sound' : 'Play Sound', onClick: () => setIsMusicActive(prev => !prev) }
    ]
  }
], [glyph, scrollPos, sectionZone, isMusicActive, onScrollToHeroStart, updateScrollPos, jumpToWhatWeShipStop, setCurrentTab]);

// Restart starting wobble and reset section states whenever active state changes
if (isActive !== prevActive) {
  setPrevActive(isActive);
  if (isActive) {
    // Arrived at PortfolioSection (About section):
    // Guarantee starting at Section 0 (WHO'S BEHIND THE SCREEN?) unless external target requested
    if (externalScrollProgress == null) {
      setScrollPos(0);
      setProjectsStage("intro");
    }
    // Compulsory pit stop at About: cushion and absorb all incoming transition scroll momentum for 850ms
    aboutArrivalCooldownUntilRef.current = Date.now() + 850;
    hasStoppedAtAboutRef.current = false;
    scrollDownAccumulatorRef.current = 0;
    scrollUpAccumulatorRef.current = 0;
  } else {
    setEntered(false);
    setIsHovered(false);
    setIsVideoPlaying(false);
    setScrollPos(0);
    setProjectsStage("intro");
    hasStoppedAtAboutRef.current = false;
  }
}


// Smooth entry animation — delay setEntered(true) so shadow fades in
useEffect(() => {
  if (enteredTimerRef.current) {
    clearTimeout(enteredTimerRef.current);
    enteredTimerRef.current = null;
  }

  if (isActive) {
    enteredTimerRef.current = setTimeout(() => {
      setEntered(true);
    }, 50);
  }

  return () => {
    if (enteredTimerRef.current) {
      clearTimeout(enteredTimerRef.current);
      enteredTimerRef.current = null;
    }
    if (scrollDownResetTimeoutRef.current) {
      clearTimeout(scrollDownResetTimeoutRef.current);
      scrollDownResetTimeoutRef.current = null;
    }
    if (scrollUpResetTimeoutRef.current) {
      clearTimeout(scrollUpResetTimeoutRef.current);
      scrollUpResetTimeoutRef.current = null;
    }
  };
}, [isActive]);

const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  const el = hitRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  setMousePos({ x, y });
}, []);

const handlePcClick = useCallback(() => {
  isVideoPlayingRef.current = true;
  setIsVideoPlaying(true);
  const video = videoRef.current;
  if (video) {
    video.currentTime = 0;
    video.play().catch(() => { });
  }
}, []);

const handleCloseVideo = useCallback(() => {
  isVideoPlayingRef.current = false;
  setIsVideoPlaying(false);
  const video = videoRef.current;
  if (video) {
    video.pause();
  }
  if (pcVideoBlobUrlRef.current) {
    setPcVideoSrc(pcVideoBlobUrlRef.current);
  }
  try {
    const existingRaw = sessionStorage.getItem("portfolio_saved_state");
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const updated = {
      ...existing,
      isVideoPlaying: false,
    };
    sessionStorage.setItem("portfolio_saved_state", JSON.stringify(updated));
  } catch { }
}, []);

  // Open project in unexpanded card view so user scrolls to expand
  const handleSelectProject = useCallback((project: typeof PROJECT_ITEMS[0]) => {
    initialExpandedRef.current = false;
    setExpandProgress(0);
    setIsInfoOpen(false);
    isInfoOpenRef.current = false;
    startLoadingTimeout();
    setSelectedProject(project);
  }, [startLoadingTimeout]);

// Close project viewer and restore carousel/screen state
const handleCloseProject = useCallback(() => {
  if (loaderTimerRef.current) {
    clearTimeout(loaderTimerRef.current);
    loaderTimerRef.current = null;
  }
  setIsIframeLoading(false);
  setShowLoader(false);
  setIsInfoOpen(false);
  isInfoOpenRef.current = false;
  setSelectedProject(null);
  setExpandProgress(0);
  initialExpandedRef.current = false;
  try {
    const existingRaw = sessionStorage.getItem("portfolio_saved_state");
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const updated = {
      ...existing,
      expandedProjectTitle: null,
      isLiveExpanded: false,
      isInfoOpen: false,
    };
    sessionStorage.setItem("portfolio_saved_state", JSON.stringify(updated));
  } catch { }
  // Ensure we give a brief grace window so wheel/pointer events from the modal don't jump sections
  arrivalLockUntilRef.current = Date.now() + 500;
  scrollDownAccumulatorRef.current = 0;
  scrollUpAccumulatorRef.current = 0;
  // Guarantee screen stays on Creations (MY CREATIONS.EXE) if that's where the tab was opened
  if (scrollPosRef.current === 1) {
    updateScrollPos(1);
  }
}, [updateScrollPos]);

// Keyboard navigation
useEffect(() => {
  if (!isActive) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (isInfoOpenRef.current) {
        setIsInfoOpen(false);
        isInfoOpenRef.current = false;
        return;
      }
      if (selectedProject) {
        if (expandProgress >= 0.5) {
          scrollExpandRef.current?.scrollToTop();
          return;
        }
        handleCloseProject();
        return;
      }
      if (isVideoPlaying) {
        handleCloseVideo();
        return;
      }
    }

    if (isVideoPlaying || selectedProject || scrollPos === 2) return;

    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") {
      if (scrollPos === 0) {
        if (Date.now() < aboutArrivalCooldownUntilRef.current) {
          return;
        }
        hasStoppedAtAboutRef.current = true;
        updateScrollPos(1);
      } else if (scrollPos === 1) {
        if (projectsStage === "intro") {
          if (Date.now() < arrivalLockUntilRef.current) {
            return;
          }
          enterProjectsCarousel();
        } else if (currentTab >= PROJECT_ITEMS.length - 1) {
          updateScrollPos(2);
        } else {
          carouselRef.current?.step(1);
        }
      }
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") {
      if (scrollPos === 1) {
        if (projectsStage === "intro") {
          if (Date.now() < arrivalLockUntilRef.current) {
            return;
          }
          handleScrollUpToAbout();
        } else if (currentTab <= 0) {
          handleScrollUpFromCarousel();
        } else {
          carouselRef.current?.step(-1);
        }
      } else if (scrollPos === 0) {
        if (Date.now() < aboutArrivalCooldownUntilRef.current) {
          return;
        }
        onScrollBackToTransitionRef.current?.();
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isActive, isVideoPlaying, selectedProject, expandProgress, isInfoOpen, scrollPos, projectsStage, currentTab, updateScrollPos, enterProjectsCarousel, handleScrollUpFromCarousel, handleScrollUpToAbout, handleCloseVideo, handleCloseProject]);

// Wheel listener: smooth natural scroll between About and Creations
const handleWheel = useCallback(
  (e: React.WheelEvent) => {
    if (!isActive || isVideoPlaying || selectedProject) {
      return;
    }

    if (scrollPos === 0) {
      // In About section: responsive scroll thresholds with zero rubber-band bounce-back
      if (e.deltaY > 0) {
        e.stopPropagation();

        if (Date.now() < aboutArrivalCooldownUntilRef.current) {
          return;
        }

        if (scrollDownResetTimeoutRef.current) {
          clearTimeout(scrollDownResetTimeoutRef.current);
          scrollDownResetTimeoutRef.current = null;
        }

        const requiredThreshold = !hasStoppedAtAboutRef.current ? 160 : 100;
        scrollDownAccumulatorRef.current += e.deltaY;

        if (scrollDownAccumulatorRef.current >= requiredThreshold) {
          hasStoppedAtAboutRef.current = true;
          scrollDownAccumulatorRef.current = 0;
          updateScrollPos(1);
        } else {
          scrollDownResetTimeoutRef.current = setTimeout(() => {
            scrollDownAccumulatorRef.current = 0;
          }, 450);
        }
      } else if (e.deltaY < 0) {
        e.stopPropagation();
        scrollDownAccumulatorRef.current = 0;

        if (Date.now() < aboutArrivalCooldownUntilRef.current) {
          return;
        }

        if (scrollUpResetTimeoutRef.current) {
          clearTimeout(scrollUpResetTimeoutRef.current);
          scrollUpResetTimeoutRef.current = null;
        }

        const REQUIRED_UP_THRESHOLD = -120;
        scrollUpAccumulatorRef.current += e.deltaY;

        if (scrollUpAccumulatorRef.current <= REQUIRED_UP_THRESHOLD) {
          scrollUpAccumulatorRef.current = 0;
          onScrollBackToTransitionRef.current?.();
        } else {
          scrollUpResetTimeoutRef.current = setTimeout(() => {
            scrollUpAccumulatorRef.current = 0;
          }, 450);
        }
      }
    } else if (scrollPos === 1) {
      // In Creations section (Projects Intro -> MY CREATIONS.EXE):
      e.stopPropagation();
      scrollDownAccumulatorRef.current = 0;
      scrollUpAccumulatorRef.current = 0;

      if (Date.now() < arrivalLockUntilRef.current) {
        return;
      }

      if (projectsStage === "intro") {
        // Next scroll down compulsorily enters the horizontal project tabs; scroll up goes back to About
        if (e.deltaY > 10) {
          enterProjectsCarousel();
        } else if (e.deltaY < -10) {
          handleScrollUpToAbout();
        }
        return;
      }

      // If at the 5th tab (Tab 4: AI Resume Analyzer) and user scrolls DOWN, transition to Section 3 (What We Ship)
      if (currentTab >= PROJECT_ITEMS.length - 1 && e.deltaY > 10) {
        scrollDownToServicesAccumulatorRef.current += e.deltaY;
        if (scrollDownToServicesAccumulatorRef.current >= 35) {
          scrollDownToServicesAccumulatorRef.current = 0;
          updateScrollPos(2);
        }
        return;
      } else {
        scrollDownToServicesAccumulatorRef.current = 0;
      }

      if (carouselRef.current) {
        carouselRef.current.handleWheel(e);
      } else if (e.deltaY < -8) {
        handleScrollUpFromCarousel();
      }
    } else if (scrollPos === 2) {
      // In Section 3: What We Ship
      e.stopPropagation();
    }
  },
  [isActive, isVideoPlaying, selectedProject, scrollPos, projectsStage, currentTab, updateScrollPos, enterProjectsCarousel, handleScrollUpFromCarousel, handleScrollUpToAbout]
);

// Hardware-accelerated CSS radial mask: creates a soft, organic clearing in the green matrix glitch around About Me text
const dynamicMaskStyle = useMemo(() => {
  return {
    maskImage:
      "radial-gradient(ellipse 36vw 40vh at 74% 50%, transparent 40%, black 82%)",
    WebkitMaskImage:
      "radial-gradient(ellipse 36vw 40vh at 74% 50%, transparent 40%, black 82%)",
  };
}, []);

const showEntered = entered;
const showVideo = isVideoPlaying;

// 3D tilt based on mouse position over the PC hit area
const tiltX = isHovered && !showVideo ? (mousePos.y - 0.5) * -6 : 0;
const tiltY = isHovered && !showVideo ? (mousePos.x - 0.5) * 6 : 0;

return (
  <div
    className={`fixed inset-0 z-[51] w-full h-full overflow-hidden select-none transition-opacity duration-500 ease-out ${isActive
      ? "opacity-100 pointer-events-auto"
      : "opacity-0 pointer-events-none"
      }`}
    onWheel={isActive ? handleWheel : undefined}
  >
    {/* ─── FIXED BACKGROUND (KEEP BACKGROUND SAME ACROSS ALL SECTIONS) ─── */}
    {/* Background - bg_port.webp stretched to fill viewport */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/assets/transition/bg_port.webp"
      alt=""
      draggable={false}
      className="absolute inset-0 w-full h-full select-none pointer-events-none render-high-quality"
      style={{ objectFit: "fill" }}
    />

    {/* Atmospheric Dark Mode Overlay covering the background */}
    <div
      className="absolute inset-0 pointer-events-none dark-mode-bg-overlay z-[1]"
      aria-hidden="true"
    />

    {/* LetterGlitch effect layered on top of bg_port */}
    <div
      className="absolute top-0 left-0 right-0 h-[92%] pointer-events-none opacity-55 overflow-hidden transition-opacity duration-500"
      style={scrollPos === 0 ? dynamicMaskStyle : undefined}
    >
      <LetterGlitch
        glitchColors={["#000000", "#059669", "#10b981"]}
        baseColor="#000000"
        glitchAmount={0.25}
        speed={0.9}
        flow={0.5}
        clickEffect="tear"
        density={0.88}
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1}
      />
    </div>

    {/* ─── CONTINUOUS SCROLL CONTAINER: SECTION 1 + SECTION 2 ─── */}
    {/* Strictly bounded between top and the brown horizon bar (0% to 92%). Nothing ever crosses onto the horizon! */}
    <div className="absolute top-0 left-0 right-0 h-[92%] overflow-hidden z-10">
      <div
        className="w-full h-full will-change-transform transition-transform duration-600 ease-out"
        style={{
          transform: `translate3d(0, -${scrollPos * 100}%, 0)`,
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: ABOUT ME / RETRO PC ("WHO'S BEHIND THE SCREEN?")    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`relative w-full h-full overflow-hidden ${isActive && scrollPos === 0 ? "pointer-events-auto" : "pointer-events-none"}`}>
          {/* PC image - stretched to fill 100vh viewport for pixel-perfect match with frame 105 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/transition/pc.webp"
            alt="Retro PC - Sahana Nayak Portfolio"
            draggable={false}
            className={`absolute inset-0 select-none pointer-events-none render-high-quality ${!isHovered && showEntered && !showVideo ? "animate-pc-wobble" : ""
              }`}
            style={{
              width: "100%",
              height: "108.7%", // 100vh / 0.92 = 108.7% so it maintains identical 16:9 proportion with frame 105
              objectFit: "fill",
              transformOrigin: `${PC_LEFT + PC_WIDTH / 2}% ${PC_TOP + PC_HEIGHT / 2}%`,
              transform:
                isHovered && !showVideo
                  ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`
                  : undefined,
              transition: isHovered
                ? "transform 0.12s ease-out, filter 0.25s ease-out"
                : "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s ease-out",
              filter:
                isHovered && !showVideo
                  ? "drop-shadow(0 30px 45px rgba(0,0,0,0.35)) drop-shadow(0 12px 18px rgba(0,0,0,0.22))"
                  : undefined,
            }}
          />

          {/* Invisible interactive hit area covering only the PC bounding box */}
          {!showVideo && scrollPos === 0 && (
            <div
              ref={hitRef}
              onClick={handlePcClick}
              className="absolute cursor-pointer"
              style={{
                left: `${PC_LEFT}%`,
                top: `${PC_TOP}%`,
                width: `${PC_WIDTH}%`,
                height: `${PC_HEIGHT}%`,
                perspective: "1200px",
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => {
                setIsHovered(false);
                setMousePos({ x: 0.5, y: 0.5 });
              }}
              data-cursor-text="Click to interact"
              aria-label="Click to interact with PC"
            />
          )}

          {/* Soft rhythmic hint paired with the 10s PC wobble */}
          {scrollPos === 0 && (
            <div
              className={`pointer-events-none absolute z-10 transition-opacity duration-500 ease-out ${
                showEntered && !showVideo && !isHovered
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              style={{
                left: `${PC_LEFT + PC_WIDTH / 2}%`,
                top: "15.5%",
              }}
            >
              <button
                type="button"
                onClick={handlePcClick}
                className={`pc-click-hint inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-[13px] tracking-wide backdrop-blur-md transition-transform duration-200 hover:scale-105 ${
                  showEntered && !showVideo && !isHovered
                    ? "pointer-events-auto cursor-pointer"
                    : "pointer-events-none"
                }`}
                style={{ fontFamily: "'Special Elite', cursive" }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 3l14 9-6 1.8-3.2 5.7L5 3z" />
                </svg>
                <span>Click the PC</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="opacity-75"
                >
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* About Me Text Animation on the right of PC */}
          <div
            className={`absolute right-[5vw] lg:right-[7vw] top-[18%] sm:top-[22%] lg:top-[47%] lg:-translate-y-1/2 w-[42vw] min-w-[290px] max-w-[560px] pointer-events-auto transition-all duration-700 ease-out ${showEntered && !showVideo
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3 pointer-events-none"
              }`}
          >
            {/* Heading: About Me */}
            <h2
              className="inline-block text-4xl sm:text-5xl lg:text-6xl font-bold tracking-normal text-neutral-900 mb-5 sm:mb-6 about-heading transition-colors duration-500"
              style={{ fontFamily: "'Special Elite', cursive" }}
            >
              WHO&apos;S BEHIND THE SCREEN?
            </h2>

            {/* Typewriter Text Animation */}
            <div
              className="relative min-h-[5em] sm:min-h-[5.5em] lg:min-h-[6.5em]"
            >
              <TextType
                text={ABOUT_SENTENCES}
                typingSpeed={75}
                pauseDuration={1500}
                deletingSpeed={50}
                deleteMode="backspace"
                typeEffect="fade"
                mistakes={0.2}
                cursorStyle="underscore"
                cursorCharacter="_"
                cursorGlide
                showCursor
                loop
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed sm:leading-relaxed text-neutral-900 about-typewriter-text transition-colors duration-500"
                style={{ fontFamily: "'Special Elite', cursive" }}
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: PROJECTS INTRO -> MY CREATIONS.EXE                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`relative w-full h-full overflow-hidden ${isActive && scrollPos === 1 ? "pointer-events-auto" : "pointer-events-none"}`}>
          {/* 2A. Text Reveal Interlude: "Mmm... let's see what she's been cooking." */}
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center px-6 sm:px-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${projectsStage === "intro"
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-full pointer-events-none"
              }`}
          >
            <ProjectsIntroHeadline animKey={projectsIntroAnimKey} />

            <button
              type="button"
              onClick={enterProjectsCarousel}
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

          {/* 2B. Horizontal Project Tabs Stage: MY CREATIONS.EXE */}
          <div
            className={`w-full h-full flex flex-col items-center justify-start pt-10 sm:pt-14 md:pt-16 lg:pt-20 pb-2 px-4 sm:px-8 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${projectsStage === "carousel"
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-[45%] pointer-events-none"
              }`}
          >
            {/* Heading: MY CREATIONS.EXE (Left-aligned with tabs/ribbons, tight gap below) */}
            <div className="relative z-10 w-[78vw] max-w-[1460px] mx-auto flex flex-col items-start justify-start text-left mt-0 mb-0">
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 drop-shadow-sm mb-1 creations-heading transition-colors duration-500"
                style={{ fontFamily: "'Special Elite', cursive" }}
              >
                MY CREATIONS.EXE
              </h2>
              <p
                className="text-xs sm:text-sm text-neutral-800/80 font-mono tracking-wide creations-subheading transition-colors duration-500"
                style={{ fontFamily: "'Special Elite', cursive" }}
              >
                Explore projects in horizontal liquid view &bull; Click to expand
              </p>
            </div>

            {/* FlexCarousel with 5 tabs (Exact width between ribbons, large tabs, cloud blur at disappearing ends) */}
            <div className="relative z-10 w-full flex items-center justify-center -mt-16 sm:-mt-20 md:-mt-24">
              <div
                className="w-[82vw] max-w-[1520px] h-[540px] sm:h-[580px] lg:h-[620px] relative mx-auto overflow-hidden"
                onWheelCapture={(e) => {
                  if (projectsStage !== "carousel") return;
                  if (currentTab >= PROJECT_ITEMS.length - 1 && e.deltaY > 10) {
                    scrollDownToServicesAccumulatorRef.current += e.deltaY;
                    if (scrollDownToServicesAccumulatorRef.current >= 35) {
                      scrollDownToServicesAccumulatorRef.current = 0;
                      updateScrollPos(2);
                    }
                  } else {
                    scrollDownToServicesAccumulatorRef.current = 0;
                  }
                }}
                onWheel={(e) => {
                  if (projectsStage !== "carousel") return;
                  e.stopPropagation();
                  if (Date.now() < arrivalLockUntilRef.current) {
                    e.preventDefault();
                  }
                }}
              >
                {/* Left Side Blur - Only visible when not on first tab, smoothly merges into background */}
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-[58%] w-10 sm:w-12 md:w-14 z-20 pointer-events-none select-none rounded-r-xl transition-opacity duration-300 ${currentTab > 0 ? "opacity-100" : "opacity-0"
                    }`}
                  style={{
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    maskImage:
                      "linear-gradient(to right, black 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to right, black 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                  }}
                />

                {/* Right Side Blur - Only visible when not on last tab, smoothly merges into background */}
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 h-[58%] w-10 sm:w-12 md:w-14 z-20 pointer-events-none select-none rounded-l-xl transition-opacity duration-300 ${currentTab < PROJECT_ITEMS.length - 1 ? "opacity-100" : "opacity-0"
                    }`}
                  style={{
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    maskImage:
                      "linear-gradient(to left, black 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to left, black 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                  }}
                />

                <div
                  className="w-full h-full"
                  style={{
                    maskImage:
                      currentTab > 0 && currentTab < PROJECT_ITEMS.length - 1
                        ? "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)"
                        : currentTab > 0
                          ? "linear-gradient(to right, transparent 0%, black 48px, black 100%)"
                          : currentTab < PROJECT_ITEMS.length - 1
                            ? "linear-gradient(to right, black 0%, black calc(100% - 48px), transparent 100%)"
                            : "none",
                    WebkitMaskImage:
                      currentTab > 0 && currentTab < PROJECT_ITEMS.length - 1
                        ? "linear-gradient(to right, transparent 0%, black 48px, black calc(100% - 48px), transparent 100%)"
                        : currentTab > 0
                          ? "linear-gradient(to right, transparent 0%, black 48px, black 100%)"
                          : currentTab < PROJECT_ITEMS.length - 1
                            ? "linear-gradient(to right, black 0%, black calc(100% - 48px), transparent 100%)"
                            : "none",
                    transition: "mask-image 0.3s ease, -webkit-mask-image 0.3s ease",
                  }}
                >
                  <FlexCarousel
                    ref={carouselRef}
                    items={PROJECT_ITEMS}
                    preset="liquid"
                    intro="none"
                    cardHeight={0.58}
                    gap={14}
                    squeeze={0}
                    focusOnClick={false}
                    captions
                    tilt={-180}
                    bend={0}
                    liquid={0}
                    onChange={(idx) => setCurrentTab(idx)}
                    onSelect={(idx) => handleSelectProject(PROJECT_ITEMS[idx])}
                    onScrollPrev={handleScrollUpFromCarousel}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Footer hint — placed safely above the horizon */}
            <div className="relative z-10 text-center pb-2 mt-auto">
              {currentTab === PROJECT_ITEMS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => updateScrollPos(2)}
                  className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/10 dark:bg-white/10 hover:bg-neutral-900/20 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono tracking-wider uppercase transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm border border-neutral-900/10 dark:border-white/10 shadow-sm"
                  style={{ fontFamily: "'Special Elite', cursive" }}
                >
                  <span>Scroll down for Experience</span>
                  <span className="transition-transform group-hover:translate-y-0.5">↓</span>
                </button>
              ) : (
                <span
                  className="text-xs text-neutral-700/60 font-mono tracking-widest uppercase portfolio-tabs-counter transition-colors duration-500"
                  style={{ fontFamily: "'Special Elite', cursive" }}
                >
                  {currentTab + 1} / {PROJECT_ITEMS.length} TABS LOADED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: WHAT WE SHIP / BRAND APPART SERVICES                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`relative w-full h-full overflow-hidden flex flex-col items-center justify-start transition-opacity duration-300 ${isActive && scrollPos === 2 ? "pointer-events-auto opacity-100 visible" : "pointer-events-none opacity-0 invisible"}`}>
          <WhatWeShipSection
            isActive={isActive && scrollPos === 2}
            activeCardIndex={servicesCardIndex}
            onActiveCardChange={setServicesCardIndex}
            externalStopRequest={whatWeShipStopRequest}
            onSectionZoneChange={setSectionZone}
            onScrollUpToCreations={() => {
              updateScrollPos(1, "carousel");
              setCurrentTab(PROJECT_ITEMS.length - 1);
            }}
          />
        </div>
      </div>
    </div>

    {/* ─── FOREGROUND HORIZON DESK BAR (Bottom 8%) ─── */}
    {/* Physically anchors the desk horizon at the bottom; content scrolls strictly above it */}
    <div
      className="absolute bottom-0 left-0 right-0 h-[8%] min-h-[64px] z-20 pointer-events-none select-none overflow-hidden horizon-desk-container shadow-[0_-6px_24px_rgba(0,0,0,0.55)]"
      style={{
        backgroundColor: "#2b180e",
        borderTop: "1.5px solid #2b180e",
        boxShadow: "0 -6px 24px rgba(0, 0, 0, 0.55)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/transition/bg_port.webp"
        alt=""
        draggable={false}
        className="absolute bottom-0 left-0 w-full select-none pointer-events-none horizon-desk-bar"
        style={{ height: "1450%", objectFit: "fill" }}
      />
      <div
        className="absolute inset-0 pointer-events-none dark-mode-bg-overlay"
        aria-hidden="true"
      />
    </div>

    {/* ─── DESK DOCK NAVBAR ON BROWN BAR ─── */}
    {/* Visible starting from the About section, anchored directly on the bottom brown bar */}
    <div
      className={`absolute bottom-0 left-0 right-0 h-[8%] min-h-[64px] z-30 flex items-center justify-center pointer-events-none transition-all duration-300 ease-out ${
        selectedProject || isVideoPlaying
          ? "opacity-0 pointer-events-none translate-y-6"
          : "opacity-100 translate-y-0"
      }`}
    >
      <div className="relative w-full h-full pointer-events-none flex items-center justify-center">
        <Dock
          className="pointer-events-auto dock--frameless"
          items={dockItems}
          baseItemSize={48}
          magnification={68}
          distance={220}
          panelHeight={48}
          roundness={0.7}
          showIndicators={false}
          accentColor="#d97706"
          badgeColor="#b91c1c"
          theme="dark"
          style={{ bottom: "calc(50% - 24px)" }}
        />
      </div>
    </div>

    {/* Fullscreen Stretched PC Video Modal View */}
    <div
      className={`fixed inset-0 z-[60] w-full h-full overflow-hidden transition-opacity duration-300 ease-out ${showVideo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
    >
      <video
        ref={videoRef}
        src={pcVideoSrc}
        preload="auto"
        playsInline
        className="absolute inset-0 w-full h-full select-none render-high-quality"
        style={{ objectFit: "fill" }}
        onEnded={handleCloseVideo}
      />

      {/* Fixed 4-corner dark overlay matching hero and transition videos */}
      <div
        className="absolute inset-0 pointer-events-none video-corner-overlay"
        aria-hidden="true"
      />

      {/* Close Button */}
      <button
        type="button"
        onClick={handleCloseVideo}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl border border-white/20 cursor-pointer group"
        aria-label="Close view"
        title="Close (Esc)"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:rotate-90"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    {/* Fullscreen ScrollExpand Modal View for Clicked Project Tab */}
    <div
      data-project-expanded={selectedProject && expandProgress >= 0.95 ? "true" : undefined}
      className={`fixed inset-0 z-[70] w-full h-full overflow-hidden bg-black/75 backdrop-blur-md transition-opacity duration-300 ease-out flex flex-col items-center justify-center ${selectedProject ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      onWheel={(e) => e.stopPropagation()}
    >
      {selectedProject && (
        <>
          {/* Close Button — Hidden when project is expanded into live site */}
          <button
            type="button"
            onClick={handleCloseProject}
            className={`absolute top-5 right-5 sm:top-7 sm:right-7 z-50 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl border border-white/20 cursor-pointer group ${expandProgress >= 0.95
              ? "opacity-0 pointer-events-none scale-75"
              : "opacity-100 pointer-events-auto scale-100"
              }`}
            aria-label="Close project view"
            title="Close (Esc)"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:rotate-90"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* ScrollExpand Component — Expands the image inside the tab */}
          <div className="w-full h-full relative">
            <ScrollExpand
              ref={scrollExpandRef}
              src={selectedProject.expandSrc || "/assets/transition/ezgif-frame-106.webp"}
              alt={selectedProject.alt}
              scrollHint="Scroll to explore live site"
              startWidth={48}
              startHeight={60}
              startRadius={20}
              endRadius={0}
              mediaZoom={1.25}
              scrollDistance={1.4}
              holdDistance={0.4}
              smoothing={0.12}
              useWindowScroll={false}
              initialExpanded={initialExpandedRef.current}
              onProgress={setExpandProgress}
            />

            {/* Fully Expanded Live Interactive Iframe */}
            {selectedProject.demoUrl && (
              <div
                className={`absolute inset-0 z-20 w-full h-full transition-opacity duration-500 flex flex-col ${expandProgress >= 0.95
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
                  }`}
                onWheel={(e) => {
                  // When info tab is opened, NEVER zoom out or scroll back — only Esc or Close button
                  if (isInfoOpen) {
                    e.stopPropagation();
                    return;
                  }
                  // When user scrolls back up (deltaY < 0), zoom out the iframe back to card!
                  if (e.deltaY < -15) {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollExpandRef.current?.scrollToTop();
                  }
                }}
              >
                {/* Top Bar with Live Project Header & Direct Zoom Out Button */}
                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-neutral-950/80 backdrop-blur-md border-b border-white/10 select-none">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-semibold tracking-wider text-[#fbf6ec] font-mono uppercase">
                      {selectedProject.title}
                    </span>
                    <span className="text-xs text-[#fbf6ec]/60 font-mono hidden sm:inline">
                      &bull; {selectedProject.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Info / Dossier Button (? or i) */}
                    <button
                      type="button"
                      onClick={() => setIsInfoOpen((prev) => !prev)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-mono font-medium tracking-wide border transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${isInfoOpen
                        ? "bg-emerald-500/30 text-emerald-300 border-emerald-400/60 shadow-emerald-500/20"
                        : "bg-white/10 hover:bg-white/25 text-white/90 hover:text-white border-white/20 hover:border-white/40 shadow-white/10"
                        }`}
                      title={isInfoOpen ? "Close info & return to live site" : "View Project Overview, Features & Tech Stack"}
                    >
                      {isInfoOpen ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center font-bold text-[11px] italic font-serif">
                          i
                        </span>
                      )}
                      <span>{isInfoOpen ? "Close" : "Info"}</span>
                    </button>

                    {/* Direct External Link */}
                    <a
                      href={selectedProject.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-emerald-100 text-xs sm:text-sm font-mono font-medium tracking-wide border border-emerald-500/35 hover:border-emerald-400/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/20"
                      title="Open live site in new tab"
                    >
                      <span>Open site</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>

                    {/* Zoom Out Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isInfoOpen) {
                          setIsInfoOpen(false);
                          return;
                        }
                        scrollExpandRef.current?.scrollToTop();
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white/90 hover:text-white text-xs sm:text-sm font-mono font-medium tracking-wide border border-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-white/10 mr-2"
                      title={isInfoOpen ? "Close info & return to live site" : "Zoom out back to overview (or scroll up)"}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span>Go Back</span>
                    </button>
                  </div>
                </div>

                {/* Live Iframe with native-site-cursor enabled for the site's own cursor */}
                <div className={`relative flex-1 w-full h-full overflow-hidden ${isInfoOpen ? "hidden" : "block native-site-cursor"}`}>
                  {/* Hamster Wheel Loading Animation — only visible if loading takes > 300ms */}
                  {showLoader && isIframeLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950 pointer-events-none transition-opacity duration-300">
                      <div
                        aria-label="Orange and tan hamster running in a metal wheel"
                        role="img"
                        className="wheel-and-hamster"
                      >
                        <div className="wheel" />
                        <div className="hamster">
                          <div className="hamster__body">
                            <div className="hamster__head">
                              <div className="hamster__ear" />
                              <div className="hamster__eye" />
                              <div className="hamster__nose" />
                            </div>
                            <div className="hamster__limb hamster__limb--fr" />
                            <div className="hamster__limb hamster__limb--fl" />
                            <div className="hamster__limb hamster__limb--br" />
                            <div className="hamster__limb hamster__limb--bl" />
                            <div className="hamster__tail" />
                          </div>
                        </div>
                        <div className="spoke" />
                      </div>
                      <p
                        className="mt-6 text-xs sm:text-sm text-[#fbf6ec]/80 font-mono tracking-widest uppercase animate-pulse"
                        style={{ fontFamily: "'Special Elite', cursive" }}
                      >
                        Loading live site...
                      </p>
                    </div>
                  )}

                  <iframe
                    src={selectedProject.demoUrl}
                    title={selectedProject.title}
                    onLoad={handleIframeLoad}
                    className="w-full h-full border-none bg-neutral-900"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                  />
                </div>

                {/* Information Overlay with MagicBento Grid */}
                {isInfoOpen && (
                  <div
                    className="relative z-20 flex-1 w-full h-full overflow-y-auto bg-neutral-950/95 backdrop-blur-2xl p-4 sm:p-6 md:p-8 flex flex-col items-center"
                    onWheel={(e) => {
                      // Isolate scrolling completely inside info overlay: never bubble to zoom-out handler!
                      e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="w-full max-w-5xl my-auto py-4">
                      {/* Dossier Header */}
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10 select-none">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs uppercase tracking-wider">
                            Project Information
                          </span>

                        </div>
                        <span className="text-xs text-[#fbf6ec]/60 font-mono tracking-wide">
                          Press Esc to return
                        </span>
                      </div>

                      {/* Magic Bento Grid */}
                      <MagicBento
                        columns={4}
                        rowHeight={200}
                        gap={12}
                        radius={20}
                        enableBorderGlow={true}
                        enableSpotlight={true}
                        spotlightRadius={300}
                        clickEffect={true}
                        enableTilt={true}
                        textAutoHide={false}
                        items={getMagicBentoItems(selectedProject.title)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);
}
