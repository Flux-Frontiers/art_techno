import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending, BackSide, BoxGeometry, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, InstancedMesh,
  MeshBasicMaterial, MeshStandardMaterial, Object3D, ShaderMaterial, type Sprite,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BOUNDS, PROCESSOR, SPIRITS, TERRACE } from "../spirits";
import { C, cityTexture, facadeTexture, glowTexture, pavingTexture } from "./textures";

/** The haze the city fades into: the fog colour, and the sky at the horizon. */
export const HAZE = "#1a2420";
export const HAZE_DENSITY = 0.0048;

/**
 * Dusk dome: near-black zenith, a copper glow low behind the terrace (-z). It
 * runs through the same tone mapping as the scene, and its horizon is exactly
 * the fog colour, so fogged ground and towers meet the sky without a seam.
 */
function Sky() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new Color("#020403") },
          uMid: { value: new Color("#0a110f") },
          uHaze: { value: new Color(HAZE) },
          uGlow: { value: new Color("#7a3a18") },
          uCore: { value: new Color("#b88a48") },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uZenith, uMid, uHaze, uGlow, uCore;
          varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            float hp = max(h, 0.0);
            vec3 col = mix(uHaze, uMid, smoothstep(0.0, 0.22, h));
            col = mix(col, uZenith, smoothstep(0.22, 0.75, h));
            // Sunset glow toward -z, strongest at the horizon.
            float toward = max(0.0, -vDir.z);
            col += uGlow * pow(toward, 3.0) * exp(-hp * 9.0) + uCore * pow(toward, 12.0) * exp(-hp * 28.0);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[480, 32, 16]} />
    </mesh>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const pts: number[] = [];
    let r = 7;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) {
      const u = rnd() * Math.PI * 2;
      const v = 0.12 + rnd() * 0.88;
      const y = v * v;
      const k = Math.sqrt(1 - y * y);
      pts.push(Math.cos(u) * k * 450, y * 450, Math.sin(u) * k * 450);
    }
    g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#d9e6df" size={1.4} sizeAttenuation={false} fog={false} transparent opacity={0.8} />
    </points>
  );
}

function Floor() {
  const w = BOUNDS.maxX - BOUNDS.minX + 4;
  const d = BOUNDS.maxZ - BOUNDS.minZ + 4;
  const cz = (BOUNDS.maxZ + BOUNDS.minZ) / 2;
  const paving = useMemo(() => pavingTexture([w / 8, d / 8]), [w, d]);
  const city = useMemo(() => cityTexture([50, 50]), []);
  return (
    <group>
      {/* The city floor: a dark circuit board to the horizon, matte so it never
          catches the sky, its streets glowing faintly into the haze. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#030504" roughness={1} metalness={0} envMapIntensity={0} emissive="#ffffff" emissiveMap={city} emissiveIntensity={0.75} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, cz]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={paving} roughness={0.32} metalness={0.25} envMapIntensity={0.6} />
      </mesh>
      {/* Gold kerb round the plaza. */}
      {[
        [0, BOUNDS.maxZ + 2, w + 0.4, 0.4],
        [0, BOUNDS.minZ - 2, w + 0.4, 0.4],
        [BOUNDS.maxX + 2, cz, 0.4, d],
        [BOUNDS.minX - 2, cz, 0.4, d],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x!, 0.12, z!]}>
          <boxGeometry args={[sx!, 0.24, sz!]} />
          <meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

type Seg = [number, number, number, number];

/**
 * Traces in the floor from the processor to every pad, routed at 0°, 45° and
 * 90° and ending in a via at each bend and a pad at each end. Each side runs
 * as a bus: the nearer pad takes the outer lane so no two traces cross.
 */
function traceRoutes(): { segs: Seg[]; vias: [number, number][]; copper: boolean[] } {
  const segs: Seg[] = [];
  const vias: [number, number][] = [];
  const copper: boolean[] = [];
  const pz = PROCESSOR.z;
  const edge = PROCESSOR.half + 0.6;
  for (const s of SPIRITS) {
    if (s.id === "astra") continue;
    const sx = Math.sign(s.x);
    const dz = s.z - pz;
    const sg = Math.sign(dz);
    const near = Math.abs(dz) < 15;
    const lane = near ? 10 : 8.6;
    const off = near ? 0.7 : 1.7;
    const padEdge = Math.abs(s.x) - s.pad - 0.1;
    const A: [number, number] = [sx * edge, pz + sg * off];
    const B: [number, number] = [sx * lane, pz + sg * (off + lane - edge)];
    const Cc: [number, number] = [sx * lane, s.z - sg * (padEdge - lane)];
    const D: [number, number] = [sx * padEdge, s.z];
    const path = [A, B, Cc, D];
    for (let i = 0; i < 3; i++) {
      segs.push([path[i]![0], path[i]![1], path[i + 1]![0], path[i + 1]![1]]);
      copper.push(near);
    }
    vias.push(B, Cc);
  }
  // The central bus: entrance to processor, processor to the terrace steps.
  for (const x of [-1.3, 1.3]) {
    segs.push([x, BOUNDS.maxZ, x, pz + edge]);
    copper.push(x > 0);
    segs.push([x, pz - edge, x, TERRACE.z + TERRACE.halfZ + 2.6]);
    copper.push(x > 0);
    vias.push([x, BOUNDS.maxZ], [x, TERRACE.z + TERRACE.halfZ + 2.6]);
  }
  return { segs, vias, copper };
}

function Traces() {
  const { segs, vias, copper } = useMemo(traceRoutes, []);
  const gold = useMemo(() => new MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 0.55, metalness: 0.8, roughness: 0.35 }), []);
  const cop = useMemo(() => new MeshStandardMaterial({ color: C.copper, emissive: C.copper, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.35 }), []);
  const viaMat = useMemo(() => new MeshStandardMaterial({ color: C.gold, emissive: "#f0d58e", emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 }), []);
  return (
    <group>
      {segs.map(([ax, az, bx, bz], i) => {
        const len = Math.hypot(bx - ax, bz - az);
        return (
          <mesh key={i} material={copper[i] ? cop : gold} position={[(ax + bx) / 2, 0.015, (az + bz) / 2]} rotation-y={Math.atan2(bx - ax, bz - az)}>
            <boxGeometry args={[0.32, 0.03, len + 0.32]} />
          </mesh>
        );
      })}
      {vias.map(([x, z], i) => (
        <mesh key={i} material={viaMat} position={[x, 0.02, z]}>
          <cylinderGeometry args={[0.42, 0.42, 0.04, 20]} />
        </mesh>
      ))}
    </group>
  );
}

