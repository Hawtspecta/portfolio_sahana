import React from "react";
import type { MagicBentoItem } from "@/components/MagicBento";

export interface ProjectDetails {
  id: string;
  name: string;
  tagline: string;
  overview: string;
  features: string[];
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
  caseStudy: string;
}

export const PROJECT_DETAILS: Record<string, ProjectDetails> = {
  "AI LAW BOT": {
    id: "ai-law-bot",
    name: "AI Law Bot",
    tagline: "Legal intelligence platform powered by RAG and semantic judicial precedent indexing.",
    overview:
      "Navigating dense legal codes, case precedents, and statutory compliance takes hours of manual scrutiny and risks critical oversight. AI Law Bot indexes penal codes, case rulings, and regulatory statutes using vector embeddings to deliver sub-second, citation-verified legal answers with high precision.",
    features: [
      "Semantic Statutory Citation & Verification",
      "RAG-Powered Clause Comparison & Risk Extraction",
      "Multilingual Legal Query Analysis & Executive Briefs",
      "Confidential, Encrypted Query Sandbox for Legal Counsel",
    ],
    techStack: [
      "Next.js 14",
      "TypeScript",
      "Google Gemini API",
      "Pinecone Vector DB",
      "LangChain",
      "Tailwind CSS",
      "Python",
    ],
    demoUrl: "https://ai-law-bot-nu.vercel.app/",
    githubUrl: "https://github.com/sahanasantoshnayak/ai-law-bot",
    caseStudy: "Statutory RAG architecture with sub-second verified citation benchmarks.",
  },
  UFI: {
    id: "ufi",
    name: "UFI (Universal Flight Interface)",
    tagline: "High-frequency global aviation radar, airspace telemetry and flight operations cockpit.",
    overview:
      "Modern flight trackers often suffer from high-latency feeds, cluttered tables, and sluggish map rendering during peak air traffic. UFI combines low-latency WebSockets with accelerated Mapbox GL pipelines to stream thousands of active flights simultaneously with interactive route forecasting and radar weather layers.",
    features: [
      "Sub-second global flight positioning & live telemetry",
      "Interactive 3D airspace route arcs & elevation mapping",
      "Dynamic NEXRAD radar weather maps & turbulence zones",
      "Predictive arrival timeline calculation & gate status",
    ],
    techStack: [
      "Next.js 14",
      "React",
      "Mapbox GL / Leaflet",
      "WebSockets",
      "OpenSky Network API",
      "Tailwind CSS",
      "Canvas 2D",
    ],
    demoUrl: "https://ufi-omega.vercel.app/",
    githubUrl: "https://github.com/sahanasantoshnayak/ufi",
    caseStudy: "High-concurrency flight telemetry streaming with sub-50ms render loop.",
  },
  "URBAN BREW": {
    id: "urban-brew",
    name: "Urban Brew",
    tagline: "Artisanal single-origin coffee roastery and interactive sensory commerce platform.",
    overview:
      "Specialty coffee lovers often struggle to decipher origin tasting notes and optimal brewing parameters from static product cards. Urban Brew delivers an interactive sensory journey that pairs bean terroir profiles with custom brew calculators and automated bean delivery subscriptions.",
    features: [
      "Interactive roast spectrum & dynamic flavor-wheel selector",
      "Smart grind-size brewing calculator with pour-over ratio timer",
      "Curated monthly roast subscription engine with taste preferences",
      "Micro-lot farm origin mapping & producer transparency profiles",
    ],
    techStack: [
      "Next.js 14",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "Stripe API",
      "Sanity CMS",
      "Vercel Edge",
    ],
    demoUrl: "https://urban-brew-ten.vercel.app/",
    githubUrl: "https://github.com/sahanasantoshnayak/urban-brew",
    caseStudy: "Sensory coffee discovery UX with dynamic pour-over ratio telemetry.",
  },
  "INDIA CONNECT HUB": {
    id: "india-connect-hub",
    name: "India Connect Hub",
    tagline: "Unified diaspora community, mentorship & cultural gateway for the global diaspora.",
    overview:
      "The global Indian diaspora relies on fragmented WhatsApp chats and Facebook groups for accommodation, cultural events, and career mentorship. India Connect Hub aggregates verified local community chapters, trusted relocation advice, and community festival ticketing into a single verified ecosystem.",
    features: [
      "Geo-located diaspora chapter directory with verified local guides",
      "Peer-to-peer mentorship network for career & student relocation",
      "Cultural festival bookings with instant digital pass generation",
      "Verified local Indian business, cuisine & professional directory",
    ],
    techStack: [
      "Next.js 14",
      "React",
      "Node.js",
      "PostgreSQL",
      "Prisma ORM",
      "Supabase Auth",
      "Tailwind CSS",
    ],
    demoUrl: "https://india-connect-hub.vercel.app/",
    githubUrl: "https://github.com/sahanasantoshnayak/india-connect-hub",
    caseStudy: "Scalable chapter-based community architecture with verified onboarding.",
  },
  "AI RESUME ANALYZER": {
    id: "ai-resume-analyzer",
    name: "AI Resume Analyzer",
    tagline: "Automated ATS scoring, keyword discrepancy detection and tailored career optimization engine.",
    overview:
      "Over 75% of qualified applicants fail initial Applicant Tracking System filters due to unparsed headers, missing keywords, and weak metric articulation. AI Resume Analyzer parses PDF resumes, compares candidate experience against target job postings, and delivers quantified bullet-point rewrites.",
    features: [
      "Real-time ATS compatibility score with section-by-section breakdown",
      "Target job description keyword gap extraction and density analysis",
      "Action-oriented bullet rewriter generating quantified achievement statements",
      "Multi-format PDF/DOCX parser with downloadable ATS-optimized reports",
    ],
    techStack: [
      "Next.js 14",
      "TypeScript",
      "FastAPI (Python)",
      "Google Gemini API",
      "pdf-parse",
      "Tailwind CSS",
    ],
    demoUrl: "https://ai-resume-analyzer-dun-one.vercel.app/",
    githubUrl: "https://github.com/sahanasantoshnayak/ai-resume-analyzer",
    caseStudy: "Natural language resume scoring pipeline with semantic keyword matching.",
  },
};

