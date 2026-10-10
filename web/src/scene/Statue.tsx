import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending, Box3, BoxGeometry, Color, CylinderGeometry, EdgesGeometry, type Group, InstancedMesh,
  type LineSegments, Mesh, MeshStandardMaterial, Object3D, Plane, SphereGeometry, SRGBColorSpace,
  type Texture, TextureLoader, Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { facingYaw, type Spirit } from "../spirits";
import { useStore } from "../store";
import { C, glowTexture, padTexture } from "./textures";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
/** Height of the pad's top surface above the statue's base. */
const PAD_TOP = 0.3;

/**
 * Floodlight a statue from its foot, faked in the shader as the forest's
 * exhibits are: each material glows in its own colour, strongest at the
 * ground and fading up the figure. No real lights, so nine statues cost no
 * more to shade than one.
 */
function uplight(m: MeshStandardMaterial, base: number, strength: number, falloff: number) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uplight = { value: strength };
    shader.uniforms.uplightBase = { value: base };
    shader.uniforms.uplightFalloff = { value: falloff };
    shader.vertexShader = "varying float vUplightY;\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n  vUplightY = (modelMatrix * vec4(transformed, 1.0)).y;",
    );
    shader.fragmentShader = "uniform float uplight; uniform float uplightBase; uniform float uplightFalloff; varying float vUplightY;\n" +
      shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.86, 0.66) * uplight * exp(-max(vUplightY - uplightBase, 0.0) / uplightFalloff) * diffuseColor.rgb;",
      );
  };
  m.customProgramCacheKey = () => `uplight-${strength}-${falloff}`;
  m.needsUpdate = true;
}

function useModel(s: Spirit): Object3D | null {
  const [scene, setScene] = useState<Object3D | null>(null);
  const markFailed = useStore((st) => st.markFailed);
  useEffect(() => {
    if (!s.model) return;
    let live = true;
    loader.load(
      s.model,
      (gltf) => {
        const root = gltf.scene;
        root.traverse((o) => {
          if (!(o instanceof Mesh)) return;
          o.castShadow = true;
          o.receiveShadow = true;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) if (m instanceof MeshStandardMaterial) {
            m.envMapIntensity = 1.1;
            uplight(m, s.base, 0.55, 4.5);
            if (s.ownPlinth) {
              // Cut away the model's own plinth; the clean one drawn in code takes its place.
              m.clippingPlanes = [new Plane(new Vector3(0, 1, 0), -(s.base + PAD_TOP + s.ownPlinth.top * (s.height / 12)))];
              m.clipShadows = true;
            }
          }
        });
        // Fit to the statue's height, base on the pad, centred on its footprint.
        const box = new Box3().setFromObject(root);
        const size = box.getSize(new Vector3());
        const k = s.height / size.y;
        root.scale.setScalar(k);
        const cx = s.ownPlinth ? s.ownPlinth.cx : (box.min.x + box.max.x) / 2;
        const cz = s.ownPlinth ? s.ownPlinth.cz : (box.min.z + box.max.z) / 2;
        root.position.set(-cx * k, -box.min.y * k, -cz * k);
        if (live) setScene(root);
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

export function Statue({ s }: { s: Spirit }) {
  const failed = useStore((st) => !!st.failed[s.id]);
  const model = useModel(s);
  const padTex = useMemo(() => padTexture(s.name, s.allegory), [s]);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    // Redraw the pad lettering once the web fonts are in.
    document.fonts?.ready.then(() => setFontsReady(true));
  }, []);
  const padTop = useMemo(() => (fontsReady ? padTexture(s.name, s.allegory) : padTex), [fontsReady, s, padTex]);
  const pool = useMemo(() => glowTexture("rgba(255,226,170,0.9)"), []);
  const group = useRef<Group>(null);
  const invalidate = useThree((st) => st.invalidate);
  useEffect(() => invalidate(), [model, invalidate]);
  const p = s.pad;
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
      {/* Pool of light from the floodlamps at the foot. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.31, 0]}>
        <planeGeometry args={[2 * p + 4, 2 * p + 4]} />
        <meshBasicMaterial map={pool} blending={AdditiveBlending} transparent depthWrite={false} opacity={0.22} color={new Color("#ffcf8a")} />
      </mesh>
      <group position={[0, PAD_TOP, showModel && s.ownPlinth ? 0 : -0.4]}>
        {showModel ? <primitive object={model} /> : s.render ? <FramedRender s={s} /> : <Reserved s={s} />}
        {showModel && s.ownPlinth ? <HexPlinth height={s.ownPlinth.top * (s.height / 12)} tiers={s.ownPlinth.tiers} /> : null}
      </group>
    </group>
  );
}