/** Rule one: the sun is a processor. A stepped chip dais with a burning core. */
function Processor() {
  const glow = useMemo(() => glowTexture(), []);
  const sprite = useRef<Sprite>(null);
  const pins = useMemo(() => {
    const m = new InstancedMesh(new BoxGeometry(0.28, 0.14, 0.9), new MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.3 }), 4 * 13);
    const o = new Object3D();
    let k = 0;
    const h = PROCESSOR.half;
    for (let side = 0; side < 4; side++)
      for (let i = 0; i < 13; i++) {
        const t = -h + 1 + (i * (2 * h - 2)) / 12;
        const pos: [number, number] = side === 0 ? [t, h + 0.4] : side === 1 ? [t, -h - 0.4] : side === 2 ? [h + 0.4, t] : [-h - 0.4, t];
        o.position.set(pos[0], 0.08, pos[1]);
        o.rotation.set(0, side < 2 ? 0 : Math.PI / 2, 0);
        o.updateMatrix();
        m.setMatrixAt(k++, o.matrix);
      }
    return m;
  }, []);
  useFrame(({ clock }) => {
    const s = 9 + Math.sin(clock.elapsedTime * 1.3) * 0.6;
    sprite.current?.scale.set(s, s, 1);
  });
  const h = PROCESSOR.half;
  return (
    <group position={[PROCESSOR.x, 0, PROCESSOR.z]}>
      <primitive object={pins} />
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2 * h, 0.4, 2 * h]} />
        <meshStandardMaterial color={C.panel} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[2 * h - 0.3, 0.02, 2 * h - 0.3]} />
        <meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[7, 0.4, 7]} />
        <meshStandardMaterial color={C.green} metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[4.2, 0.08, 4.2]} />
        <meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3, 0.1, 3]} />
        <meshBasicMaterial color="#fff2cc" toneMapped={false} />
      </mesh>
      <sprite ref={sprite} position={[0, 1.6, 0]}>
        <spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent opacity={0.85} color="#ffd9a0" />
      </sprite>
      <pointLight position={[0, 2.5, 0]} color="#ffd7a0" intensity={60} distance={30} decay={2} />
    </group>
  );
}

