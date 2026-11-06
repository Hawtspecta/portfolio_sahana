"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import TextType, { CharacterProgress, TextLineRect } from "@/components/TextType";
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
  const [prevActive, setPrevActive] = useState(isActive);
  const [wobbleKey, setWobbleKey] = useState(0);

  // Dynamic text measurement with exact line rects for prominent, letter-by-letter glitch space creation
  const headingRef = useRef<HTMLHeadingElement>(null);
  const typewriterBoxRef = useRef<HTMLDivElement>(null);
  const [headingRects, setHeadingRects] = useState<TextLineRect[]>([]);
  const [typewriterRects, setTypewriterRects] = useState<TextLineRect[]>([]);

  const updateHeadingBounds = useCallback(() => {
    if (headingRef.current) {
      const clientRects = headingRef.current.getClientRects();
      const rects = Array.from(clientRects)
        .map((r) => ({
          x: Math.round(r.left),
          y: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        }))
        .filter((r) => r.width > 0 && r.height > 0);
      if (rects.length > 0) {
        setHeadingRects(rects);
      }
    }
  }, []);

  useEffect(() => {
    updateHeadingBounds();
    window.addEventListener("resize", updateHeadingBounds);
    return () => window.removeEventListener("resize", updateHeadingBounds);
  }, [updateHeadingBounds]);

  useEffect(() => {
    if (entered) {
      updateHeadingBounds();
    }
  }, [entered, updateHeadingBounds]);

  const handleCharacterProgress = useCallback(
    (info: CharacterProgress) => {
      setTypewriterRects(info.lineRects);
      if (headingRects.length === 0) {
        updateHeadingBounds();
      }
    },
    [headingRects.length, updateHeadingBounds]
  );

  // Restart starting wobble and reset section states whenever active state changes
  if (isActive !== prevActive) {
    setPrevActive(isActive);
    if (isActive) {
      setWobbleKey((k) => k + 1);
    } else {
      setEntered(false);
      setIsHovered(false);
      setIsVideoPlaying(false);
    }
  }

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
      enteredTimerRef.current = setTimeout(() => setEntered(true), 30);
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

  // Dynamic SVG mask: prominent fixed-padding cutout that expands/contracts letter-by-letter
  const dynamicMaskStyle = useMemo(() => {
    if (typeof window === "undefined" || headingRects.length === 0) {
      return {
        maskImage:
          "radial-gradient(ellipse 20vw 23% at 73% 49%, transparent 40%, black 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 20vw 23% at 73% 49%, transparent 40%, black 80%)",
      };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Fixed prominent padding:
    // - Top padding: exact 8px as verified
    // - Bottom padding: generous 38px on typewriter lines so descenders (g, y, p, q) and underscore cursor NEVER touch the glitch background
    // - Heading bottom padding: 28px to seamlessly bridge into the typewriter container
    // - Left: 16px, Right: 26px to provide a comfortable margin around text and cursor glide
    const PAD_LEFT = 16;
    const PAD_RIGHT = 26;
    const PAD_TOP = 8;
    const PAD_BOTTOM_HEADING = 28;
    const PAD_BOTTOM_TYPE = 38;

    // Heading cutouts (one rect per line of heading)
    const headingCutouts = headingRects
      .map((r) => {
        const x = r.x - PAD_LEFT;
        const y = r.y - PAD_TOP;
        const w = r.width + PAD_LEFT + PAD_RIGHT;
        const h = r.height + PAD_TOP + PAD_BOTTOM_HEADING;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="black" filter="url(#f)"/>`;
      })
      .join("");

    // Typewriter cutouts (one rect per line of typed text - grows letter by letter!)
    const typewriterCutouts = typewriterRects
      .map((r) => {
        const x = r.x - PAD_LEFT;
        const y = r.y - PAD_TOP;
        const w = r.width + PAD_LEFT + PAD_RIGHT;
        const h = r.height + PAD_TOP + PAD_BOTTOM_TYPE;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="black" filter="url(#f)"/>`;
      })
      .join("");

    // Razor-sharp 2px feather for anti-aliasing while keeping the text cutout prominent and crisp
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}"><defs><filter id="f" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter><mask id="m"><rect width="100%" height="100%" fill="white"/>${headingCutouts}${typewriterCutouts}</mask></defs><rect width="100%" height="100%" fill="black" mask="url(#m)"/></svg>`;

    const dataUri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

    return {
      maskImage: dataUri,
      WebkitMaskImage: dataUri,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
    };
  }, [headingRects, typewriterRects]);

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
      {/* Background - bg_port.webp stretched to fill viewport */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/transition/bg_port.webp"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none pointer-events-none"
        style={{ objectFit: "fill" }}
      />

      {/* LetterGlitch effect layered on top of bg_port with crisp black & green glyphs */}
      {/* Extends all the way down to the brown floor border (top 92%) with a dynamic cutout that grows/shrinks letter-by-letter */}
      <div
        className="absolute top-0 left-0 right-0 h-[92%] pointer-events-none opacity-60 overflow-hidden"
        style={dynamicMaskStyle}
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
        key={`pc-wobble-${wobbleKey}`}
        src="/assets/transition/pc.webp"
        alt="Retro PC - Sahana Nayak Portfolio"
        draggable={false}
        className={`absolute inset-0 select-none pointer-events-none ${!isHovered && showEntered && !showVideo ? "animate-pc-wobble" : ""
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
        className={`absolute right-[5vw] lg:right-[7vw] top-[18%] sm:top-[22%] lg:top-[47%] lg:-translate-y-1/2 w-[42vw] min-w-[290px] max-w-[560px] pointer-events-auto transition-all duration-700 ease-out ${showEntered && !showVideo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
      >
        {/* Heading: About Me */}
        <h2
          ref={headingRef}
          className="inline-block text-4xl sm:text-5xl lg:text-6xl font-bold tracking-normal text-neutral-900 mb-5 sm:mb-6"
          style={{ fontFamily: "'Special Elite', cursive" }}
        >
          WHO&apos;S BEHIND THE SCREEN?
        </h2>

        {/* Typewriter Text Animation */}
        <div ref={typewriterBoxRef} className="relative min-h-[5em] sm:min-h-[5.5em] lg:min-h-[6.5em]">
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
            onCharacterProgress={handleCharacterProgress}
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