export function getMagicBentoItems(projectTitle: string): MagicBentoItem[] {
  const details = PROJECT_DETAILS[projectTitle] || PROJECT_DETAILS["AI LAW BOT"];

  return [
    {
      label: "01. PROJECT NAME",
      title: details.name,
      description: details.tagline,
      colSpan: 2,
      rowSpan: 1,
      visual: "security",
    },
    {
      label: "02. ONE-LINE TAGLINE",
      title: "Core Mission & Purpose",
      description: details.tagline,
      colSpan: 2,
      rowSpan: 1,
      visual: "analytics",
    },
    {
      label: "03. OVERVIEW",
      title: "Problem & Solution Analysis",
      description: details.overview,
      colSpan: 2,
      rowSpan: 2,
      visual: "collaboration",
    },
    {
      label: "04. KEY FEATURES",
      title: "Standout System Capabilities",
      description: details.features.join(" • "),
      colSpan: 2,
      rowSpan: 2,
      visual: "automation",
    },
    {
      label: "05. TECH STACK",
      title: "Languages, Frameworks & APIs",
      description: details.techStack.join(" • "),
      colSpan: 2,
      rowSpan: 1,
      visual: "integration",
    },
    {
      label: "06. REPOSITORY & CODE",
      title: "GitHub Repository",
      description: details.caseStudy,
      colSpan: 2,
      rowSpan: 1,
      action: (
        <a
          href={details.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-github"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>View on GitHub</span>
        </a>
      ),
    },
  ];
}

