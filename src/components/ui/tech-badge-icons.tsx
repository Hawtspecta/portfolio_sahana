"use client";

import React from "react";

export function SparkleClusterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 2L13.1 8.4L19.5 10.5L13.1 12.6L11 19L8.9 12.6L2.5 10.5L8.9 8.4L11 2Z"
        fill="#5b3b6b"
      />
      <circle cx="18.5" cy="5.5" r="1.4" fill="#5b3b6b" />
      <circle cx="18.5" cy="17.5" r="1.1" fill="#8b5d99" />
    </svg>
  );
}

export function TechBadgeIcon({ name }: { name: string }) {
  const key = name.trim().toLowerCase();

  if (key === "react" || key === "react.js") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="2.2" fill="#0ea5e9" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#0ea5e9" strokeWidth="1.5" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="3.8"
          transform="rotate(60 12 12)"
          stroke="#0ea5e9"
          strokeWidth="1.5"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="3.8"
          transform="rotate(120 12 12)"
          stroke="#0ea5e9"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (key === "typescript") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3.5" fill="#3178c6" />
        <path
          d="M12.5 11.2H7.2V12.8H9.1V18.8H10.9V12.8H12.5V11.2ZM18.4 13.6C18.4 12.2 17.3 11.1 15.6 11.1C14.1 11.1 13.1 12.0 13.1 13.4C13.1 14.6 13.9 15.2 15.3 15.7C16.3 16.0 16.7 16.3 16.7 16.9C16.7 17.4 16.2 17.7 15.5 17.7C14.7 17.7 14.0 17.3 13.4 16.8L12.7 18.2C13.4 18.7 14.4 19.0 15.5 19.0C17.4 19.0 18.6 18.1 18.6 16.6C18.6 15.4 17.8 14.7 16.3 14.2C15.3 13.9 14.9 13.6 14.9 13.1C14.9 12.7 15.3 12.4 15.9 12.4C16.6 12.4 17.2 12.7 17.7 13.1L18.4 13.6Z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  if (key === "fastapi") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#059669" />
        <path d="M13.2 5.5L7.5 13.2H11.6L10.8 18.5L16.5 10.8H12.4L13.2 5.5Z" fill="#ffffff" />
      </svg>
    );
  }

  if (key === "python") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <path
          d="M11.9 2.5C8.5 2.5 8.8 4.0 8.8 4.0V6.2H12.1V6.9H6.5C6.5 6.9 3.8 6.6 3.8 10.1C3.8 13.6 6.2 13.4 6.2 13.4H7.6V11.6C7.6 11.6 7.5 9.2 9.9 9.2H14.1C14.1 9.2 16.4 9.3 16.4 7.0V4.6C16.4 4.6 16.8 2.5 11.9 2.5ZM9.8 4.1C10.3 4.1 10.7 4.5 10.7 5.0C10.7 5.5 10.3 5.9 9.8 5.9C9.3 5.9 8.9 5.5 8.9 5.0C8.9 4.5 9.3 4.1 9.8 4.1Z"
          fill="#3776ab"
        />
        <path
          d="M12.1 21.5C15.5 21.5 15.2 20.0 15.2 20.0V17.8H11.9V17.1H17.5C17.5 17.1 20.2 17.4 20.2 13.9C20.2 10.4 17.8 10.6 17.8 10.6H16.4V12.4C16.4 12.4 16.5 14.8 14.1 14.8H9.9C9.9 14.8 7.6 14.7 7.6 17.0V19.4C7.6 19.4 7.2 21.5 12.1 21.5ZM14.2 19.9C13.7 19.9 13.3 19.5 13.3 19.0C13.3 18.5 13.7 18.1 14.2 18.1C14.7 18.1 15.1 18.5 15.1 19.0C15.1 19.5 14.7 19.9 14.2 19.9Z"
          fill="#f7c948"
        />
      </svg>
    );
  }

  if (key === "postgresql") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <path
          d="M17.2 4.2C15.5 3.3 13.6 3.7 12.1 4.6C10.6 3.7 8.5 3.3 6.8 4.2C4.6 5.4 3.7 8.4 4.8 11.4C5.6 13.7 7.3 15.3 9.2 16.0V19.5C9.2 20.4 10.0 21.0 10.9 21.0C11.7 21.0 12.2 20.4 12.3 19.6L12.6 16.6C13.6 16.5 14.6 16.1 15.5 15.5C16.5 16.7 17.5 18.2 17.2 20.2C18.6 19.6 19.4 17.6 19.0 15.2C19.8 13.6 20.1 11.4 19.6 9.3C19.2 7.1 18.5 4.9 17.2 4.2Z"
          fill="#336791"
        />
        <circle cx="9.2" cy="8.8" r="1" fill="#ffffff" />
        <circle cx="14.8" cy="8.8" r="1" fill="#ffffff" />
      </svg>
    );
  }

  if (key === "ai/ml") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" stroke="#5c3a28" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.6" fill="#5c3a28" />
        <path
          d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.3 5.3L7.1 7.1M16.9 16.9L18.7 18.7M18.7 5.3L16.9 7.1M7.1 16.9L5.3 18.7"
          stroke="#5c3a28"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (key === "rag") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="6.2" rx="7" ry="2.6" stroke="#4a2c1d" strokeWidth="1.7" fill="#ecdcc8" />
        <path
          d="M5 6.2V12C5 13.4 8.1 14.6 12 14.6C15.9 14.6 19 13.4 19 12V6.2"
          stroke="#4a2c1d"
          strokeWidth="1.7"
        />
        <path
          d="M5 12V17.8C5 19.2 8.1 20.4 12 20.4C15.9 20.4 19 19.2 19 17.8V12"
          stroke="#4a2c1d"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (key === "javascript") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3.5" fill="#f7df1e" />
        <path
          d="M11.1 16.4C11.1 17.8 10.3 18.6 8.9 18.6C7.9 18.6 7.1 18.1 6.7 17.3L8.0 16.5C8.2 16.9 8.5 17.2 9.0 17.2C9.5 17.2 9.7 16.9 9.7 16.2V11.2H11.1V16.4ZM17.6 16.5C17.6 15.3 16.8 14.7 15.4 14.2C14.6 13.9 14.2 13.7 14.2 13.2C14.2 12.8 14.5 12.5 15.1 12.5C15.7 12.5 16.1 12.7 16.5 13.2L17.6 12.4C17.0 11.6 16.1 11.1 15.1 11.1C13.6 11.1 12.6 12.0 12.6 13.3C12.6 14.5 13.4 15.1 14.7 15.6C15.6 15.9 16.0 16.2 16.0 16.7C16.0 17.1 15.6 17.4 14.9 17.4C14.2 17.4 13.6 17.0 13.1 16.4L12.0 17.3C12.7 18.2 13.7 18.7 14.9 18.7C16.7 18.7 17.6 17.8 17.6 16.5Z"
          fill="#2b180e"
        />
      </svg>
    );
  }

  if (key === "figma") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <path d="M8.5 2.5H12V9H8.5C6.7 9 5.2 7.5 5.2 5.75C5.2 4 6.7 2.5 8.5 2.5Z" fill="#f24e1e" />
        <path d="M12 2.5H15.5C17.3 2.5 18.8 4 18.8 5.75C18.8 7.5 17.3 9 15.5 9H12V2.5Z" fill="#ff7262" />
        <path d="M8.5 9H12V15.5H8.5C6.7 15.5 5.2 14 5.2 12.25C5.2 10.5 6.7 9 8.5 9Z" fill="#a259ff" />
        <path d="M8.5 15.5H12V18.75C12 20.5 10.5 22 8.75 22C7 22 5.2 20.5 5.2 18.75C5.2 17 6.7 15.5 8.5 15.5Z" fill="#0acf83" />
        <circle cx="15.4" cy="12.25" r="3.25" fill="#1abcfe" />
      </svg>
    );
  }

  if (key === "html") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <path d="M4 3L5.4 19.2L12 21L18.6 19.2L20 3H4Z" fill="#e34f26" />
        <path d="M12 4.3V19.6L17.3 18.1L18.5 4.3H12Z" fill="#ef652a" />
        <path d="M7.5 7.5H16.5L16.3 9.7H9.8L10.0 12.0H16.1L15.6 17.2L12 18.2L8.4 17.2L8.1 14.3H10.3L10.4 15.6L12 16.0L13.6 15.6L13.8 14.0H7.9L7.5 7.5Z" fill="#ffffff" />
      </svg>
    );
  }

  if (key === "css") {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true">
        <path d="M4 3L5.4 19.2L12 21L18.6 19.2L20 3H4Z" fill="#1572b6" />
        <path d="M12 4.3V19.6L17.3 18.1L18.5 4.3H12Z" fill="#33a9dc" />
        <path d="M7.5 7.5H16.5L16.2 9.7H12.2L16.0 11.5L15.6 17.2L12 18.2L8.4 17.2L8.1 14.3H10.3L10.4 15.6L12 16.0L13.6 15.6L13.8 13.7H8.1L7.9 11.7L12.0 9.7H7.7L7.5 7.5Z" fill="#ffffff" />
      </svg>
    );
  }

  return (
    <span className="w-2 h-2 rounded-full bg-[#785f47] flex-shrink-0" aria-hidden="true" />
  );
}

