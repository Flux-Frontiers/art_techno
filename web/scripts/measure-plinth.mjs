#!/usr/bin/env node
// Find where a Meshy statue's own plinth ends, so the plaza can cut it away and
// stand the figure on the code-drawn series plinth (`ownPlinth` in src/spirits.ts).
//
// Usage: node scripts/measure-plinth.mjs <model.glb> [--profile]
//
// Works on a raw Meshy export or on a file already in public/models. Prints a
// suggested `ownPlinth` line; --profile also prints the width at each height.
//
// How it decides: a stepped plinth narrows a little at each tier, then the
// footprint shrinks sharply where the figure (or Computation's globe) begins.
// The script slices the model every 5 cm, takes the footprint (width x depth)
// of each slice, and picks the sharpest drop in the lower half of the statue.
// The figure is centred on the footprint of the first 60 cm above that cut.
// Always check the result in the plaza. Ad Astra's climbing steps are not a
// plinth and should not be measured this way.

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("Usage: node scripts/measure-plinth.mjs <model.glb> [--profile]");
  process.exit(1);
}

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(file);

// World-space vertex positions (node transforms applied).
const pts = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    const v = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, v);
      pts.push([
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
      ]);
    }
  }
}
let minY = Infinity, maxY = -Infinity;
for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
const H = maxY - minY;
const STEP = 0.05;
const n = Math.ceil(H / STEP);
const slices = Array.from({ length: n }, () => ({ x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, count: 0 }));
for (const [x, y, z] of pts) {
  const s = slices[Math.min(n - 1, Math.floor((y - minY) / STEP))];
  s.x0 = Math.min(s.x0, x); s.x1 = Math.max(s.x1, x);
  s.z0 = Math.min(s.z0, z); s.z1 = Math.max(s.z1, z);
  s.count++;
}
const area = (s) => (s.x1 - s.x0) * (s.z1 - s.z0);

if (flag === "--profile") {
  console.log("height   width  depth   x-range          z-range");
  slices.forEach((s, i) => {
    if (!s.count || i * STEP > H * 0.5) return;
    console.log(
      `${(i * STEP).toFixed(2).padStart(5)} m  ${(s.x1 - s.x0).toFixed(2).padStart(5)}  ${(s.z1 - s.z0).toFixed(2).padStart(5)}` +
        `   [${s.x0.toFixed(2)}, ${s.x1.toFixed(2)}]   [${s.z0.toFixed(2)}, ${s.z1.toFixed(2)}]`,
    );
  });
}

// Footprint of everything between two heights. Windows rather than thin slices,
// because a simplified mesh may have only a handful of vertices in any 5 cm.
function windowBox(a, b) {
  const box = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, count: 0 };
  for (let i = Math.max(0, a); i < Math.min(n, b); i++) {
    const s = slices[i];
    if (!s.count) continue;
    box.x0 = Math.min(box.x0, s.x0); box.x1 = Math.max(box.x1, s.x1);
    box.z0 = Math.min(box.z0, s.z0); box.z1 = Math.max(box.z1, s.z1);
    box.count += s.count;
  }
  return box;
}
const W = Math.round(0.25 / STEP);
// The plinth edge: the lowest height where the footprint of the 25 cm above is
// sharply smaller (by 35% or more) than the 25 cm below, and small next to the
// base (a quarter of it or less). Tier steps narrow by less; the figure, or
// Computation's globe, is far narrower than the base.
const base = area(windowBox(0, W));
let best = -1, bestDrop = 0;
for (let i = Math.round(0.4 / STEP); i * STEP < H * 0.5; i++) {
  const below = windowBox(i - W, i), above = windowBox(i, i + W);
  if (below.count < 20 || above.count < 20) continue;
  const drop = 1 - area(above) / area(below);
  if (drop >= 0.35 && area(above) / base <= 0.25) { best = i; bestDrop = drop; break; }
}
// Refine to the slice: the last 5 cm still as wide as the plinth's top tier.
if (best >= 0) {
  const widths = [];
  for (let i = best - W; i < best; i++) if (slices[i]?.count >= 5) widths.push(slices[i].x1 - slices[i].x0);
  widths.sort((a, b) => a - b);
  const tier = widths[Math.floor(widths.length / 2)] ?? 0;
  for (let i = best - W; i < best + W; i++) {
    const sl = slices[i];
    if (sl?.count >= 5 && sl.x1 - sl.x0 >= 0.85 * tier) best = Math.max(best, i + 1);
  }
}
if (process.env.DROPS) {
  const base = area(windowBox(0, W));
  const rows = [];
  for (let i = Math.round(0.4 / STEP); i * STEP < H * 0.5; i++) {
    const below = windowBox(i - W, i), above = windowBox(i, i + W);
    if (below.count < 20 || above.count < 20) continue;
    const d = 1 - area(above) / area(below);
    if (d > 0.25) rows.push(`${(i * STEP).toFixed(2)}:${d.toFixed(2)}:${(area(above) / base).toFixed(2)}`);
  }
  console.log(rows.join("  "));
}
if (best < 0) {
  console.error("No plinth edge found.");
  process.exit(2);
}
const top = best * STEP;
// Centre the figure on what stands on the plinth: the first 60 cm above the cut.
const fig = windowBox(best, best + Math.round(0.6 / STEP));
const { x0, x1, z0, z1 } = fig;
const r2 = (v) => Math.round(v * 100) / 100;
console.log(`Model height ${r2(H)} m. Plinth ends at ${r2(top)} m (footprint drops ${Math.round(bestDrop * 100)}%).`);
console.log(`Figure footprint above the cut: ${r2(x1 - x0)} m wide, ${r2(z1 - z0)} m deep.`);
console.log(`\nownPlinth: { top: ${r2(top)}, cx: ${r2((x0 + x1) / 2)}, cz: ${r2((z0 + z1) / 2)}, height: 1.4 },`);
console.log("\nUse height: 1.4 for a figure standing on its plinth (the series plinth), or leave height out to keep");
console.log("the figure where it was (Computation, whose globe already sits on a low plinth).");
