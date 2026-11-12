import React from "react";
import type { MagicBentoItem } from "@/components/MagicBento";
import { TechBadgeIcon } from "@/components/ui/tech-badge-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

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
    tagline:
      "AI-powered legal assistant with RAG-grounded citations, contract risk assessment, and multi-language support.",
    overview:
      "Built with a native Node.js/TypeScript backend and React/TypeScript frontend, AI Law Bot uses Retrieval-Augmented Generation (RAG) to deliver citation-backed legal responses, semantic legal search, multi-document redline comparisons, and automated form assistance.",
    features: [
      "RAG-powered legal chat with real-time semantic query & citations",
      "Contract risk assessment (Critical/High/Medium/Low) & clause extraction",
      "Side-by-side multi-document comparison & redline summary grids",
      "Intelligent legal form filling, semantic search & regional NewsAPI feed",
    ],
    techStack: [
      "React",
      "TypeScript",
      "Node.js",
      "RAG / Vector Search",
      "NewsAPI",
      "Multi-Language i18n",
    ],
    demoUrl: "https://ai-law-bot-nu.vercel.app/",
    githubUrl: "https://github.com/Hawtspecta/AI-Law-Bot",
    caseStudy:
      "Production-grade RAG legal assistant with citation-verified statutory search and document analysis.",
  },
  UFI: {
    id: "ufi",
    name: "Aadhaar Update Friction Index (UFI)",
    tagline:
      "UIDAI Hackathon 2026 submission unlocking societal trends through Aadhaar identity update patterns.",
    overview:
      "Instead of just counting updates, UFI reframes Aadhaar enrolment and update data as a behavioral sensor to measure system-level friction—combining 5 weighted metrics to surface socioeconomic mobility, digital inequality, infrastructure gaps, and policy shocks.",
    features: [
      "5-component weighted composite index (Demographic Intensity 28.8% + 4 behavioral metrics)",
      "Reveals socioeconomic mobility, generational divides & access barriers",
      "System load & temporal instability anomaly detection",
      "Actionable policy insights framework for administrative planning",
    ],
    techStack: [
      "Python 3.8+",
      "Data Analytics",
      "Statistical Modeling",
      "Composite Indexing",
      "UIDAI Dataset",
    ],
    demoUrl: "https://ufi-omega.vercel.app/",
    githubUrl: "https://github.com/Hawtspecta/UFI",
    caseStudy:
      "UIDAI Hackathon 2026 framework transforming identity update telemetry into societal friction policy indicators.",
  },
  "URBAN BREW": {
    id: "urban-brew",
    name: "Urban Brew Café",
    tagline:
      "Modern animated café website with warm editorial design, filterable menu, and WhatsApp integration.",
    overview:
      "A responsive café experience crafted with React, TypeScript, and Tailwind CSS—pairing a warm café palette and dual-font typography with Framer Motion scroll animations, category-filtered menus, toast-notified contact forms, and Google Maps embeds.",
    features: [
      "Scroll-triggered entrance animations powered by Framer Motion",
      "Filterable menu tabs across Coffee, Bakery, Breakfast, Desserts & Drinks",
      "Sticky responsive navigation with mobile drawer & WhatsApp quick chat",
      "Embedded Google Maps & interactive contact form with toast alerts",
    ],
    techStack: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "Google Maps",
      "Vercel",
    ],
    demoUrl: "https://urban-brew-ten.vercel.app/",
    githubUrl: "https://github.com/Hawtspecta/Urban-Brew",
    caseStudy:
      "Warm artisanal café web experience featuring layered shadows, custom design tokens, and smooth motion.",
  },
  "INDIA CONNECT HUB": {
    id: "india-connect-hub",
    name: "India Connect Hub",
    tagline:
      "Cultural storytelling & global creative hub built with a heritage Madder Red, Ivory & Gold design system.",
    overview:
      "Designed to scale from a single-page storytelling experience to a global creative hub—pairing Playfair Display editorial typography and DM Sans readability with a heritage palette of Deep Madder Red, Warm Ivory, and Shimmer Gold.",
    features: [
      "Heritage visual identity with Deep Madder Red, Warm Ivory & Shimmer Gold",
      "High-resolution video & storytelling hero experience",
      "Editorial typography pairing Playfair Display & DM Sans",
      "Modular sitemap structured for global diaspora & cultural discovery",
    ],
    techStack: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Playfair Display",
      "DM Sans",
      "Vercel",
    ],
    demoUrl: "https://india-connect-hub.vercel.app/",
    githubUrl: "https://github.com/Hawtspecta/india-connect-hub",
    caseStudy:
      "Editorial storytelling platform blending cultural heritage aesthetics with scalable hub architecture.",
  },
  "AI RESUME ANALYZER": {
    id: "ai-resume-analyzer",
    name: "AI Resume Analyzer",
    tagline:
      "AI-powered resume analyzer providing ATS-style scoring, missing skill detection, and instant feedback.",
    overview:
      "Upload any PDF resume to receive intelligent ATS-style scoring, missing skills detection, and tailored improvement tips—powered by a React/TypeScript frontend on Vercel and a FastAPI Python backend using pdfplumber and Groq AI models (GPT-OSS + Qwen).",
    features: [
      "PDF resume upload & extraction via FastAPI and pdfplumber",
      "AI-powered ATS-style scoring and actionable improvement tips",
      "Missing skills detection aligned with industry expectations",
      "Ultra-fast inference via Groq API (OpenAI GPT-OSS + Qwen models)",
    ],
    techStack: [
      "React / TypeScript",
      "FastAPI (Python)",
      "pdfplumber",
      "Groq API",
      "Vercel & Render",
    ],
    demoUrl: "https://ai-resume-analyzer-dun-one.vercel.app/",
    githubUrl: "https://github.com/Hawtspecta/ai-resume-analyzer",
    caseStudy:
      "Full-stack PDF parsing and Groq LLM inference pipeline deployed across Vercel and Render.",
  },
};

