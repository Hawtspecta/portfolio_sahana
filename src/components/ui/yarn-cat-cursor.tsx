"use client";

import * as React from "react";
import * as THREE from "three";

export interface YarnCatCursorProps {
  /** CSS selector for elements the yarn may snag onto. */
  anchorSelector?: string;
  /** Size scale in px (defaults to viewport-responsive 140..240). */
  size?: number;
  /** Yarn thread color. */
  yarnColor?: string;
  /** Yarn ball color. */
  yarnBallColor?: string;
  /** Background bounce light color. */
  bounceColor?: string;
  /** Shadow color cast on the page. */
  shadowColor?: string;
  /** Maximum settled yarn threads kept at once. */
  maxThreads?: number;
  /** Let a butterfly flutter in now and then for the kitty to chase. */
  butterfly?: boolean;
  /** Still time before the kitty curls up to sleep (ms). */
  sleepAfter?: number;
  /** Initial yarn threads spun across marked elements on open. */
  seedYarn?: number;
  /** Drop in from the top on a yarn strand when entering. */
  enter?: boolean;
  /** Keys that untangle/clear all yarn. */
  clearKeys?: string[];
  /** Only run the animation loop when visible. */
  isVisible?: boolean;
  position?: "fixed" | "absolute";
  zIndex?: number;
  maxDpr?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Verlet Yarn Pool (shared particles so bridging strands pull on each other)
// ---------------------------------------------------------------------------
const MAXP = 6000;
const MAXC = 6000;

type AnchorRef = { el: Element | null; u: number; v: number; sx: number; sy: number };

type Thread = {
  id: number;
  parts: number[];
  cons: number[];
  owned: number[];
  state: number; // 0 drag, 1 set, 2 dying
  alpha: number;
  born: number;
  dieT: number;
  fluffs: number[]; // pairs: float index along parts, radius
  anchorEl: Element | null;
  hostIds: number[];
};

function createYarn() {
  const X = new Float32Array(MAXP);
  const Y = new Float32Array(MAXP);
  const PX = new Float32Array(MAXP);
  const PY = new Float32Array(MAXP);
  const INV = new Float32Array(MAXP);
  const PIN = new Int32Array(MAXP).fill(-1);
  const CA = new Int32Array(MAXC);
  const CB = new Int32Array(MAXC);
  const CR = new Float32Array(MAXC);
  const CON = new Uint8Array(MAXC);
  const freeP: number[] = [];
  const freeC: number[] = [];
  for (let i = MAXP - 1; i >= 0; i--) freeP.push(i);
  for (let i = MAXC - 1; i >= 0; i--) freeC.push(i);
  const anchors: (AnchorRef | null)[] = [];
  const freeA: number[] = [];
  const threads: Thread[] = [];
  let nextId = 1;
  const hw = { p: 0, c: 0 };

  const addAnchor = (a: AnchorRef) => {
    const id = freeA.length ? (freeA.pop() as number) : anchors.length;
    anchors[id] = a;
    return id;
  };
  const particle = (x: number, y: number, anchor: number) => {
    const i = freeP.pop();
    if (i === undefined) return -1;
    hw.p = Math.max(hw.p, i + 1);
    X[i] = PX[i] = x;
    Y[i] = PY[i] = y;
    PIN[i] = anchor;
    INV[i] = anchor >= 0 ? 0 : 1;
    return i;
  };
  const constraint = (a: number, b: number, rest: number) => {
    const c = freeC.pop();
    if (c === undefined) return -1;
    hw.c = Math.max(hw.c, c + 1);
    CA[c] = a;
    CB[c] = b;
    CR[c] = rest;
    CON[c] = 1;
    return c;
  };
  const freeThread = (t: Thread) => {
    for (const c of t.cons) {
      CON[c] = 0;
      freeC.push(c);
    }
    for (const p of t.owned) {
      const a = PIN[p];
      if (a >= 0) {
        anchors[a] = null;
        freeA.push(a);
      }
      PIN[p] = -1;
      INV[p] = 0;
      freeP.push(p);
    }
    t.cons.length = 0;
    t.owned.length = 0;
    t.parts.length = 0;
  };
  const newThread = (anchorEl: Element | null) => {
    const t: Thread = {
      id: nextId++,
      parts: [],
      cons: [],
      owned: [],
      state: 0,
      alpha: 1,
      born: 0,
      dieT: 0,
      fluffs: [],
      anchorEl,
      hostIds: [],
    };
    threads.push(t);
    return t;
  };
  const length = (t: Thread) => {
    let L = 0;
    for (let k = 1; k < t.parts.length; k++) {
      const a = t.parts[k - 1],
        b = t.parts[k];
      L += Math.hypot(X[b] - X[a], Y[b] - Y[a]);
    }
    return L;
  };
  const unpin = (p: number) => {
    const a = PIN[p];
    if (a >= 0) {
      anchors[a] = null;
      freeA.push(a);
    }
    PIN[p] = -1;
    INV[p] = 1;
  };
  const span = (t: Thread, a: number, b: number, seg: number, slack: number) => {
    const d = Math.hypot(X[b] - X[a], Y[b] - Y[a]);
    const n = Math.max(2, Math.min(36, Math.round(d / seg)));
    const rest = (d * (1 + slack)) / n;
    let prev = a;
    t.parts.push(a);
    for (let k = 1; k < n; k++) {
      const f = k / n;
      const sag = Math.sin(Math.PI * f) * d * slack * 0.95;
      const p = particle(X[a] + (X[b] - X[a]) * f, Y[a] + (Y[b] - Y[a]) * f + sag, -1);
      if (p < 0) break;
      t.owned.push(p);
      t.parts.push(p);
      t.cons.push(constraint(prev, p, rest));
      prev = p;
    }
    t.parts.push(b);
    t.cons.push(constraint(prev, b, rest));
  };
  const sprinkleFluff = (t: Thread, rand: () => number, scale: number) => {
    t.fluffs.length = 0;
    const L = length(t);
    const n = Math.floor(L / (28 + rand() * 34));
    for (let k = 0; k < n; k++) {
      t.fluffs.push(1 + rand() * Math.max(1, t.parts.length - 3), (0.8 + rand() * 1.1) * scale);
    }
  };

  return {
    X,
    Y,
    PX,
    PY,
    INV,
    PIN,
    CA,
    CB,
    CR,
    CON,
    anchors,
    threads,
    hw,
    addAnchor,
    particle,
    constraint,
    freeThread,
    newThread,
    length,
    unpin,
    span,
    sprinkleFluff,
  };
}
type Yarn = ReturnType<typeof createYarn>;

function stepYarn(s: Yarn, dt: number, time: number, rects: Map<Element, DOMRect>, iters: number) {
  const { X, Y, PX, PY, INV, PIN, CA, CB, CR, CON, anchors, hw } = s;
  const g = 640 * dt * dt;
  for (let i = 0; i < hw.p; i++) {
    const a = PIN[i];
    if (a >= 0) {
      const an = anchors[a];
      if (!an) continue;
      if (an.el) {
        const r = rects.get(an.el);
        if (r) {
          X[i] = r.left + an.u * r.width;
          Y[i] = r.top + an.v * r.height;
        }
      } else {
        X[i] = an.sx;
        Y[i] = an.sy;
      }
      PX[i] = X[i];
      PY[i] = Y[i];
      continue;
    }
    if (INV[i] === 0) continue;
    const vx = (X[i] - PX[i]) * 0.985;
    const vy = (Y[i] - PY[i]) * 0.985;
    PX[i] = X[i];
    PY[i] = Y[i];
    const breeze = Math.sin(time * 0.9 + X[i] * 0.006 + Y[i] * 0.004) * 8 * dt * dt;
    X[i] += vx + breeze;
    Y[i] += vy + g * INV[i];
  }
  for (let it = 0; it < iters; it++) {
    for (let c = 0; c < hw.c; c++) {
      if (!CON[c]) continue;
      const a = CA[c],
        b = CB[c];
      const wa = INV[a],
        wb = INV[b];
      const w = wa + wb;
      if (w === 0) continue;
      const dx = X[b] - X[a],
        dy = Y[b] - Y[a];
      const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      if (d <= CR[c]) continue;
      const k = ((d - CR[c]) / d / w) * 0.92;
      X[a] += dx * k * wa;
      Y[a] += dy * k * wa;
      X[b] -= dx * k * wb;
      Y[b] -= dy * k * wb;
    }
  }
}

// ---------------------------------------------------------------------------
// 3D Procedural Kitty + Rolling Yarn Ball (Y-up, facing +X in local space)
// ---------------------------------------------------------------------------
type CatLegState = {
  hip: THREE.Group;
  shin: THREE.Group;
  restLocal: THREE.Vector3;
  fx: number;
  fy: number;
  fz: number;
  sx: number;
  sy: number;
  t: number;
  stepping: boolean;
  dur: number;
};

type CatRig = {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  earL: THREE.Mesh;
  earR: THREE.Mesh;
  eyeL: THREE.Mesh;
  eyeR: THREE.Mesh;
  pupilL: THREE.Mesh;
  pupilR: THREE.Mesh;
  lidL: THREE.Mesh;
  lidR: THREE.Mesh;
  legs: CatLegState[];
  yarnBall: THREE.Group;
  yarnSpoolLocal: THREE.Vector3;
  headFrontLocal: THREE.Vector3;
};

function buildCatRig(yarnBallColor: string): CatRig {
  const root = new THREE.Group();

  const ginger = new THREE.MeshStandardMaterial({ color: 0xee8a42, roughness: 0.78, metalness: 0.02 });
  const stripe = new THREE.MeshStandardMaterial({ color: 0xb8531b, roughness: 0.82, metalness: 0.02 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.8, metalness: 0.02 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf4a2a8, roughness: 0.65, metalness: 0.02 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15, metalness: 0.1 });
  const eyeGlow = new THREE.MeshBasicMaterial({ color: 0xfdf3dc });

  // Torso (plump, compact, centered so head, legs, and tail overlap seamlessly)
  const torso = new THREE.Group();
  torso.position.set(0, 0, 0.13);
  root.add(torso);

  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.15, 12, 18), ginger);
  bodyMesh.rotation.z = Math.PI / 2;
  bodyMesh.scale.set(1, 0.94, 0.98);
  bodyMesh.castShadow = true;
  torso.add(bodyMesh);

  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 12), cream);
  bellyMesh.position.set(0.02, 0, -0.025);
  bellyMesh.scale.set(1.35, 0.78, 0.72);
  torso.add(bellyMesh);

  // Cute tabby stripes along back
  for (const sx of [-0.06, 0.0, 0.055]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 18, Math.PI * 1.1), stripe);
    band.rotation.y = Math.PI / 2;
    band.rotation.x = -Math.PI * 0.06;
    band.position.set(sx, 0, 0.012);
    torso.add(band);
  }

  // Head (overlapping front of torso cleanly)
  const head = new THREE.Group();
  head.position.set(0.135, 0, 0.085);
  torso.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 18), ginger);
  skull.scale.set(0.95, 1.06, 0.92);
  skull.castShadow = true;
  head.add(skull);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), cream);
  muzzle.position.set(0.082, 0, -0.022);
  muzzle.scale.set(0.75, 1.15, 0.78);
  head.add(muzzle);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.018, 3), pink);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.118, 0, -0.008);
  head.add(nose);

  // Pointed ears
  const earGeo = new THREE.ConeGeometry(0.04, 0.082, 4);
  const earL = new THREE.Mesh(earGeo, ginger);
  earL.position.set(0.0, 0.068, 0.084);
  earL.rotation.set(0.26, 0.2, 0.12);
  earL.castShadow = true;
  head.add(earL);

  const earR = new THREE.Mesh(earGeo, ginger);
  earR.position.set(0.0, -0.068, 0.084);
  earR.rotation.set(-0.26, 0.2, -0.12);
  earR.castShadow = true;
  head.add(earR);

  // Eyes + animated eyelids (full lid sphere + dark lash line when closed)
  const eyeGeo = new THREE.SphereGeometry(0.021, 10, 10);
  const pupilGeo = new THREE.SphereGeometry(0.013, 10, 10);
  const lidGeo = new THREE.SphereGeometry(0.024, 12, 10);

  const eyeL = new THREE.Mesh(eyeGeo, eyeGlow);
  eyeL.position.set(0.09, 0.044, 0.02);
  head.add(eyeL);
  const pupilL = new THREE.Mesh(pupilGeo, eyeMat);
  pupilL.position.set(0.102, 0.046, 0.02);
  head.add(pupilL);
  const lidL = new THREE.Mesh(lidGeo, ginger);
  lidL.position.copy(eyeL.position);
  lidL.rotation.y = Math.PI / 2;
  lidL.scale.setScalar(0.01);
  head.add(lidL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeGlow);
  eyeR.position.set(0.09, -0.044, 0.02);
  head.add(eyeR);
  const pupilR = new THREE.Mesh(pupilGeo, eyeMat);
  pupilR.position.set(0.102, -0.046, 0.02);
  head.add(pupilR);
  const lidR = new THREE.Mesh(lidGeo, ginger);
  lidR.position.copy(eyeR.position);
  lidR.rotation.y = Math.PI / 2;
  lidR.scale.setScalar(0.01);
  head.add(lidR);

  // Attached curved Tail (root embedded cleanly inside the back of the torso!)
  const tail = new THREE.Group();
  tail.position.set(-0.115, 0, 0.02);
  torso.add(tail);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0, 0),
    new THREE.Vector3(-0.05, 0, 0.03),
    new THREE.Vector3(-0.1, 0, 0.1),
    new THREE.Vector3(-0.08, 0, 0.175),
  ]);
  const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 14, 0.022, 8, false), ginger);
  tailMesh.castShadow = true;
  tail.add(tailMesh);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), cream);
  tailTip.position.set(-0.08, 0, 0.175);
  tail.add(tailTip);

  // 4 Articulated Legs: FL (0), FR (1), BL (2), BR (3)
  const legSpecs = [
    { x: 0.085, y: 0.062 },
    { x: 0.085, y: -0.062 },
    { x: -0.085, y: 0.062 },
    { x: -0.085, y: -0.062 },
  ];
  const legs: CatLegState[] = legSpecs.map((spec) => {
    const hip = new THREE.Group();
    hip.position.set(spec.x, spec.y, 0.095);
    root.add(hip);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.042, 6, 10), ginger);
    upper.rotation.x = Math.PI / 2;
    upper.position.set(0, 0, -0.026);
    upper.castShadow = true;
    hip.add(upper);

    const shin = new THREE.Group();
    shin.position.set(0, 0, -0.05);
    hip.add(shin);

    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.038, 6, 10), cream);
    lower.rotation.x = Math.PI / 2;
    lower.position.set(0, 0, -0.022);
    lower.castShadow = true;
    shin.add(lower);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), cream);
    paw.position.set(0.01, 0, -0.042);
    paw.scale.set(1.2, 1.0, 0.65);
    shin.add(paw);

    return {
      hip,
      shin,
      restLocal: new THREE.Vector3(spec.x, spec.y, 0),
      fx: 0,
      fy: 0,
      fz: 0,
      sx: 0,
      sy: 0,
      t: 0,
      stepping: false,
      dur: 0.15,
    };
  });

  // 3D Yarn Ball right in front of the kitty's paws (kitty bats & rolls it!)
  const yarnBall = new THREE.Group();
  const yarnMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(yarnBallColor),
    roughness: 0.85,
    metalness: 0.02,
  });
  const yarnCore = new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 16), yarnMat);
  yarnCore.castShadow = true;
  yarnBall.add(yarnCore);

  const strandMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(yarnBallColor).offsetHSL(0, 0.04, 0.07),
    roughness: 0.78,
  });
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.079, 0.009, 8, 22), strandMat);
    ring.rotation.set(i * 0.55, i * 0.9, i * 0.35);
    yarnBall.add(ring);
  }
  yarnBall.position.set(0.24, 0.07, 0.082);
  root.add(yarnBall);

  return {
    root,
    torso,
    head,
    tail,
    earL,
    earR,
    eyeL,
    eyeR,
    pupilL,
    pupilR,
    lidL,
    lidR,
    legs,
    yarnBall,
    yarnSpoolLocal: new THREE.Vector3(0.24, 0.07, 0.04),
    headFrontLocal: new THREE.Vector3(0.24, 0, 0.22),
  };
}

