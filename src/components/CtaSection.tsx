"use client";

import React from "react";
import YarnCatCursor from "@/components/ui/yarn-cat-cursor";

interface CtaSectionProps {
  isVisible: boolean;
  onJumpToSection?: (stop: number) => void;
  onOpenResume?: () => void;
}

const HEADLINE = "say hi.";

function CtaSection({
  isVisible,
  onOpenResume,
}: CtaSectionProps) {
  return (
    <section
      aria-label="Contact and Call to Action"
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-center px-6 sm:px-10 md:px-14 pt-8 pb-20 sm:pb-24"
      style={{
        color: "var(--exp-headline-color, #2b180e)",
      }}
    >
      {/* 3D Kitty + Rolling Yarn Ball & Verlet Yarn Strands */}
      <YarnCatCursor
        isVisible={isVisible}
        position="absolute"
        anchorSelector="[data-yarn-anchor]"
        yarnColor="#2d6a4f"
        yarnBallColor="#2d6a4f"
        bounceColor="#fbf6ec"
        shadowColor="#2b180e"
        seedYarn={0}
        maxThreads={45}
        butterfly={false}
        enter={false}
        zIndex={15}
      />

      {/* Main Playful Scattered Desk Layout matching portfolio theme */}
      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 max-w-5xl w-full mx-auto">
        {/* Left: Giant Per-Letter Headline + Copy */}
        <div className="lg:col-span-7 flex flex-col items-start gap-4 sm:gap-5">
          <span
            data-yarn-anchor
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-widest uppercase border"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: "var(--exp-pill-color, #2b180e)",
              borderColor: "var(--exp-pill-border, rgba(43,24,14,0.35))",
              backgroundColor: "var(--exp-pill-bg, rgba(43,24,14,0.06))",
            }}
          >
            AVAILABLE FOR WORK &amp; COLLABS
          </span>

          <h2
            aria-label={HEADLINE}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.2rem] font-extrabold tracking-tight leading-[0.94] flex flex-wrap"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: "var(--exp-headline-color, #2b180e)",
            }}
          >
            {HEADLINE.split("").map((ch, i) => (
              <span
                key={i}
                data-yarn-anchor
                className="inline-block hover:-translate-y-1 transition-transform duration-200"
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h2>

          <div className="max-w-md space-y-2.5">
            <h3
              data-yarn-anchor
              className="inline-block text-xl sm:text-2xl font-bold leading-snug"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: "var(--exp-headline-color, #2b180e)",
              }}
            >
              got an idea, a role,
              <br />
              or a late-night build?
            </h3>
            <p
              data-yarn-anchor
              className="text-sm sm:text-base leading-relaxed opacity-85"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "var(--exp-subtext-color, #3d2314)",
              }}
            >
              I build AI systems, interactive web experiences, and products people love using.
              Move your cursor around — the kitty loves tangling yarn across the page.
            </p>
            <p
              className="text-xs tracking-wide pt-1 opacity-75"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: "var(--exp-subtext-color, #3d2314)",
              }}
            >
              <kbd className="px-1.5 py-0.5 rounded border border-current/40 text-[11px] mr-1.5">
                del
              </kbd>
              untangles the yarn
            </p>
          </div>
        </div>

        {/* Right: Retro Admit-One Ticket Card */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-4">
          <div
            data-yarn-anchor
            className="w-full max-w-[350px] rounded-xl border-2 border-[#4a2c1d] bg-[#fdf6ec] text-[#2b180e] p-5 shadow-[6px_6px_0_#4a2c1d] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[9px_11px_0_#4a2c1d]"
          >
            <div
              className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[#5c3d2e] border-b border-dashed border-[#4a2c1d]/35 pb-2.5 mb-3.5"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span>ADMIT ONE</span>
              <span>No. 0208</span>
            </div>

            <p
              className="text-xl font-bold text-[#2b180e] mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Sahana Nayak
            </p>
            <p
              className="text-xs text-[#5c3d2e] mb-5"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              AI / ML &amp; Full-Stack Engineer
            </p>

            <div className="relative z-30 flex flex-wrap gap-2">
              <a
                href="mailto:nayaksahana0307@gmail.com"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-[#4a2c1d] bg-[#2b180e] text-[#fbf6ec] font-bold text-xs tracking-wide hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <span>Mail</span>
                <span>↗</span>
              </a>
              <a
                href="https://github.com/Hawtspecta"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-[#4a2c1d] bg-[#fdf6ec] text-[#2b180e] font-bold text-xs tracking-wide hover:bg-[#f3e1c3] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <span>GitHub</span>
                <span>↗</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  if (onOpenResume) {
                    onOpenResume();
                  } else {
                    window.open("/assets/Sahana_Nayak_Resume%20(8).pdf", "_blank", "noopener,noreferrer");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-[#4a2c1d] bg-[#fdf6ec] text-[#2b180e] font-bold text-xs tracking-wide hover:bg-[#f3e1c3] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                <span>Resume</span>
                <span>↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(CtaSection);
