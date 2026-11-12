"use client";

import React from "react";

interface MaskedHeadingProps {
  title: string;
  subtitle: string;
  isIn: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
}

export default function MaskedHeading({
  title,
  subtitle,
  isIn,
  titleClassName = "text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight drop-shadow-sm mb-0.5 creations-heading transition-colors duration-500",
  subtitleClassName = "text-xs sm:text-sm font-mono tracking-wide creations-subheading transition-colors duration-500",
  titleStyle,
  subtitleStyle,
}: MaskedHeadingProps) {
  const chars = title.split("");
  return (
    <>
      <h2
        className={`section-head-line ${titleClassName} ${isIn ? "in" : ""}`}
        style={{
          fontFamily: "'Special Elite', cursive",
          ...titleStyle,
        }}
        aria-label={title}
      >
        {chars.map((ch, idx) => (
          <span key={idx} className="section-head-mask">
            <span
              className="section-head-char"
              style={{ "--hi": idx } as React.CSSProperties}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          </span>
        ))}
      </h2>
      <p
        className={`section-stage-sub ${subtitleClassName} ${isIn ? "in" : ""}`}
        style={{
          fontFamily: "'Special Elite', cursive",
          ...subtitleStyle,
        }}
      >
        {subtitle}
      </p>
    </>
  );
}

