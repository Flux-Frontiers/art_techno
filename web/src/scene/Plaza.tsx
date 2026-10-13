import { useFrame, useThree } from "@react-three/fiber";
import { ALIGN_SPOT, CORE, SUN_TOWER } from "./landmarks";
import { CoreTower } from "./CoreTower";
import { SunTowers } from "./SunTowers";
import { MeteorSky } from "./MeteorSky";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending, BackSide, BoxGeometry, BufferGeometry, Color, CylinderGeometry, type Group, InstancedMesh, Matrix3,
  MeshBasicMaterial, MeshStandardMaterial, Object3D, ShaderMaterial, SRGBColorSpace, type Sprite, type Texture, TextureLoader, Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BOUNDS, PROCESSOR, SPIRITS, type Terrace, TERRACE, withVariant } from "../spirits";
import { skyColors } from "../sky/plazaSky";
import { mixHex } from "../sky/sky";
import { starBuffers } from "../sky/stars";
import { useStore } from "../store";
import { C, cityTexture, facadeTexture, glowTexture, markerTexture, offsetPath, pavingTexture, signatureTexture } from "./textures";

/**
 * The sky dome, from the knowledge_press forest: the real sun and moon for the
 * clock, the moon lit from the sun so its phase is true, and the 5,080 stars of
 * the Yale Bright Star Catalogue placed for the moment. It runs through the
 * scene's tone mapping and its horizon is the fog colour, so the hazed city
 * meets the sky without a seam. Camera-centred, so no edge is ever reached.
 */