// Alternating trot gait: FL+BR (0, 3) and FR+BL (1, 2)
const CAT_GROUP = [0, 1, 1, 0];

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const angDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function YarnCatCursor({
  anchorSelector = "[data-yarn-anchor]",
  size,
  yarnColor = "#fff6e5",
  yarnBallColor = "#f97352",
  bounceColor = "#1530e6",
  shadowColor = "#000a3a",
  maxThreads = 95,
  butterfly = true,
  sleepAfter = 4500,
  enter = true,
  seedYarn = 5,
  clearKeys = ["Delete", "Backspace"],
  isVisible = true,
  position = "absolute",
  zIndex = 30,
  maxDpr = 2,
  className,
}: YarnCatCursorProps) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const yarnRef = React.useRef<HTMLCanvasElement | null>(null);
  const glRef = React.useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = React.useRef(isVisible);
  React.useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  const opts = React.useRef({
    anchorSelector,
    size,
    yarnColor,
    maxThreads,
    butterfly,
    sleepAfter,
    enter,
    clearKeys,
  });
  React.useEffect(() => {
    opts.current = {
      anchorSelector,
      size,
      yarnColor,
      maxThreads,
      butterfly,
      sleepAfter,
      enter,
      clearKeys,
    };
  }, [anchorSelector, size, yarnColor, maxThreads, butterfly, sleepAfter, enter, clearKeys]);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const yarnCanvas = yarnRef.current;
    const glCanvas = glRef.current;
    if (!wrap || !yarnCanvas || !glCanvas) return;
    const ctx = yarnCanvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = mulberry(0xca75);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const hemi = new THREE.HemisphereLight(0xfff7ed, new THREE.Color(bounceColor), 0.95);
    hemi.position.set(0, 0, 1);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff3e0, 1.85);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.radius = 4;
    key.shadow.bias = -0.0008;
    scene.add(key, key.target);

    const rim = new THREE.DirectionalLight(0xc7d2fe, 0.75);
    scene.add(rim, rim.target);

    const camera = new THREE.PerspectiveCamera(20, 1, 1, 20000);
    const catcher = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShadowMaterial({ color: new THREE.Color(shadowColor), opacity: 0.36 })
    );
    catcher.receiveShadow = true;
    scene.add(catcher);

    const body = new THREE.Group();
    scene.add(body);
    const rig = buildCatRig(yarnBallColor);
    body.add(rig.root);

    let W = 1,
      H = 1,
      dpr = 1,
      S = 180;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      yarnCanvas.width = Math.round(W * dpr);
      yarnCanvas.height = Math.round(H * dpr);
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
      const fov = camera.fov * (Math.PI / 180);
      const dist = H / 2 / Math.tan(fov / 2);
      camera.aspect = W / H;
      camera.position.set(W / 2, -H / 2, dist);
      camera.near = dist * 0.5;
      camera.far = dist * 1.6;
      camera.lookAt(W / 2, -H / 2, 0);
      camera.updateProjectionMatrix();
      S = opts.current.size ?? clamp(Math.min(W, H * 1.35) * 0.19, 130, 230);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const cat = {
      x: W * 0.5,
      y: -S,
      vx: 0,
      vy: 0,
      th: Math.PI / 2,
      pitch: 0,
      roll: 0,
      z: 0,
      vz: 0,
      mode: reduced ? "idle" : opts.current.enter ? "enter" : "sleep",
      t: 0,
      idleT: 0,
      blink: 0,
      sleep: !reduced && !opts.current.enter ? 1 : 0,
      eyesClosed: !reduced && !opts.current.enter ? 1 : 0,
      preferGroup: 0,
      enterX: W * 0.5,
      enterY: H * 0.38,
      landed: false,
      ballSpin: 0,
    };
    if (cat.mode !== "enter") {
      cat.x = Math.max(S * 0.8, W - S * 0.9);
      cat.y = Math.max(S * 0.8, H - S * 0.85);
      cat.th = Math.PI * 0.75;
      cat.landed = true;
    }

    const placeFeet = () => {
      const c = Math.cos(cat.th),
        s = Math.sin(cat.th);
      for (const lg of rig.legs) {
        const lx = lg.restLocal.x * S,
          ly = -lg.restLocal.y * S;
        lg.fx = cat.x + lx * c - ly * s;
        lg.fy = cat.y + lx * s + ly * c;
        lg.fz = 0;
      }
    };
    placeFeet();

    const ptr = { x: cat.x, y: cat.y, has: false, lastMove: -1e9, ix: cat.x, iy: cat.y };

    // ---------------- yarn state ----------------
    const yarn = createYarn();
    let drag: Thread | null = null;
    let dragEl: Element | null = null;
    let tackX = 0,
      tackY = 0;
    let dropLine: Thread | null = null;
    let anchorEls: Element[] = [];
    let anchorScan = 0;
    const rects = new Map<Element, DOMRect>();

    const scanAnchors = () => {
      const root = position === "fixed" ? document : wrap.parentElement ?? document;
      anchorEls = Array.from(root.querySelectorAll(opts.current.anchorSelector));
    };
    scanAnchors();

    const spoolPage = new THREE.Vector3();
    const headPage = new THREE.Vector3();
    const toPage = (local: THREE.Vector3, out: THREE.Vector3) => {
      out.copy(local).applyMatrix4(rig.root.matrixWorld);
      out.y = -out.y;
      return out;
    };

    const anchorAt = (x: number, y: number, el: Element | null) => {
      if (!el) return yarn.addAnchor({ el: null, u: 0, v: 0, sx: x, sy: y });
      const r = rects.get(el) as DOMRect;
      return yarn.addAnchor({
        el,
        u: (x - r.left) / Math.max(1, r.width),
        v: (y - r.top) / Math.max(1, r.height),
        sx: x,
        sy: y,
      });
    };

    const startDrag = (x: number, y: number, el: Element) => {
      const t = yarn.newThread(el);
      const a = yarn.particle(x, y, anchorAt(x, y, el));
      const s = yarn.particle(x, y, yarn.addAnchor({ el: null, u: 0, v: 0, sx: x, sy: y }));
      if (a < 0 || s < 0) return null;
      t.owned.push(a, s);
      t.parts.push(a, s);
      t.cons.push(yarn.constraint(a, s, 0.5));
      t.born = cat.t;
      drag = t;
      dragEl = el;
      tackX = x;
      tackY = y;
      return t;
    };

    const dragEnd = (t: Thread) => t.parts[t.parts.length - 1];

    const feedDrag = (x: number, y: number) => {
      if (!drag) return;
      const s = dragEnd(drag);
      const an = yarn.anchors[yarn.PIN[s]];
      if (an) {
        an.sx = x;
        an.sy = y;
      }
      const prev = drag.parts[drag.parts.length - 2];
      const seg = Math.max(12, S * 0.08);
      const d = Math.hypot(x - yarn.X[prev], y - yarn.Y[prev]);
      if (d > seg && drag.parts.length < 60) {
        yarn.unpin(s);
        yarn.X[s] = yarn.PX[s] = x;
        yarn.Y[s] = yarn.PY[s] = y;
        const c = drag.cons[drag.cons.length - 1];
        yarn.CR[c] = d;
        const ns = yarn.particle(x, y, yarn.addAnchor({ el: null, u: 0, v: 0, sx: x, sy: y }));
        if (ns < 0) return;
        drag.owned.push(ns);
        drag.parts.push(ns);
        drag.cons.push(yarn.constraint(s, ns, 0.5));
      } else {
        yarn.CR[drag.cons[drag.cons.length - 1]] = Math.max(0.5, d);
      }
    };

    const setThreads = () => yarn.threads.filter((t) => t.state === 1);

    const lay = (a: number, b: number, el: Element | null) => {
      const t = yarn.newThread(el);
      yarn.span(t, a, b, Math.max(12, S * 0.08), 0.03 + rand() * 0.06);
      t.state = 1;
      t.born = -10;
      yarn.sprinkleFluff(t, rand, Math.sqrt(S / 200));
      return t;
    };

    const bridgeFrom = (t: Thread) => {
      const mid = t.parts[Math.floor(t.parts.length / 2)];
      let best = -1,
        bd = S * 1.15,
        host: Thread | null = null;
      for (const o of setThreads()) {
        if (o === t || o.parts.length < 4) continue;
        for (let k = 1; k < o.parts.length - 1; k++) {
          const p = o.parts[k];
          const d = Math.hypot(yarn.X[p] - yarn.X[mid], yarn.Y[p] - yarn.Y[mid]);
          if (d < bd && d > S * 0.18) {
            bd = d;
            best = p;
            host = o;
          }
        }
      }
      if (best < 0 || !host) return;
      const b = lay(mid, best, null);
      b.born = cat.t;
      b.hostIds.push(t.id, host.id);
    };

    const seed = (n: number) => {
      const els = anchorEls.filter((e) => {
        const r = rects.get(e);
        return !!r && r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < H;
      });
      if (els.length < 2) return;
      const pt = (el: Element) => {
        const r = rects.get(el) as DOMRect;
        return [r.left + r.width * (0.15 + rand() * 0.7), r.top + r.height * (0.12 + rand() * 0.55)];
      };
      const made: Thread[] = [];
      for (let k = 0, tries = 0; k < n && tries < n * 12; tries++) {
        const A = els[Math.floor(rand() * els.length)];
        const ra = rects.get(A) as DOMRect;
        const near = els.filter((e) => {
          if (e === A) return false;
          const r = rects.get(e) as DOMRect;
          const d = Math.hypot(
            r.left + r.width / 2 - ra.left - ra.width / 2,
            r.top + r.height / 2 - ra.top - ra.height / 2
          );
          return d > S * 0.35 && d < Math.min(W, H) * 0.65;
        });
        if (!near.length) continue;
        const B = near[Math.floor(rand() * near.length)];
        const [ax, ay] = pt(A),
          [bx, by] = pt(B);
        const pa = yarn.particle(ax, ay, anchorAt(ax, ay, A));
        const pb = yarn.particle(bx, by, anchorAt(bx, by, B));
        if (pa < 0 || pb < 0) break;
        const t = lay(pa, pb, A);
        t.owned.push(pa, pb);
        made.push(t);
        k++;
      }
      for (const t of made) if (rand() < 0.6) bridgeFrom(t);
    };
    let seeded = reduced || seedYarn <= 0;

    const kill = (t: Thread, burst: boolean) => {
      if (t.state === 2) return;
      t.state = 2;
      t.dieT = 0;
      for (const o of yarn.threads) if (o.hostIds.includes(t.id)) kill(o, burst);
      for (const p of t.parts) {
        yarn.unpin(p);
        if (burst) {
          yarn.PX[p] = yarn.X[p] - (rand() - 0.5) * 6;
          yarn.PY[p] = yarn.Y[p] + 1 + rand() * 3;
        }
      }
    };

    const attach = (x: number, y: number, el: Element) => {
      if (!drag) return;
      const t = drag;
      const s = dragEnd(t);
      const a0 = t.parts[0];
      const straight = Math.hypot(yarn.X[a0] - x, yarn.Y[a0] - y);
      if (straight < S * 0.1) {
        yarn.freeThread(t);
        yarn.threads.splice(yarn.threads.indexOf(t), 1);
        drag = null;
        startDrag(x, y, el);
        return;
      }
      const an = yarn.anchors[yarn.PIN[s]];
      if (an) {
        const r = rects.get(el) as DOMRect;
        an.el = el;
        an.u = (x - r.left) / Math.max(1, r.width);
        an.v = (y - r.top) / Math.max(1, r.height);
      }
      const parts = t.parts;
      const n = parts.length;
      for (let k = 1; k < n - 1; k++) {
        const p = parts[k];
        const f = k / (n - 1);
        yarn.X[p] = yarn.X[a0] + (x - yarn.X[a0]) * f + (rand() - 0.5) * 3;
        yarn.Y[p] = yarn.Y[a0] + (y - yarn.Y[a0]) * f;
        yarn.PX[p] = yarn.X[p] + (rand() - 0.5) * 2;
        yarn.PY[p] = yarn.Y[p] - 4 * Math.sin(Math.PI * f);
      }
      const slack = 0.02 + rand() * 0.055;
      const rest = (straight * (1 + slack)) / (n - 1);
      for (const c of t.cons) yarn.CR[c] = rest;
      t.state = 1;
      t.born = cat.t;
      yarn.sprinkleFluff(t, rand, Math.sqrt(S / 200));
      drag = null;

      if (rand() < 0.72) bridgeFrom(t);
      const live = setThreads();
      const over = live.length - opts.current.maxThreads;
      for (let k = 0; k < over; k++) kill(live[k], false);
      startDrag(x, y, el);
    };

    const wake = () => {
      cat.mode = "walk";
      cat.idleT = 0;
      cat.vz += S * 0.75;
    };

    const clearAll = () => {
      for (const t of yarn.threads) kill(t, true);
      drag = null;
      dragEl = null;
      if (cat.mode === "sleep") wake();
      cat.vz += S * 0.9;
    };

    // Butterfly toy state
    const bfly = {
      on: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      t: 0,
      caught: -1,
      batted: 0,
      next: 8 + rand() * 6,
      seed: 0,
      cx: 0,
      cy: 0,
    };

    // Input handlers
    const onMove = (x: number, y: number) => {
      if (!isVisibleRef.current) return;
      const r = wrap.getBoundingClientRect();
      const nx = x - r.left,
        ny = y - r.top;
      if (nx < -40 || ny < -40 || nx > r.width + 40 || ny > r.height + 40) return;
      if (!ptr.has || Math.hypot(nx - ptr.x, ny - ptr.y) > 0.5) ptr.lastMove = cat.t;
      ptr.x = nx;
      ptr.y = ny;
      ptr.has = true;
    };
    const pm = (e: PointerEvent) => onMove(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const kd = (e: KeyboardEvent) => {
      if (!isVisibleRef.current) return;
      if (!opts.current.clearKeys.includes(e.key)) return;
      if (isTyping(document.activeElement)) return;
      if (!yarn.threads.length) return;
      clearAll();
    };
    window.addEventListener("pointermove", pm, { passive: true });
    window.addEventListener("pointerdown", pm, { passive: true });
    window.addEventListener("touchstart", tm, { passive: true });
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("keydown", kd);

    const pluck = (x: number, y: number) => {
      const r = S * 0.09;
      for (const t of yarn.threads) {
        if (t.state !== 1) continue;
        for (const p of t.parts) {
          if (yarn.INV[p] === 0) continue;
          const d = Math.hypot(yarn.X[p] - x, yarn.Y[p] - y);
          if (d < r) yarn.PY[p] -= 2.4 * (1 - d / r);
        }
      }
    };

    const updateCat = (dt: number) => {
      cat.t += dt;
      const o = opts.current;
      if (cat.mode === "enter") {
        const t = cat.t;
        const dropT = 1.65;
        const p = Math.min(1, t / dropT);
        const ease = 1 - Math.pow(1 - p, 3);
        cat.x = cat.enterX + Math.sin(t * 2.1) * S * 0.04 * Math.exp(-t * 0.5);
        cat.y = -S * 0.65 + (cat.enterY + S * 0.65) * ease;
        if (t > dropT) cat.y += Math.sin((t - dropT) * 9) * S * 0.06 * Math.exp(-(t - dropT) * 3);
        cat.th = Math.PI / 2 + Math.sin(t * 1.4) * 0.2 * Math.exp(-t * 0.4);
        cat.pitch += (0.38 - cat.pitch) * damp(3, dt);
        if (!dropLine) {
          const tl = yarn.newThread(null);
          const a = yarn.particle(cat.enterX, -2, yarn.addAnchor({ el: null, u: 0, v: 0, sx: cat.enterX, sy: -2 }));
          const b = yarn.particle(cat.enterX, -1, yarn.addAnchor({ el: null, u: 0, v: 0, sx: cat.enterX, sy: -1 }));
          tl.owned.push(a, b);
          tl.parts.push(a, b);
          tl.cons.push(yarn.constraint(a, b, 1));
          tl.state = 1;
          dropLine = tl;
        }
        if (t > 2.2 && !cat.landed) {
          cat.landed = true;
          if (dropLine) {
            const end = dropLine.parts[dropLine.parts.length - 1];
            yarn.unpin(end);
            yarn.PY[end] = yarn.Y[end] + 14;
            const tl = dropLine;
            setTimeout(() => kill(tl, false), 650);
          }
          cat.mode = "idle";
          cat.idleT = 0.4;
          cat.vx = cat.vy = 0;
          placeFeet();
          if (!ptr.has) {
            ptr.x = cat.x;
            ptr.y = cat.y;
          }
        }
        return;
      }

      const moved = ptr.has && cat.t - ptr.lastMove < 0.25;
      const chaseBfly = !reduced && bfly.on && bfly.caught >= 0 && !moved && cat.t - ptr.lastMove > 1.0;
      let tx = ptr.x,
        ty = ptr.y;
      if (chaseBfly) {
        tx = yarn.X[bfly.caught];
        ty = yarn.Y[bfly.caught];
      }
      if (reduced) {
        tx = cat.x;
        ty = cat.y;
      }
      const dx = tx - cat.x,
        dy = ty - cat.y;
      const dist = Math.hypot(dx, dy);

      if (cat.mode === "sleep") {
        if ((moved && Math.hypot(ptr.x - ptr.ix, ptr.y - ptr.iy) > 4) || (chaseBfly && bfly.t > 1.5)) wake();
      } else if (moved || chaseBfly || dist > S * 0.14) {
        if (cat.mode !== "walk" && cat.mode !== "hunt") {
          cat.mode = "walk";
          cat.idleT = 0;
        }
        if (chaseBfly) cat.mode = "hunt";
        else if (cat.mode === "hunt") cat.mode = "walk";
      }

      if (cat.mode === "walk" || cat.mode === "hunt") {
        const maxV = S * 2.55;
        const stop = cat.mode === "hunt" ? S * 0.3 : 6;
        let want = Math.min(maxV, Math.max(0, dist - stop) * 3.1);
        const head = Math.atan2(dy, dx);
        const err = Math.abs(angDiff(cat.th, head));
        want *= clamp(Math.cos(err) * 1.2, 0.2, 1);
        const ux = dist > 0.001 ? dx / dist : 0,
          uy = dist > 0.001 ? dy / dist : 0;
        cat.vx += (ux * want - cat.vx) * damp(6.5, dt);
        cat.vy += (uy * want - cat.vy) * damp(6.5, dt);
        const speed = Math.hypot(cat.vx, cat.vy);
        if (dist > 6) {
          const turn = angDiff(cat.th, head);
          cat.th += clamp(turn, -8 * dt, 8 * dt) * Math.min(1, 0.25 + speed / (S * 0.3));
        }
        cat.x += cat.vx * dt;
        cat.y += cat.vy * dt;
        cat.ballSpin += (speed / Math.max(1, S)) * dt * 6;
        cat.pitch += (0 - cat.pitch) * damp(9, dt);
        if (!moved && dist <= stop + 6 && speed < S * 0.06) {
          if (cat.mode === "hunt") {
            bfly.batted += dt;
          } else {
            cat.mode = "idle";
            cat.idleT = 0;
            ptr.ix = ptr.x;
            ptr.iy = ptr.y;
          }
        }
      } else {
        cat.vx += (0 - cat.vx) * damp(10, dt);
        cat.vy += (0 - cat.vy) * damp(10, dt);
        cat.x += cat.vx * dt;
        cat.y += cat.vy * dt;
      }

      if (cat.mode === "idle") {
        cat.idleT += dt;
        const bt = cat.idleT - 1.0;
        cat.blink =
          bt > 0 && bt < 0.18
            ? Math.sin((bt / 0.18) * Math.PI)
            : bt > 0.34 && bt < 0.52
              ? Math.sin(((bt - 0.34) / 0.18) * Math.PI)
              : 0;
        if (!reduced && cat.idleT * 1000 > o.sleepAfter) {
          cat.mode = "sleep";
          ptr.ix = ptr.x;
          ptr.iy = ptr.y;
        }
      }

      const sleeping = cat.mode === "sleep";
      cat.sleep += ((sleeping ? 1 : 0) - cat.sleep) * damp(sleeping ? 1.5 : 7, dt);
      if (sleeping) cat.pitch += (0 - cat.pitch) * damp(2.5, dt);
      cat.eyesClosed = Math.max(cat.blink, cat.sleep);

      cat.vz += (-cat.z * 160 - cat.vz * 14) * dt;
      cat.z += cat.vz * dt;
      const lat = -Math.sin(cat.th) * cat.vx + Math.cos(cat.th) * cat.vy;
      cat.roll += (clamp(-lat / (S * 30), -0.1, 0.1) - cat.roll) * damp(6, dt);
    };

    const updateCatLegs = (dt: number) => {
      const c = Math.cos(cat.th),
        s = Math.sin(cat.th);
      const speed = Math.hypot(cat.vx, cat.vy);
      const walking = cat.mode === "walk" || cat.mode === "hunt";
      const dur = clamp(0.18 - (speed / S) * 0.03, 0.085, 0.18);
      const lead = dur * 0.9;
      const thresh = (walking ? 0.095 : 0.045) * S;
      const errs: number[] = [];
      const homes: number[] = [];

      for (let i = 0; i < 4; i++) {
        const lg = rig.legs[i];
        const lx = lg.restLocal.x * S,
          ly = -lg.restLocal.y * S;
        const hx = cat.x + lx * c - ly * s + cat.vx * lead;
        const hy = cat.y + lx * s + ly * c + cat.vy * lead;
        homes.push(hx, hy);
        errs.push(Math.hypot(lg.fx - hx, lg.fy - hy));
        if (errs[i] > S * 0.55) {
          lg.fx = hx;
          lg.fy = hy;
          lg.stepping = false;
          errs[i] = 0;
        }
      }

      const stepping = [false, false];
      for (let i = 0; i < 4; i++) if (rig.legs[i].stepping) stepping[CAT_GROUP[i]] = true;
      for (const g of [cat.preferGroup, 1 - cat.preferGroup]) {
        if (stepping[0] || stepping[1]) break;
        let worst = 0;
        for (let i = 0; i < 4; i++) if (CAT_GROUP[i] === g) worst = Math.max(worst, errs[i]);
        if (worst > thresh) {
          for (let i = 0; i < 4; i++) {
            if (CAT_GROUP[i] !== g || errs[i] < thresh * 0.25) continue;
            const lg = rig.legs[i];
            lg.stepping = true;
            lg.t = 0;
            lg.dur = dur;
            lg.sx = lg.fx;
            lg.sy = lg.fy;
          }
          cat.preferGroup = 1 - g;
          stepping[g] = true;
        }
      }

      for (let i = 0; i < 4; i++) {
        const lg = rig.legs[i];
        if (lg.stepping) {
          lg.t += dt / lg.dur;
          const f = Math.min(1, lg.t);
          const e = f * f * (3 - 2 * f);
          lg.fx = lg.sx + (homes[i * 2] - lg.sx) * e;
          lg.fy = lg.sy + (homes[i * 2 + 1] - lg.sy) * e;
          lg.fz = Math.sin(Math.PI * f) * S * 0.055;
          if (f >= 1) {
            lg.stepping = false;
            lg.fz = 0;
            pluck(lg.fx, lg.fy);
          }
          const swing = Math.sin(Math.PI * f) * 0.55;
          lg.hip.rotation.y = -swing;
          lg.shin.rotation.y = swing * 0.7;
        } else {
          lg.fz += (0 - lg.fz) * damp(18, dt);
          lg.hip.rotation.y += (0 - lg.hip.rotation.y) * damp(14, dt);
          lg.shin.rotation.y += (0 - lg.shin.rotation.y) * damp(14, dt);
        }
        // Tuck legs gently when sleeping
        if (cat.sleep > 0.05) {
          lg.hip.rotation.y += (cat.sleep * 0.85 - lg.hip.rotation.y) * damp(8, dt);
          lg.shin.rotation.y += (-cat.sleep * 1.15 - lg.shin.rotation.y) * damp(8, dt);
        }
      }
    };

    const placeBody = () => {
      const breathe = Math.sin(cat.t * (cat.sleep > 0.5 ? 1.8 : 3.0)) * 0.02;
      body.position.set(cat.x, -cat.y, cat.z - cat.sleep * S * 0.055);
      body.rotation.set(0, 0, 0);
      body.rotation.order = "ZYX";
      body.rotation.z = -cat.th;
      body.rotation.y = -cat.pitch * 0.6;
      body.rotation.x = cat.roll;

      rig.root.scale.setScalar(S);
      rig.torso.scale.set(1, 1 + breathe * 0.5, 1 + breathe);
      rig.head.rotation.y = cat.pitch * 0.25 + Math.sin(cat.t * 1.8) * 0.05;
      rig.head.rotation.z = Math.sin(cat.t * 1.1) * 0.08 * (1 - cat.sleep);
      rig.tail.rotation.z = Math.sin(cat.t * (cat.mode === "walk" ? 6 : 2.6)) * 0.35;
      rig.earL.rotation.z = 0.12 + Math.sin(cat.t * 5.5) * 0.04;
      rig.earR.rotation.z = -0.12 - Math.cos(cat.t * 4.7) * 0.04;

      const eyesOpen = cat.eyesClosed < 0.55;
      rig.eyeL.visible = eyesOpen;
      rig.eyeR.visible = eyesOpen;
      rig.pupilL.visible = eyesOpen;
      rig.pupilR.visible = eyesOpen;
      const lidScale = Math.max(0.01, cat.eyesClosed);
      rig.lidL.scale.setScalar(lidScale);
      rig.lidR.scale.setScalar(lidScale);

      // Roll yarn ball smoothly behind/beside kitty
      rig.yarnBall.rotation.y = cat.ballSpin;
      rig.yarnBall.rotation.x = Math.sin(cat.ballSpin * 0.7) * 0.4;
      rig.yarnBall.position.z = 0.11 + Math.abs(Math.sin(cat.ballSpin * 1.5)) * 0.015;

      body.updateMatrixWorld(true);
      toPage(rig.yarnSpoolLocal, spoolPage);
      toPage(rig.headFrontLocal, headPage);
    };

    const updateYarnThreads = () => {
      if (reduced) return;
      if (dropLine && !cat.landed) {
        const end = dropLine.parts[dropLine.parts.length - 1];
        const an = yarn.anchors[yarn.PIN[end]];
        if (an) {
          an.sx = spoolPage.x;
          an.sy = spoolPage.y;
        }
        const a = dropLine.parts[0];
        yarn.CR[dropLine.cons[0]] = Math.max(1, Math.hypot(spoolPage.x - yarn.X[a], spoolPage.y - yarn.Y[a]));
        return;
      }
      if (!cat.landed) return;
      const x = spoolPage.x,
        y = spoolPage.y;
      let el: Element | null = null;
      let area = Infinity;
      for (const e of anchorEls) {
        const r = rects.get(e);
        if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
        const a = r.width * r.height;
        if (a < area) {
          area = a;
          el = e;
        }
      }
      const walking = Math.hypot(cat.vx, cat.vy) > S * 0.1;
      if (!drag) {
        if (el && walking) startDrag(x, y, el);
        return;
      }
      feedDrag(x, y);
      if (el && walking) {
        const r = rects.get(el) as DOMRect;
        const big = Math.max(r.width, r.height) > S * 1.3;
        if (el !== dragEl) attach(x, y, el);
        else if (big && Math.hypot(x - tackX, y - tackY) > S * 0.42) attach(x, y, el);
      }
      if (drag && yarn.length(drag) > Math.hypot(W, H) * 0.9) {
        const t = drag;
        drag = null;
        dragEl = null;
        kill(t, false);
      }
    };

    const updateButterfly = (dt: number) => {
      if (reduced || !opts.current.butterfly) return;
      const f = bfly;
      if (!f.on) {
        f.next -= dt;
        if (f.next <= 0 && setThreads().length >= 2) {
          f.on = true;
          f.cx = 0;
          f.t = 0;
          f.caught = -1;
          f.batted = 0;
          f.seed = rand() * 100;
          const side = rand() < 0.5 ? -1 : 1;
          f.x = side < 0 ? -20 : W + 20;
          f.y = H * (0.18 + rand() * 0.55);
          f.vx = -side * 85;
          f.vy = 0;
        }
        return;
      }
      f.t += dt;
      if (f.caught < 0) {
        const n = f.seed;
        const ax = Math.sin(f.t * 1.7 + n) * 240 + Math.sin(f.t * 4.3 + n * 2) * 120;
        const ay = Math.cos(f.t * 1.3 + n * 3) * 200 + Math.sin(f.t * 5.1 + n) * 110;
        if (f.cx === 0 || rand() < dt * 0.4) {
          const live = setThreads();
          const t = live[Math.floor(rand() * live.length)];
          if (t) {
            const p = t.parts[Math.floor(t.parts.length / 2)];
            f.cx = yarn.X[p];
            f.cy = yarn.Y[p];
          }
        }
        const gx = f.cx || W * 0.5,
          gy = f.cy || H * 0.45;
        f.vx += (ax + (gx - f.x) * 0.85) * dt;
        f.vy += (ay + (gy - f.y) * 0.85) * dt;
        const v = Math.hypot(f.vx, f.vy);
        if (v > 210) {
          f.vx *= 210 / v;
          f.vy *= 210 / v;
        }
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.t > 1.2) {
          for (const t of yarn.threads) {
            if (t.state !== 1) continue;
            for (let k = 1; k < t.parts.length - 1; k++) {
              const p = t.parts[k];
              const q = t.parts[k + 1];
              const ex = yarn.X[q] - yarn.X[p],
                ey = yarn.Y[q] - yarn.Y[p];
              const u = clamp(
                ((f.x - yarn.X[p]) * ex + (f.y - yarn.Y[p]) * ey) / (ex * ex + ey * ey || 1),
                0,
                1
              );
              if (Math.hypot(yarn.X[p] + ex * u - f.x, yarn.Y[p] + ey * u - f.y) < 7 && yarn.INV[p] > 0) {
                f.caught = p;
                yarn.PY[p] -= 5;
                break;
              }
            }
            if (f.caught >= 0) break;
          }
        }
        if (f.t > 16 || f.x < -60 || f.x > W + 60 || f.y < -60 || f.y > H + 60) {
          if (f.t > 3) {
            f.on = false;
            f.next = 12 + rand() * 10;
          }
        }
      } else {
        f.x = yarn.X[f.caught];
        f.y = yarn.Y[f.caught];
        if (yarn.INV[f.caught] > 0 && f.batted < 0.01 && rand() < 0.12) {
          yarn.PX[f.caught] += (rand() - 0.5) * 3;
          yarn.PY[f.caught] += (rand() - 0.5) * 3;
        }
        const hostAlive = yarn.threads.some((t) => t.state === 1 && t.parts.includes(f.caught));
        if (!hostAlive || f.batted > 1.2) {
          f.on = false;
          f.next = 14 + rand() * 10;
          if (cat.mode === "hunt") {
            cat.mode = "idle";
            cat.idleT = 0;
            ptr.x = cat.x;
            ptr.y = cat.y;
            ptr.ix = cat.x;
            ptr.iy = cat.y;
          }
        }
      }
    };

    const pathThread = (t: Thread) => {
      const { X, Y } = yarn;
      const P = t.parts;
      ctx.moveTo(X[P[0]], Y[P[0]]);
      for (let k = 1; k < P.length - 1; k++) {
        const a = P[k],
          b = P[k + 1];
        ctx.quadraticCurveTo(X[a], Y[a], (X[a] + X[b]) / 2, (Y[a] + Y[b]) / 2);
      }
      const last = P[P.length - 1];
      ctx.lineTo(X[last], Y[last]);
    };

    const drawYarn = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = opts.current.yarnColor;

      const solid: Thread[] = [];
      for (const t of yarn.threads) {
        if (t.parts.length < 2 || t.alpha <= 0.01) continue;
        const a = t.alpha * (t.state === 0 ? 0.8 : Math.min(1, 0.6 + (time - t.born) * 2));
        if (a >= 0.999) {
          solid.push(t);
          continue;
        }
        ctx.beginPath();
        pathThread(t);
        ctx.globalAlpha = a * 0.88;
        ctx.lineWidth = 2.1;
        ctx.stroke();
      }
      if (solid.length) {
        ctx.beginPath();
        for (const t of solid) pathThread(t);
        ctx.globalAlpha = 0.88;
        ctx.lineWidth = 2.1;
        ctx.stroke();
      }

      // Draw Butterfly toy if active
      if (bfly.on) {
        const flap = Math.sin(time * (bfly.caught >= 0 ? 22 : 16));
        ctx.save();
        ctx.translate(bfly.x, bfly.y);
        ctx.rotate(bfly.caught >= 0 ? Math.sin(time * 8) * 0.3 : Math.atan2(bfly.vy, bfly.vx));
        ctx.fillStyle = "#fde047";
        ctx.globalAlpha = 0.95;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(0, side * 5 * (0.4 + 0.6 * Math.abs(flap)), 7, 4.5, side * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-5, -1.2, 10, 2.4);
        ctx.restore();
      }

      // Sleep "z z z"
      if (cat.sleep >= 0.4) {
        const a = (cat.sleep - 0.4) / 0.6;
        const base = clamp(S / 190, 0.75, 1.25);
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        ctx.fillStyle = isDark ? "#fbf6ec" : "#2b180e";
        ctx.textBaseline = "middle";
        for (let k = 0; k < 3; k++) {
          const ph = (time * 0.45 + k / 3) % 1;
          const x = headPage.x + S * 0.1 + ph * S * 0.16 + Math.sin(time * 1.4 + k * 2) * 4;
          const y = headPage.y - S * 0.1 - ph * S * 0.38;
          ctx.globalAlpha = a * Math.sin(ph * Math.PI);
          ctx.font = `italic 700 ${Math.round((13 + ph * 11) * base)}px ui-rounded, system-ui, sans-serif`;
          ctx.fillText("z", x, y);
        }
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = 0;
    let acc = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!isVisibleRef.current || document.hidden) return;
      const t = now / 1000;
      let dt = last ? t - last : 1 / 60;
      last = t;
      dt = Math.min(dt, 1 / 20);

      anchorScan -= dt;
      if (anchorScan <= 0) {
        scanAnchors();
        anchorScan = 1;
      }
      const wr = wrap.getBoundingClientRect();
      rects.clear();
      for (const e of anchorEls) {
        const r = e.getBoundingClientRect();
        rects.set(e, new DOMRect(r.left - wr.left, r.top - wr.top, r.width, r.height));
      }

      if (!seeded) {
        seeded = true;
        seed(seedYarn);
      }
      updateCat(dt);
      placeBody();
      updateCatLegs(dt);
      updateYarnThreads();
      updateButterfly(dt);

      acc += dt;
      let steps = 0;
      while (acc >= 1 / 120 && steps < 4) {
        stepYarn(yarn, 1 / 120, cat.t, rects, 4);
        acc -= 1 / 120;
        steps++;
      }
      if (steps === 4) acc = 0;
      for (let k = yarn.threads.length - 1; k >= 0; k--) {
        const th = yarn.threads[k];
        if (th.state === 2) {
          th.dieT += dt;
          th.alpha = Math.max(0, 1 - th.dieT / 0.85);
          if (th.dieT > 0.9) {
            yarn.freeThread(th);
            yarn.threads.splice(k, 1);
            if (th === dropLine) dropLine = null;
          }
        }
      }
      drawYarn(cat.t);

      const span = S * 1.3;
      key.position.set(cat.x - S * 0.9, -cat.y + S * 1.3, S * 3.2);
      key.target.position.set(cat.x, -cat.y, 0);
      const sc = key.shadow.camera as THREE.OrthographicCamera;
      sc.left = -span;
      sc.right = span;
      sc.top = span;
      sc.bottom = -span;
      sc.near = 1;
      sc.far = S * 8;
      sc.updateProjectionMatrix();
      rim.position.set(cat.x + S, -cat.y - S * 1.5, S);
      rim.target.position.set(cat.x, -cat.y, 0);
      catcher.position.set(cat.x, -cat.y, 0);
      catcher.scale.set(span * 2.4, span * 2.4, 1);

      const pad = S * 1.0;
      const x0 = clamp(cat.x - pad, 0, W),
        x1 = clamp(cat.x + pad, 0, W);
      const y0 = clamp(cat.y - pad, 0, H),
        y1 = clamp(cat.y + pad, 0, H);
      renderer.setScissorTest(true);
      renderer.setScissor(x0, H - y1, x1 - x0, y1 - y0);
      renderer.render(scene, camera);
    };

    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    start();

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerdown", pm);
      window.removeEventListener("touchstart", tm);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("keydown", kd);
      renderer.dispose();
    };
  }, [position, maxDpr, bounceColor, shadowColor, yarnBallColor, seedYarn]);

  const layer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    maxWidth: "none",
    pointerEvents: "none",
  };
  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={className}
      style={{
        position,
        inset: 0,
        width: "100%",
        height: position === "fixed" ? "100svh" : "100%",
        pointerEvents: "none",
        zIndex,
        overflow: "hidden",
      }}
    >
      <canvas ref={yarnRef} style={layer} />
      <canvas ref={glRef} style={layer} />
    </div>
  );
}

