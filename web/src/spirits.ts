/**
 * The nine Spirits of the Art Techno series and where each stands in the plaza.
 *
 * World axes: y is up, the avenue runs along z. You enter at +z and walk toward
 * -z; Ad Astra closes the view from a raised terrace at the far end. Statues on
 * the left (x < 0) and right (x > 0) face the avenue.
 */

export type Status = "model" | "render" | "planned";

export type Spirit = {
  id: string;
  name: string;
  /** The virtue it stands for. */
  allegory: string;
  /** The attribute that identifies it, as on the style doc's table. */
  attribute: string;
  body: string;
  /** Plinth centre on the plaza floor. */
  x: number;
  z: number;
  /** Height the statue stands, plinth included, in metres. */
  height: number;
  /** Pad half-width. */
  pad: number;
  /** Ground level of the pad (Ad Astra stands on the terrace). */
  base: number;
  /** Hero render, shown framed until the model arrives. */
  render?: string;
  /** Meshy GLB, once it is in public/models. */
  model?: string;
  /**
   * Replace the model's own plinth with a clean one drawn in code. In the
   * model's raw units (as exported, base at y = 0): `top` is the height of its
   * plinth, where the model is cut; `cx`, `cz` centre the figure over the new
   * plinth. `height` is the new plinth's height in metres (default: the cut
   * height, so the figure stays where it was); the figure is scaled to fill the
   * rest of the statue's height. `tiers` are the hexagons' corner radii in
   * metres, bottom to top (default: the series plinth).
   */
  ownPlinth?: { top: number; cx: number; cz: number; height?: number; tiers?: [number, number, number] };
};

/** Avenue half-width to the statue centres. */
export const SIDE_X = 16;
/** The processor dais at the heart of the plaza. */
export const PROCESSOR = { x: 0, z: 3, half: 5.5 };
/** The raised terrace that carries Ad Astra. */
export const TERRACE = { x: 0, z: -52, halfX: 10, halfZ: 9, height: 1.5 };
/** Walkable floor. */
export const BOUNDS = { minX: -32, maxX: 32, minZ: -64, maxZ: 54 };
/** Where you enter. */
export const ENTRANCE = { x: 0, z: 48 };

const ROWS = [30, 12, -6, -24];

