import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending, BoxGeometry, type BufferGeometry, CanvasTexture, Color, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute,
  Group, LatheGeometry, type Material, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, Shape, SphereGeometry,
  type Mesh, type Object3D, SRGBColorSpace, type Sprite, TorusGeometry, Vector2, Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useStore } from "../store";
import { cityTowers, towerReach, towerTop } from "./Plaza";
import { C, glowTexture } from "./textures";

/**
 * The aerial craft of the Art Techno design doc (design/aerial-craft.md in the
 * project, docs/designs/aerial-*.png here): the Packet Clipper, the Uplink
 * rocket and The Cloud airship, built in code from their boards and sent across
 * the sky now and then. Every edge runs at 0, 45 or 90 degrees, fans are iris
 * portholes, windows are server lights, and the flame is emitted light.
 */

type Parts = Record<"hull" | "gold" | "copper" | "green" | "lights", BufferGeometry[]>;
const parts = (): Parts => ({ hull: [], gold: [], copper: [], green: [], lights: [] });

/** Paint a geometry one colour, for the merged vertex-coloured lights. */
function tint(g: BufferGeometry, hex: string) {
  const c = new Color(hex);
  const n = g.getAttribute("position").count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new Float32BufferAttribute(a, 3));
  return g;
}

const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new BoxGeometry(w, h, d).translate(x, y, z);
/** An extruded outline: points in the x-y plane, `depth` thick, centred on z = 0. */
function slab(points: [number, number][], depth: number) {
  const s = new Shape(points.map(([x, y]) => new Vector2(x, y)));
  return new ExtrudeGeometry(s, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
}
/** The iris porthole: a gold ring, six copper blades, a green core. Faces +z. */
function iris(p: Parts, r: number, place: (g: BufferGeometry) => BufferGeometry) {
  p.gold.push(place(new TorusGeometry(r, r * 0.12, 6, 24)));
  p.hull.push(place(new CylinderGeometry(r * 0.9, r * 0.9, r * 0.1, 24).rotateX(Math.PI / 2)));
  for (let k = 0; k < 6; k++) p.copper.push(place(box(r * 0.75, r * 0.07, r * 0.14, r * 0.38).rotateZ(k * (Math.PI / 3) + 0.5)));
  p.lights.push(place(tint(new CylinderGeometry(r * 0.2, r * 0.2, r * 0.16, 12).rotateX(Math.PI / 2), C.green)));
}
/** Server lights: a row of small lit dashes in gold, silk and mint. */
function serverRow(p: Parts, n: number, place: (g: BufferGeometry, i: number) => BufferGeometry | null) {
  const cols = [C.gold, C.silk, C.mint, C.gold, C.silk, C.green];
  for (let i = 0; i < n; i++) {
    const g = place(box(1, 1, 1), i);
    if (g) p.lights.push(tint(g, cols[(i * 7) % cols.length]!));
  }
}

/** Packet Clipper: 40 m long, nose along +x. The plan from the board, at 0.0694 m per pixel. */
function clipperParts(): Parts {
  const p = parts();
  const s = 0.0694;
  const X = (Y: number) => (430 - Y) * s; // board y (nose up) to metres forward
  const Z = (Xb: number) => (Xb - 450) * s;
  // Fuselage: an octagonal body, a three-step nose, a tail cone cut at 45 degrees.
  const R = 2.6;
  const along = (g: BufferGeometry) => g.rotateZ(-Math.PI / 2);
  const oct = (r0: number, r1: number, len: number, x: number) => along(new CylinderGeometry(r1, r0, len, 8).rotateY(Math.PI / 8)).translate(x, 0, 0);
  p.hull.push(oct(R, R, X(216) - X(606), (X(216) + X(606)) / 2));
  for (const [hw, y0, y1] of [[1.9, 200, 216], [1.35, 184, 200], [0.7, 160, 184]] as const) p.hull.push(oct(hw, hw, (y1 - y0) * s, X((y0 + y1) / 2)));
  p.hull.push(oct(R, 1.1, X(606) - X(628), (X(606) + X(628)) / 2));
  p.hull.push(oct(1.1, 0.45, X(628) - X(740), (X(628) + X(740)) / 2));
  // Cockpit: a solder-green die band round the nose.
  p.green.push(oct(R + 0.05, R + 0.05, 1.0, X(222)));
  // Wings: swept at exactly 45 degrees, square tips, a chevron trailing edge.
  const wing: [number, number][] = [[486, 322], [738, 574], [738, 606], [610, 606], [486, 482]].map(([xb, yb]) => [X(yb!), Z(xb!)]);
  for (const side of [1, -1]) {
    const pts = wing.map(([x, z]) => [x, z * side] as [number, number]);
    // The outline lies in x-z: extrude in y.
    const g = slab(pts, 0.5).rotateX(Math.PI / 2).translate(0, -0.9, 0);
    p.hull.push(g);
    // Heat-sink fins along the leading edge, and the lift fans.
    for (let k = 1; k <= 4; k++) {
      const len = 12 - k * 1.6;
      p.copper.push(box(len, 0.1, 0.16).rotateY(side * Math.PI / 4).translate(X(380 + k * 22) - len * 0.35, -0.6, side * (Z(486) + len * 0.35 + k * 0.3)));
    }
    for (const [xb, yb] of [[560, 446], [636, 522]]) iris(p, 1.35, (g2) => g2.rotateX(-Math.PI / 2).translate(X(yb!), -0.62, side * Z(xb!)));
    // Wingtip lights: green on the right, copper on the left.
    p.lights.push(tint(new SphereGeometry(0.35, 8, 6).translate(X(590), -0.6, side * Z(742)), side > 0 ? C.green : C.copper));
  }
  // Tail fin with a copper rib, and the tailplane.
  const fin: [number, number][] = [[X(724), 1.5], [X(724), 8], [X(700), 8], [X(630), 1.5]];
  p.hull.push(slab(fin, 0.35));
  p.copper.push(box(0.12, 5.6, 0.4, X(712), 4.6, 0));
  for (const side of [1, -1]) {
    const tp: [number, number][] = [[462, 640], [536, 714], [536, 728], [462, 728]].map(([xb, yb]) => [X(yb!), side * Z(xb!)]);
    p.hull.push(slab(tp, 0.3).rotateX(Math.PI / 2).translate(0, 0.9, 0));
  }
  // The spine: a heavy copper trace with a gold hairline, a via at each end.
  p.copper.push(box(X(250) - X(700), 0.1, 0.55, (X(250) + X(700)) / 2, R + 0.02, -0.3));
  p.gold.push(box(X(250) - X(700), 0.1, 0.16, (X(250) + X(700)) / 2, R + 0.02, 0.45));
  for (const yb of [250, 700]) p.gold.push(new CylinderGeometry(0.5, 0.5, 0.14, 12).translate(X(yb), R + 0.03, -0.3));
  // Windows as server lights, both sides; speed lines dashed in bit patterns.
  for (const side of [1, -1]) {
    serverRow(p, 26, (g, i) => g.scale(0.5, 0.5, 0.1).translate(X(590) + i * 0.97, 0.5, side * (R * 0.94)));
    for (let i = 0; i < 18; i++) {
      const len = [1.2, 0.4, 0.8, 0.4][i % 4]!;
      p.gold.push(box(len, 0.1, 0.06, X(600) + i * 1.6, 1.5, side * (R * 0.95)));
    }
  }
  return p;
}

/** Uplink: about 52 m tall, standing on +y with its engines at the origin. */
function uplinkParts(): Parts {
  const p = parts();
  const r = 2.6;
  const cyl = (r0: number, r1: number, h: number, y: number, seg = 24) => new CylinderGeometry(r1, r0, h, seg).translate(0, y + h / 2, 0);
  // Engines: three bells splayed at 45 degrees, under a stepped skirt ringed with studs.
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    p.hull.push(new CylinderGeometry(0.55, 1.15, 1.6, 12).translate(Math.cos(a) * 1.2, 0.8, Math.sin(a) * 1.2));
  }
  p.hull.push(cyl(3.0, r, 1.4, 1.6));
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    p.gold.push(new SphereGeometry(0.16, 6, 4).translate(Math.cos(a) * 2.95, 2.2, Math.sin(a) * 2.95));
  }
  // First stage: heat-sink flutes, folded legs, a band of server lights, the die emblem.
  p.hull.push(cyl(r, r, 34, 3));
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    p.copper.push(box(0.14, 11, 0.14, Math.cos(a) * (r + 0.04), 9, Math.sin(a) * (r + 0.04)));
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    p.copper.push(box(0.5, 8, 1.1).rotateY(-a).translate(Math.cos(a) * (r + 0.25), 7.5, Math.sin(a) * (r + 0.25)));
  }
  for (let row = 0; row < 4; row++)
    serverRow(p, 36, (g, i) => ((i * 3 + row * 5) % 7 < 4 ? g.scale(0.5, 0.18, 0.08).translate(0, 0, r + 0.02).rotateY((i / 36) * Math.PI * 2).translate(0, 24 + row * 0.55, 0) : null));
  for (const a of [0, Math.PI]) {
    const place = (g: BufferGeometry) => g.translate(0, 30, r + 0.06).rotateY(a);
    p.gold.push(place(new TorusGeometry(1.7, 0.1, 4, 4).rotateZ(Math.PI / 4)));
    p.green.push(place(box(1.4, 1.4, 0.12)));
    p.gold.push(place(box(0.6, 0.6, 0.16)));
  }
  // Interstage studs and the second stage with its routed traces.
  p.green.push(cyl(r + 0.05, r + 0.05, 0.8, 37));
  p.hull.push(cyl(r, r, 6.5, 37.8));
  for (const a of [0, Math.PI]) {
    const place = (g: BufferGeometry) => g.translate(0, 0, r + 0.04).rotateY(a);
    for (const s of [-1, 1]) {
      p.copper.push(place(box(0.25, 2.6, 0.08, s * 1.2, 39.6, 0)));
      p.copper.push(place(box(0.25, 1.6, 0.08).rotateZ(-s * Math.PI / 4).translate(s * 0.9, 41.4, 0)));
      p.copper.push(place(box(0.25, 1.6, 0.08, s * 0.6, 43, 0)));
    }
  }
  // Payload fairing: a five-tier stepped crown, gold at every step, a mast and a pad.
  let y = 44.3;
  for (const [rr, h] of [[r, 2], [2.06, 1.4], [1.52, 1.4], [0.98, 1.2], [0.54, 0.8]] as const) {
    p.hull.push(cyl(rr, rr, h, y, 8));
    p.gold.push(cyl(rr + 0.08, rr + 0.08, 0.16, y + h - 0.16, 8));
    y += h;
  }
  p.gold.push(cyl(0.08, 0.08, 2.2, y));
  p.lights.push(tint(new SphereGeometry(0.3, 8, 6).translate(0, y + 2.3, 0), C.gold));
  return p;
}

