import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending, Box3, BoxGeometry, Color, CylinderGeometry, EdgesGeometry, type Group, InstancedMesh,
  type LineSegments, Mesh, MeshStandardMaterial, Object3D, Plane, SphereGeometry, SRGBColorSpace,
  type Texture, TextureLoader, Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { facingYaw, FIGURE_HEAD, type Spirit, withVariant } from "../spirits";
import { useStore } from "../store";
import { C, glowTexture, padTexture } from "./textures";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
/** Height of the pad's top surface above the statue's base. */
const PAD_TOP = 0.3;

/** Height of the code-drawn plinth: as given, or the model's own (exports are 12 m tall). */
/** The series plinth's hexagon corner radii, bottom to top, in metres. */
const SERIES_TIERS: [number, number, number] = [3.2, 2.7, 2.2];

function plinthHeight(s: Spirit): number {
  const op = s.ownPlinth!;
  return op.height ?? op.top * (s.height / 12);
}

/**
 * Floodlight a statue from its foot, faked in the shader as the forest's
 * exhibits are: each material glows in its own colour, strongest at the
 * ground and fading up the figure. No real lights, so nine statues cost no
 * more to shade than one.
 */
/**
 * The night lamps, as in the Knowledge Press forest: off by day, fading in
 * through dusk, full once the sky is dark. One shared uniform, so every
 * statue's floodlighting follows the sky at once.
 */
export const NIGHT_LAMP = { value: 0 };
/** Statue materials whose reflections dim at night, so the lamps carry them. */
const LIT = new Set<MeshStandardMaterial>();

/** Follows the sky: the lamps come up as it darkens and the studio reflections go down. */
export function NightLamps() {
  const daylight = useStore((st) => st.sky.daylight);
  useEffect(() => {
    NIGHT_LAMP.value = Math.min(1, Math.max(0, (0.6 - daylight) / 0.45));
    for (const m of LIT) m.envMapIntensity = (m.userData.envDay ?? 1.1) * (0.3 + 0.7 * daylight);
  }, [daylight]);
  return null;
}

