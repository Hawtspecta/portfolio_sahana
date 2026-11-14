"use client";

import { useState } from "react";
import { useIsMobile } from "@/lib/useIsMobile";

export default function MobileNotice() {
  const isMobile = useIsMobile();
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Desktop recommended"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1c0f08]/92 backdrop-blur-md p-5 select-none"
      >
        <div className="w-full max-w-sm rounded-xl border-2 border-[#4a2c1d] bg-[#fbf6ec] text-[#2b180e] p-6 shadow-[6px_6px_0_#4a2c1d] text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#4a2c1d] bg-[#fdf6ec]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>

          <h2
            className="text-xl font-bold tracking-tight mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Open on Desktop or Laptop
          </h2>
          <p
            className="text-sm text-[#3d2314]/90 leading-relaxed mb-5"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            This interactive 3D portfolio is designed for a larger screen, mouse, and keyboard. Please switch to a desktop or laptop for the full experience.
          </p>

          <div className="pt-3 border-t border-[#4a2c1d]/20 flex flex-col gap-2.5">
            <span
              className="text-[11px] font-semibold text-[#4a2c1d]/80 uppercase tracking-wider"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Can&apos;t switch right now?
            </span>

            <button
              type="button"
              onClick={() => setIsResumeOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border-2 border-[#4a2c1d] bg-[#2b180e] text-[#fbf6ec] text-xs font-bold uppercase tracking-wider hover:bg-[#3d2314] active:scale-95 transition-all shadow-[2px_2px_0_#4a2c1d] cursor-pointer"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>View Resume</span>
            </button>
          </div>
        </div>
      </div>

      {/* In-App Mobile Resume Viewer */}
      {isResumeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sahana Nayak Resume"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1c0f08]/90 backdrop-blur-md p-3 sm:p-5"
        >
          <div className="relative w-full max-w-lg h-[92vh] flex flex-col rounded-xl border-2 border-[#4a2c1d] bg-[#fdf6ec] shadow-[6px_6px_0_#4a2c1d] overflow-visible">
            <button
              type="button"
              onClick={() => setIsResumeOpen(false)}
              aria-label="Close resume viewer"
              title="Close"
              className="absolute -top-3 -right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4a2c1d] bg-[#fdf6ec] text-[#2b180e] shadow-[2px_2px_0_#4a2c1d] hover:bg-[#f3e1c3] cursor-pointer active:scale-95 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-[#4a2c1d] bg-[#f3e1c3] rounded-t-[10px]">
              <span
                className="text-xs sm:text-sm font-bold tracking-wider text-[#2b180e]"
                style={{ fontFamily: "'Special Elite', cursive" }}
              >
                SAHANA_NAYAK_RESUME.PDF
              </span>
              <div className="flex items-center gap-1.5 pr-2">
                <a
                  href="/assets/Sahana_Nayak_Resume.pdf"
                  download="Sahana_Nayak_Resume.pdf"
                  className="px-2.5 py-1 rounded border border-[#4a2c1d] bg-[#fdf6ec] text-[10px] font-bold tracking-wider uppercase text-[#2b180e] shadow-[1px_1px_0_#4a2c1d] hover:bg-[#efe0ce] cursor-pointer"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Download ↓
                </a>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#e9dcc9] rounded-b-[10px] overflow-hidden">
              <iframe
                src="/assets/Sahana_Nayak_Resume.pdf#view=FitH"
                title="Sahana Nayak Resume"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