/** The Cloud: 104 m long along +x, its axis at the origin. The hull is lathed, so it is faceted like Deco metalwork. */
function cloudParts(): { parts: Parts; hull: BufferGeometry } {
  const p = parts();
  // Profile: a 45-degree tail, straight flanks, a true-arc nose, sampled evenly so the skin texture is even.
  const prof: Vector2[] = [];
  const R = 15, x0 = -51, x1 = 36;
  prof.push(new Vector2(0.01, x0), new Vector2(7, x0));
  for (let x = x0; x <= x0 + 8; x += 2) prof.push(new Vector2(7 + (x - x0), x));
  for (let x = x0 + 10; x <= x1; x += 3) prof.push(new Vector2(R, x));
  for (let k = 1; k <= 12; k++) {
    const a = (k / 12) * (Math.PI / 2);
    prof.push(new Vector2(Math.max(0.01, R * Math.cos(a)), x1 + R * Math.sin(a)));
  }
  const hull = new LatheGeometry(prof, 24).rotateZ(-Math.PI / 2);
  // Cruciform fins with 45-degree leading edges and copper ribs.
  const fin: [number, number][] = [[-51, 7], [-51, 27], [-47, 27], [-34, 14], [-36, 13]];
  for (let k = 0; k < 4; k++) {
    p.hull.push(slab(fin, 0.6).rotateX((k * Math.PI) / 2));
    p.copper.push(box(0.3, 13, 0.75, -49, 20, 0).rotateX((k * Math.PI) / 2));
  }
  // Gondola: a server rack with its ends cut at 45 degrees, lit in rows, pins along its keel.
  const gon: [number, number][] = [[-16.6, -14.6], [18.2, -14.6], [18.2, -20.2], [14.8, -23.6], [-13.2, -23.6], [-16.6, -20.2]];
  p.hull.push(slab(gon, 6));
  for (const side of [1, -1])
    for (let row = 0; row < 3; row++)
      serverRow(p, 30, (g, i) => ((row * 5 + i * 3) % 7 < 4 ? g.scale(0.7, 0.32, 0.1).translate(-14.5 + i * 1.03, -16.2 - row * 1.5, side * 3.03) : null));
  for (let i = 0; i < 12; i++) p.copper.push(box(0.25, 1.5, 4, -11 + i * 2.2, -24.2, 0));
  p.gold.push(box(35, 0.25, 6.3, 0.8, -14.7, 0));
  // Ducted fans on struts, fore and aft of the gondola, both sides.
  for (const x of [-28.6, 30.2])
    for (const side of [1, -1]) {
      p.gold.push(box(0.5, 0.5, 9, x, -19.4, side * 4.5));
      iris(p, 3, (g) => g.rotateY(Math.PI / 2).translate(x, -19.4, side * 9));
    }
  // The die lozenge on each flank.
  for (const side of [1, -1]) {
    const place = (g: BufferGeometry) => g.translate(30, 2, side * (R + 0.15));
    p.gold.push(place(new TorusGeometry(5, 0.35, 4, 4).rotateZ(Math.PI / 4)));
    p.green.push(place(box(3.6, 3.6, 0.3)));
    p.gold.push(place(box(1.4, 1.4, 0.4)));
  }
  // Nose cap.
  p.gold.push(new CylinderGeometry(1.4, 1.4, 1.2, 8).rotateZ(Math.PI / 2).translate(x1 + R + 0.4, 0, 0));
  return { parts: p, hull };
}

