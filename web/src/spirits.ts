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
  /** Shift the figure sideways on its pad, in metres (Ad Astra: his star onto the avenue's axis). */
  shiftX?: number;
  ownPlinth?: {
    top: number; cx: number; cz: number; height?: number; tiers?: [number, number, number];
    /**
     * Top of the figure's head, in the same raw units as `top`. When given, the
     * figure is scaled so its head stands at FIGURE_HEAD above the pad, so every
     * standing Spirit is the same size whatever it holds overhead.
     */
    head?: number;
    /** Where that head should stand, in metres above the pad (default FIGURE_HEAD; lower for a kneeling figure). */
    headAt?: number;
  };
  /**
   * Alternative models to compare in place. The plaque card shows a button for
   * each; the first is the one shown by default and should match `model`.
   */
  variants?: { label: string; model: string; ownPlinth?: Spirit["ownPlinth"]; height?: number; pad?: number; base?: number; terrace?: Terrace }[];
  /** For Ad Astra: the terrace he stands on, which grows with him. */
  terrace?: Terrace;
};

/** Where a standing figure's head reaches, in metres above its pad: plinth plus figure. */
export const FIGURE_HEAD = 9.6;

/** Avenue half-width to the statue centres. */
export const SIDE_X = 16;
/** The processor dais at the heart of the plaza. */
export const PROCESSOR = { x: 0, z: 3, half: 5.5 };
/** The raised terrace that carries Ad Astra. */
export type Terrace = { x: number; z: number; halfX: number; halfZ: number; height: number; steps: number; stairHalf: number };
export const TERRACE: Terrace = { x: 0, z: -52, halfX: 10, halfZ: 9, height: 1.5, steps: 3, stairHalf: 6 };
/**
 * The grand terrace for a 24 m Ad Astra: twice as high, wider and deeper, with a
 * six-step stair the width of the avenue's centre, so you climb toward him.
 */
export const GRAND_TERRACE: Terrace = { x: 0, z: -52, halfX: 14, halfZ: 12, height: 3, steps: 6, stairHalf: 8 };
/** Walkable floor. */
export const BOUNDS = { minX: -32, maxX: 32, minZ: -64, maxZ: 54 };
/** Where you enter. */
export const ENTRANCE = { x: 0, z: 48 };

const ROWS = [30, 12, -6, -24];

