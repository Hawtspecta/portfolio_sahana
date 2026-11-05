"use client";

import { useState, useEffect, useCallback } from "react";
import SplashScreen from "@/components/SplashScreen";
import HeroSection from "@/components/HeroSection";
import MetaBalls from "@/components/MetaBalls";
import AboutTransition from "@/components/AboutTransition";

export default function Home() {
  const [isLastFrame, setIsLastFrame] = useState(false);
  const [isHeroVideoCompleted, setIsHeroVideoCompleted] = useState(false);
  const [isAboutActive, setIsAboutActive] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Press 'F' to toggle browser fullscreen if desired
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // When splash reaches the end or reverses back into splash
  const handleLastFrameChange = useCallback((isLast: boolean) => {
    setIsLastFrame(isLast);
    if (!isLast) {
      setIsHeroVideoCompleted(false);
      setIsAboutActive(false);
      setTransitionProgress(0);
    }
  }, []);

  // Scroll forward from hero triggers the Lenis smooth About transition ONLY when hero has fully completed
  const handleScrollPastHero = useCallback(() => {
    if (!isHeroVideoCompleted) return;
    setIsAboutActive(true);
  }, [isHeroVideoCompleted]);

  // Scrolling backward past frame 1 of About returns to hero screen
  const handleScrollBackFromAbout = useCallback(() => {
    setIsAboutActive(false);
    setTransitionProgress(0);
  }, []);

  // Scrolling backward past frame 1 of Hero returns to Splash screen at frame 201
  const handleScrollBackToSplash = useCallback(() => {
    setIsLastFrame(false);
    setIsHeroVideoCompleted(false);
  }, []);

  // Clicking "Scroll to explore" activates the transition
  const handleScrollToExploreClick = useCallback(() => {
    if (!isHeroVideoCompleted) return;
    setIsAboutActive(true);
  }, [isHeroVideoCompleted]);

  return (
    <>
      {/* Scroll-linked image sequence splash (frames 6..201, Lenis backward scrub) */}
      <SplashScreen
        onLastFrameChange={handleLastFrameChange}
        isHeroActive={isLastFrame}
        onScrollPastHero={handleScrollPastHero}
        isAboutActive={isAboutActive}
        onScrollBackFromAbout={handleScrollBackFromAbout}
      />

      {/* Hero Canvas Section (80 frames, liquid Lenis scroll backward & forward) */}
      <HeroSection
        isActive={isLastFrame}
        isAboutActive={isAboutActive}
        onHeroComplete={() => setIsHeroVideoCompleted(true)}
        onScrollPastHero={handleScrollPastHero}
        onScrollBackToSplash={handleScrollBackToSplash}
      />

      {/* "Scroll to explore" hint — shown ONLY after hero typing is fully completed */}
      {isLastFrame && isHeroVideoCompleted && !isAboutActive && (
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

      {/* Flanking MetaBalls — active at the Hero typewriter view, smoothly fading out as About scrub begins */}
      {isLastFrame && (
        <div
          className={`fixed inset-0 z-[55] pointer-events-none transition-opacity duration-300 ease-out ${
            transitionProgress < 0.03 && (!isAboutActive || transitionProgress === 0)
              ? "opacity-100"
              : "opacity-0"
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
              paused={!isLastFrame || transitionProgress > 0.05}
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
              paused={!isLastFrame || transitionProgress > 0.05}
            />
          </div>
        </div>
      )}

      {/* Lenis Smooth Scroll-based About Transition (106 high-DPI frames, zero glitch) */}
      <AboutTransition
        isActive={isAboutActive}
        onProgressChange={setTransitionProgress}
        onScrollBackToHero={handleScrollBackFromAbout}
      />
    </>
  );
}
