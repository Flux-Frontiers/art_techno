import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Offset a path of 0, 45 and 90 degree segments sideways by `d`, mitring each
 * corner: the traces of a bus run (motif 13) keep their pitch through every
 * bend, so a bus turns as one, in nested 45-degree chamfers.
 */
export function offsetPath(path: [number, number][], d: number): [number, number][] {
  const n = path.length;
  const normal = (a: [number, number], b: [number, number]): [number, number] => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    return [-dy / L, dx / L];
  };
  return path.map((p, i) => {
    if (i === 0 || i === n - 1) {
      const [nx, ny] = i === 0 ? normal(path[0]!, path[1]!) : normal(path[n - 2]!, path[n - 1]!);
      return [p[0] + nx * d, p[1] + ny * d];
    }
    const n1 = normal(path[i - 1]!, p), n2 = normal(p, path[i + 1]!);
    const k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    return [p[0] + ((n1[0] + n2[0]) / k) * d, p[1] + ((n1[1] + n2[1]) / k) * d];
  });
}

/**
 * A running Greek key (motif 14) as a routed trace: up from the line, across,
 * down, back, and down to the line again, every turn a right angle, repeated
 * along [x0, x1] between heights y0 (top) and y1 (the line).
 */
export function greekKey(x0: number, x1: number, y0: number, y1: number): [number, number][] {
  const s = (y1 - y0) / 4;
  // A whole number of keys across, so the frieze runs on unbroken round a tower.
  const n = Math.max(1, Math.round((x1 - x0) / (4 * s)));
  const w = (x1 - x0) / (4 * n);
  const pts: [number, number][] = [[x0, y1]];
  for (let k = 0; k < n; k++) {
    const x = x0 + k * 4 * w;
    pts.push([x, y0], [x + 3 * w, y0], [x + 3 * w, y0 + 2 * s], [x + w, y0 + 2 * s], [x + w, y1], [x + 4 * w, y1]);
  }
  return pts;
}

/** Palette from the Art Techno rules. */
export const C = {
  obsidian: "#0B100E",
  panel: "#121A17",
  copper: "#C77C48",
  gold: "#D4AF5A",
  green: "#2F8F74",
  mint: "#7FBFA8",
  silk: "#EDE6D3",
};

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

/**
 * Polished black paving, one tile = 8 m: 2 m slabs with dark joints, a gold
 * hairline round the 8 m square, and a via where the hairlines cross.
 */
export function pavingTexture(repeat: [number, number]) {
  const [c, g] = canvas(1024, 1024);
  g.fillStyle = "#0f1513";
  g.fillRect(0, 0, 1024, 1024);
  // Slight variation slab to slab, like stone.
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const v = 14 + ((i * 7 + j * 13) % 5);
      g.fillStyle = `rgb(${v - 2},${v + 4},${v + 1})`;
      g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250);
    }
  g.strokeStyle = "#070a09";
  g.lineWidth = 6;
  for (let k = 0; k <= 4; k++) {
    g.beginPath(); g.moveTo(k * 256, 0); g.lineTo(k * 256, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, k * 256); g.lineTo(1024, k * 256); g.stroke();
  }
  g.strokeStyle = "rgba(212,175,90,0.55)";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 1021, 1021);
  g.fillStyle = C.gold;
  for (const [x, y] of [[0, 0], [1024, 0], [0, 1024], [1024, 1024]] as const) {
    g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#070a09";
  for (const [x, y] of [[0, 0], [1024, 0], [0, 1024], [1024, 1024]] as const) {
    g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
  }
  return tex(c, repeat);
}

/**
 * Art Techno facade, one tile = 16 m square, drawn as light on black glass
 * (rule 5): heat-sink-fin piers every 4 m in copper, bays of short lit dashes
 * like server-rack lights, and in some bays a gold circuit trace that rises,
 * jogs at 45 degrees and ends in a pad (rules 2 and 3). The emissive map of a
 * near-black material, so the towers glow rather than reflect.
 */
