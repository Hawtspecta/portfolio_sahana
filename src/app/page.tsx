"use client";

import { useState, useEffect, useCallback } from "react";
import SplashScreen from "@/components/SplashScreen";
import HeroSection, { FastForwardHandoff } from "@/components/HeroSection";
import MetaBalls from "@/components/MetaBalls";
import AboutTransition from "@/components/AboutTransition";
import PortfolioSection from "@/components/PortfolioSection";
import SideScrollBar from "@/components/SideScrollBar";
import RocketBoostSkip from "@/components/RocketBoostSkip";
import { initGlobalLenis, useLenis } from "@/lib/lenis";

export default function Home() {
  const [isLastFrame, setIsLastFrame] = useState(false);
  const [isAboutActive, setIsAboutActive] = useState(false);
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

  const lenis = useLenis();

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

  // Fast-forward on Hero directly continues through About Transition to Portfolio (no in-between stop!)
  const handleHeroFastForwardComplete = useCallback((handoff?: FastForwardHandoff) => {
    setTargetAboutProgress(null);
    setTargetHeroProgress(null);
    setHeroFastForwardTrigger(0);
    if (handoff) {
      setFastForwardHandoff(handoff);
    }
    setIsAboutActive(true);
    setTransitionFastForwardTrigger(Date.now());
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
    setTransitionProgress(0);
    setTargetAboutProgress(null);
    setTargetHeroProgress(null);
    setHeroFastForwardTrigger(0);
    setTransitionFastForwardTrigger(0);
    setFastForwardHandoff(null);
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
  // - On splash screen: tracks splash sequence from 0 to 1
  // - Once splash screen completes: tracks site journey (Hero + About) from 0 to 1 (no space reserved for splash!)
  const overallProgress = isLastFrame
    ? isAboutActive
      ? 0.5 + transitionProgress * 0.5
      : heroProgress * 0.5
    : splashProgress;

  // Smoothly scrub via the edge scrollbar:
  const handleScrollToProgress = useCallback((targetProgress: number) => {
    if (!isLastFrame) {
      // While on splash screen, scrub splash screen directly (0 to 1)
      setTargetSplashProgress(targetProgress);
    } else {
      // Once splash screen has completed, scrub Hero (0 to 0.5) and About transition (0.5 to 1.0)
      // Splash screen is never brought back and takes no space!
      if (targetProgress < 0.5) {
        const hp = targetProgress / 0.5;
        setTargetHeroProgress(hp);
        setTargetAboutProgress(null);
        setIsAboutActive((prev) => {
          if (prev) {
            setTransitionProgress(0);
            return false;
          }
          return prev;
        });
      } else {
        const ap = (targetProgress - 0.5) / 0.5;
        setTargetAboutProgress(ap);
        setTargetHeroProgress(null);
        setIsAboutActive((prev) => (!prev ? true : prev));
      }
    }
  }, [isLastFrame]);

  // Step-by-step skip handler with Rocket Boost speed streaks:
  // Splash Screen -> About (Hero) -> Transition -> Portfolio (Retro PC)
  const handleUniversalSkip = useCallback(() => {
    if (!isLastFrame) {
      // 1. On Splash Screen -> Fast-forward all splash frames sequentially at rocket speed
      setSplashFastForwardTrigger(Date.now());
    } else if (!isAboutActive) {
      // 2. On About (Hero) -> Fast-forward all 119 hero typewriter frames sequentially at rocket speed
      setHeroFastForwardTrigger(Date.now());
    } else if (transitionProgress < 0.98) {
      // 3. On Transition -> Fast-forward all 106 transition frames sequentially at rocket speed
      setFastForwardHandoff(null);
      setTransitionFastForwardTrigger(Date.now());
    }
  }, [isLastFrame, isAboutActive, transitionProgress]);

  // Skip button persists starting from splash screen until the last frame of transition (never disappears before portfolio, hidden on loading screen)
  const isSkipButtonVisible = isSplashReady && (!isAboutActive || transitionProgress < 0.98);

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
        isAboutActive={isAboutActive}
        onHeroComplete={handleHeroComplete}
        onScrollPastHero={handleScrollPastHero}
        onFastForwardComplete={handleHeroFastForwardComplete}
        onProgressChange={handleHeroProgressChange}
        targetProgress={targetHeroProgress}
        fastForwardTrigger={heroFastForwardTrigger}
      />

      {/* "Scroll to explore" hint — visible throughout from Hero until the portfolio section (retro PC) */}
      {isLastFrame && (!isAboutActive || transitionProgress < 0.98) && (
        <div
          onClick={handleScrollToExploreClick}
          className="fixed bottom-9 left-1/2 -translate-x-1/2 z-[56] animate-bounce pointer-events-auto cursor-pointer select-none transition-all duration-300 ease-out"
        >
          <div className="flex flex-col items-center gap-1.5 text-neutral-900 hover:text-black transition-all hover:scale-105 active:scale-95 drop-shadow-sm">
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

      {/* Flanking MetaBalls — active at the Hero typewriter view, collapse/burst during About transition */}
      {isLastFrame && (
        <div
          className={`fixed inset-0 z-[55] pointer-events-none transition-opacity duration-700 ease-in-out ${transitionProgress > 70 / 105 ? "hidden" : ""
            }`}
        >
          {/* Left MetaBalls — 2 blobs, expansive contour rings */}
          <div className="absolute left-[5vw] sm:left-[7vw] lg:left-[8.5vw] top-[11%] sm:top-[13%] md:top-[14%] w-[18vw] min-w-[140px] max-w-[250px] h-[360px] max-h-[46vh] pointer-events-auto">
            <MetaBalls
              color="#000000"
              cursorBallColor="#000000"
              variant="contour"
              motion="lava"
              ballCount={2}
              seed={19}
              speed={0.22}
              animationSize={24}
              cursorBallSize={1.8}
              clumpFactor={0.7}
              gooeyness={0.45}
              stretch={0.4}
              wobble={0.6}
              enableTransparency
              lineWidth={1.2}
              rings={6}
              spacing={0.56}
              paused={!isLastFrame || transitionProgress > 70 / 105}
              collapseProgress={isAboutActive ? Math.min(1, transitionProgress / (70 / 105)) : 0}
              dpr={1.2}
            />
          </div>

          {/* Right MetaBalls — 3 blobs, expansive contour rings */}
          <div className="absolute right-[5vw] sm:right-[7vw] lg:right-[8.5vw] top-[15%] sm:top-[17%] md:top-[18%] w-[18vw] min-w-[140px] max-w-[250px] h-[360px] max-h-[46vh] pointer-events-auto">
            <MetaBalls
              color="#000000"
              cursorBallColor="#000000"
              variant="contour"
              motion="lava"
              ballCount={3}
              seed={83}
              speed={0.31}
              animationSize={26}
              cursorBallSize={2.0}
              clumpFactor={0.75}
              gooeyness={0.55}
              stretch={0.6}
              wobble={0.4}
              enableTransparency
              lineWidth={1.3}
              rings={6}
              spacing={0.58}
              paused={!isLastFrame || transitionProgress > 70 / 105}
              collapseProgress={isAboutActive ? Math.min(1, transitionProgress / (70 / 105)) : 0}
              dpr={1.2}
            />
          </div>
        </div>
      )}

      {/* Lenis Smooth Scroll-based About Transition (106 high-DPI frames, zero glitch) */}
      <AboutTransition
        lenis={lenis}
        isActive={isAboutActive}
        onProgressChange={handleProgressChange}
        onScrollBackToHero={handleScrollBackFromAbout}
        targetProgress={targetAboutProgress}
        fastForwardTrigger={transitionFastForwardTrigger}
        handoff={fastForwardHandoff}
      />

      {/* Portfolio section — bg_port background + interactive PC overlay after transition completes */}
      <PortfolioSection isActive={isAboutActive && transitionProgress >= 0.98} />

      {/* Beautiful Native-Style Edge Scrollbar — active across entire journey including Splash Screen */}
      <SideScrollBar
        progress={overallProgress}
        isVisible={isSplashReady}
        onScrollToProgress={handleScrollToProgress}
      />
    </>
  );
}