const HUB_POSITIONS = [
  { x: "17%", y: "24%" },
  { x: "83%", y: "24%" },
  { x: "17%", y: "78%" },
  { x: "83%", y: "78%" },
] as const;

function normalizeTechIconName(tech: string): string {
  const t = tech.toLowerCase();
  if (t.includes("react")) return "React";
  if (t.includes("typescript")) return "TypeScript";
  if (t.includes("javascript")) return "JavaScript";
  if (t.includes("python")) return "Python";
  if (t.includes("fastapi")) return "FastAPI";
  if (t.includes("tailwind")) return "Tailwind";
  if (t.includes("node")) return "Node.js";
  if (t.includes("rag") || t.includes("ai") || t.includes("groq")) return "AI/ML";
  if (t.includes("figma")) return "Figma";
  if (t.includes("html")) return "HTML";
  if (t.includes("css")) return "CSS";
  return "AI/ML";
}

function ProjectTechHubVisual({ techStack }: { techStack: string[] }) {
  const nodes = HUB_POSITIONS.map((pos, idx) => ({
    ...pos,
    tech: techStack[idx] ?? techStack[0] ?? "React",
    iconName: normalizeTechIconName(techStack[idx] ?? techStack[0] ?? "React"),
  }));

  return (
    <div className="magic-bento__hub">
      <svg
        className="magic-bento__hub-links"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {nodes.map((node) => (
          <line
            key={node.x + node.y}
            x1={parseFloat(node.x)}
            y1={parseFloat(node.y)}
            x2="50"
            y2="51"
            pathLength="1"
          />
        ))}
      </svg>
      {nodes.map((node, index) => (
        <span
          key={`packet-${index}`}
          className="magic-bento__packet"
          style={
            {
              "--x": node.x,
              "--y": node.y,
              "--i": index,
            } as React.CSSProperties
          }
        />
      ))}
      {nodes.map((node, index) => (
        <span
          key={node.x + node.y}
          title={node.tech}
          className="magic-bento__hub-node magic-bento__tile"
          style={
            {
              "--x": node.x,
              "--y": node.y,
              "--s": "28px",
              "--i": index + 1,
            } as React.CSSProperties
          }
        >
          <TechBadgeIcon name={node.iconName} />
        </span>
      ))}
      <span
        className="magic-bento__hub-node magic-bento__tile"
        style={
          {
            "--x": "50%",
            "--y": "51%",
            "--s": "34px",
            "--i": 0,
          } as React.CSSProperties
        }
      >
        <HugeiconsIcon icon={SparklesIcon} size={17} strokeWidth={1.8} />
      </span>
    </div>
  );
}

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
      label: "02. MISSION & SCOPE",
      title: "Core Purpose",
      description: details.tagline,
      colSpan: 2,
      rowSpan: 1,
      visual: "analytics",
    },
    {
      label: "03. OVERVIEW",
      title: "Architecture & Solution",
      description: details.overview,
      colSpan: 2,
      rowSpan: 2,
      visual: "collaboration",
    },
    {
      label: "04. KEY FEATURES",
      title: "System Capabilities",
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
      visual: <ProjectTechHubVisual techStack={details.techStack} />,
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
