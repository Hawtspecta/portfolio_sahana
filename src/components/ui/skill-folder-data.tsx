"use client";

import type { FolderIcon } from "./icon-folder";

export interface SkillFolderCategory {
  id: string;
  title: string;
  tags: string[];
  icons: FolderIcon[];
}

export const SKILL_FOLDERS: SkillFolderCategory[] = [
  {
    id: "programming",
    title: "Programming",
    tags: ["C", "C++", "Java", "Python"],
    icons: [
      {
        label: "C",
        background: "linear-gradient(135deg, #6366F1, #3730A3)",
        node: (
          <svg viewBox="0 0 128 128" width="74%" height="74%" aria-hidden="true">
            <path
              fill="#818CF8"
              d="M115.4 30.7L67.1 2.9c-.8-.5-1.9-.7-3.1-.7-1.2 0-2.3.3-3.1.7L12.6 30.7C10.9 31.7 9.5 34.1 9.5 36v55.9c0 1.9 1.4 4.3 3.1 5.3l48.3 27.9c.8.5 1.9.7 3.1.7 1.2 0 2.3-.3 3.1-.7l48.3-27.9c1.7-1 3.1-3.4 3.1-5.3V36c0-1.9-1.4-4.3-3.1-5.3z"
            />
            <path
              fill="#4338CA"
              d="M118.5 36c0-.9-.3-1.9-.9-2.8L64 64v61.8c1.2 0 2.3-.3 3.1-.7l48.3-27.9c1.7-1 3.1-3.4 3.1-5.3V36z"
            />
            <path
              fill="#4F46E5"
              d="M10.5 94.9c.6.9 1.3 1.7 2.1 2.2l48.3 27.9c.8.5 1.9.7 3.1.7V64L10.5 94.9z"
            />
            <path
              fill="#ffffff"
              d="M64 36.5c-15.2 0-27.5 12.3-27.5 27.5S48.8 91.5 64 91.5c9.8 0 18.4-5.1 23.3-12.8l-11.9-6.9c-2.4 3.7-6.6 6.2-11.4 6.2-7.5 0-13.5-6.1-13.5-13.5S56.5 50.5 64 50.5c4.8 0 9.1 2.5 11.5 6.3l11.9-6.9C82.5 41.7 73.9 36.5 64 36.5z"
            />
          </svg>
        ),
      },
      {
        label: "C++",
        background: "linear-gradient(135deg, #38BDF8, #0369A1)",
        node: (
          <svg viewBox="0 0 128 128" width="74%" height="74%" aria-hidden="true">
            <path
              fill="#0EA5E9"
              d="M115.4 30.7L67.1 2.9c-.8-.5-1.9-.7-3.1-.7-1.2 0-2.3.3-3.1.7L12.6 30.7C10.9 31.7 9.5 34.1 9.5 36v55.9c0 1.9 1.4 4.3 3.1 5.3l48.3 27.9c.8.5 1.9.7 3.1.7 1.2 0 2.3-.3 3.1-.7l48.3-27.9c1.7-1 3.1-3.4 3.1-5.3V36c0-1.9-1.4-4.3-3.1-5.3z"
            />
            <path
              fill="#7DD3FC"
              d="M64 2.2c-1.2 0-2.3.3-3.1.7L12.6 30.7C10.9 31.7 9.5 34.1 9.5 36v55.9c0 1 .4 2.1 1 3L64 64V2.2z"
            />
            <path
              fill="#0284C7"
              d="M118.5 36c0-.9-.3-1.9-.9-2.8L64 64v61.8c1.2 0 2.3-.3 3.1-.7l48.3-27.9c1.7-1 3.1-3.4 3.1-5.3V36z"
            />
            <path
              fill="#ffffff"
              d="M62 37.5c-14.6 0-26.5 11.9-26.5 26.5S47.4 90.5 62 90.5c9.4 0 17.7-4.9 22.4-12.3l-11.4-6.6c-2.3 3.6-6.3 5.9-11 5.9-7.2 0-13-5.8-13-13s5.8-13 13-13c4.6 0 8.7 2.4 11 6l11.4-6.6C79.7 42.4 71.4 37.5 62 37.5z"
            />
            <path
              fill="#ffffff"
              d="M89.5 60.5v-5h-4.8v5h-4.8v4.8h4.8v5h4.8v-5h4.8v-4.8h-4.8zm16 0v-5h-4.8v5h-4.8v4.8h4.8v5h4.8v-5h4.8v-4.8h-4.8z"
            />
          </svg>
        ),
      },
      {
        label: "Java",
        background: "linear-gradient(135deg, #FB923C, #C2410C)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M47.6 98.1s-4.8 2.8 3.4 3.7c9.9 1.1 15 1 25.9-1.1 0 0 2.9 1.8 6.9 3.4-24.6 10.5-55.6-.6-36.2-6zm-3-13.7s-5.4 4 2.8 4.8c10.7 1.1 19.1 1.2 33.7-1.6 0 0 2 2 5.1 3.1-29.8 8.7-63 .7-41.6-6.3z"
            />
            <path
              fill="#FED7AA"
              d="M69.6 60.1c6.1 7-1.6 13.3-1.6 13.3s15.4-7.9 8.3-17.9c-6.6-9.3-11.7-13.9 15.8-29.8 0 0-43.1 10.8-22.5 34.4z"
            />
            <path
              fill="#ffffff"
              d="M102.2 108.2s3.5 2.9-3.9 5.2c-14.1 4.3-58.6 5.6-71 .2-4.4-1.9 3.9-4.6 6.5-5.2 2.7-.6 4.3-.5 4.3-.5-4.9-3.5-31.9 6.8-13.7 9.8 49.7 8 90.6-3.6 77.8-9.5zM49.9 70s-22.9 5.4-8.1 7.4c6.2.8 18.6.6 30.2-.3 9.4-.8 18.9-2.5 18.9-2.5s-3.3 1.4-5.7 3.1c-23.2 6.1-67.9 3.3-55-3 10.9-5.3 19.7-4.7 19.7-4.7zm40.9 22.8c23.5-12.2 12.6-24 5-22.4-1.8.4-2.7.7-2.7.7s.7-1.1 2-1.5c15-5.3 26.5 15.5-4.8 23.8 0 0 .3-.3.5-.6z"
            />
            <path
              fill="#FED7AA"
              d="M76.8 11.4s13 13-12.3 33c-20.3 16-4.6 25.1-.1 35.6-11.7-10.6-20.3-19.9-14.5-28.5 8.4-12.7 31.8-18.9 26.9-40.1z"
            />
            <path
              fill="#ffffff"
              d="M52.3 121.3c22.6 1.4 57.3-.8 58.1-11.5 0 0-1.6 4.1-18.7 7.3-19.3 3.6-43.1 3.2-57.2.9 0 0 2.9 2.4 17.8 3.3z"
            />
          </svg>
        ),
      },
      {
        label: "Python",
        background: "linear-gradient(135deg, #3B82F6, #1E40AF)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M63.4 10.6c-27.1 0-25.4 11.7-25.4 11.7v12.1h25.9v3.6H27.7s-17.3-2-17.3 25.4c0 27.4 15.1 26.4 15.1 26.4h9V77.1s-.5-15.1 14.9-15.1h25.6s14.4.2 14.4-13.9V24.7s2.2-14.1-26-14.1zm-14.2 8.2a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2z"
            />
            <path
              fill="#FFD43B"
              d="M64.6 117.4c27.1 0 25.4-11.7 25.4-11.7V93.6H64.1V90h36.2s17.3 2 17.3-25.4c0-27.4-15.1-26.4-15.1-26.4h-9v12.7s.5 15.1-14.9 15.1H53s-14.4-.2-14.4 13.9v23.4s-2.2 14.1 26 14.1zm14.2-8.2a4.6 4.6 0 1 1 0-9.2 4.6 4.6 0 0 1 0 9.2z"
            />
          </svg>
        ),
      },
    ],
  },
  {
    id: "frontend",
    title: "Frontend",
    tags: ["React", "Next", "JS", "TS"],
    icons: [
      {
        label: "React",
        background: "linear-gradient(135deg, #1E3A8A, #1D4ED8)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <circle cx="64" cy="64" r="10.5" fill="#61DAFB" />
            <g fill="none" stroke="#61DAFB" strokeWidth="5.8">
              <ellipse cx="64" cy="64" rx="52" ry="20" />
              <ellipse cx="64" cy="64" rx="52" ry="20" transform="rotate(60 64 64)" />
              <ellipse cx="64" cy="64" rx="52" ry="20" transform="rotate(120 64 64)" />
            </g>
          </svg>
        ),
      },
      {
        label: "Next",
        background: "linear-gradient(135deg, #8B5CF6, #4F46E5)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <circle cx="64" cy="64" r="54" fill="#18181B" />
            <path
              fill="#ffffff"
              d="M99.8 104.7L49.4 41.8H40.5v44.4h7.1V51.3l46.5 57.9c2-.1 3.9-2.8 5.7-4.5z"
            />
            <rect x="80.5" y="41.8" width="7.1" height="44.4" fill="#ffffff" />
          </svg>
        ),
      },
      {
        label: "JS",
        background: "linear-gradient(135deg, #F7DF1E, #EAB308)",
        node: (
          <svg viewBox="0 0 24 24" width="84%" height="84%" aria-hidden="true">
            <path
              d="M11.6 17.5c0 1.9-1.1 2.9-2.9 2.9-1.3 0-2.3-.7-2.9-1.7l1.7-1c.3.6.7 1 1.3 1 .7 0 1-.4 1-1.3v-6.9h1.8v7zm8.3.1c0-1.6-1-2.4-2.8-3.1-1.1-.4-1.6-.7-1.6-1.4 0-.6.5-1 1.3-1 .8 0 1.4.3 1.9 1l1.5-1c-.8-1.1-2-1.7-3.4-1.7-2 0-3.3 1.2-3.3 2.9 0 1.6 1 2.4 2.7 3.1 1.2.4 1.7.8 1.7 1.5s-.6 1.1-1.5 1.1c-1 0-1.8-.5-2.4-1.3l-1.5 1.2c.9 1.2 2.2 1.9 3.9 1.9 2.3 0 3.5-1.2 3.5-2.9z"
              fill="#111111"
            />
          </svg>
        ),
      },
      {
        label: "TS",
        background: "linear-gradient(135deg, #3178C6, #1E40AF)",
        node: (
          <svg viewBox="0 0 24 24" width="84%" height="84%" aria-hidden="true">
            <path
              d="M13.2 10.6H6.1v2.1h2.5v7.6h2.4v-7.6h2.2v-2.1zm7.9 3.1c0-1.9-1.4-3.2-3.6-3.2-1.9 0-3.3 1.1-3.3 2.9 0 1.5 1 2.4 2.9 3 1.3.4 1.8.8 1.8 1.5 0 .7-.6 1.1-1.6 1.1-1.1 0-2-.5-2.8-1.2l-1 1.8c1 .7 2.2 1.1 3.7 1.1 2.4 0 4-1.2 4-3.1 0-1.6-1-2.4-3-3.1-1.3-.4-1.8-.8-1.8-1.4 0-.6.5-1 1.4-1 .9 0 1.7.4 2.4 1l.9-1.8z"
              fill="#ffffff"
            />
          </svg>
        ),
      },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    tags: ["FastAPI", "SQL", "REST"],
    icons: [
      {
        label: "FastAPI",
        background: "linear-gradient(135deg, #10B981, #047857)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <circle cx="64" cy="64" r="50" fill="#ffffff" />
            <path fill="#059669" d="M68.2 24L37 69.5h23.4L54.6 104l32.4-45.5H63.5L68.2 24z" />
          </svg>
        ),
      },
      {
        label: "SQL",
        background: "linear-gradient(135deg, #38BDF8, #1D4ED8)",
        node: (
          <svg viewBox="0 0 24 24" width="76%" height="76%" aria-hidden="true">
            <path
              d="M17.2 4.2C15.5 3.3 13.6 3.7 12.1 4.6C10.6 3.7 8.5 3.3 6.8 4.2C4.6 5.4 3.7 8.4 4.8 11.4C5.6 13.7 7.3 15.3 9.2 16.0V19.5C9.2 20.4 10.0 21.0 10.9 21.0C11.7 21.0 12.2 20.4 12.3 19.6L12.6 16.6C13.6 16.5 14.6 16.1 15.5 15.5C16.5 16.7 17.5 18.2 17.2 20.2C18.6 19.6 19.4 17.6 19.0 15.2C19.8 13.6 20.1 11.4 19.6 9.3C19.2 7.1 18.5 4.9 17.2 4.2Z"
              fill="#ffffff"
            />
            <circle cx="9.2" cy="8.8" r="1.15" fill="#1D4ED8" />
            <circle cx="14.8" cy="8.8" r="1.15" fill="#1D4ED8" />
          </svg>
        ),
      },
      {
        label: "REST",
        background: "linear-gradient(135deg, #FB7185, #E11D48)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <path
              d="M42 28c-8 0-12 5-12 13v12c0 6-4 10-9 11 5 1 9 5 9 11v12c0 8 4 13 12 13"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M86 28c8 0 12 5 12 13v12c0 6 4 10 9 11-5 1-9 5-9 11v12c0 8-4 13-12 13"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="48" cy="64" r="5.5" fill="#ffffff" />
            <circle cx="64" cy="64" r="5.5" fill="#ffffff" />
            <circle cx="80" cy="64" r="5.5" fill="#ffffff" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "ai-ml",
    title: "AI / ML",
    tags: ["ML", "LLMs", "RAG"],
    icons: [
      {
        label: "ML",
        background: "linear-gradient(135deg, #F43F5E, #BE123C)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <g stroke="#ffffff" strokeOpacity="0.88" strokeWidth="4.5" strokeLinecap="round">
              <line x1="28" y1="36" x2="64" y2="28" />
              <line x1="28" y1="36" x2="64" y2="64" />
              <line x1="28" y1="92" x2="64" y2="64" />
              <line x1="28" y1="92" x2="64" y2="100" />
              <line x1="64" y1="28" x2="100" y2="48" />
              <line x1="64" y1="64" x2="100" y2="48" />
              <line x1="64" y1="64" x2="100" y2="82" />
              <line x1="64" y1="100" x2="100" y2="82" />
            </g>
            <circle cx="28" cy="36" r="8.5" fill="#ffffff" />
            <circle cx="28" cy="92" r="8.5" fill="#ffffff" />
            <circle cx="64" cy="28" r="8.5" fill="#ffffff" />
            <circle cx="64" cy="64" r="10" fill="#ffffff" />
            <circle cx="64" cy="100" r="8.5" fill="#ffffff" />
            <circle cx="100" cy="48" r="8.5" fill="#ffffff" />
            <circle cx="100" cy="82" r="8.5" fill="#ffffff" />
          </svg>
        ),
      },
      {
        label: "LLMs",
        background: "linear-gradient(135deg, #A855F7, #6D28D9)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M54 18c3 22 18 37 40 40-22 3-37 18-40 40-3-22-18-37-40-40 22-3 37-18 40-40z"
            />
            <path
              fill="#ffffff"
              fillOpacity="0.92"
              d="M96 72c1.6 10 8.4 16.8 18 18-9.6 1.2-16.4 8-18 18-1.6-10-8.4-16.8-18-18 9.6-1.2 16.4-8 18-18z"
            />
          </svg>
        ),
      },
      {
        label: "RAG",
        background: "linear-gradient(135deg, #14B8A6, #0F766E)",
        node: (
          <svg viewBox="0 0 128 128" width="76%" height="76%" aria-hidden="true">
            {/* clean document stack + search loupe */}
            <path
              d="M30 22h42l18 18v58a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="7"
              strokeLinejoin="round"
            />
            <path d="M72 22v18h18" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinejoin="round" />
            <line x1="38" y1="54" x2="66" y2="54" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            <line x1="38" y1="72" x2="58" y2="72" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            <circle cx="84" cy="84" r="16" fill="#0F766E" stroke="#ffffff" strokeWidth="7" />
            <path d="M96 96l12 12" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];
