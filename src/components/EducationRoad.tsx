"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SpeedingText } from "@/components/ui/speeding-text";

export interface EducationMilestone {
  id: string;
  count: string;
  railLabel: string;
  institution: string;
  degree: string;
  detail?: string;
  period: string;
  scoreLabel: string;
  scoreValue: string;
  side: "left" | "right";
  /** Center progress (0..1) along the downward Education journey */
  stopProgress: number;
}

export const EDUCATION_MILESTONES: EducationMilestone[] = [
  {
    id: "ssc",
    count: "01",
    railLabel: "2010–22 · SSC",
    institution: "Dr. Sarvepalli Radhakrishnan Vidyalaya",
    degree: "Secondary School Certificate (SSC)",
    period: "2010 – 2022",
    scoreLabel: "Percentage",
    scoreValue: "94%",
    side: "left",
    stopProgress: 0.145,
  },
  {
    id: "hsc",
    count: "02",
    railLabel: "2022–24 · HSC",
    institution: "Chikitsak Samuha’s Patkar-Varde College",
    degree: "Higher Secondary Certificate (HSC)",
    detail: "Bifocal Subject: Computer Science",
    period: "2022 – 2024",
    scoreLabel: "Percentage",
    scoreValue: "92.33%",
    side: "right",
    stopProgress: 0.509,
  },
  {
    id: "btech",
    count: "03",
    railLabel: "2024–28 · B.Tech",
    institution: "Dwarkadas J. Sanghvi College of Engineering",
    degree: "B.Tech in Artificial Intelligence & Machine Learning",
    detail: "Minor: Financial Technology (FinTech)",
    period: "2024 – 2028",
    scoreLabel: "Current CGPA",
    scoreValue: "9.5",
    side: "left",
    stopProgress: 0.873,
  },
];

// Mathematically smooth C-infinity harmonic S-curve control points (zero kinks)
const ROAD_SAMPLES = 72;
const ROAD_POINTS: [number, number, number][] = Array.from(
  { length: ROAD_SAMPLES + 1 },
  (_, idx) => {
    const u = idx / ROAD_SAMPLES;
    return [
      4.0 * Math.sin(u * Math.PI * 4.0),
      -7.6 * u,
      8 - u * 136,
    ];
  }
);

// Layered shades of brown matching the website's kraft, walnut & espresso aesthetic
const ROAD_BROWN_SHADES = [
  0xc49a6c,
  0xb4865b,
  0xcba57d,
  0x9e6c42,
  0x845431,
] as const;