export function facadeTexture(seed: number) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#000000";
  g.fillRect(0, 0, 512, 512);
  let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const bay = 128; // 4 m
  // One or two bays of every tile carry a bus run instead of server lights.
  const busBays = seed % 2 ? [1, 3] : [2];
  for (let b = 0; b < 4; b++) {
    if (busBays.includes(b)) {
      g.fillStyle = "#5a3418";
      for (let f = 0; f < 4; f++) g.fillRect(b * bay + 2 + f * 6, 0, 3, 512);
      continue;
    }
    const x0 = b * bay;
    // Pier: a bundle of narrow copper fins.
    g.fillStyle = "#5a3418";
    for (let f = 0; f < 4; f++) g.fillRect(x0 + 2 + f * 6, 0, 3, 512);
    // Server-light dashes in rows.
    for (let y = 8; y < 512; y += 16) {
      for (let x = x0 + 34; x < x0 + bay - 10; x += 22) {
        const v = rnd();
        if (v < 0.55) continue;
        g.fillStyle = v > 0.94 ? "#f6e3b0" : v > 0.8 ? "#9a7440" : "#24564a";
        g.fillRect(x, y, 14, 4);
      }
    }
    // A routed trace in some light bays: up, 45 degrees across, up again, a pad at each end.
    if (rnd() > 0.45) {
      const xa = x0 + 30 + rnd() * 30, xb = xa + 40;
      const y1 = 380 - rnd() * 120, y2 = y1 - 40;
      g.strokeStyle = "#d4af5a";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(xa, 512); g.lineTo(xa, y1); g.lineTo(xb, y2); g.lineTo(xb, 60);
      g.stroke();
      g.fillStyle = "#f0d58e";
      for (const [px, py] of [[xb, 60], [xa, y1], [xb, y2]] as const) {
        g.beginPath(); g.arc(px, py, 6, 0, Math.PI * 2); g.fill();
      }
    }
  }
  // Bus runs (motif 13): five traces at one pitch climbing the full height of
  // the tile, jogging over at 45 degrees and back, so the bus runs unbroken up
  // the whole tower. Heavy copper outside, gold within.
  for (const b of busBays) {
    g.fillStyle = "#000000";
    g.fillRect(b * bay + 28, 0, bay - 28, 512);
    const cx = b * bay + 58, j = 30;
    const centre: [number, number][] = [[cx, 520], [cx, 360], [cx + j, 330], [cx + j, 200], [cx, 170], [cx, -8]];
    for (let i = 0; i < 5; i++) {
      const outer = i === 0 || i === 4;
      g.strokeStyle = outer ? "#c77c48" : "#d4af5a";
      g.lineWidth = outer ? 4 : 2.2;
      g.beginPath();
      for (const [x, y] of offsetPath(centre, (i - 2) * 9)) g.lineTo(x, y);
      g.stroke();
    }
  }
  // A string course of three traces under a square-wave clock frieze, across the top of the tile.
  for (const [y, col, w] of [[26, "#c77c48", 3], [32, "#d4af5a", 1.6], [38, "#c77c48", 3]] as const) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
  }
  // The frieze along the top of the tile: a square-wave clock rule, a running
  // Greek key (motif 14), or a double key routed as a pair, by facade.
  const style = seed % 3;
  if (style === 0) {
    g.strokeStyle = "#c77c48";
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= 512; x += 32) {
      g.lineTo(x, 6); g.lineTo(x + 16, 6); g.lineTo(x + 16, 18); g.lineTo(x + 32, 18);
    }
    g.stroke();
  } else {
    const key = greekKey(0, 512, 3, 21);
    const lines = style === 1 ? [[0, "#c77c48", 3]] : [[-1.6, "#c77c48", 2.2], [1.6, "#d4af5a", 1.4]];
    for (const [d, col, w] of lines as [number, string, number][]) {
      g.strokeStyle = col;
      g.lineWidth = w;
      g.beginPath();
      for (const [x, y] of offsetPath(key, d)) g.lineTo(x, y);
      g.stroke();
    }
  }
  return tex(c, [1, 1]);
}

/**
 * The city floor beyond the plaza as one great circuit board, one tile = 48 m:
 * faint copper streets on a 12 m grid, a gold trace that jogs at 45 degrees, and
 * a pad at every free end. Used as an emissive map, so the streets glow dimly
 * and fade into the haze.
 */
export function cityTexture(repeat: [number, number]) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#000000";
  g.fillRect(0, 0, 512, 512);
  const u = 512 / 48; // pixels per metre
  // Every street is a bus run of three traces (motif 13).
  for (let k = 0; k < 4; k++)
    for (const [o, col, w] of [[-5, "#3a2210", 2.5], [0, "#4a3a1c", 1.4], [5, "#3a2210", 2.5]] as const) {
      const p = k * 12 * u + 6 + o;
      g.strokeStyle = col;
      g.lineWidth = w;
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 512); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(512, p); g.stroke();
    }
  // Gold traces: along a street, a 45-degree jog across a block, on again.
  g.strokeStyle = "#5c4a22";
  g.lineWidth = 2;
  const pads: [number, number][] = [];
  for (const [x0, y0, len] of [[6, 3, 3], [30, 27, 4], [18, 39, 3]] as const) {
    const a: [number, number] = [x0 * u, y0 * u];
    const b: [number, number] = [a[0] + len * u, a[1]];
    const cc: [number, number] = [b[0] + 4 * u, b[1] + 4 * u];
    const d: [number, number] = [cc[0] + len * u, cc[1]];
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...cc); g.lineTo(...d); g.stroke();
    pads.push(a, d);
  }
  g.fillStyle = "#6e5a2c";
  for (const [x, y] of pads) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
  // A via at every street crossing.
  g.fillStyle = "#4a3418";
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(i * 12 * u + 6, j * 12 * u + 6, 4, 0, Math.PI * 2); g.fill(); }
  return tex(c, repeat);
}

