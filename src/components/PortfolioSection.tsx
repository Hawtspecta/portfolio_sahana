"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TextType from "@/components/TextType";
import LetterGlitch from "@/components/LetterGlitch";

interface PortfolioSectionProps {
  isActive: boolean;
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

export default function PortfolioSection({ isActive }: PortfolioSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [entered, setEntered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const hitRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const enteredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth entry animation — delay setEntered(true) so shadow fades in
  useEffect(() => {
    if (enteredTimerRef.current) {
      clearTimeout(enteredTimerRef.current);
      enteredTimerRef.current = null;
    }
    if (isActive) {
      enteredTimerRef.current = setTimeout(() => setEntered(true), 50);
    }
    return () => {
      if (enteredTimerRef.current) {
        clearTimeout(enteredTimerRef.current);
        enteredTimerRef.current = null;
      }
    };
  }, [isActive]);

  // Derive active states based on isActive
  const showEntered = isActive && entered;
  const showVideo = isActive && isVideoPlaying;

  const handleCloseVideo = useCallback(() => {
    setIsVideoPlaying(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }, 300);
  }, []);

  const handlePcClick = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { });
      }
    }
    setIsVideoPlaying(true);
  }, []);

  // Allow Escape key to close the video view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showVideo) {
        handleCloseVideo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showVideo, handleCloseVideo]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hitRef.current) return;
      const rect = hitRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    },
    []
  );

  if (!isActive) return null;

  // 3D tilt based on mouse position over the PC hit area
  const tiltX = isHovered && !showVideo ? (mousePos.y - 0.5) * -6 : 0;
  const tiltY = isHovered && !showVideo ? (mousePos.x - 0.5) * 6 : 0;

  return (
      <div
        className="fixed inset-0 z-[51] w-full h-full overflow-hidden select-none"
        onWheel={(e) => {
          if (showVideo) e.stopPropagation();
        }}
      >
        {/* Background - bg_port.png stretched to fill viewport */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/transition/bg_port.png"
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none"
          style={{ objectFit: "fill" }}
        />

        {/* LetterGlitch effect layered on top of bg_port with crisp black & green glyphs */}
        {/* Extends all the way down to the brown floor border (top 92%) with a tight cutout around the text */}
        <div
          className="absolute top-0 left-0 right-0 h-[92%] pointer-events-none opacity-60 overflow-hidden"
          style={{
            maskImage:
              "radial-gradient(ellipse 19vw 22% at 73% 41%, transparent 40%, black 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 19vw 22% at 73% 41%, transparent 40%, black 80%)",
          }}
        >
          <LetterGlitch
            glitchColors={['#000000', '#059669', '#10b981']}
            baseColor="#000000"
            glitchAmount={0.26}
            speed={1}
            flow={0.5}
            clickEffect="tear"
            density={0.89}
            dpr={1.2}
          />
        </div>

        {/* PC image - stretched to fill viewport for pixel-perfect match with frame 106 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/transition/pc.png"
          alt="Retro PC - Sahana Nayak Portfolio"
          draggable={false}
          className={`absolute inset-0 select-none pointer-events-none ${!isHovered && showEntered && !showVideo ? "animate-pc-float" : ""
            }`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            // Transform origin at the center of the PC content
            transformOrigin: `${PC_LEFT + PC_WIDTH / 2}% ${PC_TOP + PC_HEIGHT / 2}%`,
            transform:
              isHovered && !showVideo
                ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`
                : "none",
            transition: isHovered
              ? "transform 0.12s ease-out, filter 0.25s ease-out"
              : "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s ease-out",
            filter:
              isHovered && !showVideo
                ? "drop-shadow(0 30px 45px rgba(0,0,0,0.35)) drop-shadow(0 12px 18px rgba(0,0,0,0.22))"
                : showEntered
                  ? "drop-shadow(0 16px 28px rgba(0,0,0,0.18)) drop-shadow(0 6px 10px rgba(0,0,0,0.1))"
                  : "drop-shadow(0 0 0 rgba(0,0,0,0))",
          }}
        />

        {/* Invisible interactive hit area covering only the PC bounding box */}
        {!showVideo && (
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
            title="Click to interact"
            aria-label="Click to interact with PC"
          />
        )}

        {/* About Me Text Animation on the right of PC */}
        <div
          className={`absolute right-[5vw] lg:right-[7vw] top-[14%] sm:top-[16%] lg:top-[38%] lg:-translate-y-1/2 w-[42vw] min-w-[290px] max-w-[560px] pointer-events-auto transition-all duration-700 ease-out ${showEntered && !showVideo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
            }`}
        >
          {/* Heading: About Me */}
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-normal text-neutral-900 mb-5 sm:mb-6"
            style={{ fontFamily: "'Special Elite', cursive" }}
          >
            About Me
          </h2>

          {/* Typewriter Text Animation */}
          <div className="relative min-h-[5em] sm:min-h-[5.5em] lg:min-h-[6.5em]">
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
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed sm:leading-relaxed text-neutral-900"
              style={{ fontFamily: "'Special Elite', cursive" }}
            />
          </div>
        </div>

        {/* Fullscreen Stretched PC Video Modal View (Always mounted & preloaded for zero-blink instant playback) */}
        <div
          className={`fixed inset-0 z-[60] w-full h-full overflow-hidden transition-opacity duration-300 ease-out ${showVideo ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
        >
          {/* Stretched 4K video covering full viewport */}
          <video
            ref={videoRef}
            src="/assets/transition/pc_click.mp4"
            preload="auto"
            playsInline
            className="absolute inset-0 w-full h-full select-none"
            style={{ objectFit: "fill" }}
            onEnded={handleCloseVideo}
          />

          {/* Close (Cross) Button */}
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
      </div>
      );
}
