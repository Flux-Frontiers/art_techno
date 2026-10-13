import { useEffect, useMemo, useState } from "react";
import { Box3, Group, type Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl } from "../device";
import { cityLit } from "../sky/plazaSky";
import { useStore } from "../store";
import { POLE } from "./landmarks";
import { cityTowers, POLE_NEEDLE } from "./Plaza";
import { craftShading } from "./shading";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

/**
 * The southern finial in silver, so north and south can be told apart: its warm colors (the gold and
 * copper, where red stands well over blue) drained to a cool neutral, by day and in its glow after
 * dark; the granite, already neutral, and the green chip are untouched.
 */
function silvered(mat: MeshStandardMaterial): MeshStandardMaterial {
  const m = mat.clone();
  craftShading(m, 0.6);
  const craft = m.onBeforeCompile;
  const silver = (v: string) => `{ float warm = clamp((${v}.r - ${v}.b) * 4.0, 0.0, 1.0); ${v} = mix(${v}, vec3(dot(${v}, vec3(0.2126, 0.7152, 0.0722))) * vec3(0.94, 0.98, 1.06), warm); }`;
  m.onBeforeCompile = (shader, renderer) => {
    craft(shader, renderer);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <map_fragment>", `#include <map_fragment>\n  ${silver("diffuseColor.rgb")}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n  ${silver("totalEmissiveRadiance")}`);
  };
  m.customProgramCacheKey = () => "craft-silver-v1-0.6";
  return m;
}

/**
 * The pole star finial: a Meshy spire (a granite base, a collar of copper fins, a
 * faceted shaft carrying a bus and a glowing chip, a needle ending in a gold ball)
 * crowning the pole tower and its mirror, in place of a plain mast. Each is
 * scaled to POLE_NEEDLE of its tower's height, so the tip stops just under
 * Polaris from the floor marker whatever the latitude (landmarks.ts, POLE). The
 * tower widens with its height so its top tier carries the base (cityTowers()).
 * The northern finial (+x) is gold, the southern one silver.
 */
export function PoleFinials() {
  const [models, setModels] = useState<{ north: Group; south: Group } | null>(null);
  const daylight = useStore((s) => s.sky.daylight);
  const lat = useStore((s) => s.place?.lat ?? POLE.defaultLat);
  const spots = useMemo(() => cityTowers(lat).filter((t) => t.pole), [lat]);
  useEffect(() => {
    let live = true;
    loader.load(`${import.meta.env.BASE_URL}${modelUrl("models/pole-finial.glb")}`, (gltf) => {
      if (!live) return;
      const root = gltf.scene;
      const box = new Box3().setFromObject(root);
      const size = box.getSize(new Vector3());
      // Normalized to 1 m tall, base at the origin, centered in plan.
      const k = 1 / size.y;
      root.scale.setScalar(k);
      root.position.set(-((box.min.x + box.max.x) / 2) * k, -box.min.y * k, -((box.min.z + box.max.z) / 2) * k);
      root.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as MeshStandardMaterial;
        if (mat.map) { mat.emissiveMap = mat.map; mat.emissive.set("#ffffff"); mat.emissiveIntensity = 0; }
        craftShading(mat, 0.6);
      });
      const north = new Group();
      north.add(root);
      const south = north.clone();
      south.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.isMesh) mesh.material = silvered(mesh.material as MeshStandardMaterial);
      });
      setModels({ north, south });
    }, undefined, () => { /* no finial: the pole tower stands without its pointer */ });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    for (const m of models ? [models.north, models.south] : []) {
      m.traverse((o) => {
        const mat = (o as Mesh).material as MeshStandardMaterial | undefined;
        if (mat?.emissiveMap) mat.emissiveIntensity = 0.16 * (1 - daylight) * (0.5 + 0.5 * cityLit(daylight));
      });
    }
  }, [models, daylight]);
  // North is +x (plazaSky.ts).
  const copies = useMemo(() => (models ? spots.map((t) => (t.x > 0 ? models.north : models.south).clone()) : []), [models, spots]);
  return (
    <group>
      {copies.map((c, i) => {
        const t = spots[i]!;
        // On the tower's top roof, its chip turned to the plaza.
        return <primitive key={i} object={c} position={[t.x, t.h, t.z]} rotation={[0, Math.atan2(-t.x, -t.z), 0]} scale={t.h * POLE_NEEDLE} />;
      })}
    </group>
  );
}
