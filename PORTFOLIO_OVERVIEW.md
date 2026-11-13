# Sahana Nayak Portfolio — Tech Stack, Design & Architecture Breakdown

> A comprehensive technical and creative deep dive into how this interactive, high-craft portfolio was built.

---

## 1. Quick Overview

- **Creator:** Sahana Santosh Nayak (AI / ML & Full-Stack Engineer)
- **Concept:** A multi-era digital interactive experience transitioning from analog hardware (mechanical typewriter) $\rightarrow$ vintage computing (retro CRT PC) $\rightarrow$ modern interactive software $\rightarrow$ 3D procedural simulation.
- **Performance Target:** Rock-solid 60/120fps client-side rendering with fluid trackpad/wheel scrub mechanics.
- **Live URL:** [portfolio-sahana.vercel.app](https://portfolio-sahana.vercel.app)

---

## 2. Full Tech Stack

| Layer | Technologies Used | What It Powers |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** (App Router, Turbopack/Webpack) | Server-side routing, static pre-rendering, edge asset caching, SEO metadata. |
| **Core UI** | **React 19** + **TypeScript** (Strict Mode) | Component architecture, state machines, typed props, concurrent transitions. |
| **3D Graphics** | **Three.js** (`three`) | Real-time 3D ginger cat + rolling yarn ball physics, 3D spline educational roadmap, procedural lighting. |
| **2D Animation Pipeline** | **HTML5 Canvas 2D Context** | High-DPI frame streaming (~450+ sequential WebP frames) with off-screen `Image.decode()`. |
| **Custom Shaders** | **WebGL2 (GLSL)** | Interactive Matrix LetterGlitch background effect, tear/flow distortion filters. |
| **Smooth Scrolling** | **Lenis Smooth Scroll** (`@studio-freight/lenis`) | Custom mathematical runways, momentum inertia, virtual scroll interception, and bidirectional handoffs. |
| **Styling** | **Tailwind CSS** + Custom CSS Modules | Responsive typography, glassmorphism overlays, custom keyframes, scanline CRT filters. |
| **Audio** | **HTML5 Audio API** + **Web Audio API** | Synchronized soundtrack playback, silent user-gesture unlock, mechanical switch sound synthesis. |
| **Icons & Fonts** | **Hugeicons**, **Google Fonts** (*Space Mono*, *Special Elite*, *Geist*) | Monospace terminals, retro typewriter stamps, clean modern sans-serif typography. |
| **Hosting & CDN** | **Vercel Edge Network** | Immutable asset caching (`public, max-age=31536000`), edge redirects, global CDN distribution. |

---

## 3. Design Philosophy & Visual Aesthetic

1. **Multi-Era Storytelling:**  
   Unlike typical generic portfolios with flat dark cards, the design takes the visitor on a journey through technological mediums:
   - **Stage 1 (Analog):** Physical typewriter printing real-time text stamps on vintage parchment.
   - **Stage 2 (Retro PC Era):** Zoom into a vintage CRT monitor with physical scanlines, desk clutter, and warm ambient room tones.
   - **Stage 3 (Modern Software):** Fluid carousel tabs, interactive dossiers, live iframe site previews, and clean developer logs.
   - **Stage 4 (Whimsical 3D World):** A winding 3D pathway across milestones ending with a warm ginger cat sleeping and playing with yarn.

2. **Palette & Atmosphere:**
   - **Beige / Cream / Espresso Palette:** `#fbf6ec` (warm paper), `#2b180e` (rich espresso brown), `#4a2c1d` (warm wood tone), `#059669` (emerald terminal accents).
   - **Tactile Skeuomorphism:** Authentic CRT glass glare, paper texture overlays, dropped shadows, and hardware details.

3. **Playful Nostalgia:**
   - **Hamster Wheel Loader:** An animated running hamster wheel indicating asset loading progress with a volume tip.
   - **Pull-String Desk Lamp:** A physical cord you can grab and yank down to snap between Day and Night mode with realistic sound.
   - **Dancing Kitten & Cat Paw Cursors:** Custom 20-frame meme cursor that transforms into a soft cat paw whenever hovering over clickable elements.

---

## 4. Animation & Physics Architecture

### A. The 60/120fps Multi-Stage Canvas Engine
- Rather than rendering heavy video tags (which suffer from seek latency and range-request stalls), video sequences were rendered into sequences of ultra-optimized WebP frames:
  - **Splash Sequence:** 196 frames (`014.webp` $\rightarrow$ `209.webp`)
  - **Hero Typewriter Sequence:** 119 frames (`001.webp` $\rightarrow$ `119.webp`)
  - **About Transition Sequence:** 106 frames (`001.webp` $\rightarrow$ `106.webp`)
- **Off-Thread Image Decoding:** Every single frame is asynchronously pre-decoded into GPU texture memory using `Image.decode()` before being touched by the canvas, preventing synchronous frame-dropping.
- **Dynamic DPR Clamping:** Automatically limits Canvas DPR to `Math.min(window.devicePixelRatio, 1.5)` to protect mobile and high-resolution laptops from GPU thermal throttling.

### B. Lenis Smooth-Scroll Choreography
- Traditional CSS scrolling cannot handle frame scrubbing cleanly. We integrated scoped **Lenis Smooth Scroll** instances with calibrated mathematical runways:
  - `HERO_RUNWAY_PX = 2200px` ($119$ frames $\approx 18.5\text{px}$ per frame)
  - `TRANSITION_RUNWAY_PX = 2000px` ($106$ frames $\approx 18.8\text{px}$ per frame)
- **Inertial Handoffs:** When scrolling past frame 119 of the Hero, the engine hands off momentum seamlessly to the Transition runway without any page jumping or visual flash.

### C. 3D Kitten & Yarn Ball Interactive Simulation
- Built with **Three.js** in a dedicated canvas layer:
  - **Procedural Geometry:** Modeled ginger cat anatomy (body, head, pointed ears, cream muzzle, blinking eyes, articulated tail).
  - **Physics Tracking:** A rolling sage-green yarn ball (`#2d6a4f`) that tracks mouse movements across the screen with natural deceleration and inertia.
  - **Cat IK & Tail Physics:** The cat turns its head toward the yarn ball, wags its tail dynamically, and rolls over into sleeping `"z z z"` state when left idle.

### D. 3D Spline Milestone Road
- An S-curve 3D road mathematically sampled across 72 control points using a $C^\infty$ harmonic sine curve ($4.0 \cdot \sin(u \cdot 4\pi)$).
- A 3D miniature kitten navigates down the road, stopping at educational milestones (SSC, HSC, B.Tech AI/ML at D.J. Sanghvi) with milestone card reveals.

---

## 5. Performance & Optimization Highlights

1. **Decoupled Render Loops:**  
   Heavy components like `<FlexCarousel />` and `<LetterGlitch />` are lazily mounted only when their specific section is entered (`scrollPos >= 1` or `entered === true`). This guarantees that 100% of GPU/CPU bandwidth is dedicated to smooth canvas scrubbing during transitions.
2. **Immutable Edge Caching:**  
   All `/assets/:path*` files are served with `Cache-Control: public, max-age=31536000, immutable`, meaning once a visitor loads an image or audio track, their browser serves it instantly from disk on subsequent visits.
3. **Instant In-Place Live Previews:**  
   When expanding a project tab, instead of redirecting the user away, a full-screen retro OS window opens with a responsive live `<iframe>` pre-warmed in memory, with zero wait time.
4. **Smart Audio Autoplay Workaround:**  
   Handles modern browser Autoplay security policies cleanly by attempting autoplay, quietly unlocking audio on any loading screen interaction, and providing a clean *"Click anywhere for sound"* pill fallback.

---

## 6. Featured Projects Showcased in the Portfolio

1. **AI Law Bot** — Next.js, Python, Vector DB, LLMs (Legal Intelligence & Statutory Analysis platform).
2. **UFI (Aadhaar Update Friction Index)** — React, Data Analytics, Node.js (Friction reduction dashboard for citizen identity updates).
3. **Urban Brew** — Next.js, Tailwind, Fluid Motion (Artisanal coffee ordering experience).
4. **India Connect Hub** — Next.js, WebGL (Cultural storytelling & heritage hub).
5. **AI Resume Analyzer** — Python, NLP, Next.js (Intelligent ATS resume evaluation system).

---

## 7. Summary for Reviewers & Recruiters

This website demonstrates:
- **Advanced Full-Stack Engineering:** Clean Next.js 16 App Router architecture, TypeScript strict typing, and high-performance Webpack optimization.
- **Creative Technology & Graphics:** Three.js 3D physics, WebGL2 GLSL shaders, and hardware-accelerated Canvas 2D animation.
- **Product Design & UX Craft:** Attention to micro-interactions, skeuomorphic retro aesthetics, custom sound design, and accessibility fallbacks.