function uplight(m: MeshStandardMaterial, base: number, strength: number, falloff: number, cleanSteps = false) {
  m.userData.envDay = m.envMapIntensity;
  LIT.add(m);
  m.onBeforeCompile = (shader) => {
    // Floodlamps at the foot: their light, strongest at the base, fades up the figure.
    shader.uniforms.uplight = NIGHT_LAMP;
    shader.uniforms.uplightStrength = { value: strength };
    shader.uniforms.uplightBase = { value: base };
    shader.uniforms.uplightFalloff = { value: falloff };
    shader.vertexShader = "varying float vUplightY;\nvarying vec3 vObj;\nvarying vec3 vAxX;\nvarying vec3 vAxY;\nvarying vec3 vAxZ;\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n  vUplightY = (modelMatrix * vec4(transformed, 1.0)).y;\n  vObj = transformed;\n  vAxX = normalMatrix * vec3(1.0, 0.0, 0.0); vAxY = normalMatrix * vec3(0.0, 1.0, 0.0); vAxZ = normalMatrix * vec3(0.0, 0.0, 1.0);",
    );
    let frag = "uniform float uplight; uniform float uplightStrength; uniform float uplightBase; uniform float uplightFalloff; varying float vUplightY; varying vec3 vObj; varying vec3 vAxX; varying vec3 vAxY; varying vec3 vAxZ;\n" +
      shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.86, 0.66) * uplight * uplightStrength * exp(-max(vUplightY - uplightBase, 0.0) / uplightFalloff) * diffuseColor.rgb;",
      );
    if (cleanSteps) {
      // Ad Astra's steps: Meshy's granite smears at 24 m. On the staircase only
      // (model units: turned 53 degrees, under the top tread at 3.76), the dark,
      // unsaturated texels become clean polished black, each surface lit as the
      // true plane it belongs to. Gold, copper and green (the rail, the
      // chain, the cuff, his feet) keep their texture.
      frag = frag
        .replace("#include <map_fragment>", `#include <map_fragment>
  float stepClean = 0.0;
  {
    float su = vObj.x * 0.6018 + vObj.z * 0.7986;
    float sv = -vObj.x * 0.7986 + vObj.z * 0.6018;
    float mx = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b);
    float mn = min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
    float sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
    float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    if (vObj.y < 3.8 && su > -2.45 && su < 2.9 && sv > -2.4 && sv < 3.1 && (lum < 0.16 && sat < 0.5 || lum < 0.08 && sat < 0.8)) {
      stepClean = 1.0;
      diffuseColor.rgb = vec3(0.0045, 0.0068, 0.006);
    }
  }`)
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.26, stepClean);")
        .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 0.35, stepClean);")
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
  if (stepClean > 0.5) {
    // Snap each surface to the staircase's own planes: treads face up, risers
    // and sides face along the stair's two plan axes. The lumpy mesh then
    // lights as true flat granite.
    vec3 f = normalize(cross(dFdx(vObj), dFdy(vObj)));
    vec3 au = vec3(0.6018, 0.0, 0.7986), av = vec3(-0.7986, 0.0, 0.6018), ay = vec3(0.0, 1.0, 0.0);
    float du = dot(f, au), dv = dot(f, av), dy = dot(f, ay);
    vec3 n = abs(dy) >= abs(du) && abs(dy) >= abs(dv) ? ay : abs(du) >= abs(dv) ? au : av;
    vec3 nv = normalize(n.x * vAxX + n.y * vAxY + n.z * vAxZ);
    normal = dot(nv, vViewPosition) < 0.0 ? -nv : nv;
  }`);
    }
    shader.fragmentShader = frag;
  };
  m.customProgramCacheKey = () => `uplight-${strength}-${falloff}-${cleanSteps}`;
  m.needsUpdate = true;
}

type Loaded = { root: Object3D; tiers: [number, number, number] | null };

/**
 * Plinth tiers that fit the figure: the top tier wide enough for everything that
 * stands on it (feet, robe hem, staff), and never smaller than the series plinth.
 */
function fitTiers(root: Object3D, cut: number): [number, number, number] {
  root.updateMatrixWorld(true);
  const v = new Vector3();
  let r = 0;
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const pos = o.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (v.y >= cut && v.y <= cut + 0.6) r = Math.max(r, Math.hypot(v.x, v.z));
    }
  });
  // Corner radius whose flat sides clear the footprint by 35 cm.
  const top = Math.max(SERIES_TIERS[2], (r + 0.35) / Math.cos(Math.PI / 6));
  return [top + 1.0, top + 0.5, top];
}

function useModel(s: Spirit): Loaded | null {
  const [scene, setScene] = useState<Loaded | null>(null);
  const markFailed = useStore((st) => st.markFailed);
  useEffect(() => {
    if (!s.model) return;
    let live = true;
    loader.load(
      s.model,
      (gltf) => {
        const root = gltf.scene;
        // Fit to the statue's height, base on the pad, centred on its footprint.
        const box = new Box3().setFromObject(root);
        const size = box.getSize(new Vector3());
        const op = s.ownPlinth;
        // With a code-drawn plinth, the figure above the cut fills the height left over.
        const k = op?.head
          ? ((op.headAt ?? FIGURE_HEAD) - plinthHeight(s)) / (op.head - op.top)
          : op ? (s.height - plinthHeight(s)) / (size.y - op.top) : s.height / size.y;
        root.scale.setScalar(k);
        const cx = op ? op.cx : (box.min.x + box.max.x) / 2;
        const cz = op ? op.cz : (box.min.z + box.max.z) / 2;
        const lift = op ? plinthHeight(s) - (box.min.y + op.top) * k : -box.min.y * k;
        root.position.set(-cx * k, lift, -cz * k);
        root.traverse((o) => {
          if (!(o instanceof Mesh)) return;
          o.castShadow = true;
          o.receiveShadow = true;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) if (m instanceof MeshStandardMaterial) {
            m.envMapIntensity = 1.1;
            uplight(m, s.base, 0.8, Math.max(4.5, s.height * 0.38), s.id === "astra");
            if (op) {
              // Cut away the model's own plinth; the clean one drawn in code takes its place.
              m.clippingPlanes = [new Plane(new Vector3(0, 1, 0), -(s.base + PAD_TOP + plinthHeight(s)))];
              m.clipShadows = true;
            }
          }
        });
        const tiers = op && !op.tiers ? fitTiers(root, plinthHeight(s)) : null;
        if (live) setScene({ root, tiers });
      },
      undefined,
      () => live && markFailed(s.id),
    );
    return () => {
      live = false;
    };
  }, [s, markFailed]);
  return scene;
}

/** Until a model arrives: the hero render in a gold frame on a black stele. */
function FramedRender({ s }: { s: Spirit }) {
  const [map, setMap] = useState<Texture | null>(null);
  useEffect(() => {
    if (!s.render) return;
    new TextureLoader().load(s.render, (t) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      setMap(t);
    });
  }, [s.render]);
  const gold = useMemo(() => new MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.28, emissive: C.gold, emissiveIntensity: 0.12 }), []);
  const h = s.height * 0.72;
  const w = (h * 2) / 3;
  const bottom = 1.4;
  const cy = bottom + h / 2;
  const t = 0.28;
  return (
    <group>
      {/* Stele behind the picture. */}
      <mesh position={[0, cy, -0.35]} castShadow>
        <boxGeometry args={[w + 1.2, h + 1.6, 0.5]} />
        <meshStandardMaterial color={C.panel} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, bottom / 2, -0.2]} castShadow>
        <boxGeometry args={[w + 2.2, bottom, 1.6]} />
        <meshStandardMaterial color={C.panel} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, cy, -0.05]}>
        <planeGeometry args={[w, h]} />
        {map ? <meshBasicMaterial map={map} toneMapped={false} color="#e8e8e8" /> : <meshBasicMaterial color="#141c19" />}
      </mesh>
      {[
        [0, cy + h / 2 + t / 2, w + 2 * t, t],
        [0, cy - h / 2 - t / 2, w + 2 * t, t],
        [-w / 2 - t / 2, cy, t, h],
        [w / 2 + t / 2, cy, t, h],
      ].map(([x, y, sx, sy], i) => (
        <mesh key={i} material={gold} position={[x!, y!, 0]}>
          <boxGeometry args={[sx!, sy!, 0.3]} />
        </mesh>
      ))}
      {/* A stepped Deco crest over the frame. */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} material={gold} position={[0, cy + h / 2 + t + 0.25 + k * 0.4, -0.1]}>
          <boxGeometry args={[w * (0.5 - k * 0.14), 0.3, 0.3]} />
        </mesh>
      ))}
    </group>
  );
}

/** A Spirit not yet designed: the outline of its future plinth and figure, drawn in light. */
function Reserved({ s }: { s: Spirit }) {
  const lines = useRef<LineSegments>(null);
  const geo = useMemo(() => {
    const parts = [
      new BoxGeometry(6.4, 0.8, 6.4).translate(0, 0.4, 0),
      new BoxGeometry(5.2, 0.8, 5.2).translate(0, 1.2, 0),
      new BoxGeometry(4, 0.8, 4).translate(0, 2.0, 0),
      new BoxGeometry(1.8, s.height - 3.2, 1.2).translate(0, 2.4 + (s.height - 3.2) / 2, 0),
    ];
    return parts.map((p) => new EdgesGeometry(p));
  }, [s.height]);
  useFrame(({ clock }) => {
    const m = lines.current?.material as { opacity?: number } | undefined;
    if (m) m.opacity = 0.45 + Math.sin(clock.elapsedTime * 1.4 + s.z) * 0.2;
  });
  return (
    <group>
      {geo.map((g, i) => (
        <lineSegments key={i} ref={i === 0 ? lines : undefined} geometry={g}>
          <lineBasicMaterial color={C.mint} transparent opacity={0.5} />
        </lineSegments>
      ))}
    </group>
  );
}

/**
 * The series plinth, drawn in code so its edges are true: three hexagonal
 * tiers of polished black granite, a flat face toward the avenue, each tier
 * edged with a gold rail and a row of gold studs on every face.
 */
function HexPlinth({ height, tiers }: { height: number; tiers: [number, number, number] }) {
  const parts = useMemo(() => {
    const granite = new MeshStandardMaterial({ color: "#0d1311", roughness: 0.24, metalness: 0.35, envMapIntensity: 1.2 });
    const gold = new MeshStandardMaterial({ color: C.gold, metalness: 0.95, roughness: 0.25, emissive: C.gold, emissiveIntensity: 0.12 });
    const th = height / 3;
    const out: { geo: CylinderGeometry; mat: MeshStandardMaterial; y: number }[] = [];
    const studs: [number, number, number][] = [];
    tiers.forEach((R, i) => {
      const y0 = i * th;
      // A corner sits at +z by default; a sixth of a turn puts a flat face there instead.
      out.push({ geo: new CylinderGeometry(R, R, th, 6).rotateY(Math.PI / 6), mat: granite, y: y0 + th / 2 });
      for (const [h, yy] of [[0.06, y0 + th - 0.03], [0.04, y0 + 0.02]] as const)
        out.push({ geo: new CylinderGeometry(R + 0.025, R + 0.025, h, 6, 1, true).rotateY(Math.PI / 6), mat: gold, y: yy });
      const apothem = R * Math.cos(Math.PI / 6);
      const n = Math.max(3, Math.floor(R / 0.34));
      for (let f = 0; f < 6; f++) {
        const phi = (f * Math.PI) / 3;
        const dx = Math.sin(phi), dz = Math.cos(phi);
        for (let j = 0; j < n; j++) {
          const t = (j + 0.5) / n - 0.5;
          const along = t * R * 0.86;
          studs.push([dx * (apothem + 0.01) + dz * along, y0 + th * 0.48, dz * (apothem + 0.01) - dx * along]);
        }
      }
    });
    const studMesh = new InstancedMesh(new SphereGeometry(0.075, 12, 8), gold, studs.length);
    const o = new Object3D();
    studs.forEach((p, i) => { o.position.set(...p); o.updateMatrix(); studMesh.setMatrixAt(i, o.matrix); });
    studMesh.castShadow = true;
    return { out, studMesh };
  }, [height, tiers]);
  return (
    <group>
      {parts.out.map((p, i) => (
        <mesh key={i} geometry={p.geo} material={p.mat} position={[0, p.y, 0]} castShadow receiveShadow />
      ))}
      <primitive object={parts.studMesh} />
    </group>
  );
}

/** Shows the chosen variant; a new key rebuilds the statue when the choice changes. */
export function Statue({ s }: { s: Spirit }) {
  const index = useStore((st) => st.variant[s.id]);
  const shown = useMemo(() => withVariant(s, index), [s, index]);
  return <StatueBody key={`${shown.model ?? s.id}@${shown.height}`} s={shown} />;
}

function StatueBody({ s }: { s: Spirit }) {
  const failed = useStore((st) => !!st.failed[s.id]);
  const loaded = useModel(s);
  const model = loaded?.root ?? null;
  const tiers = s.ownPlinth?.tiers ?? loaded?.tiers ?? SERIES_TIERS;
  const padTex = useMemo(() => padTexture(s.name, s.allegory), [s]);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    // Redraw the pad lettering once the web fonts are in.
    document.fonts?.ready.then(() => setFontsReady(true));
  }, []);
  const padTop = useMemo(() => (fontsReady ? padTexture(s.name, s.allegory) : padTex), [fontsReady, s, padTex]);
  const pool = useMemo(() => glowTexture("rgba(255,226,170,0.9)"), []);
  const daylight = useStore((st) => st.sky.daylight);
  const night = Math.min(1, Math.max(0, (0.6 - daylight) / 0.45));
  const lens = useMemo(() => new Color("#3a2c1c").lerp(new Color("#ffdca6"), night), [night]);
  const group = useRef<Group>(null);
  const invalidate = useThree((st) => st.invalidate);
  useEffect(() => invalidate(), [model, invalidate]);
  // The pad grows with a broad plinth, so the corners stay on it and the name
  // lettered along its front edge (from 0.69 to 0.86 of the half-width out from
  // the centre) stays clear of the bottom tier's front face.
  const apothem = tiers[0] * Math.cos(Math.PI / 6);
  const p = Math.max(s.pad, tiers[0] + 0.5, (apothem + 0.15) / 0.69);
  const showModel = model && !failed;
  return (
    <group ref={group} position={[s.x, s.base, s.z]} rotation-y={facingYaw(s)}>
      {/* The pad: a gold-framed chip package with the name on its front edge. */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2 * p, 0.3, 2 * p]} />
        <meshStandardMaterial color={C.panel} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.305, 0]} receiveShadow>
        <planeGeometry args={[2 * p, 2 * p]} />
        <meshStandardMaterial map={padTop} metalness={0.35} roughness={0.38} />
      </mesh>
      {/* Pool of light from the floodlamps at the foot, and the lamps themselves at the pad's corners. */}
      {night > 0.01 ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.31, 0]}>
          <planeGeometry args={[2 * p + 4, 2 * p + 4]} />
          <meshBasicMaterial map={pool} blending={AdditiveBlending} transparent depthWrite={false} opacity={0.26 * night} color={new Color("#ffcf8a")} />
        </mesh>
      ) : null}
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => (
        <group key={i} position={[a! * (p - 0.7), 0.3, b! * (p - 0.7)]}>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.2, 0.26, 0.22, 8]} />
            <meshStandardMaterial color={C.panel} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.225, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.16, 8]} />
            <meshBasicMaterial color={lens} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group position={[0, PAD_TOP, showModel && s.ownPlinth ? 0 : -0.4]}>
        {showModel ? <primitive object={model} /> : s.render ? <FramedRender s={s} /> : <Reserved s={s} />}
        {showModel && s.ownPlinth ? <HexPlinth height={plinthHeight(s)} tiers={tiers} /> : null}
      </group>
    </group>
  );
}
