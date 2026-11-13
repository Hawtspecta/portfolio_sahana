<div align="center">

  <h1>Sahana Santosh Nayak</h1>
  <p><strong>AI / ML & Full-Stack Engineer</strong></p>
  <p><em>Obsessed with high-craft digital experiences, neural systems, and tactile web interfaces.</em></p>

  <p>
    <a href="https://portfolio-sahana.vercel.app"><strong>Explore Live Portfolio »</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

---

> [!IMPORTANT]
> **Proprietary & Copyright Notice:**  
> This repository is made public **strictly for portfolio review, code inspection, and hiring evaluation**. All visual designs, 3D assets, animations, and image sequences are the exclusive intellectual property of **Sahana Santosh Nayak**. Unauthorized cloning, redistribution, or replication of this portfolio is strictly prohibited. See [LICENSE.md](LICENSE.md).

---

## Table of Contents
- [Overview](#overview)
- [Architecture & Creative Engineering](#architecture--creative-engineering)
- [Featured Engineering Projects](#featured-engineering-projects)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [License & Intellectual Property](#license--intellectual-property)

---

## Overview

This repository powers **Sahana Nayak's** personal creative engineering portfolio. Built on **Next.js 16 (App Router)** and **React 19**, it blends retro hardware aesthetics, cinematic scroll-linked video canvas sequences, custom Three.js 3D physics simulations, and seamless multi-stage navigation into a unified 60/120fps client-side experience.

### Key Highlights
- **Multi-Stage Canvas Animation Engine:** Continuous synchronized canvas transitions from a cinematic typewriter splash, down to a retro CRT computer desk, through live project dossiers, interactive work experience, and a 3D educational timeline.
- **Lenis-Driven Scroll Choreography:** Synchronized scrub curves, momentum gliding, tactile checkpoints, and bidirectional stage handoffs with zero layout jitter.
- **Interactive 3D Kitten & Yarn Ball Simulation:** Real-time Three.js canvas featuring a procedural ginger tabby kitten that tracks and chases a rolling sage-green yarn ball following custom physics and tail-wag mechanics.
- **Dynamic WebGL2 Shaders & CRT Effects:** Custom WebGL2 matrix letter glitching, retro scanline filters, tactile desk pull-string lamp theme switcher, and custom cursor animations.
- **Ultra-Optimized Streaming & Caching:** 1-year immutable edge caching, batched background asset hydration, and non-blocking sub-component lazy loading.

---

## Architecture & Creative Engineering

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 APP RUNTIME                          │
├─────────────────┬──────────────────────┬───────────────────────────────┤
│  SPLASH STAGE   │     HERO STAGE       │      TRANSITION STAGE         │
│  Frames 14–209  │    Frames 1–119      │        Frames 1–106           │
│  Typewriter CRT │  Scroll-Linked Hero  │  Seamless Desk / Retro PC Handoff
├─────────────────┴──────────────────────┴───────────────────────────────┤
│                   PORTFOLIO ARENA (DESK OS RUNTIME)                    │
├────────────────────────┬────────────────────────┬──────────────────────┤
│    ABOUT ME (PC)       │   PROJECTS DOSSIER     │  EXPERIENCE & ROAD   │
│  Interactive PC Screen │  Fluid 3D Tab Carousel │  Work Experience     │
│  LetterGlitch Overlay  │  Live iframe Preview   │  Three.js Milestones │
│  Pull-String Lamp      │  Project Deep Dives    │  3D Cat CTA Contact  │
└────────────────────────┴────────────────────────┴──────────────────────┘
```

1. **Continuous Canvas Streamer:**  
   High-density WebP frame sequences are rendered onto hardware-accelerated HTML5 canvases using off-screen image decoding (`Image.decode()`) and responsive DPR clamping to maintain 60/120fps even on high-DPI retina displays.
2. **Synchronous Stage Handshake:**  
   Components coordinate scroll progress using calibrated Lenis runways, passing time-synchronized handoff frames between independent viewports without dropping frames or triggering cascading re-renders.
3. **Adaptive Preloading & Memory Management:**  
   Assets are prioritized through a staged queue: initial critical frames load immediately, while deeper project tabs, certificate scans, and 3D textures are lazily hydrated in non-blocking batches.

---

## Featured Engineering Projects

| Project | Tech Stack | Description | Live Demo |
| :--- | :--- | :--- | :---: |
| **AI Law Bot** | Next.js, Python, LLMs, Vector DB | Legal intelligence platform delivering automated legal research, case discovery, and statutory reasoning. | [Launch ↗](https://ai-law-bot-nu.vercel.app/) |
| **UFI (Aadhaar Friction Index)** | React, Data Analytics, Node.js | Citizen authentication optimization dashboard analyzing friction metrics across biometric update journeys. | [Launch ↗](https://ufi-omega.vercel.app/) |
| **Urban Brew** | Next.js, Tailwind, Motion | Modern artisanal coffee ordering platform with interactive brewing flows and fluid e-commerce aesthetics. | [Launch ↗](https://urban-brew-ten.vercel.app/) |
| **India Connect Hub** | Next.js, Interactive WebGL | Cultural storytelling and heritage platform designed to preserve and explore regional histories and arts. | [Launch ↗](https://india-connect-hub.vercel.app/) |
| **AI Resume Analyzer** | Python, NLP, Next.js, Tailwind | Intelligent ATS resume scanner scoring keyword alignment, formatting, and structural recommendations. | [Launch ↗](https://ai-resume-analyzer-dun-one.vercel.app/) |

---

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Core Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **3D & Graphics:** [Three.js](https://threejs.org/), Custom WebGL2 Shaders, Canvas2D
- **Smooth Scrolling:** [Lenis](https://lenis.darkroom.engineering/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Hugeicons](https://hugeicons.com/)
- **Deployment:** [Vercel Edge Network](https://vercel.com/)

---

## Local Development

Ensure you have **Node.js 18+** installed:

```bash
# 1. Clone the repository
git clone https://github.com/Hawtspecta/portfolio_sahana.git
cd portfolio_sahana

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:3000
```

### Production Build
```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run start
```

---

## License & Intellectual Property

**Copyright (c) 2025–2026 Sahana Santosh Nayak. All Rights Reserved.**

This repository is published for technical inspection, employment consideration, and peer review only.  
No license is granted to duplicate, redistribute, or use these designs, assets, or code for your own personal or commercial projects. See the full [LICENSE.md](LICENSE.md) for terms.

---

<div align="center">
  <p>Crafted with curiosity & code by <strong>Sahana Santosh Nayak</strong></p>
  <p>
    <a href="mailto:nayaksahana0307@gmail.com">nayaksahana0307@gmail.com</a> •
    <a href="https://github.com/Hawtspecta">GitHub</a> •
    <a href="https://portfolio-sahana.vercel.app">Portfolio</a>
  </p>
</div>
