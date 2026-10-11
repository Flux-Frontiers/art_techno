import { useEffect, useState } from "react";
import { Box3, Group, type Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl } from "../device";
import { useStore } from "../store";
import { PANTHEON } from "./landmarks";
import { craftShading } from "./shading";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

/**
 * The city's great temple: a Meshy facade (the stepped tower, winged die and
 * boot-sun crown, its two armoured guardians at the door), scaled and placed
 * (landmarks.ts) on the avenue's axis where the tallest setback tower was. It is only
 * ever seen from the plaza, which suits it: the model is a deep relief, not a
 * building in the round. Its gold glows faintly after dark, like the craft,
 * and shares their colour treatment.
 */
export function Pantheon() {
  const [model, setModel] = useState<Group | null>(null);
  const daylight = useStore((s) => s.sky.daylight);
  useEffect(() => {
    let live = true;
    loader.load(`${import.meta.env.BASE_URL}${modelUrl("models/pantheon.glb")}`, (gltf) => {
      if (!live) return;
      const root = gltf.scene;
      const box = new Box3().setFromObject(root);
      const size = box.getSize(new Vector3());
      const k = PANTHEON.height / size.y;
      root.scale.setScalar(k);
      root.position.set(-((box.min.x + box.max.x) / 2) * k, -box.min.y * k, -((box.min.z + box.max.z) / 2) * k);
      root.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as MeshStandardMaterial;
        if (mat.map) { mat.emissiveMap = mat.map; mat.emissive.set("#ffffff"); mat.emissiveIntensity = 0; }
        // Meshy's pale gold, pushed toward the statues' as the sky darkens (as for the craft), and
        // 60% of the haze: it stands in the city's air, but the avenue's end should still read gold.
        craftShading(mat, 0.6);
      });
      const wrap = new Group();
      wrap.add(root);
      setModel(wrap);
    }, undefined, () => { /* no Pantheon: the skyline simply has its gap */ });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    model?.traverse((o) => {
      const mat = (o as Mesh).material as MeshStandardMaterial | undefined;
      if (mat?.emissiveMap) mat.emissiveIntensity = 0.32 * (1 - daylight);
    });
  }, [model, daylight]);
  return model ? <primitive object={model} position={[0, 0, PANTHEON.z]} /> : null;
}