function Sky() {
  const sky = useStore((s) => s.sky);
  const dome = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const moonMap = useMemo(() => {
    const t = new TextureLoader().load(`${import.meta.env.BASE_URL}textures/moon/moon_color.jpg`, () => {
      const u = material.current?.uniforms;
      if (u?.moonReady) u.moonReady.value = 1;
    });
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => moonMap.dispose(), [moonMap]);
  const uniforms = useMemo(() => ({
    zenith: { value: new Color() },
    horizon: { value: new Color() },
    daylight: { value: 0 },
    warmth: { value: 0 },
    sunDir: { value: new Vector3(0, 1, 0) },
    moonDir: { value: new Vector3(0, -1, 0) },
    moonFraction: { value: 0 },
    moonMap: { value: moonMap },
    moonReady: { value: 0 },
  }), [moonMap]);
  // Written through the material: it holds its own copy of plain numbers.
  useEffect(() => {
    const u = (material.current?.uniforms ?? uniforms) as typeof uniforms;
    skyColors(sky, { zenith: u.zenith.value, horizon: u.horizon.value });
    u.daylight.value = sky.daylight;
    u.warmth.value = sky.warmth;
    u.sunDir.value.set(...sky.sunDir);
    u.moonDir.value.set(...sky.moonDir);
    u.moonFraction.value = sky.moonFraction;
    if (moonMap.image) u.moonReady.value = 1;
  }, [sky, uniforms, moonMap]);
  const starBuf = useMemo(() => starBuffers(), []);
  const starMaterial = useRef<ShaderMaterial>(null);
  const starUniforms = useMemo(() => ({ equToWorld: { value: new Matrix3() }, opacity: { value: 0 }, pixelRatio: { value: 1 } }), []);
  const gl = useThree((s) => s.gl);
  // Stars come out as the sky darkens, not at a switch.
  const starOpacity = 0.9 * (1 - sky.daylight) ** 2;
  useEffect(() => {
    const u = (starMaterial.current?.uniforms ?? starUniforms) as typeof starUniforms;
    u.equToWorld.value.set(...(sky.starMatrix as [number, number, number, number, number, number, number, number, number]));
    u.pixelRatio.value = gl.getPixelRatio();
    u.opacity.value = starOpacity;
  }, [sky.starMatrix, starOpacity, starUniforms, gl]);
  useFrame(({ camera }) => dome.current?.position.copy(camera.position));
  return (
    <group ref={dome}>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[480, 48, 24]} />
        <shaderMaterial ref={material} side={BackSide} depthWrite={false} fog={false} uniforms={uniforms}
          vertexShader={`varying vec3 direction;
            void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`varying vec3 direction;
            uniform vec3 zenith; uniform vec3 horizon; uniform float daylight; uniform float warmth;
            uniform vec3 sunDir; uniform vec3 moonDir; uniform float moonFraction;
            uniform sampler2D moonMap; uniform float moonReady;
            void main() {
              vec3 d = normalize(direction);
              vec3 col = mix(horizon, zenith, pow(max(d.y, 0.0), 0.4));
              // Sunrise and sunset: the low sky warms, most toward the sun.
              vec2 dh = normalize(d.xz + vec2(1e-5));
              vec2 sh = normalize(sunDir.xz + vec2(1e-5));
              float toward = 0.35 + 0.65 * pow(max(dot(dh, sh), 0.0), 3.0);
              col = mix(col, vec3(.98, .5, .26), warmth * toward * pow(1.0 - max(d.y, 0.0), 3.0) * 0.8);
              float sun = max(dot(d, sunDir), 0.0);
              float sunUp = smoothstep(-0.05, 0.02, sunDir.y);
              col += vec3(1., .55, .28) * pow(sun, 6.) * .3 * warmth * sunUp;
              col += vec3(1., .8, .5) * pow(sun, 32.) * .28 * daylight * sunUp;
              col = mix(col, mix(vec3(1., .97, .88), vec3(1., .42, .16), warmth) * 1.15, smoothstep(.9992, .9997, sun) * sunUp);
              // The moon, about eight times its true size so it reads over the city.
              float md = dot(d, moonDir);
              float moonUp = smoothstep(-0.03, 0.03, moonDir.y);
              vec3 right = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
              vec3 up = cross(right, moonDir);
              vec2 p = vec2(dot(d, right), dot(d, up)) / 0.0374;
              float r2 = dot(p, p);
              float z = sqrt(max(1.0 - r2, 0.0));
              vec2 muv = vec2(0.5 + atan(p.x, max(z, 1e-4)) / 6.2831853, 0.5 + asin(clamp(p.y, -1.0, 1.0)) / 3.1415927);
              vec3 albedo = mix(vec3(.82), texture2D(moonMap, muv).rgb, moonReady);
              albedo = mix(vec3(dot(albedo, vec3(.2126, .7152, .0722))), albedo, 0.5);
              albedo = pow(albedo, vec3(1.8)) * 1.45;
              if (md > 0.9993 && moonUp > 0.0 && r2 < 1.0) {
                vec3 n = p.x * right + p.y * up - z * moonDir;
                float lit = smoothstep(-0.04, 0.08, dot(n, sunDir));
                float edge = smoothstep(1.0, 0.85, r2) * moonUp;
                col = mix(col, albedo * .1, (1.0 - lit) * edge * (1.0 - daylight) * 0.75);
                col = mix(col, albedo * 1.05, lit * edge * mix(1.0, 0.55, daylight));
              }
              col += vec3(.45, .5, .62) * pow(max(md, 0.0), 900.0) * .35 * moonFraction * (1.0 - daylight) * moonUp;
              gl_FragColor = vec4(col, 1.);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`} />
      </mesh>
      <points visible={starOpacity > 0.01} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starBuf.dir, 3]} />
          <bufferAttribute attach="attributes-mag" args={[starBuf.mag, 1]} />
          <bufferAttribute attach="attributes-tint" args={[starBuf.color, 3]} />
        </bufferGeometry>
        <shaderMaterial ref={starMaterial} transparent depthWrite={false} blending={AdditiveBlending} uniforms={starUniforms}
          vertexShader={`uniform mat3 equToWorld; uniform float pixelRatio;
            attribute float mag; attribute vec3 tint;
            varying vec3 vTint; varying float vLevel;
            void main() {
              vec3 d = equToWorld * position;
              float bright = clamp(6.0 - mag, 0.0, 7.5);
              gl_PointSize = clamp(1.3 + 0.7 * bright, 1.3, 6.0) * pixelRatio;
              vLevel = clamp(0.45 + 0.13 * bright, 0.45, 1.0) * smoothstep(0.0, 0.12, d.y);
              vTint = tint;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(d * 450.0, 1.0);
            }`}
          fragmentShader={`uniform float opacity;
            varying vec3 vTint; varying float vLevel;
            void main() {
              float r = length(gl_PointCoord - 0.5) * 2.0;
              float a = smoothstep(1.0, 0.0, r);
              gl_FragColor = vec4(vTint * a * a * vLevel * opacity, 1.0);
              #include <colorspace_fragment>
            }`} />
      </points>
    </group>
  );
}

function Floor() {
  const w = BOUNDS.maxX - BOUNDS.minX + 4;
  const d = BOUNDS.maxZ - BOUNDS.minZ + 4;
  const cz = (BOUNDS.maxZ + BOUNDS.minZ) / 2;
  const paving = useMemo(() => pavingTexture([w / 8, d / 8]), [w, d]);
  const city = useMemo(() => cityTexture([50, 50]), []);
  const daylight = useStore((s) => s.sky.daylight);
  return (
    <group>
      {/* The city floor: a dark circuit board to the horizon, matte so it never
          catches the sky, its streets glowing faintly into the haze. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color={mixHex("#030504", "#3b423e", daylight)} roughness={1} metalness={0} envMapIntensity={0} emissive="#ffffff" emissiveMap={city} emissiveIntensity={0.75 * (1 - 0.8 * daylight)} />
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

type Route = { path: [number, number][]; copper: boolean };

/** Three traces to a bus, 0.36 m apart (motif 13). */
const BUS = { n: 3, pitch: 0.36, width: 0.15 };

/**
 * Bus runs in the floor from the processor to every pad (motif 13): three
 * traces at one pitch, routed at 0, 45 and 90 degrees, turning together through
 * nested bends and ending in a row of vias at the pad. Each side runs as a
 * pair of buses: the nearer pad takes the outer lane, so no two buses cross.
 */
function traceRoutes(terrace: Terrace): Route[] {
  const routes: Route[] = [];
  const pz = PROCESSOR.z;
  const edge = PROCESSOR.half + 0.6;
  for (const s of SPIRITS) {
    if (s.id === "astra") continue;
    const sx = Math.sign(s.x);
    const dz = s.z - pz;
    const sg = Math.sign(dz);
    const near = Math.abs(dz) < 15;
    const lane = near ? 10.2 : 8.4;
    const off = near ? 0.7 : 2.2;
    const padEdge = Math.abs(s.x) - s.pad - 0.1;
    routes.push({
      path: [
        [sx * edge, pz + sg * off],
        [sx * lane, pz + sg * (off + lane - edge)],
        [sx * lane, s.z - sg * (padEdge - lane)],
        [sx * padEdge, s.z],
      ],
      copper: near,
    });
  }
  // The central buses: entrance to processor, processor to the terrace steps.
  for (const x of [-1.6, 1.6]) {
    routes.push({ path: [[x, BOUNDS.maxZ], [x, pz + edge]], copper: x > 0 });
    routes.push({ path: [[x, pz - edge], [x, terrace.z + terrace.halfZ + terrace.steps * 0.9]], copper: x > 0 });
  }
  return routes;
}

function Traces() {
  const index = useStore((st) => st.variant.astra);
  const geo = useMemo(() => {
    const terrace = withVariant(SPIRITS.find((x) => x.id === "astra")!, index).terrace ?? TERRACE;
    const parts: Record<"gold" | "copper" | "vias", BufferGeometry[]> = { gold: [], copper: [], vias: [] };
    for (const r of traceRoutes(terrace)) {
      for (let i = 0; i < BUS.n; i++) {
        const d = (i - (BUS.n - 1) / 2) * BUS.pitch;
        const p = offsetPath(r.path, d);
        // The outer traces take the route's metal; the middle one is always a gold hairline.
        const key = i === 1 ? "gold" : r.copper ? "copper" : "gold";
        const w = i === 1 ? BUS.width * 0.6 : BUS.width;
        for (let k = 0; k < p.length - 1; k++) {
          const [ax, az] = p[k]!, [bx, bz] = p[k + 1]!;
          const len = Math.hypot(bx - ax, bz - az);
          // A little longer than the segment, so mitred corners close.
          parts[key].push(new BoxGeometry(w, 0.03, len + w * 0.9).rotateY(Math.atan2(bx - ax, bz - az)).translate((ax + bx) / 2, 0.015, (az + bz) / 2));
        }
        // Every trace ends in a via (rule 3).
        for (const [x, z] of [p[0]!, p[p.length - 1]!]) parts.vias.push(new CylinderGeometry(0.17, 0.17, 0.04, 14).translate(x, 0.02, z));
      }
    }
    const merge = (gs: BufferGeometry[]) => mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)))!;
    return { gold: merge(parts.gold), copper: merge(parts.copper), vias: merge(parts.vias) };
  }, [index]);
  const gold = useMemo(() => new MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 0.55, metalness: 0.8, roughness: 0.35 }), []);
  const cop = useMemo(() => new MeshStandardMaterial({ color: C.copper, emissive: C.copper, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.35 }), []);
  const viaMat = useMemo(() => new MeshStandardMaterial({ color: C.gold, emissive: "#f0d58e", emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 }), []);
  return (
    <group>
      <mesh geometry={geo.gold} material={gold} />
      <mesh geometry={geo.copper} material={cop} />
      <mesh geometry={geo.vias} material={viaMat} />
    </group>
  );
}

/** Rule one: the sun is a processor. A stepped chip dais with a burning core. */
/**
 * A via ring in the paving just in front of the processor, holding a small boot
 * sun, with STAND HERE lettered toward the entrance: the one spot where Ad
 * Astra's star sits on the Core's winged chip (landmarks.ts). Ornament until you
 * read it. Its gold glows faintly after dark, like the crowns.
 */
/** Redraw a canvas texture once the web fonts its lettering needs are in. */
function useLettered(draw: () => Texture, fonts: string[]) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all(fonts.map((f) => document.fonts?.load(f))).catch(() => {}).then(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const map = useMemo(draw, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

function FloorMarker() {
  const map = useLettered(markerTexture, ["600 92px 'Josefin Sans'", "400 40px 'IBM Plex Mono'"]);
  const daylight = useStore((s) => s.sky.daylight);
  // 2.4 m across; the plane runs on 0.6 m toward the entrance for the lettering.
  return (
    <mesh rotation-x={-Math.PI / 2} position={[ALIGN_SPOT.x, 0.04, ALIGN_SPOT.z + 0.3]}>
      <planeGeometry args={[2.4, 3.0]} />
      <meshStandardMaterial map={map} transparent alphaTest={0.05} metalness={0.3} roughness={0.65} polygonOffset polygonOffsetFactor={-2}
        emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.35 * (1 - daylight)} />
    </mesh>
  );
}

/**
 * The artist's signature, inlaid in gold script in the paving at the plaza's
 * front-right corner, reading toward the entrance like a sculptor's on a base.
 */
function Signature() {
  const map = useLettered(signatureTexture, ["112px 'Pinyon Script'"]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[BOUNDS.maxX - 4.5, 0.04, BOUNDS.maxZ - 1.6]}>
      <planeGeometry args={[4, 1]} />
      <meshStandardMaterial map={map} transparent alphaTest={0.05} metalness={0.5} roughness={0.45} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

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

/**
 * The raised terrace for Ad Astra, reached by gold-nosed steps on the avenue side.
 * It grows with him: the grand terrace is twice as high, with six steps.
 * The floor buses climb the stair and run on across the terrace to his pad.
 */
function Terrace() {
  const index = useStore((st) => st.variant.astra);
  const astra = SPIRITS.find((x) => x.id === "astra")!;
  const shownAstra = withVariant(astra, index);
  const T = shownAstra.terrace ?? TERRACE;
  const { x, z, halfX, halfZ, height, steps, stairHalf } = T;
  const stone = useMemo(() => new MeshStandardMaterial({ color: "#121a17", roughness: 0.35, metalness: 0.3 }), []);
  const gold = useMemo(() => new MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.3, emissive: C.gold, emissiveIntensity: 0.15 }), []);
  const trace = useMemo(() => new MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 0.55, metalness: 0.8, roughness: 0.35 }), []);
  const copper = useMemo(() => new MeshStandardMaterial({ color: C.copper, emissive: C.copper, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.35 }), []);
  const rise = height / steps;
  const depth = 0.9;
  // The two central buses, carried on up the stair and across the terrace to the pad.
  const busX = [-1.6, 1.6];
  const lanes = (cx: number) => [-BUS.pitch, 0, BUS.pitch].map((o) => cx + o);
  const padFront = shownAstra.pad + 0.2;
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
        const zz = halfZ + (steps - i) * depth - depth / 2;
        return (
          <group key={i}>
            <mesh material={stone} position={[0, h / 2, zz]} receiveShadow>
              <boxGeometry args={[2 * stairHalf, h, depth]} />
            </mesh>
            <mesh material={gold} position={[0, h, zz + depth / 2 - 0.05]}>
              <boxGeometry args={[2 * stairHalf, 0.06, 0.12]} />
            </mesh>
            {/* The buses climb as one run: along each tread and down its riser. */}
            {busX.flatMap(lanes).map((lx, k) => {
              const mat = k % 3 === 1 ? trace : busX[Math.floor(k / 3)]! > 0 ? copper : trace;
              const w = k % 3 === 1 ? BUS.width * 0.6 : BUS.width;
              return (
                <group key={k}>
                  <mesh material={mat} position={[lx, h + 0.016, zz]}>
                    <boxGeometry args={[w, 0.03, depth]} />
                  </mesh>
                  <mesh material={mat} position={[lx, h - rise / 2 + 0.015, zz + depth / 2 + 0.016]}>
                    <boxGeometry args={[w, rise + 0.03, 0.03]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
      {busX.flatMap(lanes).map((lx, k) => (
        <group key={k}>
          <mesh material={k % 3 === 1 ? trace : busX[Math.floor(k / 3)]! > 0 ? copper : trace} position={[lx, height + 0.016, (halfZ + padFront) / 2]}>
            <boxGeometry args={[k % 3 === 1 ? BUS.width * 0.6 : BUS.width, 0.03, halfZ - padFront]} />
          </mesh>
          <mesh material={gold} position={[lx, height + 0.02, padFront]}>
            <cylinderGeometry args={[0.17, 0.17, 0.04, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

type Kind = "setback" | "slab" | "spire" | "hall" | "block";
export type Tower = { kind: Kind; x: number; z: number; w: number; d: number; h: number; tiers: number; variant: number; hero?: boolean;
  /** Drawn elsewhere (the Core, the Sun Towers): kept here only so the craft fly round it. */
  modelled?: boolean;
  /** Which model draws it, when modelled. */
  landmark?: "core" | "sun" };
type Parts = { facade: BufferGeometry[]; glow: BufferGeometry[]; caps: BufferGeometry[]; chips: BufferGeometry[]; copper: BufferGeometry[]; crown: BufferGeometry[] };

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
 * boot-sun crown) in a different massing, like a Deco skyline of siblings.
 */
function towerGeometry(t: Tower): Parts {
  const out: Parts = { facade: [], glow: [], caps: [], chips: [], copper: [], crown: [] };
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
  // The boot-sun crown (docs/designs/sun-tower-render.jpg): a die seated on a roofline like the sun
  // on the horizon, inside stepped arcs that alias the curve (rule 4), long gold rays and short
  // copper rays between them, each ending in a pad (rule 3). With `below`, a bus of six traces drops
  // down the face beneath, bending at 45 degrees into ring vias (rule 2). `r` is the ray reach;
  // `face` and `below` are the depths of the faces it sits on and drops down, from the centre.
  const crown = (r: number, y: number, face: number, rays: number, below?: number) => {
    const z = -face - 0.4;
    const s = r / 16; // one stair step of the arcs
    const w = r * 0.065; // a ray's width: bold enough to read from the far ring
    const arcs = [0.28, 0.37, 0.46].map((f) => f * r);
    const outer = arcs[2]!;
    const q = (v: number) => Math.round(v / s) * s;
    const at = (g: BufferGeometry, dz = 0) => place(g, 0, y, z + dz);
    // A bar between two points in the crown's plane.
    const bar = (x1: number, y1: number, x2: number, y2: number, width: number, depth: number) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      return new BoxGeometry(width, len + width, depth).rotateZ(Math.atan2(x1 - x2, y2 - y1)).translate((x1 + x2) / 2, (y1 + y2) / 2, 0);
    };
    // A granite plate behind the arcs, stepped like them, so the windows stop at the sun.
    for (let j = 0; j * s < outer; j++) {
      const half = q(Math.sqrt(Math.max(0, outer * outer - (j * s) ** 2))) + s;
      out.caps.push(at(new BoxGeometry(half * 2, s, 0.3).translate(0, j * s + s / 2, 0), 0.15));
    }
    // The arcs: a gold line one step wide along each ring's stair-stepped edge.
    for (const R of arcs) {
      let prev = q(R);
      for (let j = 0; j * s < R; j++) {
        const half = q(Math.sqrt(Math.max(0, R * R - ((j + 1) * s) ** 2)));
        for (const sx of [-1, 1]) {
          out.crown.push(at(new BoxGeometry(s * 0.5, s, 0.4).translate(sx * prev, j * s + s / 2, 0)));
          if (prev > half) out.crown.push(at(new BoxGeometry(prev - half + s * 0.5, s * 0.5, 0.4).translate(sx * (half + prev) / 2, (j + 1) * s, 0)));
        }
        prev = half;
      }
    }
    // The rays: long gold ones with round pads, short copper ones between with square tips.
    const r0 = outer + s;
    for (let i = 0; i < rays; i++) {
      const a = (i / (rays - 1)) * Math.PI;
      const [cx, cy] = [Math.cos(a), Math.sin(a)];
      out.crown.push(at(bar(cx * r0, cy * r0, cx * r, cy * r, w, 0.4)));
      out.crown.push(at(new CylinderGeometry(w * 1.2, w * 1.2, 0.5, 12).rotateX(Math.PI / 2).translate(cx * r, cy * r, 0), -0.05));
      if (i === rays - 1) break;
      const b = ((i + 0.5) / (rays - 1)) * Math.PI;
      const L = r * 0.78;
      const [bx, by] = [Math.cos(b), Math.sin(b)];
      out.copper.push(at(bar(bx * r0, by * r0, bx * L, by * L, w * 0.85, 0.35)));
      out.copper.push(at(new BoxGeometry(w * 1.5, w * 1.5, 0.45).rotateZ(b).translate(bx * L, by * L, 0), -0.05));
    }
    // The die: a solder-green chip in a gold frame, a glowing core, a row of pins on three sides.
    const d = r * 0.24;
    out.crown.push(at(new BoxGeometry(d, d, 0.5).translate(0, d / 2, 0), -0.1));
    out.chips.push(at(new BoxGeometry(d * 0.74, d * 0.74, 0.5).translate(0, d / 2, 0), -0.22));
    // Only the die's core glows; the rest is gilt metal catching the light.
    out.glow.push(at(new BoxGeometry(d * 0.3, d * 0.3, 0.5).translate(0, d / 2, 0), -0.32));
    for (let k = 0; k < 6; k++) {
      const u = -d * 0.4 + (k * d * 0.8) / 5;
      out.crown.push(at(new BoxGeometry(w * 0.4, d * 0.16, 0.4).translate(u, d + d * 0.08, 0), -0.1));
      for (const sx of [-1, 1]) out.crown.push(at(new BoxGeometry(d * 0.16, w * 0.4, 0.4).translate(sx * (d / 2 + d * 0.08), d / 2 + u, 0), -0.1));
    }
    if (below === undefined) return;
    // The bus, on the face below: inner traces straight down; outer ones jog out at 45 degrees.
    const zb = -below - 0.4 - z;
    const pitch = w * 1.8;
    for (let k = 0; k < 3; k++) {
      const x0 = pitch * (k + 0.5);
      const drop = r * (0.95 - k * 0.25);
      const jog = r * 0.12 * k;
      const path: [number, number][] = k === 0
        ? [[x0, 0], [x0, -drop]]
        : [[x0, 0], [x0, -drop * 0.35], [x0 + jog, -drop * 0.35 - jog], [x0 + jog, -drop - jog]];
      for (const sx of [-1, 1]) {
        for (let n = 1; n < path.length; n++) {
          const [p, q2] = [path[n - 1]!, path[n]!];
          out.crown.push(at(bar(sx * p[0], p[1], sx * q2[0], q2[1], w * 0.5, 0.3), zb));
        }
        const [vx, vy] = path[path.length - 1]!;
        out.crown.push(at(new CylinderGeometry(w * 1.1, w * 1.1, 0.4, 12).rotateX(Math.PI / 2).translate(sx * vx, vy, 0), zb - 0.05));
        out.caps.push(at(new CylinderGeometry(w * 0.5, w * 0.5, 0.4, 10).rotateX(Math.PI / 2).translate(sx * vx, vy, 0), zb - 0.12));
      }
    }
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
    const tops: number[] = [], faces: number[] = [];
    for (let k = 0; k < t.tiers; k++) {
      const th = k === 0 ? base : step;
      const R = ((t.w / 2) * (1 - k * (spire ? 0.17 : 0.11))) / Math.cos(Math.PI / 8);
      out.facade.push(place(octTier(R, th), 0, y + th / 2, 0));
      out.caps.push(place(new CylinderGeometry(R, R, 0.2, 8).rotateY(Math.PI / 8), 0, y + th, 0));
      out.glow.push(place(new CylinderGeometry(R + 0.15, R + 0.15, 0.5, 8, 1, true).rotateY(Math.PI / 8), 0, y + th - 0.25, 0));
      y += th;
      topR = R;
      tops.push(y);
      faces.push(R * Math.cos(Math.PI / 8));
    }
    // The crown sits on a roofline a few tiers down, on the face of the tier above it, so it reads
    // large; its rays reach up over the setbacks. Towers on the outer variant skip the bus.
    const m = spire ? 0 : Math.max(0, t.tiers - 3);
    crown(faces[m + 1]! * (spire ? 1.0 : 1.25), tops[m]!, faces[m + 1]!, spire || t.w < 22 ? 9 : 13, t.variant === 1 ? undefined : faces[m]!);
    if (spire) {
      out.caps.push(place(new CylinderGeometry(0.15, topR * 0.6, t.h * 0.22, 8).rotateY(Math.PI / 8), 0, y + t.h * 0.11, 0));
      out.glow.push(place(new BoxGeometry(1.2, 1.2, 1.2), 0, y + t.h * 0.22, 0));
    } else {
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
    // The crown on the base's roofline, on the face of the first step back, its bus down the base.
    crown(t.w * 0.74 * 0.5, base, (t.d * 0.92) / 2, 13, t.variant === 1 ? undefined : t.d / 2);
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
 * The city's buildings, the same every visit (a seeded sequence): the tall ring,
 * the data halls, the low blocks and the great tower behind Ad Astra. Shared with
 * the aerial craft, which plan their flights to clear them.
 */
/**
 * Ring places left empty, by index in cityTowers()'s ring loop, the same at both
 * ends: place i at the entrance end mirrors place 13 - i at the far end. Each end
 * keeps its central pair (the Sun Towers at the far end) and the towers beside them.
 */
const RING_GAPS = new Set([1, 2, 4, 9, 11, 12]);

export function cityTowers(): Tower[] {
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
    const t: Tower = { kind, ...at(a, dist), w, d: kind === "slab" ? w * 0.42 : w, h: 55 + rnd() * 60 + far * 70, tiers: kind === "spire" ? 6 : 5 + Math.floor(rnd() * 3), variant: i % 3 };
    // The pair nearest the Core are the Sun Towers (landmarks.ts), sized to the model: 0.38 of
    // its height wide, rays included, and 0.35 deep.
    if (i === SUN_TOWER.ring) Object.assign(t, { w: SUN_TOWER.height * 0.38, d: SUN_TOWER.height * 0.35, h: SUN_TOWER.height, modelled: true, landmark: "sun" });
    // Left out to open the skyline (their random draws still taken, so no other tower moves).
    if (RING_GAPS.has(i)) continue;
    mirror(t);
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
  // On the axis behind Ad Astra: the Core (CoreTower.tsx), a facade 0.61 of its height wide and 0.17 deep.
  towers.push({ kind: "setback", x: 0, z: CORE.z, w: CORE.height * 0.61, d: CORE.height * 0.17, h: CORE.height, tiers: 7, variant: 0, hero: true, modelled: true, landmark: "core" });
  return towers;
}

/** The highest point of a building, its crown, mast or needle included, in metres. */
export function towerTop(t: Tower): number {
  if (t.modelled) return t.h + 2;
  if (t.kind === "setback") return t.h * (t.hero ? 1.27 : 1.21);
  if (t.kind === "spire") return t.h * 1.24;
  if (t.kind === "slab") return t.h * 1.14;
  return t.h + 1;
}

/** How far a building reaches from its centre in plan, its crown fan included. */
export function towerReach(t: Tower): number {
  return (Math.max(t.w, t.d) / 2) * 1.1 + (t.kind === "setback" || t.kind === "slab" ? 4 : 1);
}

/**
 * The Art Techno city: tall towers of five kinds on an outer ring, data halls
 * and low blocks filling the middle ground, all mirror-symmetric about the
 * avenue as a Deco skyline should be, with one great tower on the axis behind
 * Ad Astra (the Core, drawn by CoreTower.tsx). Merged by material, so the whole city is a handful of draw calls.
 */
function Skyline() {
  const meshes = useMemo(() => {
    const towers = cityTowers();
    const facades: BufferGeometry[][] = [[], [], []];
    const glow: BufferGeometry[] = [];
    const caps: BufferGeometry[] = [];
    const chips: BufferGeometry[] = [];
    const copper: BufferGeometry[] = [];
    const crown: BufferGeometry[] = [];
    for (const t of towers) {
      if (t.modelled) continue;
      const g = towerGeometry(t);
      facades[t.variant]!.push(...g.facade);
      glow.push(...g.glow);
      caps.push(...g.caps);
      chips.push(...g.chips);
      copper.push(...g.copper);
      crown.push(...g.crown);
    }
    const strip = (gs: BufferGeometry[]) => gs.map((g) => (g.index ? g.toNonIndexed() : g));
    return {
      facades: facades.map((gs) => mergeGeometries(strip(gs))!),
      glow: mergeGeometries(strip(glow))!,
      caps: mergeGeometries(strip(caps))!,
      chips: mergeGeometries(strip(chips))!,
      copper: mergeGeometries(strip(copper))!,
      crown: mergeGeometries(strip(crown))!,
    };
  }, []);
  const mats = useMemo(() => {
    const tex = [0, 1, 2].map((v) => facadeTexture(v + 3));
    return {
      facades: tex.map((t) => new MeshStandardMaterial({ color: "#05080a", roughness: 0.25, metalness: 0.6, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.85 })),
      glow: new MeshBasicMaterial({ color: new Color(C.gold).multiplyScalar(1.15) }),
      caps: new MeshStandardMaterial({ color: "#0b100e", roughness: 0.4, metalness: 0.6 }),
      chips: new MeshBasicMaterial({ color: new Color(C.green).multiplyScalar(1.05) }),
      // The crowns are gilt bronze and copper, not light: lit metal with a faint glow after dark.
      crown: new MeshStandardMaterial({ color: C.gold, metalness: 0.8, roughness: 0.4, emissive: C.gold, emissiveIntensity: 0.2 }),
      copper: new MeshStandardMaterial({ color: C.copper, metalness: 0.8, roughness: 0.4, emissive: C.copper, emissiveIntensity: 0.2 }),
    };
  }, []);
  // The city's lights dim by day; its glass catches the sky instead.
  const daylight = useStore((s) => s.sky.daylight);
  useEffect(() => {
    for (const m of mats.facades) m.emissiveIntensity = 0.85 * (1 - 0.7 * daylight);
    mats.crown.emissiveIntensity = mats.copper.emissiveIntensity = 0.2 * (1 - daylight);
  }, [mats, daylight]);
  useEffect(() => () => {
    mats.facades.forEach((m) => { m.emissiveMap?.dispose(); m.dispose(); });
    mats.glow.dispose();
    mats.caps.dispose();
    mats.chips.dispose();
    mats.copper.dispose();
    mats.crown.dispose();
  }, [mats]);
  return (
    <group>
      {meshes.facades.map((g, i) => <mesh key={i} geometry={g} material={mats.facades[i]} />)}
      <mesh geometry={meshes.glow} material={mats.glow} />
      <mesh geometry={meshes.caps} material={mats.caps} />
      <mesh geometry={meshes.chips} material={mats.chips} />
      <mesh geometry={meshes.copper} material={mats.copper} />
      <mesh geometry={meshes.crown} material={mats.crown} />
    </group>
  );
}

export function Plaza() {
  return (
    <group>
      <Sky />
      <MeteorSky />
      <Floor />
      <Traces />
      <Processor />
      <FloorMarker />
      <Signature />
      <Terrace />
      <Skyline />
      <CoreTower />
      <SunTowers />
    </group>
  );
}