/** The raised terrace for Ad Astra, reached by gold-nosed steps on the avenue side. */
function Terrace() {
  const { x, z, halfX, halfZ, height } = TERRACE;
  const stone = useMemo(() => new MeshStandardMaterial({ color: "#121a17", roughness: 0.35, metalness: 0.3 }), []);
  const gold = useMemo(() => new MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.3, emissive: C.gold, emissiveIntensity: 0.15 }), []);
  const steps = 3;
  const rise = height / steps;
  return (
    <group position={[x, 0, z]}>
      <mesh material={stone} position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2 * halfX, height, 2 * halfZ]} />
      </mesh>
      {/* Gold rails along the terrace edge. */}
      <mesh material={gold} position={[0, height + 0.02, halfZ - 0.15]}>
        <boxGeometry args={[2 * halfX, 0.05, 0.3]} />
      </mesh>
      {Array.from({ length: steps }, (_, i) => {
        const h = rise * (i + 1);
        const depth = 0.9;
        const zz = halfZ + (steps - i) * depth - depth / 2;
        return (
          <group key={i}>
            <mesh material={stone} position={[0, h / 2, zz]} receiveShadow>
              <boxGeometry args={[12, h, depth]} />
            </mesh>
            <mesh material={gold} position={[0, h, zz + depth / 2 - 0.05]}>
              <boxGeometry args={[12, 0.06, 0.12]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

type Kind = "setback" | "slab" | "spire" | "hall" | "block";
type Tower = { kind: Kind; x: number; z: number; w: number; d: number; h: number; tiers: number; variant: number; hero?: boolean };
type Parts = { facade: BufferGeometry[]; glow: BufferGeometry[]; caps: BufferGeometry[] };

/** Scale a box's UVs so the 16 m facade tile wraps each face at true size. */
function facadeBox(w: number, h: number, d: number) {
  const g = new BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv");
  // Faces in order +x, -x, +y, -y, +z, -z; four vertices each.
  const size = [[d, h], [d, h], [0, 0], [0, 0], [w, h], [w, h]];
  for (let f = 0; f < 6; f++)
    for (let i = 0; i < 4; i++) uv.setXY(f * 4 + i, uv.getX(f * 4 + i) * size[f]![0]! / 16, uv.getY(f * 4 + i) * size[f]![1]! / 16);
  return g;
}

/** An octagonal tier: a square with its corners chamfered at 45 degrees. */
function octTier(R: number, th: number) {
  const side = new CylinderGeometry(R, R, th, 8, 1, true).rotateY(Math.PI / 8);
  const uv = side.getAttribute("uv");
  const per = (2 * Math.PI * R) / 16;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * per, uv.getY(i) * (th / 16));
  return side;
}

/**
 * One building's parts, in place, sorted by material. Every kind keeps the
 * same vocabulary (server-layer facades, gold edge lines at each setback, a
 * boot-sun fan) in a different massing, like a Deco skyline of siblings.
 */
function towerGeometry(t: Tower): Parts {
  const out: Parts = { facade: [], glow: [], caps: [] };
  // Face the plaza: local -z points at the centre.
  const yaw = Math.atan2(t.x, t.z);
  const place = (g: BufferGeometry, x: number, y: number, z: number) =>
    g.rotateY(yaw).translate(t.x + x * Math.cos(yaw) + z * Math.sin(yaw), y, t.z - x * Math.sin(yaw) + z * Math.cos(yaw));
  // A rectangular layer with its cap and a gold line round the top edge.
  const layer = (w: number, d: number, y: number, th: number) => {
    out.facade.push(place(facadeBox(w, th, d), 0, y + th / 2, 0));
    out.caps.push(place(new BoxGeometry(w + 0.3, 0.3, d + 0.3), 0, y + th, 0));
    out.glow.push(place(new BoxGeometry(w + 0.25, 0.45, d + 0.25), 0, y + th - 0.3, 0));
  };
  // A half boot sun on the plaza face: long and short rays from a chip, each ending in a pad.
  const fan = (r: number, y: number, face: number, rays: number, ray: number) => {
    for (let i = 0; i < rays; i++) {
      const a = (i / (rays - 1)) * Math.PI;
      const len = r * (i % 2 ? 0.7 : 1);
      out.glow.push(place(new BoxGeometry(ray, len, 0.3).translate(0, len / 2, 0).rotateZ(a - Math.PI / 2), 0, y, -face - 0.4));
      out.glow.push(place(new BoxGeometry(ray * 2.4, ray * 2.4, 0.4).translate(Math.cos(a) * len, Math.sin(a) * len, 0), 0, y, -face - 0.45));
    }
    out.glow.push(place(new BoxGeometry(r * 0.3, r * 0.3, 0.5), 0, y, -face - 0.5));
  };
  // A stepped mast tipped with a glowing pad.
  const mast = (y: number, base: number, h: number) => {
    for (let k = 0; k < 3; k++) out.caps.push(place(new BoxGeometry(base * (1 - k * 0.3), h * 0.12, base * (1 - k * 0.3)), 0, y + h * 0.12 * (k + 0.5), 0));
    out.caps.push(place(new CylinderGeometry(0.25, 0.6, h * 0.64, 6), 0, y + h * 0.36 + h * 0.32, 0));
    out.glow.push(place(new BoxGeometry(1.4, 1.4, 1.4), 0, y + h, 0));
  };

  if (t.kind === "setback" || t.kind === "spire") {
    // Stacked octagonal server layers. A setback tower steps evenly; a spire
    // rises sheer, then steps fast into a needle like a Deco crown.
    const spire = t.kind === "spire";
    const base = t.h * (spire ? 0.66 : 0.42);
    const step = (t.h - base) / (t.tiers - 1);
    let y = 0, topR = 0;
    for (let k = 0; k < t.tiers; k++) {
      const th = k === 0 ? base : step;
      const R = ((t.w / 2) * (1 - k * (spire ? 0.17 : 0.11))) / Math.cos(Math.PI / 8);
      out.facade.push(place(octTier(R, th), 0, y + th / 2, 0));
      out.caps.push(place(new CylinderGeometry(R, R, 0.2, 8).rotateY(Math.PI / 8), 0, y + th, 0));
      out.glow.push(place(new CylinderGeometry(R + 0.15, R + 0.15, 0.5, 8, 1, true).rotateY(Math.PI / 8), 0, y + th - 0.25, 0));
      if (spire && k === 1) fan(R * 0.9, y + 0.6, R * Math.cos(Math.PI / 8), 7, 0.45);
      y += th;
      topR = R;
    }
    if (spire) {
      out.caps.push(place(new CylinderGeometry(0.15, topR * 0.6, t.h * 0.22, 8).rotateY(Math.PI / 8), 0, y + t.h * 0.11, 0));
      out.glow.push(place(new BoxGeometry(1.2, 1.2, 1.2), 0, y + t.h * 0.22, 0));
    } else {
      fan(topR * (t.hero ? 1.6 : 1.1), y - step * 0.5, topR * Math.cos(Math.PI / 8), t.hero ? 15 : 9, t.hero ? 0.9 : 0.5);
      mast(y, topR * 0.35, t.h * (t.hero ? 0.25 : 0.19));
    }
  } else if (t.kind === "slab") {
    // A broad slab facing the plaza, stepping in only across its width near the
    // top, like the great Deco office slabs; a fan crowns the top step.
    const base = t.h * 0.64;
    const step = (t.h - base) / 3;
    let y = 0, w = t.w, d = t.d;
    for (let k = 0; k < 4; k++) {
      const th = k === 0 ? base : step;
      layer(w, d, y, th);
      y += th;
      if (k < 3) { w *= 0.74; d *= 0.92; }
    }
    fan(w * 0.55, y - step * 0.55, d / 2, 9, 0.5);
    mast(y, Math.min(w, d) * 0.3, t.h * 0.12);
  } else if (t.kind === "hall") {
    // A data hall: low, wide and stepped like a ziggurat, a chip on its crown.
    const th = t.h / t.tiers;
    for (let k = 0; k < t.tiers; k++) layer(t.w * (1 - k * 0.2), t.d * (1 - k * 0.2), k * th, th);
    const top = t.w * (1 - (t.tiers - 1) * 0.2);
    out.glow.push(place(new BoxGeometry(top * 0.35, 0.8, top * 0.35), 0, t.h + 0.4, 0));
  } else {
    // A plain block of the middle ground: one or two layers.
    const th = t.tiers > 1 ? t.h * 0.7 : t.h;
    layer(t.w, t.d, 0, th);
    if (t.tiers > 1) layer(t.w * 0.7, t.d * 0.7, th, t.h - th);
  }
  return out;
}

/**
 * The Art Techno city: tall towers of five kinds on an outer ring, data halls
 * and low blocks filling the middle ground, all mirror-symmetric about the
 * avenue as a Deco skyline should be, with one great tower on the axis behind
 * Ad Astra. Merged by material, so the whole city is a handful of draw calls.
 */
function Skyline() {
  const meshes = useMemo(() => {
    const towers: Tower[] = [];
    let r = 11;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    const at = (a: number, dist: number) => ({ x: Math.sin(a) * dist, z: Math.cos(a) * dist });
    const mirror = (t: Tower) => towers.push(t, { ...t, x: -t.x });
    // The tall ring, from beside the entrance (a near 0) round to beside the far end (a near pi).
    const ring: Kind[] = ["setback", "slab", "spire", "setback", "slab", "spire", "setback"];
    for (let i = 0; i < 14; i++) {
      const a = 0.12 + (i / 13) * (Math.PI - 0.5);
      const dist = 185 + rnd() * 70;
      const far = Math.max(0, -Math.cos(a)); // toward the far end, behind Ad Astra
      const kind = ring[i % ring.length]!;
      const w = kind === "slab" ? 30 + rnd() * 16 : 16 + rnd() * 14;
      mirror({ kind, ...at(a, dist), w, d: kind === "slab" ? w * 0.42 : w, h: 55 + rnd() * 60 + far * 70, tiers: kind === "spire" ? 6 : 5 + Math.floor(rnd() * 3), variant: i % 3 });
    }
    // Data halls between the rings.
    for (let i = 0; i < 6; i++) {
      const a = 0.35 + (i / 5) * (Math.PI - 0.95);
      const w = 34 + rnd() * 18;
      mirror({ kind: "hall", ...at(a, 135 + rnd() * 25), w, d: w * (0.7 + rnd() * 0.3), h: 18 + rnd() * 16, tiers: 4, variant: (i + 1) % 3 });
    }
    // Low blocks in the middle ground, kept clear of the far axis behind Ad Astra.
    for (let i = 0; i < 16; i++) {
      const a = 0.3 + (i / 15) * (Math.PI - 0.75);
      const dist = 92 + rnd() * 30;
      const w = 14 + rnd() * 14;
      mirror({ kind: "block", ...at(a, dist), w, d: 12 + rnd() * 14, h: 10 + rnd() * 18, tiers: rnd() > 0.5 ? 2 : 1, variant: i % 3 });
    }
    towers.push({ kind: "setback", x: 0, z: -235, w: 42, d: 42, h: 215, tiers: 7, variant: 0, hero: true });
    const facades: BufferGeometry[][] = [[], [], []];
    const glow: BufferGeometry[] = [];
    const caps: BufferGeometry[] = [];
    for (const t of towers) {
      const g = towerGeometry(t);
      facades[t.variant]!.push(...g.facade);
      glow.push(...g.glow);
      caps.push(...g.caps);
    }
    const strip = (gs: BufferGeometry[]) => gs.map((g) => (g.index ? g.toNonIndexed() : g));
    return {
      facades: facades.map((gs) => mergeGeometries(strip(gs))!),
      glow: mergeGeometries(strip(glow))!,
      caps: mergeGeometries(strip(caps))!,
    };
  }, []);
  const mats = useMemo(() => {
    const tex = [0, 1, 2].map((v) => facadeTexture(v + 3));
    return {
      facades: tex.map((t) => new MeshStandardMaterial({ color: "#05080a", roughness: 0.25, metalness: 0.6, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.85 })),
      glow: new MeshBasicMaterial({ color: new Color(C.gold).multiplyScalar(1.15) }),
      caps: new MeshStandardMaterial({ color: "#0b100e", roughness: 0.4, metalness: 0.6 }),
    };
  }, []);
  useEffect(() => () => {
    mats.facades.forEach((m) => { m.emissiveMap?.dispose(); m.dispose(); });
    mats.glow.dispose();
    mats.caps.dispose();
  }, [mats]);
  return (
    <group>
      {meshes.facades.map((g, i) => <mesh key={i} geometry={g} material={mats.facades[i]} />)}
      <mesh geometry={meshes.glow} material={mats.glow} />
      <mesh geometry={meshes.caps} material={mats.caps} />
    </group>
  );
}

export function Plaza() {
  return (
    <group>
      <Sky />
      <Stars />
      <Floor />
      <Traces />
      <Processor />
      <Terrace />
      <Skyline />
    </group>
  );
}
