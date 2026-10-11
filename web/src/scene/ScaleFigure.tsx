import { useMemo } from "react";
import { BoxGeometry, BufferGeometry, CylinderGeometry, Quaternion, RingGeometry, SphereGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useStore } from "../store";
import { C } from "./textures";

/** Stature of the scale figure, in metres. */
export const FIGURE_HEIGHT = 1.75;

/** A tapered limb from a to b, faceted like the rest of the plaza. */
function limb(a: [number, number, number], b: [number, number, number], r1: number, r2: number): BufferGeometry {
  const A = new Vector3(...a), B = new Vector3(...b);
  const len = A.distanceTo(B);
  const g = new CylinderGeometry(r2, r1, len, 8);
  g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  const mid = A.add(B).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

/**
 * An architect's scale figure, 1.75 m to the crown, facing +z: no face, no
 * dress, just a person's proportions, so the eye has a measure.
 */
function figureGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    const foot = new BoxGeometry(0.1, 0.06, 0.25);
    foot.translate(sx * 0.09, 0.03, 0.04);
    parts.push(foot);
    parts.push(limb([sx * 0.09, 0.06, 0], [sx * 0.09, 0.5, 0], 0.045, 0.058)); // shin
    parts.push(limb([sx * 0.09, 0.5, 0], [sx * 0.095, 0.93, 0], 0.06, 0.085)); // thigh
    parts.push(limb([sx * 0.2, 1.44, 0], [sx * 0.24, 1.13, 0.01], 0.048, 0.04)); // upper arm
    parts.push(limb([sx * 0.24, 1.13, 0.01], [sx * 0.25, 0.86, 0.04], 0.04, 0.034)); // forearm
    const hand = new SphereGeometry(0.045, 8, 6);
    hand.scale(0.8, 1.3, 1);
    hand.translate(sx * 0.25, 0.8, 0.045);
    parts.push(hand);
  }
  const hips = new CylinderGeometry(0.16, 0.15, 0.16, 8);
  hips.scale(1, 1, 0.65);
  hips.translate(0, 0.96, 0);
  parts.push(hips);
  const torso = new CylinderGeometry(0.2, 0.15, 0.48, 8);
  torso.scale(1, 1, 0.6);
  torso.translate(0, 1.27, 0);
  parts.push(torso);
  parts.push(limb([0, 1.5, 0], [0, 1.56, 0], 0.05, 0.05)); // neck
  const head = new SphereGeometry(0.1, 10, 8);
  head.scale(0.92, 1.22, 1);
  head.translate(0, FIGURE_HEIGHT - 0.122, 0.01);
  parts.push(head);
  // Drop index/uv differences so the parts merge into one draw.
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) { g.deleteAttribute("uv"); g.computeVertexNormals(); }
  return mergeGeometries(flat)!;
}

let shared: { body: BufferGeometry; ring: BufferGeometry } | null = null;
function geometry() {
  if (!shared) {
    const ring = new RingGeometry(0.42, 0.47, 32);
    ring.rotateX(-Math.PI / 2);
    shared = { body: figureGeometry(), ring };
  }
  return shared;
}

/**
 * The scale figure on its gold ring. Placed by the statue in its own frame
 * (facing +z), standing on the floor beside the pad's front corner.
 */
export function ScaleFigure({ x, z }: { x: number; z: number }) {
  const on = useStore((s) => s.scaleFigure);
  const daylight = useStore((s) => s.sky.daylight);
  const g = useMemo(geometry, []);
  if (!on) return null;
  // Lit faintly at night, like the statues under their lamps, so it still reads.
  const glow = 0.1 * Math.min(1, Math.max(0, (0.6 - daylight) / 0.45));
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={g.body} castShadow receiveShadow>
        <meshStandardMaterial color={C.silk} roughness={0.55} metalness={0.05} flatShading emissive={C.silk} emissiveIntensity={glow} />
      </mesh>
      <mesh geometry={g.ring} position={[0, 0.006, 0]}>
        <meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.3} emissive={C.gold} emissiveIntensity={0.15 + glow} />
      </mesh>
    </group>
  );
}