/**
 * The Cloud's skin: gold girders along the hull, frame rings with a via where
 * each crosses the keel line, and server-light ports along the upper flanks.
 * u runs round the hull, v along it; drawn as light, so it is the emissive map.
 */
function cloudSkin() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#6b5528";
  for (let k = 0; k < 24; k++) g.fillRect((k / 24) * 1024 - 1, 0, 3, 512);
  g.fillStyle = "#5a4520";
  for (let j = 1; j < 16; j++) g.fillRect(0, (j / 16) * 512 - 1, 1024, 3);
  // The keel trace (bottom, u = 0.25) in copper, vias at each frame.
  g.fillStyle = "#7a4a26";
  g.fillRect(0.25 * 1024 - 5, 0, 10, 512);
  g.fillStyle = "#c9a656";
  for (let j = 1; j < 16; j++) { g.beginPath(); g.arc(0.25 * 1024, (j / 16) * 512, 9, 0, Math.PI * 2); g.fill(); }
  // Ports along the upper flanks (u = 0.62 and 0.88), lit like server racks.
  const cols = ["#f6e3b0", "#d4af5a", "#7fbfa8", "#d4af5a"];
  for (const u of [0.62, 0.88])
    for (let j = 40; j < 470; j += 12) {
      if ((j * 7) % 5 > 2) continue;
      g.fillStyle = cols[(j / 12) % cols.length | 0]!;
      g.fillRect(u * 1024 - 4, j, 8, 6);
    }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function mergeParts(p: Parts) {
  const out: Partial<Record<keyof Parts, BufferGeometry>> = {};
  for (const k of Object.keys(p) as (keyof Parts)[]) {
    if (!p[k].length) continue;
    const gs = p[k].map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      for (const name of Object.keys(n.attributes)) if (!["position", "normal", "uv", "color"].includes(name)) n.deleteAttribute(name);
      if (k !== "lights") n.deleteAttribute("color");
      if (!n.getAttribute("uv")) n.setAttribute("uv", new Float32BufferAttribute(new Float32Array(n.getAttribute("position").count * 2), 2));
      return n;
    });
    out[k] = mergeGeometries(gs)!;
  }
  return out;
}