/** A soft round glow for additive sprites and light pools. */
export function glowTexture(inner = "rgba(255,240,200,1)") {
  const [c, g] = canvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, "rgba(255,200,120,0.35)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return tex(c);
}

/**
 * The top of a statue's pad, seen from above with the avenue at the bottom
 * edge: a gold frame, corner vias, and the Spirit's name along the front.
 */
export function padTexture(name: string, allegory: string) {
  const [c, g] = canvas(1024, 1024);
  g.fillStyle = C.panel;
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = C.gold;
  g.lineWidth = 10;
  g.strokeRect(24, 24, 976, 976);
  g.strokeStyle = C.copper;
  g.lineWidth = 3;
  g.strokeRect(48, 48, 928, 928);
  for (const [x, y] of [[48, 48], [976, 48], [48, 976], [976, 976]] as const) {
    g.fillStyle = C.gold;
    g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.obsidian;
    g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
  }
  // Pins along the front edge, like a package's leads.
  g.fillStyle = C.gold;
  for (let x = 120; x <= 904; x += 56) g.fillRect(x - 10, 990, 20, 34);
  g.textAlign = "center";
  g.fillStyle = C.gold;
  g.font = "600 58px 'Josefin Sans', 'Futura', sans-serif";
  g.fillText(spaced(name.toUpperCase()), 512, 900);
  g.fillStyle = C.mint;
  g.font = "400 30px 'IBM Plex Mono', monospace";
  g.fillText(spaced(allegory.toUpperCase()), 512, 950);
  return tex(c);
}

/**
 * The floor marker at the front of the processor (Plaza.tsx, FloorMarker), seen
 * from above with the entrance at the bottom edge: a gold via ring holding a small
 * boot sun (a die, eight short rays ending in pads), and under it the lettering a
 * visitor reads as they walk up. Transparent outside the marks, so the floor shows.
 */
export function markerTexture() {
  const [c, g] = canvas(1024, 1280);
  const cx = 512, cy = 512;
  const disc = (r: number, color: string) => { g.fillStyle = color; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); };
  const ring = (r: number, w: number, color: string) => { g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); };
  disc(470, C.obsidian);
  ring(470, 30, C.gold);
  ring(425, 6, C.copper);
  // The boot sun: eight rays from the die, long and short, each ending in a pad.
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const len = k % 2 ? 300 : 350;
    g.strokeStyle = C.gold; g.lineWidth = 22; g.lineCap = "butt";
    g.beginPath(); g.moveTo(cx + Math.cos(a) * 130, cy + Math.sin(a) * 130); g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.arc(cx + Math.cos(a) * len, cy + Math.sin(a) * len, 28, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.obsidian; g.beginPath(); g.arc(cx + Math.cos(a) * len, cy + Math.sin(a) * len, 11, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = C.gold; g.fillRect(cx - 110, cy - 110, 220, 220);
  g.fillStyle = C.green; g.fillRect(cx - 82, cy - 82, 164, 164);
  g.fillStyle = C.silk; g.fillRect(cx - 30, cy - 30, 60, 60);
  g.textAlign = "center";
  g.fillStyle = C.gold;
  g.font = "600 92px 'Josefin Sans', 'Futura', sans-serif";
  g.fillText(spaced("STAND HERE"), 512, 1130);
  g.fillStyle = C.mint;
  g.font = "400 40px 'IBM Plex Mono', monospace";
  g.fillText(spaced("HIS STAR MEETS THE CORE"), 512, 1205);
  return tex(c);
}

/**
 * The artist's signature, inlaid in gold in the paving at the plaza's front-right
 * corner (Plaza.tsx, Signature), cut into the stone: a dark shadow under the gold.
 */
export function signatureTexture() {
  const [c, g] = canvas(1024, 256);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "112px 'Pinyon Script', 'Snell Roundhand', cursive";
  const text = "E.G. Suchanek, \u201926";
  g.fillStyle = "rgba(0, 0, 0, 0.75)";
  g.fillText(text, 516, 136);
  g.fillStyle = C.gold;
  g.fillText(text, 512, 130);
  return tex(c);
}

/** Letter-spacing for canvas text, which has none of its own in older engines. */
function spaced(s: string) {
  return s.split("").join(" ");
}
