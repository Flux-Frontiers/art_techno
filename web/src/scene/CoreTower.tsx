import { useEffect, useState } from "react";
import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { modelUrl } from "../device";
import { cityLit } from "../sky/plazaSky";
import { useStore } from "../store";
import { CORE } from "./landmarks";
import { useLettered } from "./lettered";
import { craftShading } from "./shading";
import { C, doorTexture } from "./textures";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

/**
 * The plate over the door that carries the inscription (textures.ts, doorTexture), covering Meshy's
 * garbled lettering. In the model's own units (glTF axes, +z toward the plaza), measured by ray
 * casting: the panel is recessed in the doorway, x +-0.084 and y -0.8175 to -0.7125, its face at
 * z -0.091 to -0.097 inside a gold frame whose face is at -0.089. The plate fills it flush behind the
 * frame, reaching 0.004 under it at each side. The plaza build (scripts/blender/build_plaza.py) mounts the same plate.
 */
const DOOR = { w: 0.176, h: 0.105, y: -0.765, back: -0.098, front: -0.0895 };

/**
 * The city's great tower: a Meshy facade (the stepped tower, winged die and
 * boot-sun crown, its two armoured guardians at the door), scaled and placed
 * (landmarks.ts) on the avenue's axis where the tallest setback tower was. It is only
 * ever seen from the plaza, which suits it: the model is a deep relief, not a
 * building in the round. Its gold glows faintly after dark, like the craft,
 * and shares their colour treatment.
 */
export function CoreTower() {
  const [model, setModel] = useState<Group | null>(null);
  const daylight = useStore((s) => s.sky.daylight);
  const inscription = useLettered(doorTexture, ["600 150px 'Josefin Sans'"]);
  const [face] = useState(() => {
    // A fifth of the facade's glow: flat canvas gold reads far brighter than Meshy's shaded relief.
    const m = new MeshStandardMaterial({ metalness: 0.3, roughness: 0.7, emissive: "#333333", emissiveIntensity: 0 });
    craftShading(m, 0.6);
    return m;
  });
  useEffect(() => {
    face.map = face.emissiveMap = inscription;
    face.needsUpdate = true;
  }, [face, inscription]);
  useEffect(() => {
    let live = true;
    loader.load(`${import.meta.env.BASE_URL}${modelUrl("models/core.glb")}`, (gltf) => {
      if (!live) return;
      const root = gltf.scene;
      const box = new Box3().setFromObject(root);
      const size = box.getSize(new Vector3());
      const k = CORE.height / size.y;
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
      const block = new MeshStandardMaterial({ color: C.obsidian, metalness: 0.3, roughness: 0.65 });
      craftShading(block, 0.6);
      const plate = new Mesh(new BoxGeometry(DOOR.w, DOOR.h, DOOR.front - DOOR.back), block);
      plate.position.set(0, DOOR.y, (DOOR.front + DOOR.back) / 2);
      const lettering = new Mesh(new PlaneGeometry(DOOR.w, DOOR.h), face);
      lettering.position.set(0, DOOR.y, DOOR.front + 0.0002);
      root.add(plate, lettering);
      const wrap = new Group();
      wrap.add(root);
      setModel(wrap);
    }, undefined, () => { /* no Core: the skyline simply has its gap */ });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    model?.traverse((o) => {
      const mat = (o as Mesh).material as MeshStandardMaterial | undefined;
      if (mat?.emissiveMap) mat.emissiveIntensity = 0.32 * (1 - daylight) * (0.5 + 0.5 * cityLit(daylight));
    });
  }, [model, daylight]);
  return model ? <primitive object={model} position={[0, 0, CORE.z]} /> : null;
}