type Kind = "clipper" | "uplink" | "cloud";
type Flight = { kind: Kind; t: number; dur: number; from: Vector3; to: Vector3; yaw: number; pad?: Vector3; out?: Vector3 };

/** A flight path: crossing the sky well above the city, or, for Uplink, a launch from beyond it. */
function plan(kind: Kind, rnd = Math.random): Flight {
  const heading = rnd() * Math.PI * 2;
  if (kind === "uplink") {
    // A pad beyond the tall ring, anywhere but straight behind Ad Astra.
    let a = rnd() * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a), -Math.cos(a))) < 0.4) a += 0.8;
    const pad = new Vector3(Math.sin(a) * 285, 0, Math.cos(a) * 285);
    return { kind, t: 0, dur: 30, from: pad, to: pad, yaw: 0, pad, out: pad.clone().normalize() };
  }
  // Try a few lines across the sky and keep the one that can fly lowest: the
  // craft must clear every building it passes over, crown and mast included.
  const clipper = kind === "clipper";
  const half = clipper ? 520 : 420;
  const reach = clipper ? 20 : 30; // half the wingspan, or the airship's fins and fans
  const below = clipper ? 4 : 26; // how far the craft hangs below its centre line
  let best: Flight | null = null;
  let bestAlt = Infinity;
  for (let attempt = 0; attempt < 12; attempt++) {
    const h = attempt === 0 ? heading : rnd() * Math.PI * 2;
    const d = new Vector3(Math.cos(h), 0, Math.sin(h));
    const sd = new Vector3(-d.z, 0, d.x);
    const offset = (rnd() < 0.5 ? -1 : 1) * (clipper ? 30 + rnd() * 130 : 60 + rnd() * 140);
    const mid = sd.multiplyScalar(offset).add(new Vector3(0, 0, -10));
    const from = mid.clone().addScaledVector(d, -half), to = mid.clone().addScaledVector(d, half);
    const floor = clipper ? 120 + rnd() * 25 : 90 + rnd() * 20;
    let need = 0;
    for (const t of CITY) {
      if (segmentDistance(t.x, t.z, from, to) < towerReach(t) + reach + 12) need = Math.max(need, towerTop(t) + 18 + below);
    }
    const alt = Math.max(floor, need);
    if (alt < bestAlt) {
      bestAlt = alt;
      best = { kind, t: 0, dur: clipper ? 24 : 70, from: from.setY(alt), to: to.setY(alt), yaw: -h };
    }
    if (alt <= floor) break;
  }
  return best!;
}

