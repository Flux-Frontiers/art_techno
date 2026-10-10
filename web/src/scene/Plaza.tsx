import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending, BackSide, BoxGeometry, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, InstancedMesh,
  MeshBasicMaterial, MeshStandardMaterial, Object3D, ShaderMaterial, type Sprite,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BOUNDS, PROCESSOR, SPIRITS, TERRACE } from "../spirits";
import { C, facadeTexture, glowTexture, pavingTexture } from "./textures";

/** Dusk dome: near-black zenith, a copper glow low behind the terrace (-z). */
function Sky() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {},
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 zenith = vec3(0.012, 0.022, 0.02);
            vec3 mid = vec3(0.03, 0.055, 0.05);
            vec3 hor = vec3(0.07, 0.085, 0.075);
            vec3 col = mix(hor, mid, smoothstep(0.0, 0.18, h));
            col = mix(col, zenith, smoothstep(0.18, 0.75, h));
            // Sunset glow toward -z, strongest at the horizon.
            float toward = max(0.0, -vDir.z);
            float glow = pow(toward, 3.0) * exp(-max(h, 0.0) * 9.0);
            col += vec3(0.55, 0.27, 0.12) * glow * 0.9 + vec3(0.83, 0.62, 0.3) * pow(toward, 12.0) * exp(-max(h,0.0) * 28.0) * 0.6;
            gl_FragColor = vec4(col, 1.0);
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
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#070b0a" roughness={0.95} />
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

type Tower = { x: number; z: number; w: number; h: number; tiers: number; variant: number; hero?: boolean };

/** One tower's parts, in place, sorted by material. */
function towerGeometry(t: Tower) {
  const facade: BufferGeometry[] = [];
  const glow: BufferGeometry[] = [];
  const caps: BufferGeometry[] = [];
  // Face the plaza: local -z points at the centre.
  const yaw = Math.atan2(t.x, t.z);
  const place = (g: BufferGeometry, x: number, y: number, z: number) =>
    g.rotateY(yaw).translate(t.x + x * Math.cos(yaw) + z * Math.sin(yaw), y, t.z - x * Math.sin(yaw) + z * Math.cos(yaw));
  // Stacked server layers: a tall shaft, then equal setbacks, each an octagon,
  // a square with its corners chamfered at 45 degrees.
  const base = t.h * 0.42;
  const step = (t.h - base) / (t.tiers - 1);
  let y = 0;
  let topR = 0;
  for (let k = 0; k < t.tiers; k++) {
    const th = k === 0 ? base : step;
    const R = (t.w / 2) * (1 - k * 0.11) / Math.cos(Math.PI / 8);
    const side = new CylinderGeometry(R, R, th, 8, 1, true).rotateY(Math.PI / 8);
    // Wrap the 16 m facade tile round the tier at its true size.
    const uv = side.getAttribute("uv");
    const per = (2 * Math.PI * R) / 16;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * per, uv.getY(i) * (th / 16));
    facade.push(place(side, 0, y + th / 2, 0));
    caps.push(place(new CylinderGeometry(R, R, 0.2, 8).rotateY(Math.PI / 8), 0, y + th, 0));
    // A thin glowing gold line along each setback edge.
    glow.push(place(new CylinderGeometry(R + 0.15, R + 0.15, 0.5, 8, 1, true).rotateY(Math.PI / 8), 0, y + th - 0.25, 0));
    y += th;
    topR = R;
  }
  // Crown: a half "boot sun" on the plaza face, long and short gold rays fanning
  // up from a chip, each ending in a pad.
  const apo = topR * Math.cos(Math.PI / 8);
  const fanR = topR * (t.hero ? 1.6 : 1.1);
  const cy = y - step * 0.5;
  const rays = t.hero ? 15 : 9;
  for (let i = 0; i < rays; i++) {
    const a = (i / (rays - 1)) * Math.PI;
    const len = fanR * (i % 2 ? 0.7 : 1);
    const ray = new BoxGeometry(t.hero ? 0.9 : 0.5, len, 0.3).translate(0, len / 2, 0).rotateZ(a - Math.PI / 2);
    glow.push(place(ray, 0, cy, -apo - 0.4));
    const pad = new BoxGeometry(t.hero ? 2.2 : 1.2, t.hero ? 2.2 : 1.2, 0.4).translate(Math.cos(a) * len, Math.sin(a) * len, 0);
    glow.push(place(pad, 0, cy, -apo - 0.45));
  }
  glow.push(place(new BoxGeometry(fanR * 0.3, fanR * 0.3, 0.5), 0, cy, -apo - 0.5));
  // A stepped antenna tipped with a glowing pad.
  for (let k = 0; k < 3; k++) {
    const sw = topR * (0.35 - k * 0.1);
    const sh = t.h * 0.03;
    caps.push(place(new BoxGeometry(sw, sh, sw), 0, y + sh * (k + 0.5), 0));
  }
  const mastH = t.h * (t.hero ? 0.16 : 0.1);
  caps.push(place(new CylinderGeometry(0.25, 0.6, mastH, 6), 0, y + t.h * 0.09 + mastH / 2, 0));
  glow.push(place(new BoxGeometry(1.4, 1.4, 1.4), 0, y + t.h * 0.09 + mastH, 0));
  return { facade, glow, caps };
}

/**
 * The Art Techno skyline: towers of stacked server layers with chamfered
 * setbacks, light-drawn facades, a fanned "boot sun" crown and a stepped
 * antenna, mirror-symmetric about the avenue as a Deco skyline should be, with
 * one great tower on the axis behind Ad Astra. Merged by material, so the whole
 * skyline is a handful of draw calls.
 */
function Skyline() {
  const meshes = useMemo(() => {
    const towers: Tower[] = [];
    let r = 11;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    // One side, then its mirror image across the avenue.
    for (let i = 0; i < 14; i++) {
      // From beside the entrance (a near 0) round to beside the far end (a near pi).
      const a = 0.12 + (i / 13) * (Math.PI - 0.5);
      const dist = 175 + rnd() * 70;
      const far = Math.max(0, -Math.cos(a)); // toward the far end, behind Ad Astra
      const t = {
        x: Math.sin(a) * dist,
        z: Math.cos(a) * dist,
        w: 16 + rnd() * 14,
        h: 55 + rnd() * 60 + far * 70,
        tiers: 5 + Math.floor(rnd() * 3),
        variant: i % 3,
      };
      towers.push(t, { ...t, x: -t.x });
    }
    towers.push({ x: 0, z: -265, w: 44, h: 230, tiers: 7, variant: 0, hero: true });
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
