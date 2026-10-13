/**
 * The plaza's sky, from the knowledge_press forest's clock (sky.ts, stars.ts):
 * the real sun, moon and stars for the viewer's time zone, turned so the
 * avenue's far end, behind Ad Astra, faces west. At dusk the sun sets behind
 * him, and the stars wheel over the city as they do over the forest.
 */
import { Color } from "three";
import { effectiveTime, skyState, timeZonePlace, type Place, type SkyState, type TimeMode, type Vec3 } from "./sky";

export type { SkyState, TimeMode };

/** The order the clock button steps through. Dusk first: the plaza as it was designed. */
export const CLOCK_ORDER: TimeMode[] = ["dusk", "night", "dawn", "day", "live"];
export const CLOCK_LABEL: Record<TimeMode, string> = { live: "Live", dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" };

// sky.ts has +x east and +z south. Here west is -z (the far end) and north is +x:
// (x, y, z) -> (-z, y, x).
const R = [0, 0, -1, 0, 1, 0, 1, 0, 0];
const turn = (v: Vec3): Vec3 => [-v[2], v[1], v[0]];

/** The sky for a clock mode, at the viewer's place if known (location.ts), else their time zone's. */
export function plazaSky(mode: TimeMode, now = new Date(), at?: Place | null): SkyState {
  const place = at ?? timeZonePlace(now);
  // The forest's dusk and dawn hold the sun 4 degrees up. The plaza is lit for the
  // moment after: the sun just under the horizon, the glow at its strongest.
  const shift = mode === "dusk" ? 40 : mode === "dawn" ? -40 : 0;
  const s = skyState(new Date(effectiveTime(mode, now, place).valueOf() + shift * 60000), place);
  const m = s.starMatrix;
  const starMatrix: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) starMatrix.push(R[r * 3]! * m[c]! + R[r * 3 + 1]! * m[3 + c]! + R[r * 3 + 2]! * m[6 + c]!);
  return { ...s, sunDir: turn(s.sunDir), moonDir: turn(s.moonDir), light: { ...s.light, dir: turn(s.light.dir) }, starMatrix };
}

/** Night haze and day haze: the fog colour, and the sky at the horizon. */
const HORIZON_NIGHT = new Color("#1a2420");
const HORIZON_DAY = new Color("#b4c8cf");
const ZENITH_NIGHT = new Color("#020504");
const ZENITH_DAY = new Color("#2d62a6");
export const HAZE_NIGHT_DENSITY = 0.0036;
export const HAZE_DAY_DENSITY = 0.0025;

/** The sky's colours for a moment. The horizon is also the fog colour, so the two meet without a seam. */
export function skyColors(sky: SkyState, out = { zenith: new Color(), horizon: new Color() }) {
  out.zenith.copy(ZENITH_NIGHT).lerp(ZENITH_DAY, sky.daylight);
  out.horizon.copy(HORIZON_NIGHT).lerp(HORIZON_DAY, sky.daylight);
  return out;
}

export function hazeDensity(sky: SkyState) {
  return HAZE_NIGHT_DENSITY + (HAZE_DAY_DENSITY - HAZE_NIGHT_DENSITY) * sky.daylight;
}

/** The clock last chosen, kept in this browser. `?clock=` overrides it, for screenshots. */
export function savedClock(): TimeMode {
  const q = typeof location !== "undefined" ? new URLSearchParams(location.search).get("clock") : null;
  if (q && q in CLOCK_LABEL) return q as TimeMode;
  try {
    const v = localStorage.getItem("plaza-clock");
    if (v && v in CLOCK_LABEL) return v as TimeMode;
  } catch { /* storage blocked: use the default */ }
  return "dusk";
}

export function saveClock(mode: TimeMode) {
  try { localStorage.setItem("plaza-clock", mode); } catch { /* not kept; fine */ }
}