/** Distance in plan from a point to a flight's line. */
function segmentDistance(x: number, z: number, a: Vector3, b: Vector3) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(a.x + dx * t - x, a.z + dz * t - z);
}

const CITY = cityTowers();

const NEXT = () => 18 + Math.random() * 30;

/**
 * Sculpted craft from Grok renders converted in Meshy, as for the Spirits. Each
 * replaces its code-built stand-in once loaded: `turn` points the nose along +x,
 * `length` is its size in metres. The code-built craft stays as the fallback.
 */
const MODELS: Partial<Record<Kind, { url: string; turn: number; length: number }>> = {
  // The Packet Clipper ("Gilded Nightwing" in Meshy): exported nose toward -x.
  clipper: { url: "models/clipper.glb", turn: Math.PI, length: 40 },
  // The Cloud ("Emerald Sovereign" in Meshy): exported nose toward -x.
  cloud: { url: "models/cloud.glb", turn: Math.PI, length: 104 },
};

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

function useCraftModels() {
  const [models, setModels] = useState<Partial<Record<Kind, Object3D>>>({});
  useEffect(() => {
    let live = true;
    for (const [kind, m] of Object.entries(MODELS) as [Kind, NonNullable<(typeof MODELS)[Kind]>][]) {
      loader.load(`${import.meta.env.BASE_URL}${m.url}`, (gltf) => {
        if (!live) return;
        const root = gltf.scene;
        root.rotation.y = m.turn;
        root.updateMatrixWorld(true);
        // Centre it and scale it to its length.
        let x0 = Infinity, x1 = -Infinity, cx = 0, cy = 0, cz = 0, n = 0;
        root.traverse((o) => {
          const mesh = o as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.computeBoundingBox();
          const b = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
          x0 = Math.min(x0, b.min.x); x1 = Math.max(x1, b.max.x);
          const c = b.getCenter(new Vector3());
          cx += c.x; cy += c.y; cz += c.z; n++;
          // Its windows and gold carry a little light of their own at night.
          const mat = mesh.material as MeshStandardMaterial;
          if (mat.map) { mat.emissiveMap = mat.map; mat.emissive.set("#ffffff"); mat.emissiveIntensity = 0; }
        });
        const k = m.length / (x1 - x0);
        const wrap = new Group();
        root.position.set(-cx / n, -cy / n, -cz / n);
        wrap.add(root);
        wrap.scale.setScalar(k);
        setModels((prev) => ({ ...prev, [kind]: wrap }));
      }, undefined, () => { /* keep the code-built craft */ });
    }
    return () => { live = false; };
  }, []);
  return models;
}

