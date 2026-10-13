import { useEffect, useMemo, useState } from "react";
import { Box3, Group, type Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl } from "../device";
import { useStore } from "../store";
import { cityTowers } from "./Plaza";
import { craftShading } from "./shading";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

/**
 * The Sun Towers: one Meshy tower (the boot-sun crown seated on a setback, its
 * rays ending in pads, a bus dropping to vias) drawn twice, mirrored across the
 * avenue where cityTowers() marks the pair (landmarks.ts). Each turns its crown
 * to the plaza. Lit and hazed like the Core, which they frame.
 */
export function SunTowers() {
  const [model, setModel] = useState<Group | null>(null);
  const daylight = useStore((s) => s.sky.daylight);
  const spots = useMemo(() => cityTowers().filter((t) => t.landmark === "sun"), []);
  useEffect(() => {
    let live = true;
    loader.load(`${import.meta.env.BASE_URL}${modelUrl("models/sun-tower.glb")}`, (gltf) => {
      if (!live) return;
      const root = gltf.scene;
      const box = new Box3().setFromObject(root);
      const size = box.getSize(new Vector3());
      // Normalized to 1 m tall, base at the origin, centered in plan; each copy scales to its tower.
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
      const wrap = new Group();
      wrap.add(root);
      setModel(wrap);
    }, undefined, () => { /* no model: the two ring places stay empty */ });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    model?.traverse((o) => {
      const mat = (o as Mesh).material as MeshStandardMaterial | undefined;
      if (mat?.emissiveMap) mat.emissiveIntensity = 0.32 * (1 - daylight);
    });
  }, [model, daylight]);
  const copies = useMemo(() => (model ? spots.map(() => model.clone()) : []), [model, spots]);
  return (
    <group>
      {copies.map((c, i) => {
        const t = spots[i]!;
        // The model's front (+z) turned toward the plaza's centre.
        return <primitive key={i} object={c} position={[t.x, 0, t.z]} rotation={[0, Math.atan2(-t.x, -t.z), 0]} scale={t.h} />;
      })}
    </group>
  );
}