/** Staggered character-mask split reveal */
function SplitHeadline({
  text,
  isIn,
}: {
  text: string;
  isIn: boolean;
}) {
  let charIdx = 0;
  const tokens = text.split(/(\s+)/);

  return (
    <h3
      className={`tink-split text-[1.15rem] sm:text-[1.32rem] lg:text-[1.42rem] font-bold leading-[1.18] tracking-tight ${isIn ? "in" : ""
        }`}
      style={{ fontFamily: "'Special Elite', cursive", color: "#2b180e" }}
      aria-label={text}
    >
      {tokens.map((tok, tIdx) => {
        if (!tok) return null;
        if (/^\s+$/.test(tok)) {
          return <React.Fragment key={`sp-${tIdx}`}> </React.Fragment>;
        }
        return (
          <span key={`w-${tIdx}`} className="tink-w">
            {tok.split("").map((ch, cIdx) => {
              const idx = charIdx++;
              return (
                <span key={cIdx} className="tink-mask">
                  <span
                    className="tink-c"
                    style={{ "--i": idx } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
    </h3>
  );
}

interface EducationRoadProps {
  /** Normalized progress across Education stage: 0.0 -> 1.0 */
  progress: number;
  /** Entrance transition progress (0..1) into the Education stage */
  entranceProgress?: number;
  /** Whether Education stage is visible/active in viewport */
  isVisible: boolean;
  /** Jump to a specific milestone progress (0..1) via timeline or card */
  onSelectProgress?: (targetProgress: number) => void;
}

export default function EducationRoad({
  progress,
  entranceProgress = 1,
  isVisible,
  onSelectProgress,
}: EducationRoadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const progressRef = useRef(Math.max(0, Math.min(1, progress)));
  const entranceRef = useRef(Math.max(0, Math.min(1, entranceProgress)));
  const isVisibleRef = useRef(isVisible);
  useEffect(() => {
    progressRef.current = Math.max(0, Math.min(1, progress));
  }, [progress]);
  useEffect(() => {
    entranceRef.current = Math.max(0, Math.min(1, entranceProgress));
  }, [entranceProgress]);
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 760px)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !small,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.style.display = "none";
      return;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = !small;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;

    const camera = new THREE.PerspectiveCamera(small ? 52 : 38, 1, 0.1, 400);

    const hemi = new THREE.HemisphereLight(0xfff9f0, 0x6b442d, 1.35);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4e2, 2.45);
    sun.castShadow = !small;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -9,
      right: 9,
      top: 9,
      bottom: -9,
      near: 1,
      far: 42,
    });
    sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);

    const world = new THREE.Group();
    scene.add(world);

    const disposables: { dispose: () => void }[] = [envTarget];
    const trackDisp = <T extends { dispose: () => void }>(d: T): T => {
      disposables.push(d);
      return d;
    };

    const M = (
      color: number,
      rough = 0.55,
      extra: THREE.MeshStandardMaterialParameters = {}
    ) => trackDisp(new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra }));

    const shadowy = <T extends THREE.Object3D>(m: T, cast = true, recv = true): T => {
      m.castShadow = cast;
      m.receiveShadow = recv;
      return m;
    };

    // ─── 1. Mathematically Smooth Curved Shades-of-Brown Road ──────────
    const pts = ROAD_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    curve.arcLengthDivisions = 1200;
    const LEN = curve.getLength();
    const UP = new THREE.Vector3(0, 1, 0);

    const T0 = 6 / LEN;
    const T1 = 1 - 2 / LEN;
    const tAt = (curveP: number) => T0 + (T1 - T0) * curveP;
    const curvePFromEdu = (eduP: number) => 0.96 - eduP * 0.94;
    const goalT = tAt(curvePFromEdu(1));

    const frame = (t: number) => {
      const clampedT = Math.max(0.0001, Math.min(0.9999, t));
      const pos = curve.getPointAt(clampedT);
      const tan = curve.getTangentAt(clampedT);
      const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
      const norm = new THREE.Vector3().crossVectors(side, tan).normalize();
      return { pos, tan, side, norm };
    };

    const espressoCurbColor = new THREE.Color(0x3a2012);
    const mortarColor = new THREE.Color(0x52311d);
    const shadeColors = ROAD_BROWN_SHADES.map((hex) => new THREE.Color(hex));

    // Closed clockwise beveled cross-section in (side, norm) coordinates
    const RING_PTS: readonly [number, number][] = [
      [-0.78, -0.045],
      [-0.71, 0.0],
      [0.71, 0.0],
      [0.78, -0.045],
      [0.81, -0.08],
      [0.76, -0.22],
      [-0.76, -0.22],
      [-0.81, -0.08],
    ];

    const buildCurvedRoadSegmentGeometry = (
      tStart: number,
      tEnd: number
    ): THREE.BufferGeometry => {
      const arcLen = Math.max(0.05, (tEnd - tStart) * LEN);
      const segs = Math.max(10, Math.ceil(arcLen / 0.13));
      const slices = segs + 1;

      const positions: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];

      const frames = Array.from({ length: slices }, (_, i) => {
        const u = i / segs;
        const ti = tStart + (tEnd - tStart) * u;
        return { ti, ...frame(ti) };
      });

      const tmpV = new THREE.Vector3();
      const tmpC = new THREE.Color();
      const plankLen = 1.08;

      const sampleTopColor = (ti: number, edgeBlend: number) => {
        const sDist = ti * LEN;
        const rawIdx = Math.floor(sDist / plankLen);
        const frac = sDist / plankLen - rawIdx;
        const baseCol =
          rawIdx % 5 === 2
            ? shadeColors[(Math.floor(rawIdx / 5) % (shadeColors.length - 1)) + 1]
            : shadeColors[0];
        tmpC.copy(baseCol);
        // Subtle radial mortar seam curved cleanly across each brown plank
        const edgeDist = Math.min(frac, 1 - frac);
        if (edgeDist < 0.08) {
          const seamWeight = (1 - edgeDist / 0.08) * 0.65;
          tmpC.lerp(mortarColor, seamWeight);
        }
        if (edgeBlend > 0) {
          tmpC.lerp(espressoCurbColor, edgeBlend);
        }
        return tmpC;
      };

      const pushVert = (
        f: (typeof frames)[number],
        s: number,
        h: number,
        col: THREE.Color
      ) => {
        tmpV
          .copy(f.pos)
          .addScaledVector(f.side, s)
          .addScaledVector(f.norm, h);
        positions.push(tmpV.x, tmpV.y, tmpV.z);
        colors.push(col.r, col.g, col.b);
        return positions.length / 3 - 1;
      };

      // Build 8 split-normal longitudinal strips so edges are crisp and curves are smooth
      for (let edge = 0; edge < RING_PTS.length; edge++) {
        const [sa, ha] = RING_PTS[edge];
        const [sb, hb] = RING_PTS[(edge + 1) % RING_PTS.length];
        const isTopOrBevel = edge <= 2;
        const isCheek = edge === 3 || edge === 7;
        const baseIndex = positions.length / 3;

        for (let i = 0; i < slices; i++) {
          const f = frames[i];
          if (isTopOrBevel) {
            const colA = sampleTopColor(f.ti, edge === 0 ? 0.14 : 0).clone();
            const colB = sampleTopColor(f.ti, edge === 2 ? 0.14 : 0).clone();
            pushVert(f, sa, ha, colA);
            pushVert(f, sb, hb, colB);
          } else if (isCheek) {
            const col = sampleTopColor(f.ti, 0.48).clone();
            pushVert(f, sa, ha, col);
            pushVert(f, sb, hb, espressoCurbColor);
          } else {
            pushVert(f, sa, ha, espressoCurbColor);
            pushVert(f, sb, hb, espressoCurbColor);
          }
        }

        for (let i = 0; i < segs; i++) {
          const a = baseIndex + i * 2;
          const b = a + 1;
          const d = baseIndex + (i + 1) * 2;
          const c = d + 1;
          indices.push(a, b, c, a, c, d);
        }
      }

      // Clean capped ends at tStart (-tan) and tEnd (+tan)
      const addCap = (f: (typeof frames)[number], flip: boolean) => {
        const cIdx = pushVert(f, 0, -0.11, espressoCurbColor);
        const ringIdx: number[] = [];
        for (let k = 0; k < RING_PTS.length; k++) {
          const [s, h] = RING_PTS[k];
          const c =
            k <= 3
              ? sampleTopColor(f.ti, 0.25).clone()
              : espressoCurbColor;
          ringIdx.push(pushVert(f, s, h, c));
        }
        for (let k = 0; k < RING_PTS.length; k++) {
          const next = (k + 1) % RING_PTS.length;
          if (flip) {
            indices.push(cIdx, ringIdx[next], ringIdx[k]);
          } else {
            indices.push(cIdx, ringIdx[k], ringIdx[next]);
          }
        }
      };

      addCap(frames[0], true);
      addCap(frames[frames.length - 1], false);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return trackDisp(geo);
    };

    const roadMat = trackDisp(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.48,
        metalness: 0.05,
      })
    );

    // Continuous unbroken curved road ending right after the finish ring (zero tiles in air)
    const roadStartT = Math.max(0.004, goalT - 0.72 / LEN);
    const roadEndT = 0.996;
    const roadGeo = buildCurvedRoadSegmentGeometry(roadStartT, roadEndT);
    const roadMesh = shadowy(new THREE.Mesh(roadGeo, roadMat), true, true);
    world.add(roadMesh);

    // Soft grounded drop-shadow ribbon tracing the entire curved road below (feathered smoothly at ends)
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext("2d");
    if (shadowCtx) {
      const hGrad = shadowCtx.createLinearGradient(0, 0, 128, 0);
      hGrad.addColorStop(0.0, "rgba(18, 8, 3, 0)");
      hGrad.addColorStop(0.2, "rgba(18, 8, 3, 0.14)");
      hGrad.addColorStop(0.5, "rgba(18, 8, 3, 0.42)");
      hGrad.addColorStop(0.8, "rgba(18, 8, 3, 0.14)");
      hGrad.addColorStop(1.0, "rgba(18, 8, 3, 0)");
      shadowCtx.fillStyle = hGrad;
      shadowCtx.fillRect(0, 0, 128, 128);

      shadowCtx.globalCompositeOperation = "destination-in";
      const vGrad = shadowCtx.createLinearGradient(0, 0, 0, 128);
      vGrad.addColorStop(0.0, "rgba(255, 255, 255, 0)");
      vGrad.addColorStop(0.18, "rgba(255, 255, 255, 0.55)");
      vGrad.addColorStop(0.38, "rgba(255, 255, 255, 1)");
      vGrad.addColorStop(0.62, "rgba(255, 255, 255, 1)");
      vGrad.addColorStop(0.82, "rgba(255, 255, 255, 0.55)");
      vGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
      shadowCtx.fillStyle = vGrad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = trackDisp(new THREE.CanvasTexture(shadowCanvas));
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    shadowTex.wrapS = THREE.ClampToEdgeWrapping;
    shadowTex.wrapT = THREE.ClampToEdgeWrapping;

    const shadowStartT = Math.max(0.001, roadStartT - 0.5 / LEN);
    const shadowEndT = Math.min(0.999, roadEndT + 0.45 / LEN);
    const shadowSpanLen = (shadowEndT - shadowStartT) * LEN;
    const shadowSegs = Math.ceil(shadowSpanLen / 0.16);
    const sPos: number[] = [];
    const sUv: number[] = [];
    const sIdx: number[] = [];
    const shadowHalfW = 1.48;
    const shadowYOffset = -0.34;
    const shadowSunShift = 0.16;
    const fadeDist = 2.6;

    for (let i = 0; i <= shadowSegs; i++) {
      const u = i / shadowSegs;
      const ti = shadowStartT + (shadowEndT - shadowStartT) * u;
      const f = frame(ti);
      const distStart = u * shadowSpanLen;
      const distEnd = (1 - u) * shadowSpanLen;

      // Map v in [0..0.5] near the last tile, [0.5] in body, [0.5..1] at far end
      let vCoord = 0.5;
      if (distStart < fadeDist) {
        vCoord = 0.5 * (distStart / fadeDist);
      } else if (distEnd < fadeDist) {
        vCoord = 1 - 0.5 * (distEnd / fadeDist);
      }

      const lx = f.pos.x + f.side.x * (-shadowHalfW + shadowSunShift);
      const ly = f.pos.y + shadowYOffset;
      const lz = f.pos.z + f.side.z * (-shadowHalfW + shadowSunShift);
      const rx = f.pos.x + f.side.x * (shadowHalfW + shadowSunShift);
      const ry = f.pos.y + shadowYOffset;
      const rz = f.pos.z + f.side.z * (shadowHalfW + shadowSunShift);
      sPos.push(lx, ly, lz, rx, ry, rz);
      sUv.push(0, vCoord, 1, vCoord);
      if (i < shadowSegs) {
        const a = i * 2;
        const b = a + 1;
        const d = a + 2;
        const c = d + 1;
        sIdx.push(a, b, c, a, c, d);
      }
    }
    const shadowRibbonGeo = trackDisp(new THREE.BufferGeometry());
    shadowRibbonGeo.setAttribute("position", new THREE.Float32BufferAttribute(sPos, 3));
    shadowRibbonGeo.setAttribute("uv", new THREE.Float32BufferAttribute(sUv, 2));
    shadowRibbonGeo.setIndex(sIdx);
    const shadowRibbonMat = trackDisp(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    const shadowRibbonMesh = new THREE.Mesh(shadowRibbonGeo, shadowRibbonMat);
    shadowRibbonMesh.renderOrder = -1;
    world.add(shadowRibbonMesh);

    // ─── 2. Articulated 3D Running Calico Cat ──────────────────────────
    const cat = new THREE.Group();
    const catBodyGroup = new THREE.Group();
    cat.add(catBodyGroup);

    const catCreamMat = M(0xf4dec4, 0.62);
    const catGingerMat = M(0xd68348, 0.58);
    const catEspressoMat = M(0x3b2113, 0.58);
    const catInnerEarMat = M(0xe8a598, 0.65);
    const catEyeMat = M(0x160d08, 0.12, { metalness: 0.1 });
    const catHighlightMat = trackDisp(new THREE.MeshBasicMaterial({ color: 0xfff8ee }));

    // Rounded torso + calico patches
    const torsoMesh = shadowy(
      new THREE.Mesh(trackDisp(new THREE.SphereGeometry(0.22, 24, 18)), catCreamMat)
    );
    torsoMesh.scale.set(0.95, 0.9, 1.48);
    torsoMesh.position.set(0, 0.25, 0);
    catBodyGroup.add(torsoMesh);

    const patchEspresso = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.16, 18, 14)),
      catEspressoMat
    );
    patchEspresso.scale.set(0.9, 0.72, 1.15);
    patchEspresso.position.set(-0.07, 0.34, -0.04);
    catBodyGroup.add(patchEspresso);

    const patchGinger = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.14, 18, 14)),
      catGingerMat
    );
    patchGinger.scale.set(0.85, 0.7, 1.0);
    patchGinger.position.set(0.08, 0.33, 0.08);
    catBodyGroup.add(patchGinger);

    // Fluffy chest puff
    const chestMesh = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.14, 16, 14)),
      catCreamMat
    );
    chestMesh.position.set(0, 0.24, 0.24);
    catBodyGroup.add(chestMesh);

    // Cute Head Group
    const catHead = new THREE.Group();
    catHead.position.set(0, 0.42, 0.28);
    catBodyGroup.add(catHead);

    const headMesh = shadowy(
      new THREE.Mesh(trackDisp(new THREE.SphereGeometry(0.2, 24, 20)), catCreamMat)
    );
    headMesh.scale.set(1.06, 0.96, 0.96);
    catHead.add(headMesh);

    // Calico brow patches (left espresso, right ginger)
    const browL = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.115, 16, 14)),
      catEspressoMat
    );
    browL.position.set(-0.075, 0.08, 0.02);
    browL.scale.set(1.0, 0.9, 1.1);
    catHead.add(browL);

    const browR = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.105, 16, 14)),
      catGingerMat
    );
    browR.position.set(0.08, 0.075, 0.015);
    catHead.add(browR);

    // Pointed Ears + Inner Ear Pink
    const earGeo = trackDisp(new THREE.ConeGeometry(0.072, 0.14, 16));
    const innerEarGeo = trackDisp(new THREE.ConeGeometry(0.04, 0.09, 12));

    const buildEar = (sideSign: number, outerMat: THREE.Material) => {
      const earG = new THREE.Group();
      const outer = shadowy(new THREE.Mesh(earGeo, outerMat));
      const inner = new THREE.Mesh(innerEarGeo, catInnerEarMat);
      inner.position.set(0, -0.01, 0.022);
      earG.add(outer, inner);
      earG.position.set(sideSign * 0.115, 0.19, 0.0);
      earG.rotation.z = -sideSign * 0.34;
      earG.rotation.x = 0.12;
      catHead.add(earG);
    };
    buildEar(-1, catEspressoMat);
    buildEar(1, catGingerMat);

    // Sparkly eyes + cute nose
    const eyeGeo = trackDisp(new THREE.SphereGeometry(0.032, 14, 12));
    const glintGeo = trackDisp(new THREE.SphereGeometry(0.011, 8, 8));
    [-1, 1].forEach((sideSign) => {
      const eye = new THREE.Mesh(eyeGeo, catEyeMat);
      eye.position.set(sideSign * 0.072, 0.015, 0.175);
      const glint = new THREE.Mesh(glintGeo, catHighlightMat);
      glint.position.set(sideSign * 0.072 + 0.01, 0.028, 0.2);
      catHead.add(eye, glint);
    });

    const noseMesh = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.024, 12, 10)),
      catInnerEarMat
    );
    noseMesh.scale.set(1.2, 0.85, 0.8);
    noseMesh.position.set(0, -0.022, 0.195);
    catHead.add(noseMesh);

    // 4 Articulated Running Legs
    const legUpperGeo = trackDisp(new THREE.CylinderGeometry(0.046, 0.038, 0.18, 12));
    const pawGeo = trackDisp(new THREE.SphereGeometry(0.044, 14, 12));

    const makeLeg = (x: number, y: number, z: number, mat: THREE.Material) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);
      const limb = shadowy(new THREE.Mesh(legUpperGeo, mat));
      limb.position.y = -0.085;
      const paw = shadowy(new THREE.Mesh(pawGeo, catCreamMat));
      paw.scale.set(1.0, 0.72, 1.25);
      paw.position.set(0, -0.17, 0.018);
      pivot.add(limb, paw);
      catBodyGroup.add(pivot);
      return pivot;
    };

    const legFL = makeLeg(0.1, 0.19, 0.17, catGingerMat);
    const legFR = makeLeg(-0.1, 0.19, 0.17, catCreamMat);
    const legBL = makeLeg(0.105, 0.19, -0.17, catCreamMat);
    const legBR = makeLeg(-0.105, 0.19, -0.17, catEspressoMat);

    // Multi-segment curving expressive tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.28, -0.28);
    catBodyGroup.add(tailPivot);

    const tailSeg1 = shadowy(
      new THREE.Mesh(
        trackDisp(new THREE.CylinderGeometry(0.038, 0.044, 0.22, 12)),
        catEspressoMat
      )
    );
    tailSeg1.position.set(0, 0.08, -0.08);
    tailSeg1.rotation.x = -0.75;
    tailPivot.add(tailSeg1);

    const tailMid = new THREE.Group();
    tailMid.position.set(0, 0.16, -0.16);
    tailPivot.add(tailMid);

    const tailSeg2 = shadowy(
      new THREE.Mesh(
        trackDisp(new THREE.CylinderGeometry(0.032, 0.038, 0.2, 12)),
        catGingerMat
      )
    );
    tailSeg2.position.set(0, 0.09, -0.03);
    tailSeg2.rotation.x = -0.32;
    tailMid.add(tailSeg2);

    const tailTip = new THREE.Mesh(
      trackDisp(new THREE.SphereGeometry(0.034, 12, 10)),
      catCreamMat
    );
    tailTip.position.set(0, 0.19, -0.06);
    tailMid.add(tailTip);

    cat.scale.setScalar(1.08);
    world.add(cat);

    // ─── 3. Minimal Finish Pad at Road End ─────────────────────────────
    const goalFrame = frame(goalT);
    const goalPos = goalFrame.pos;
    let celebrateT = 0;
    const goalGroup = new THREE.Group();
    const goalPadGroup = new THREE.Group();
    goalPadGroup.quaternion.setFromUnitVectors(UP, goalFrame.norm);
    const goalDisc = shadowy(
      new THREE.Mesh(
        trackDisp(new THREE.CylinderGeometry(0.425, 0.425, 0.024, 48)),
        M(0x050505, 0.92, { envMapIntensity: 0.18 })
      ),
      false,
      true
    );
    goalDisc.position.y = 0.016;
    const goalRing = new THREE.Mesh(
      trackDisp(new THREE.TorusGeometry(0.42, 0.045, 12, 48)),
      M(0x4a2c1d, 0.5)
    );
    goalRing.rotation.x = -Math.PI / 2;
    goalRing.position.y = 0.026;
    goalPadGroup.add(goalDisc, goalRing);
    const pole = shadowy(
      new THREE.Mesh(
        trackDisp(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8)),
        M(0x4a2c1d, 0.5)
      )
    );
    pole.position.set(0.54, 0.7, -0.3);
    const fs = new THREE.Shape();
    fs.moveTo(0, 0);
    fs.lineTo(0.62, -0.17);
    fs.lineTo(0, -0.36);
    const flag = shadowy(
      new THREE.Mesh(
        trackDisp(new THREE.ShapeGeometry(fs)),
        M(0xc49a6c, 0.5, { side: THREE.DoubleSide })
      )
    );
    flag.position.set(0.56, 1.38, -0.3);
    goalGroup.add(goalPadGroup, pole, flag);
    goalGroup.position.copy(goalPos);
    world.add(goalGroup);

    // ─── 4. Pointer Tilt & Resize ──────────────────────────────────────
    const pointer = new THREE.Vector2(0, 0);
    const onPointerMove = (e: PointerEvent) => {
      pointer.set(
        (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
        (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1
      );
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width || window.innerWidth));
      const h = Math.max(1, Math.round(rect.height || window.innerHeight));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // ─── 5. Render Loop ────────────────────────────────────────────────
    const timer = new THREE.Timer();
    let p = progressRef.current;
    let entranceBlend = entranceRef.current;
    let t = 0;
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const prevCatPos = new THREE.Vector3();
    let stridePhase = 0;
    let runBlend = 0;
    let first = true;

    let slow = 0;
    let frames = 0;
    let acc = 0;
    let lowered = false;
    let rafId = 0;
    let disposed = false;

    const adapt = (raw: number) => {
      frames++;
      acc += raw;
      if (frames < 45) return;
      const avg = acc / frames;
      frames = 0;
      acc = 0;
      if (avg > 1 / 50) slow++;
      else if (avg < 1 / 58) slow = 0;
      if (slow >= 2 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        renderer.setPixelRatio(dpr);
        resize();
        slow = 0;
      } else if (slow >= 2 && !lowered) {
        lowered = true;
        sun.castShadow = false;
        slow = 0;
      }
    };

    const update = (dt: number) => {
      t += dt;
      const targetP = progressRef.current;
      p = reduced ? targetP : p + (targetP - p) * Math.min(dt * 4.5, 1);

      const curveP = curvePFromEdu(p);
      const tt = tAt(curveP);
      const { pos, tan, side } = frame(tt);

      flag.rotation.y = Math.sin(t * 3.5) * 0.3;

      celebrateT = p > 0.97 ? Math.min(1, celebrateT + dt * 1.4) : Math.max(0, celebrateT - dt * 2.5);
      const happyHop =
        celebrateT > 0.01 ? Math.abs(Math.sin(t * 5.2)) * 0.14 * celebrateT : 0;

      const cp = pos.clone().addScaledVector(UP, 0.02 + happyHop);
      cat.position.copy(cp);
      const camBase = pos.clone().addScaledVector(UP, 0.35);

      // Face downward along the running direction (-tan projected onto horizontal plane)
      const heading = tan.clone().negate();
      heading.y = 0;
      if (heading.lengthSq() > 1e-6) {
        heading.normalize();
        const targetYaw = Math.atan2(heading.x, heading.z);
        if (first) {
          cat.rotation.y = targetYaw;
        } else {
          let diff = targetYaw - cat.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          cat.rotation.y += diff * Math.min(dt * 8, 1);
        }
      }

      goalPadGroup.scale.setScalar(1 + Math.sin(t * 2.5) * 0.04 * celebrateT);

      // Compute cat stride speed from actual horizontal movement along the curve
      let speedInst = 0;
      if (!first) {
        const d = cp.clone().sub(prevCatPos);
        d.y = 0;
        const dist = d.length();
        speedInst = Math.min(1, dist / Math.max(dt * 3.5, 0.015));
        stridePhase += dist * 8.5;
      }
      prevCatPos.copy(cp);

      runBlend += (speedInst - runBlend) * Math.min(dt * 10, 1);
      const gallopAmp = 0.12 + 0.68 * runBlend;
      const bounceAmp = 0.012 + 0.065 * runBlend;

      // Idle subtle breathing/bob + playful trotting gait when scrolling
      const idlePhase = t * 4.2;
      const activePhase = runBlend > 0.05 ? stridePhase : idlePhase * 0.5;
      catBodyGroup.position.y = Math.abs(Math.sin(activePhase)) * bounceAmp;
      catBodyGroup.rotation.x = Math.cos(activePhase) * 0.11 * runBlend;

      // Quadruped running leg articulation
      legFL.rotation.x = Math.sin(activePhase) * gallopAmp;
      legFR.rotation.x = Math.sin(activePhase + 0.85) * gallopAmp;
      legBL.rotation.x = Math.sin(activePhase + Math.PI) * gallopAmp;
      legBR.rotation.x = Math.sin(activePhase + Math.PI + 0.85) * gallopAmp;

      // Expressive head bob & tail sway
      catHead.rotation.z = Math.sin(t * 2.2) * 0.04;
      catHead.rotation.x = -0.06 - Math.cos(activePhase) * 0.06 * runBlend;
      tailPivot.rotation.z = Math.sin(t * (3.6 + runBlend * 4.0)) * 0.28;
      tailMid.rotation.z = Math.sin(t * (3.6 + runBlend * 4.0) - 0.7) * 0.26;

      // Smooth scenic entrance lift + camera swoop as Education stage reveals
      const targetEntrance = entranceRef.current;
      entranceBlend = reduced
        ? targetEntrance
        : entranceBlend + (targetEntrance - entranceBlend) * Math.min(dt * 6, 1);
      const easeInOut = 1 - Math.pow(1 - Math.max(0, Math.min(1, entranceBlend)), 3);
      world.position.y = -(1 - easeInOut) * 1.15;

      // Camera frames the winding road beside each alternating retro window card
      const intro = 1 - THREE.MathUtils.smoothstep(p, 0, 0.06);
      const outro = THREE.MathUtils.smoothstep(p, 0.94, 1);
      const arriveLift = 1 - easeInOut;
      const back = 9.0 + intro * 2.4 + arriveLift * 4.2 - outro * 1.8;
      const up = 5.4 + intro * 2.0 + arriveLift * 3.2 + outro * 1.0;
      const cardPhase = ((p - 0.145) / 0.364) * Math.PI;
      const cardClearance = small ? 0 : -Math.cos(cardPhase) * 2.4 * (1 - outro);
      const sideK = cardClearance + 0.7 * Math.sin(p * 8.5) * (1 - outro);

      const want = camBase
        .clone()
        .addScaledVector(tan, -back)
        .addScaledVector(UP, up)
        .addScaledVector(side, sideK);
      const look = camBase
        .clone()
        .addScaledVector(tan, 1.15 - outro * 1.5)
        .addScaledVector(UP, -0.35 + intro * 0.65)
        .addScaledVector(side, cardClearance * 0.55);

      if (first || reduced) {
        camPos.copy(want);
        camLook.copy(look);
        first = false;
      }
      camPos.lerp(want, Math.min(dt * 3, 1));
      camLook.lerp(look, Math.min(dt * 4, 1));
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      world.rotation.z += (-pointer.x * 0.03 - world.rotation.z) * Math.min(dt * 3, 1);
      world.rotation.x += (pointer.y * 0.02 - world.rotation.x) * Math.min(dt * 3, 1);

      sun.position.copy(cp).add(new THREE.Vector3(-6, 12, 6));
      sun.target.position.copy(cp);
    };

    const loop = (timestamp?: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(loop);
      timer.update(timestamp);
      const raw = timer.getDelta();
      const dt = Math.min(raw, 1 / 20);
      if (!isVisibleRef.current || document.hidden) return;
      update(dt);
      renderer.render(scene, camera);
      adapt(raw);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      timer.dispose();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      disposables.forEach((d) => d.dispose());
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  const clampedP = Math.max(0, Math.min(1, progress));
  const isStageEntered = isVisible && entranceProgress > 0.12;
  const headingChars = "EDUCATION.MD".split("");

  return (
    <div
      ref={containerRef}
      className="edu-road-root relative w-full h-full overflow-hidden select-none"
    >
      <style>{`
        .edu-road-root {
          --tink-ease: cubic-bezier(.2, .8, .2, 1);
          --edu-spring: cubic-bezier(0.22, 1, 0.36, 1);
        }

        .tink-w {
          display: inline-block;
          white-space: nowrap;
        }
        .tink-mask {
          display: inline-block;
          overflow: hidden;
          padding: 0.08em 0.03em 0.14em;
          margin: -0.08em -0.03em -0.14em;
          vertical-align: bottom;
        }
        .tink-c {
          display: inline-block;
          transform: translateY(112%);
          opacity: 0;
          transition: transform 0.85s var(--tink-ease), opacity 0.5s ease;
          transition-delay: calc(var(--i) * 14ms);
        }
        .tink-split.in .tink-c {
          transform: none;
          opacity: 1;
        }

        .edu-head-char {
          display: inline-block;
          transform: translateY(115%);
          opacity: 0;
          transition: transform 0.72s var(--edu-spring), opacity 0.45s ease;
          transition-delay: calc(var(--hi) * 28ms);
        }
        .edu-head-line.in .edu-head-char {
          transform: translateY(0);
          opacity: 1;
        }

        .edu-stage-sub {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease 0.24s, transform 0.75s var(--edu-spring) 0.24s;
        }
        .edu-stage-sub.in {
          opacity: 1;
          transform: translateY(0);
        }

        .edu-window-shell {
          transform: perspective(900px) translateY(20px) scale(0.92) rotateX(6deg);
          opacity: 0;
          transform-origin: center bottom;
          transition:
            transform 0.78s var(--edu-spring),
            opacity 0.48s ease;
        }
        .edu-window-shell.in {
          transform: perspective(900px) translateY(0) scale(1) rotateX(0deg);
          opacity: 1;
        }
        .edu-window-shell.in:hover {
          transform: perspective(900px) translateY(-8px) scale(1.015) rotateX(0deg);
          transition:
            transform 0.35s var(--edu-spring),
            opacity 0.48s ease;
        }
        .edu-window-frame {
          filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.36));
          transition: filter 0.35s ease;
        }
        .edu-window-shell.in:hover .edu-window-frame {
          filter: drop-shadow(0 26px 38px rgba(0, 0, 0, 0.46));
        }

        .edu-rule-wipe {
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.75s var(--edu-spring) 0.2s;
        }
        .edu-rule-wipe.in {
          transform: scaleX(1);
        }

        .tink-reveal {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.65s ease, transform 0.85s var(--tink-ease);
        }
        .tink-reveal.in {
          opacity: 1;
          transform: none;
        }
        .tink-reveal-d1 { transition-delay: 110ms; }
        .tink-reveal-d2 { transition-delay: 200ms; }

        @media (prefers-reduced-motion: reduce) {
          .tink-c, .tink-reveal, .edu-head-char, .edu-stage-sub, .edu-window-shell, .edu-rule-wipe {
            transform: none !important;
            opacity: 1 !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Transparent 3D WebGL Road & Running Cat directly over portfolio background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Section Heading: generous top breathing room inside lace borders, masked stagger reveal */}
      <div className="relative z-10 w-[84vw] max-w-[1060px] mx-auto pt-9 sm:pt-12 lg:pt-14 flex items-start justify-between pointer-events-none">
        <div>
          <h2
            className={`edu-head-line text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight drop-shadow-sm mb-0.5 creations-heading transition-colors duration-500 ${isStageEntered ? "in" : ""
              }`}
            style={{
              fontFamily: "'Special Elite', cursive",
              color: "var(--exp-headline-color, #2b180e)",
              textShadow: "var(--exp-text-shadow, none)",
            }}
            aria-label="EDUCATION.log"
          >
            {headingChars.map((ch, idx) => (
              <span key={idx} className="tink-mask">
                <span
                  className="edu-head-char"
                  style={{ "--hi": idx } as React.CSSProperties}
                >
                  {ch}
                </span>
              </span>
            ))}
          </h2>
          <p
            className={`edu-stage-sub text-xs sm:text-sm font-mono tracking-wide creations-subheading transition-colors duration-500 ${isStageEntered ? "in" : ""
              }`}
            style={{
              fontFamily: "'Special Elite', cursive",
              color: "var(--exp-subtext-color, #3d2314)",
            }}
          >
            Academic milestones &bull; Scroll down to follow the trail
          </p>
        </div>
      </div>

      {/* ─── 3 Retro Window Cards using exact /assets/small_experience.webp frame ─── */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="relative w-[84vw] max-w-[1060px] h-full mx-auto">
          {EDUCATION_MILESTONES.map((ms, idx) => {
            const startWin = idx === 0 ? -0.15 : ms.stopProgress - 0.19;
            const endWin =
              idx === EDUCATION_MILESTONES.length - 1 ? 1.15 : ms.stopProgress + 0.19;

            const dist = clampedP - ms.stopProgress;
            const halfSpan = 0.19;
            const normDist = Math.abs(dist) / halfSpan;

            const isEdgePinned =
              (idx === 0 && clampedP <= ms.stopProgress) ||
              (idx === EDUCATION_MILESTONES.length - 1 && clampedP >= ms.stopProgress);

            const opacity = isEdgePinned
              ? 1
              : Math.max(0, Math.min(1, 1 - Math.max(0, normDist - 0.55) / 0.45));
            const translateY = isEdgePinned ? 0 : -dist * 105;
            const isIn =
              isStageEntered &&
              clampedP >= startWin &&
              clampedP <= endWin &&
              opacity > 0.25;
            const isLeft = ms.side === "left";

            return (
              <section
                key={ms.id}
                aria-hidden={!isIn}
                className="absolute inset-x-0 top-28 bottom-8 flex items-center"
                style={{
                  opacity,
                  transform: `translate3d(0, ${translateY.toFixed(1)}px, 0)`,
                  visibility: opacity > 0.01 ? "visible" : "hidden",
                  pointerEvents: isIn ? "auto" : "none",
                }}
              >
                {/* Exact Retro Window Frame (/assets/small_experience.webp) with tactile unfold reveal */}
                <div
                  className={`edu-window-shell relative w-[min(370px,84vw)] sm:w-[400px] h-[min(365px,54vh)] min-h-[305px] ${isLeft ? "mr-auto" : "ml-auto"
                    } ${isIn ? "in" : ""}`}
                >
                  <div
                    aria-hidden="true"
                    className="edu-window-frame absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: "url('/assets/small_experience.webp')",
                      backgroundSize: "100% 100%",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />

                  {/* Strict Cream Paper Safe-Zone (18% top, 11.5% bottom, 14% sides) */}
                  <div
                    className="absolute flex flex-col justify-between overflow-y-auto no-scrollbar py-0.5"
                    style={{
                      top: "18%",
                      bottom: "11.5%",
                      left: "14%",
                      right: "14%",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      WebkitFontSmoothing: "antialiased",
                    }}
                  >
                    {/* Header: Index + Period Capsule + Institution */}
                    <div className="flex flex-col flex-shrink-0">
                      <div
                        className={`tink-reveal flex items-center justify-between gap-2 mb-1.5 ${isIn ? "in" : ""
                          }`}
                      >
                        <span
                          className="text-sm font-bold"
                          style={{ fontFamily: "'Space Mono', monospace", color: "#7c5840" }}
                        >
                          {ms.count}.
                        </span>

                        <span
                          className="inline-flex items-center gap-1 text-[10px] sm:text-[10.5px] font-bold tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: "#4a2c1d",
                            backgroundColor: "#efe0ce",
                            border: "1px solid #dec9b2",
                          }}
                        >
                          {ms.period}
                        </span>
                      </div>

                      <SplitHeadline text={ms.institution} isIn={isIn} />

                      <div
                        className={`edu-rule-wipe h-[2px] w-3/4 rounded-full mt-2 bg-gradient-to-r from-[#8b5e3c]/65 via-[#c28e64]/45 to-transparent ${isIn ? "in" : ""
                          }`}
                      />
                    </div>

                    {/* Degree + Specialization (single concise block, zero repetition) */}
                    <div
                      className={`tink-reveal tink-reveal-d1 my-auto py-2 space-y-1 ${isIn ? "in" : ""
                        }`}
                    >
                      <p className="text-[14px] sm:text-[15px] font-semibold leading-snug text-[#2b180e]">
                        {ms.degree}
                      </p>
                      {ms.detail && (
                        <p className="text-[12.5px] sm:text-[13.5px] font-medium text-[#6b442d]">
                          {ms.detail}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metric Capsule + Next Action */}
                    <div
                      className={`tink-reveal tink-reveal-d2 pt-2 border-t flex items-center justify-between gap-2 ${isIn ? "in" : ""
                        }`}
                      style={{ borderColor: "#dec9b2" }}
                    >
                      <div
                        className="inline-flex items-baseline gap-1.5 px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#efe0ce",
                          border: "1px solid #dec9b2",
                        }}
                      >
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ fontFamily: "'Space Mono', monospace", color: "#6b442d" }}
                        >
                          {ms.scoreLabel}:
                        </span>
                        <SpeedingText
                          value={ms.scoreValue}
                          isActive={isIn}
                          delay={240}
                          duration={860}
                          className="text-sm sm:text-base font-bold"
                          style={{ fontFamily: "'Special Elite', cursive", color: "#2b180e" }}
                        />
                      </div>

                      {idx < EDUCATION_MILESTONES.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectProgress?.(EDUCATION_MILESTONES[idx + 1].stopProgress)
                          }
                          className="group inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: "#4a2c1d",
                          }}
                        >
                          <span>NEXT</span>
                          <span className="w-5 h-5 rounded-full bg-[#4a2c1d] text-[#fdf6ec] grid place-items-center text-[10px] transition-transform duration-300 group-hover:translate-y-0.5">
                            ↓
                          </span>
                        </button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ fontFamily: "'Space Mono', monospace", color: "#6b442d" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Pursuing</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