export const SPIRITS: Spirit[] = [
  {
    id: "computation",
    name: "Spirit of Computation",
    allegory: "Thought and calculation",
    attribute: "Raised trace bolts, wafer globe, heat-sink wings",
    body:
      "The first of the Spirits, and the one that set the rules. A faceted figure raises bolts " +
      "routed at 0°, 45° and 90° over a globe cut from a silicon wafer, with heat-sink fins for wings. " +
      "Thought is drawn the way a board is routed: every line ends in a pad.",
    x: -SIDE_X, z: ROWS[0]!, height: 12, pad: 4.5, base: 0,
    render: "renders/computation.jpg",
    model: "models/computation.glb",
    // Measured from the Meshy export: three tiers up to 1.38 m, the globe sitting just off centre.
    ownPlinth: { top: 1.4, cx: 0.15, cz: 0.55 },
  },
  {
    id: "power",
    name: "Spirit of Power",
    allegory: "Energy",
    attribute: "Atlas bearing a fusion sun in an armillary of magnetic coils",
    body:
      "Atlas for the age of fusion. He braces wide and bears an armillary of gold and copper rings " +
      "around a burning core, with eight magnet blocks set round it like a rose window. " +
      "The plinth is switchgear: copper bus bars capped in gold.",
    x: SIDE_X, z: ROWS[0]!, height: 12, pad: 4.5, base: 0,
    render: "renders/power.jpg",
    model: "models/power.glb",
    // Its own plinth ends at 2.74 m; the figure is lowered onto the 1.4 m series plinth.
    ownPlinth: { top: 2.74, cx: 0, cz: 0.05, height: 1.4 },
  },
  {
    id: "knowledge",
    name: "Spirit of Knowledge",
    allegory: "Wisdom",
    attribute: "Open book, knowledge-graph halo, fluted robe",
    body:
      "Wisdom holds an open book beneath a halo drawn as a knowledge graph, its nodes and edges in gold. " +
      "Her robe falls in flutes, and the plinth is stacked like spines on a library shelf.",
    x: -SIDE_X, z: ROWS[1]!, height: 12, pad: 4.5, base: 0,
    render: "renders/knowledge.jpg",
    model: "models/knowledge.glb",
    // Its own plinth ends at 3.58 m; the robe hem stands on the 1.4 m series plinth.
    ownPlinth: { top: 3.58, cx: 0, cz: 0.1, height: 1.4 },
  },
  {
    id: "communication",
    name: "Spirit of Communication",
    allegory: "Connection",
    attribute: "Satellite rings, signal wavefronts, a sash of optical fiber",
    body:
      "Planned. Connection drawn as satellite rings and stepped signal wavefronts, " +
      "with a sash of optical fiber carrying light across the figure.",
    x: SIDE_X, z: ROWS[1]!, height: 12, pad: 4.5, base: 0,
  },
  {
    id: "innovation",
    name: "Spirit of Innovation",
    allegory: "Invention",
    attribute: "A chip released upward beneath a framed circuit panel",
    body:
      "Invention as release. A kneeling figure, eyes closed under a green brow band, lets a glowing chip " +
      "go upward from open hands. Above it a framed panel carries the circuit the chip will become.",
    x: -SIDE_X, z: ROWS[2]!, height: 12, pad: 4.5, base: 0,
    render: "renders/innovation.jpg",
    model: "models/innovation.glb",
    // Its own plinth ends at 3.38 m; the kneeling figure is lowered onto the 1.4 m series plinth.
    ownPlinth: { top: 3.38, cx: 0.09, cz: 0.04, height: 1.4 },
  },
  {
    id: "industry",
    name: "Spirit of Industry",
    allegory: "Labor, the Builder",
    attribute: "A figure and a robotic arm assembling a stepped tower",
    body:
      "Planned. The Builder and a robotic arm work side by side, setting the last tier on a stepped tower.",
    x: SIDE_X, z: ROWS[2]!, height: 12, pad: 4.5, base: 0,
  },
  {
    id: "life",
    name: "Spirit of Life",
    allegory: "Biology meets computation",
    attribute: "A faceted double-helix staff, a glowing cell in her palm",
    body:
      "She holds the double helix as a staff crowned with a fan of rays, and a glowing cell in her open palm. " +
      "Her halo carries green nodes like a cell membrane, and the plinth spells out the four bases as a code of colored bars.",
    x: -SIDE_X, z: ROWS[3]!, height: 12, pad: 4.5, base: 0,
    render: "renders/life.jpg",
    model: "models/life.glb",
    // Its own plinth ends at 2.87 m; she and the helix staff stand on the 1.4 m series plinth.
    ownPlinth: { top: 2.87, cx: 0.3, cz: 0.5, height: 1.4 },
  },
  {
    id: "liberty",
    name: "Spirit of Liberty",
    allegory: "Freedom",
    attribute: "A torch whose flame is a key",
    body: "Planned. Freedom raises a torch whose flame is a key, for privacy and encryption.",
    x: SIDE_X, z: ROWS[3]!, height: 12, pad: 4.5, base: 0,
  },
  {
    id: "astra",
    name: "Ad Astra per Aspera",
    allegory: "Aspiration",
    attribute: "A climb toward a chip-hearted star",
    body:
      "Through hardship to the stars. A figure climbs a long stepped plinth toward a star with a chip for a heart. " +
      "The climb is the point, which is why the plinth is so tall and why it closes the avenue.",
    x: TERRACE.x, z: TERRACE.z, height: 14, pad: 5.5, base: TERRACE.height,
    render: "renders/astra.jpg",
    model: "models/astra.glb",
  },
];

export function statusOf(s: Spirit): Status {
  if (s.model) return "model";
  if (s.render) return "render";
  return "planned";
}

export const STATUS_LABEL: Record<Status, string> = {
  model: "Statue",
  render: "Render · model coming",
  planned: "Planned",
};

/** Unit vector (x, z) from the statue toward the avenue, which it faces. */
export function facing(s: Spirit): [number, number] {
  if (s.x < -1) return [1, 0];
  if (s.x > 1) return [-1, 0];
  return [0, 1];
}

/** Rotation about y that turns a model's +z front toward the avenue. */
export function facingYaw(s: Spirit): number {
  const [fx, fz] = facing(s);
  return Math.atan2(fx, fz);
}

/** Where to stand to see the whole statue, and the point to look at. */
export function viewpoint(s: Spirit): { x: number; z: number; lookY: number } {
  const [fx, fz] = facing(s);
  const d = s.id === "astra" ? 19 : 14.5;
  return { x: s.x + fx * d, z: s.z + fz * d, lookY: s.base + s.height * 0.5 };
}