export const SPIRITS: Spirit[] = [
  {
    id: "computation",
    name: "Spirit of Computation",
    allegory: "The architecture of the machine",
    attribute: "Dividers on a processor die, enthroned on the memory hierarchy",
    body:
      "The Architect. He sits enthroned on the memory hierarchy, which rises behind him as a ziggurat: " +
      "storage, memory, cache, registers, and at the summit the core, its rays his halo. On his knees lies " +
      "a processor die, sixteen cores in a grid, and he measures it with gold dividers, as the architect of " +
      "the universe was drawn with his compass.",
    x: -SIDE_X, z: ROWS[0]!, height: 10.5, pad: 4.5, base: 0,
    render: "renders/computation.jpg",
    model: "models/computation.glb",
    // "Architect of the Golden Circuit" (Meshy, 2026-10-11): four tiers up to 0.235 of a 1.904 export.
    // Seated, so his head stands at 8 m (as Innovation kneels at 8.6) and he stays the same size of man.
    ownPlinth: { top: 0.235, cx: 0, cz: -0.05, height: 1.4, head: 1.437, headAt: 8.0 },
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
    ownPlinth: { top: 2.74, cx: 0, cz: 0.05, height: 1.4, head: 7.8 },
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
    ownPlinth: { top: 3.58, cx: 0, cz: 0.1, height: 1.4, head: 9.0 },
  },
  {
    id: "communication",
    name: "Spirit of Communication",
    allegory: "Connection",
    attribute: "Satellite rings, signal wavefronts, a sash of optical fiber",
    body:
      "Connection. She broadcasts with open hands, and stepped Deco wavefronts spread from each palm. " +
      "Two orbits circle her head with a small satellite riding the outer ring, " +
      "and a sash of optical fiber carries light across her body to a fan of glowing tips.",
    x: SIDE_X, z: ROWS[1]!, height: 12, pad: 4.5, base: 0,
    render: "renders/communication.jpg",
    // Golden Signal Goddess, chosen over the A render. Measured with scripts/measure-plinth.mjs
    // (a 1.9 m export, in raw units).
    model: "models/communication.glb",
    ownPlinth: { top: 0.262, cx: 0.004, cz: -0.038, height: 1.4, head: 1.726 },
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
    ownPlinth: { top: 3.38, cx: 0.09, cz: 0.04, height: 1.4, head: 8.5, headAt: 8.6 },
  },
  {
    id: "industry",
    name: "Spirit of Industry",
    allegory: "Labor, the Builder",
    attribute: "A worker and a robotic arm setting a processor sun on a stepped tower",
    body:
      "Human and machine as partners. The Builder and a copper robotic arm lift a processor sun together " +
      "and set it on top of a stepped server tower, the same rising-sun crown the city's towers wear.",
    x: SIDE_X, z: ROWS[2]!, height: 12, pad: 4.5, base: 0,
    render: "renders/industry.jpg",
    model: "models/industry.glb",
    // 1.9 m export. The tower and the arm keep the footprint wide, so the script's 0.262 cut too high;
    // the plinth really ends at about 0.195. The man's head is at about 1.29; the sun rises above it.
    ownPlinth: { top: 0.195, cx: 0.047, cz: 0.007, height: 1.4, head: 1.29 },
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
    ownPlinth: { top: 2.87, cx: 0.3, cz: 0.5, height: 1.4, head: 10.2 },
  },
  {
    id: "liberty",
    name: "Spirit of Liberty",
    allegory: "Freedom",
    attribute: "A torch whose flame is a key, a sealed tablet with a padlock",
    body:
      "Freedom in the computer age is privacy. Liberty raises a torch whose flame is a key and holds " +
      "a tablet framed like a chip package, sealed with a padlock: the right to keep what is yours.",
    x: SIDE_X, z: ROWS[3]!, height: 12, pad: 4.5, base: 0,
    render: "renders/liberty.jpg",
    model: "models/liberty.glb",
    // 1.9 m export; its four-tier plinth ends at 0.238. Head top about 1.50, under the crown rays.
    ownPlinth: { top: 0.238, cx: 0.006, cz: -0.011, height: 1.4, head: 1.5 },
  },
  {
    id: "astra",
    name: "Ad Astra per Aspera",
    allegory: "Aspiration",
    attribute: "A climb toward a chip-hearted star",
    body:
      "Through hardship to the stars. A figure climbs a long stepped plinth toward a star with a chip for a heart. " +
      "The climb is the point, which is why the plinth is so tall and why it closes the avenue.",
    x: TERRACE.x, z: TERRACE.z, height: 24, pad: 11.5, base: GRAND_TERRACE.height, terrace: GRAND_TERRACE,
    // His star rises 5.2 m right of his centre; shifted left on his pad, it sits on the avenue's axis,
    // right in front of the Core's winged chip seen from the processor.
    shiftX: -5.2,
    render: "renders/astra.jpg",
    model: "models/astra.glb",
    // The plaza's message, so he is the one it is built for: 24 m on a grand
    // terrace, about twice the other Spirits. One size only.
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
  // Ad Astra is seen from further back, the more so the taller he stands.
  const d = s.id === "astra" ? 19 * (s.height / 14) : 14.5;
  return { x: s.x + fx * d, z: s.z + fz * d, lookY: s.base + s.height * 0.5 };
}

/** A Spirit as currently shown: with the chosen variant's model and plinth, if it has variants. */
export function withVariant(s: Spirit, index: number | undefined): Spirit {
  const v = s.variants?.[index ?? 0];
  return v
    ? { ...s, model: v.model, ownPlinth: v.ownPlinth ?? s.ownPlinth, height: v.height ?? s.height, pad: v.pad ?? s.pad, base: v.base ?? s.base, terrace: v.terrace ?? s.terrace }
    : s;
}