export function Craft() {
  const daylight = useStore((s) => s.sky.daylight);
  const phase = useStore((s) => s.phase);
  const geo = useMemo(() => {
    const cl = cloudParts();
    return { clipper: mergeParts(clipperParts()), uplink: mergeParts(uplinkParts()), cloud: mergeParts(cl.parts), cloudHull: cl.hull };
  }, []);
  const skin = useMemo(() => cloudSkin(), []);
  const glow = useMemo(() => glowTexture(), []);
  const models = useCraftModels();
  useEffect(() => {
    // The sculpted craft glow faintly from their own texture after dark.
    for (const root of Object.values(models))
      root?.traverse((o) => {
        const mat = (o as Mesh).material as MeshStandardMaterial | undefined;
        if (mat?.emissiveMap) mat.emissiveIntensity = 0.12 * (1 - daylight);
      });
  }, [models, daylight]);
  const mats = useMemo(() => ({
    hull: new MeshStandardMaterial({ color: C.obsidian, metalness: 0.6, roughness: 0.3 }),
    gold: new MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.3, emissive: C.gold, emissiveIntensity: 0.25 }),
    copper: new MeshStandardMaterial({ color: C.copper, metalness: 0.85, roughness: 0.35, emissive: C.copper, emissiveIntensity: 0.15 }),
    green: new MeshStandardMaterial({ color: C.green, metalness: 0.3, roughness: 0.4, emissive: C.green, emissiveIntensity: 0.3 }),
    lights: new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    skin: new MeshStandardMaterial({ color: "#0d1412", metalness: 0.55, roughness: 0.35, emissive: "#ffffff", emissiveMap: skin, emissiveIntensity: 1 }),
    // The flame is light: no fog, so a launch beyond the haze still shows.
    flame: new MeshBasicMaterial({ color: "#fff1d0", toneMapped: false, fog: false }),
    rays: new MeshBasicMaterial({ color: new Color(C.gold).multiplyScalar(1.6), toneMapped: false, fog: false }),
  }), [skin]);
  useEffect(() => {
    // The gold and the lit skin glow more at night.
    mats.gold.emissiveIntensity = 0.25 * (1 - 0.7 * daylight);
    mats.skin.emissiveIntensity = 1 - 0.75 * daylight;
  }, [mats, daylight]);
  useEffect(() => () => { Object.values(mats).forEach((m: Material) => m.dispose()); skin.dispose(); glow.dispose(); }, [mats, skin, glow]);

  // Uplink's exhaust: a stepped, faceted flame (a lathe of eight facets) and a fan of rays ending in pads.
  const flameGeo = useMemo(() => {
    const prof = [[0.01, -16], [0.9, -12], [0.9, -9], [1.6, -7], [1.6, -4], [2.2, -2], [1.4, 0]].map(([r, y]) => new Vector2(r, y));
    return new LatheGeometry(prof, 8);
  }, []);
  const rayGeo = useMemo(() => {
    const gs: BufferGeometry[] = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const len = k % 2 ? 7 : 11;
      const g = box(0.18, len, 0.18, 0, -len / 2, 0).rotateZ(0.6).rotateY(a);
      const tip = new Vector3(0, -len, 0).applyAxisAngle(new Vector3(0, 0, 1), 0.6).applyAxisAngle(new Vector3(0, 1, 0), a);
      gs.push(g.toNonIndexed(), new SphereGeometry(k % 2 ? 0.35 : 0.5, 6, 4).translate(tip.x, tip.y, tip.z).toNonIndexed());
    }
    for (const g of gs) { g.deleteAttribute("uv"); }
    return mergeGeometries(gs)!;
  }, []);

  const groups = { clipper: useRef<Group>(null), uplink: useRef<Group>(null), cloud: useRef<Group>(null) };
  const flame = useRef<Group>(null);
  const halo = useRef<Sprite>(null);
  const strobes = { clipper: useRef<Sprite>(null), cloud: useRef<Sprite>(null) };
  const flights = useRef<Partial<Record<Kind, Flight>>>({});
  const next = useRef(6);

  // ?craft=clipper (or uplink, cloud): hold one craft in view, for screenshots.
  const pinned = useMemo(() => {
    const k = new URLSearchParams(location.search).get("craft");
    return k === "clipper" || k === "uplink" || k === "cloud" ? k : null;
  }, []);

  // Thumbnails and pose checks stay still: no craft unless one is asked for.
  const still = useMemo(() => ["thumb", "pose"].some((k) => new URLSearchParams(location.search).has(k)), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const f = flights.current;
    if (pinned) {
      if (!f[pinned]) {
        const fl = plan(pinned, () => 0.3);
        if (pinned === "uplink") { fl.pad = new Vector3(-150, 0, -140); fl.out = fl.pad.clone().normalize(); fl.t = 0.23; }
        else { fl.from.set(-160, pinned === "clipper" ? 60 : 55, -60); fl.to.set(160, pinned === "clipper" ? 60 : 55, -60); fl.yaw = 0; fl.t = 0.5; }
        f[pinned] = fl;
      }
    } else if (phase === "walk" && !still) {
      next.current -= dt;
      if (next.current <= 0) {
        const free = (["clipper", "cloud", "uplink"] as Kind[]).filter((k) => !f[k]);
        if (free.length) {
          const r = Math.random();
          const want: Kind = r < 0.45 ? "clipper" : r < 0.8 ? "cloud" : "uplink";
          const k = free.includes(want) ? want : free[0]!;
          f[k] = plan(k);
        }
        next.current = NEXT();
      }
    }
    for (const kind of ["clipper", "uplink", "cloud"] as Kind[]) {
      const g = groups[kind].current;
      const fl = f[kind];
      if (!g) continue;
      g.visible = !!fl;
      if (!fl) continue;
      if (!pinned) fl.t += dt / fl.dur;
      if (fl.t >= 1) { delete f[kind]; g.visible = false; continue; }
      if (kind === "uplink") {
        // Straight up, then pitching away from the city as it climbs.
        const time = fl.t * fl.dur;
        const h = 0.5 * 2.6 * time * time;
        const lean = Math.min(0.5, h / 1400);
        g.position.copy(fl.pad!).addScaledVector(fl.out!, h * h / 2400);
        g.position.y = h;
        const axis = new Vector3(-fl.out!.z, 0, fl.out!.x);
        g.quaternion.setFromAxisAngle(axis, -lean);
        const flick = 1 + Math.sin(clock.elapsedTime * 40) * 0.06 + Math.sin(clock.elapsedTime * 23) * 0.05;
        flame.current?.scale.set(1, flick * Math.min(1, time / 2 + 0.3), 1);
        halo.current?.scale.setScalar(26 * flick);
      } else {
        g.position.lerpVectors(fl.from, fl.to, fl.t);
        g.rotation.set(0, fl.yaw, 0);
        if (kind === "cloud") g.position.y += Math.sin(clock.elapsedTime * 0.3) * 1.5;
      }
    }
    // Strobes: a short flash every second and a half.
    const on = (clock.elapsedTime % 1.5) < 0.12;
    for (const s of Object.values(strobes)) if (s.current) s.current.visible = on;
  });

  const body = (k: "clipper" | "uplink" | "cloud") =>
    (Object.keys(geo[k]) as (keyof Parts)[]).map((m) => <mesh key={m} geometry={geo[k][m]} material={mats[m]} castShadow={false} />);

  return (
    <group>
      <group ref={groups.clipper} visible={false}>
        {models.clipper ? <primitive object={models.clipper} /> : body("clipper")}
        <sprite ref={strobes.clipper} position={models.clipper ? [-19, 6.4, 0] : [-21, 8.3, 0]} scale={6}>
          <spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent fog={false} color="#ffffff" />
        </sprite>
      </group>
      <group ref={groups.uplink} visible={false}>
        {body("uplink")}
        <group ref={flame}>
          <mesh geometry={flameGeo} material={mats.flame} />
          <mesh geometry={rayGeo} material={mats.rays} position={[0, -0.6, 0]} />
        </group>
        <sprite ref={halo} position={[0, -6, 0]} scale={26}>
          <spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent fog={false} color="#ffd59a" opacity={0.9} />
        </sprite>
      </group>
      <group ref={groups.cloud} visible={false}>
        {models.cloud ? <primitive object={models.cloud} /> : <><mesh geometry={geo.cloudHull} material={mats.skin} />{body("cloud")}</>}
        <sprite ref={strobes.cloud} position={[-52, 0, 0]} scale={8}>
          <spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent fog={false} color="#ffe2a8" />
        </sprite>
      </group>
    </group>
  );
}
