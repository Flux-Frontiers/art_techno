import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

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
  for (let b = 0; b < 4; b++) {
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
    // A routed trace in some bays: up, 45 degrees across, up again, a pad at each end.
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
  // Square-wave clock frieze along the top of the tile.
  g.strokeStyle = "#c77c48";
  g.lineWidth = 3;
  g.beginPath();
  for (let x = 0; x <= 512; x += 32) {
    g.lineTo(x, 6); g.lineTo(x + 16, 6); g.lineTo(x + 16, 18); g.lineTo(x + 32, 18);
  }
  g.stroke();
  return tex(c, [1, 1]);
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

/** Letter-spacing for canvas text, which has none of its own in older engines. */
function spaced(s: string) {
  return s.split("").join(" ");
}
