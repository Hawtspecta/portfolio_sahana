"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface CarouselImage {
  src: string;
  alt: string;
}

interface ExperienceFeatureCarouselProps {
  images: CarouselImage[];
  isActive?: boolean;
  className?: string;
}

export function ExperienceFeatureCarousel({
  images,
  isActive = true,
  className,
}: ExperienceFeatureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    images.length > 0 ? Math.floor(images.length / 2) : 0
  );
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isActive || isPaused || images.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [isActive, isPaused, images.length, handleNext]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Perspective Stage */}
      <div className="relative w-full flex-1 min-h-[190px] sm:min-h-[230px] flex items-center justify-center [perspective:1000px]">
        {images.map((image, index) => {
          const offset = index - currentIndex;
          const total = images.length;
          let pos = (offset + total) % total;
          if (pos > Math.floor(total / 2)) {
            pos = pos - total;
          }

          const isCenter = pos === 0;
          const isAdjacent = Math.abs(pos) === 1;

          return (
            <div
              key={`${image.src}-${index}`}
              onClick={(e) => {
                if (!isCenter && isAdjacent) {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }
              }}
              className={cn(
                "absolute w-[128px] h-[176px] sm:w-[152px] sm:h-[210px] lg:w-[172px] lg:h-[238px] transition-all duration-500 ease-in-out flex items-center justify-center",
                isAdjacent && "cursor-pointer"
              )}
              style={{
                transform: `
                  translateX(${pos * 44}%)
                  scale(${isCenter ? 1 : isAdjacent ? 0.84 : 0.68})
                  rotateY(${pos * -10}deg)
                `,
                zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                opacity: isCenter ? 1 : isAdjacent ? 0.45 : 0,
                filter: isCenter ? "blur(0px)" : "blur(3px)",
                visibility: Math.abs(pos) > 1 ? "hidden" : "visible",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                draggable={false}
                loading="lazy"
                className="object-cover w-full h-full rounded-2xl border-2 border-[#2b180e]/20 shadow-[0_14px_30px_rgba(43,24,14,0.28)] bg-[#f4e7d4]"
              />
            </div>
          );
        })}

        {/* Left Navigation Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full flex items-center justify-center border border-[#2b180e]/25 bg-[#fcf2e2]/85 hover:bg-[#2b180e] text-[#2b180e] hover:text-[#fcf2e2] backdrop-blur-sm shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Right Navigation Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full flex items-center justify-center border border-[#2b180e]/25 bg-[#fcf2e2]/85 hover:bg-[#2b180e] text-[#2b180e] hover:text-[#fcf2e2] backdrop-blur-sm shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Subtle Slide Indicator Dots */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-1.5 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                idx === currentIndex
                  ? "w-4 bg-[#2b180e]"
                  : "w-1.5 bg-[#2b180e]/25 hover:bg-[#2b180e]/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExperienceFeatureCarousel;

