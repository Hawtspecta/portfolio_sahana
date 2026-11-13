"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import SplashScreen from "@/components/SplashScreen";
import HeroSection, { FastForwardHandoff } from "@/components/HeroSection";
import AboutTransition from "@/components/AboutTransition";
import PortfolioSection from "@/components/PortfolioSection";
import { MAX_PROGRESS as EXPERIENCE_SECTION_MAX_PROGRESS } from "@/components/ExperienceSection";
import SideScrollBar from "@/components/SideScrollBar";
import RocketBoostSkip from "@/components/RocketBoostSkip";
import LampToggle from "@/components/LampToggle";
import { initGlobalLenis, useLenis } from "@/lib/lenis";

export default function Home() {
  const [isLastFrame, setIsLastFrame] = useState(false);
  const [isAboutActive, setIsAboutActive] = useState(false);
  const [isPortfolioActive, setIsPortfolioActive] = useState(false);
  const [portfolioScrollProgress, setPortfolioScrollProgress] = useState(0);
  const [targetPortfolioProgress, setTargetPortfolioProgress] = useState<number | null>(null);
  const [experienceProgress, setExperienceProgress] = useState(0);
  const [targetExperienceProgress, setTargetExperienceProgress] = useState<number | null>(null);
  const [splashProgress, setSplashProgress] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [targetSplashProgress, setTargetSplashProgress] = useState<number | null>(null);
  const [targetHeroProgress, setTargetHeroProgress] = useState<number | null>(null);
  const [targetAboutProgress, setTargetAboutProgress] = useState<number | null>(null);

  const [splashFastForwardTrigger, setSplashFastForwardTrigger] = useState(0);
  const [heroFastForwardTrigger, setHeroFastForwardTrigger] = useState(0);
  const [transitionFastForwardTrigger, setTransitionFastForwardTrigger] = useState(0);
  const [fastForwardHandoff, setFastForwardHandoff] = useState<FastForwardHandoff | null>(null);
  const [isSplashReady, setIsSplashReady] = useState(false);
  const [isProjectLiveExpanded, setIsProjectLiveExpanded] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const hasRestoredRef = useRef(false);

  const lenis = useLenis();

  // Initialize theme from DOM attribute or storage on mount (default: light)
  useEffect(() => {
    const current =
      (localStorage.getItem("portfolio-theme") as "dark" | "light") ||
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
      "light";
    setTheme(current);
    document.documentElement.setAttribute("data-theme", current);
    if (current === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Intercept hard refresh shortcuts (Ctrl+Shift+R, Ctrl+F5, Shift+F5) so Edge/Chrome starts fresh from the hamster
  useEffect(() => {
    const handleHardRefreshKeys = (e: KeyboardEvent) => {
      const isCtrlShiftR =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "r" || e.key === "R" || e.code === "KeyR");
      const isHardF5 = e.key === "F5" && (e.ctrlKey || e.shiftKey);

      if (isCtrlShiftR || isHardF5) {
        try {
          (window as unknown as { __skipSessionPersist?: boolean }).__skipSessionPersist = true;
          sessionStorage.removeItem("portfolio_saved_state");
          sessionStorage.removeItem("portfolio_session_initialized");
          localStorage.removeItem("portfolio_saved_state");
        } catch { }
      }
    };

    window.addEventListener("keydown", handleHardRefreshKeys, true);
    document.addEventListener("keydown", handleHardRefreshKeys, true);
    return () => {
      window.removeEventListener("keydown", handleHardRefreshKeys, true);
      document.removeEventListener("keydown", handleHardRefreshKeys, true);
    };
  }, []);

  // Restore screen and section state across normal in-tab reloads (except fresh visits or hard reload)
  useEffect(() => {
    try {
      localStorage.removeItem("portfolio_saved_state");

      let isReload = false;
      const navEntries = performance.getEntriesByType("navigation");
      if (navEntries.length > 0) {
        isReload = (navEntries[0] as PerformanceNavigationTiming).type === "reload";
      } else if (typeof performance !== "undefined" && (performance as { navigation?: { type?: number } }).navigation) {
        isReload = (performance as { navigation?: { type?: number } }).navigation?.type === 1;
      }

      const sessionInitialized = sessionStorage.getItem("portfolio_session_initialized");

      if (!isReload || !sessionInitialized) {
        sessionStorage.removeItem("portfolio_saved_state");
        sessionStorage.setItem("portfolio_session_initialized", "true");
        hasRestoredRef.current = true;
        return;
      }

      const raw = sessionStorage.getItem("portfolio_saved_state");
      if (!raw) {
        hasRestoredRef.current = true;
        return;
      }

      const saved = JSON.parse(raw);
      if (!saved || !saved.section) {
        hasRestoredRef.current = true;
        return;
      }

      hasRestoredRef.current = true;
      if (saved.section === "services") {
        setIsLastFrame(true);
        setIsAboutActive(true);
        setIsPortfolioActive(true);
        setIsSplashReady(true);
        setTransitionProgress(1);
        setTargetAboutProgress(1);
        setTargetSplashProgress(1);
        setPortfolioScrollProgress(2);
        setTargetPortfolioProgress(2);
      } else if (
        saved.section === "projects" ||
        saved.section === "expanded_project" ||
        saved.expandedProjectTitle
      ) {
        setIsLastFrame(true);
        setIsAboutActive(true);
        setIsPortfolioActive(true);
        setIsSplashReady(true);
        setTransitionProgress(1);
        setTargetAboutProgress(1);
        setTargetSplashProgress(1);
        setPortfolioScrollProgress(1);
        setTargetPortfolioProgress(1);
        if (saved.expandedProjectTitle || saved.section === "expanded_project") {
          setIsProjectLiveExpanded(true);
        }
      } else if (saved.section === "about") {
        setIsLastFrame(true);
        setIsAboutActive(true);
        setIsPortfolioActive(true);
        setIsSplashReady(true);
        setTransitionProgress(1);
        setTargetAboutProgress(1);
        setTargetSplashProgress(1);
        setPortfolioScrollProgress(0);
        setTargetPortfolioProgress(0);
      } else if (saved.section === "transition") {
        setIsLastFrame(true);
        setIsAboutActive(true);
        setIsPortfolioActive(false);
        setIsSplashReady(true);
        setTargetSplashProgress(1);
        const tp = saved.transitionProgress ?? 0.5;
        setTransitionProgress(tp);
        setTargetAboutProgress(tp);
        setPortfolioScrollProgress(0);
        setTargetPortfolioProgress(0);
      } else if (saved.section === "hero") {
        setIsLastFrame(true);
        setIsAboutActive(false);
        setIsPortfolioActive(false);
        setIsSplashReady(true);
        setTargetSplashProgress(1);
        const hp = saved.heroProgress ?? 0.5;
        setHeroProgress(hp);
        setTargetHeroProgress(hp);
        setTransitionProgress(0);
        setPortfolioScrollProgress(0);
      }
    } catch {
      // Ignore corrupted storage
    } finally {
      hasRestoredRef.current = true;
    }
  }, []);

  // Persist current screen and progress state to survive reloads (throttled so 60fps scroll/skip never stutters)
  useEffect(() => {
    // Only save after initial state restoration has completed
    if (!hasRestoredRef.current) return;
    if ((window as unknown as { __skipSessionPersist?: boolean }).__skipSessionPersist) return;

    const timer = setTimeout(() => {
      if ((window as unknown as { __skipSessionPersist?: boolean }).__skipSessionPersist) return;
      try {
        const existingRaw = sessionStorage.getItem("portfolio_saved_state");
        const existing = existingRaw ? JSON.parse(existingRaw) : {};

        const currentSection = !isLastFrame
          ? "splash"
          : !isAboutActive
            ? "hero"
            : transitionProgress < 0.98
              ? "transition"
              : isProjectLiveExpanded
                ? "expanded_project"
                : portfolioScrollProgress >= 1.5
                  ? "services"
                  : portfolioScrollProgress >= 0.5
                    ? "projects"
                    : "about";

        const stateToSave = {
          ...existing,
          section: currentSection,
          isLastFrame,
          isAboutActive,
          heroProgress,
          transitionProgress,
          portfolioScrollProgress,
          splashProgress,
          timestamp: Date.now(),
        };
        sessionStorage.setItem("portfolio_saved_state", JSON.stringify(stateToSave));
      } catch {
        // Storage unavailable or quota exceeded
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [
    isLastFrame,
    isAboutActive,
    isProjectLiveExpanded,
    transitionProgress,
    portfolioScrollProgress,
    heroProgress,
    splashProgress,
  ]);

  // Set manual scroll restoration to prevent browser from auto-scrolling on updates
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // ─── Unified Global Lenis Engine Lifecycle ─────────────────────────
  useEffect(() => {
    return initGlobalLenis();
  }, []);

  // Press 'F' to toggle browser fullscreen if desired
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        } else {
          document.exitFullscreen().catch(() => { });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Splash screen completion / reversible state handler
  const handleLastFrameChange = useCallback((isLast: boolean) => {
    setIsLastFrame(isLast);
  }, []);

  const handleHeroComplete = useCallback(() => {
    // Hero typewriter video complete
  }, []);

  // Fast-forward on Hero lands cleanly at the start of About Transition (step-by-step, matching SplashScreen pattern)
  const handleHeroFastForwardComplete = useCallback(() => {
    setTargetAboutProgress(0);
    setTargetHeroProgress(null);
    setHeroFastForwardTrigger(0);
    setFastForwardHandoff(null);
    setIsAboutActive(true);
  }, []);

  // Scroll forward from hero triggers the Lenis smooth About transition
  const handleScrollPastHero = useCallback(() => {
    setTargetAboutProgress(null);
    setTargetHeroProgress(null);
    setHeroFastForwardTrigger(0);
    setFastForwardHandoff(null);
    setIsAboutActive(true);
  }, []);

  // Scrolling backward past frame 0 of About returns to hero screen (painted at frame 118)
  const handleScrollBackFromAbout = useCallback(() => {
    setIsAboutActive(false);
    setIsPortfolioActive(false);
    setPortfolioScrollProgress(0);
    setTargetPortfolioProgress(null);
    setTransitionProgress(0);
    setTargetAboutProgress(null);
    setHeroFastForwardTrigger(0);
    setTargetHeroProgress(null);
    setTransitionFastForwardTrigger(0);
    setFastForwardHandoff(null);
  }, []);

  // Scrolling backward past About section smoothly returns to the transition frames
  const handleScrollBackFromPortfolio = useCallback(() => {
    setIsPortfolioActive(false);
    setPortfolioScrollProgress(0);
    setTargetPortfolioProgress(null);
    setTransitionProgress(1);
    setTargetAboutProgress(null);
  }, []);

  // Dedicated navigation to jump directly back to Hero section 1st frame (frame 0)
  const handleScrollToHeroStart = useCallback(() => {
    setIsAboutActive(false);
    setIsPortfolioActive(false);
    setHeroProgress(0);
    setTargetHeroProgress(0);
    setTransitionProgress(0);
    setTargetAboutProgress(null);
    setPortfolioScrollProgress(0);
    setTargetPortfolioProgress(null);
  }, []);

  const handlePortfolioProgressChange = useCallback((prog: number) => {
    setPortfolioScrollProgress(prog);
    setTargetPortfolioProgress(null);
  }, []);

  const handleExperienceProgressChange = useCallback((prog: number) => {
    setExperienceProgress(prog);
    setTargetExperienceProgress(null);
  }, []);

  // Splash progress handler
  const handleSplashProgressChange = useCallback((progress: number) => {
    setSplashProgress(progress);
    setTargetSplashProgress(null);
  }, []);

  // Transition progress handler
  const handleProgressChange = useCallback((progress: number) => {
    setTransitionProgress(progress);
    setTargetAboutProgress(null);
  }, []);

  // Dedicated landing callback: only activates PortfolioSection when forward approach actually completes
  const handleAboutLandingComplete = useCallback(() => {
    setPortfolioScrollProgress(0);
    setTargetPortfolioProgress(0);
    setIsPortfolioActive(true);
  }, []);

  // Hero progress handler
  const handleHeroProgressChange = useCallback((progress: number) => {
    setHeroProgress(progress);
    setTargetHeroProgress(null);
  }, []);

  // Clicking "Scroll to explore" advances hero typing, transitions to about, or advances transition
  const handleScrollToExploreClick = useCallback(() => {
    if (!isAboutActive) {
      if (heroProgress < 0.98) {
        setTargetHeroProgress((prev) => {
          const current = prev ?? heroProgress;
          return Math.min(1, current + 0.15);
        });
      } else {
        setTargetAboutProgress(null);
        setIsAboutActive(true);
      }
    } else {
      setTargetAboutProgress((prev) => {
        const current = prev ?? transitionProgress;
        return Math.min(1, current + 0.25);
      });
    }
  }, [isAboutActive, heroProgress, transitionProgress]);

  // Calculate overall scrollytelling progress for the side scrollbar (0 to 1):
  // - Hidden on Splash, Hero, and About Transition; active only from About Me onward
  //   Portfolio (PC -> MY CREATIONS.EXE): 0.00 -> 0.20
  //   WhatWeShip (Experience -> Leadership -> Achievements -> Skills -> Certifications -> Education): 0.20 -> 1.00
  const overallProgress = !(isLastFrame && isAboutActive && isPortfolioActive)
    ? 0
    : portfolioScrollProgress >= 2
      ? 0.20 + (Math.min(EXPERIENCE_SECTION_MAX_PROGRESS, Math.max(0, experienceProgress)) / EXPERIENCE_SECTION_MAX_PROGRESS) * 0.80
      : (Math.min(2, Math.max(0, portfolioScrollProgress)) / 2) * 0.20;

  // Smoothly scrub via the edge scrollbar across Portfolio & WhatWeShip (never back above About Me):
  const handleScrollToProgress = useCallback((targetProgress: number) => {
    if (!isLastFrame || !isAboutActive || !isPortfolioActive) return;

    const clamped = Math.min(1, Math.max(0, targetProgress));
    if (clamped < 0.20) {
      // Portfolio Section (PC -> MY CREATIONS.EXE)
      const pp = Math.min(1.99, Math.max(0, (clamped / 0.20) * 2));
      setPortfolioScrollProgress(pp);
      setTargetPortfolioProgress(pp);
      setExperienceProgress(0);
      setTargetExperienceProgress(0);
    } else {
      // ExperienceSection (Experience -> Education)
      const wp = Math.min(
        EXPERIENCE_SECTION_MAX_PROGRESS,
        Math.max(0, ((clamped - 0.20) / 0.80) * EXPERIENCE_SECTION_MAX_PROGRESS)
      );
      setPortfolioScrollProgress(2);
      setTargetPortfolioProgress(2);
      setExperienceProgress(wp);
      setTargetExperienceProgress(wp);
    }
  }, [isLastFrame, isAboutActive, isPortfolioActive]);

  // Step-by-step skip handler with Rocket Boost speed streaks:
  // Splash Screen -> Hero -> Transition (Retro PC About section)
  const handleUniversalSkip = useCallback(() => {
    if (!isLastFrame) {
      setSplashFastForwardTrigger(Date.now());
    } else if (!isAboutActive) {
      setHeroFastForwardTrigger(Date.now());
    } else if (!isPortfolioActive) {
      setFastForwardHandoff(null);
      setPortfolioScrollProgress(0);
      setTargetPortfolioProgress(0);
      setTransitionFastForwardTrigger(Date.now());
    }
  }, [isLastFrame, isAboutActive, isPortfolioActive]);

  // Skip button persists through splash screen, hero, and transition (including the last transition frame).
  // It only appears once the splash screen is ready (not on the loading screen).
  // It is hidden on the About section, Portfolio/Creations section, and when a project is expanded.
  const isSkipButtonVisible =
    isSplashReady &&
    !isPortfolioActive &&
    !isProjectLiveExpanded;

  return (
    <>
      {/* Persistent Rocket Fast-Forward Skip Button */}
      <RocketBoostSkip
        isVisible={isSkipButtonVisible}
        onSkip={handleUniversalSkip}
      />
      {/* Scroll-linked image sequence splash (visible only once, frames 6..201) */}
      <SplashScreen
        lenis={lenis}
        onLastFrameChange={handleLastFrameChange}
        isHeroActive={isLastFrame}
        isAboutActive={isAboutActive}
        onProgressChange={handleSplashProgressChange}
        targetProgress={targetSplashProgress}
        fastForwardTrigger={splashFastForwardTrigger}
        onReady={() => setIsSplashReady(true)}
      />

      {/* Hero Canvas Section (119 frames, liquid Lenis scroll. Frame 0 connects back to Splash) */}
      <HeroSection
        lenis={lenis}
        isActive={isLastFrame}
        canPreload={isSplashReady}
        isAboutActive={isAboutActive}
        onHeroComplete={handleHeroComplete}
        onScrollPastHero={handleScrollPastHero}
        onFastForwardComplete={handleHeroFastForwardComplete}
        onProgressChange={handleHeroProgressChange}
        targetProgress={targetHeroProgress}
        fastForwardTrigger={heroFastForwardTrigger}
      />

      {/* "Scroll to explore" hint — visible on Hero before user transitions to retro PC */}
      {isLastFrame && !isAboutActive && heroProgress < 0.98 && (
        <div
          onClick={handleScrollToExploreClick}
          className="fixed bottom-9 left-1/2 -translate-x-1/2 z-[56] animate-bounce pointer-events-auto cursor-pointer select-none transition-all duration-300 ease-out"
        >
          <div className="flex flex-col items-center gap-1.5 text-neutral-900 hover:text-black transition-all hover:scale-105 active:scale-95 drop-shadow-sm hero-explore-hint">
            <span className="text-sm sm:text-base font-bold font-mono tracking-widest uppercase">
              Scroll to explore
            </span>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Lenis Smooth Scroll-based About Transition (106 high-DPI frames, zero glitch) */}
      <AboutTransition
        lenis={lenis}
        isActive={isAboutActive}
        canPreload={isLastFrame}
        isPortfolioActive={isAboutActive && isPortfolioActive}
        portfolioScrollPos={portfolioScrollProgress}
        onProgressChange={handleProgressChange}
        onLandingComplete={handleAboutLandingComplete}
        onScrollBackToHero={handleScrollBackFromAbout}
        targetProgress={targetAboutProgress}
        fastForwardTrigger={transitionFastForwardTrigger}
        handoff={fastForwardHandoff}
      />

      {/* Portfolio section — mounted when Transition begins so no heavy DOM mounting interrupts the approach to About Me */}
      {(isAboutActive || isPortfolioActive) && (
        <PortfolioSection
          isActive={isAboutActive && isPortfolioActive}
          externalScrollProgress={targetPortfolioProgress}
          onPortfolioProgressChange={handlePortfolioProgressChange}
          externalExperienceProgress={targetExperienceProgress}
          onExperienceProgressChange={handleExperienceProgressChange}
          onScrollBackToTransition={handleScrollBackFromPortfolio}
          onScrollToHeroStart={handleScrollToHeroStart}
          onExpandedStateChange={setIsProjectLiveExpanded}
        />
      )}

      {/* Interactive Pull-String Lamp Theme Toggle — visible once About Me / Portfolio section is active */}
      {isLastFrame && isAboutActive && isPortfolioActive && (
        <LampToggle
          defaultTheme="light"
          onThemeChange={setTheme}
          className={`right-12 sm:right-20 md:right-24 transition-opacity duration-500 ${isProjectLiveExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        />
      )}

      {/* Beautiful Native-Style Edge Scrollbar — visible only from About Me onward and hidden during live site expansion */}
      <SideScrollBar
        progress={overallProgress}
        isVisible={isLastFrame && isAboutActive && isPortfolioActive && !isProjectLiveExpanded}
        onScrollToProgress={handleScrollToProgress}
      />
    </>
  );
}
