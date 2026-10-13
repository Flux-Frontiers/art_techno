import { useMemo } from "react";
import { canLocate, locate } from "./sky/location";
import { SHOWERS, showerZhr } from "./sky/meteors";
import { planetPositions } from "./sky/planets";
import { bodyAltAz, moonIllumination, moonPhaseName, type Place, solarLongitude, sunPosition, timeZonePlace } from "./sky/sky";
import { useStore } from "./store";

const DAY = 86400000;
const SYNODIC = 29.530589; // days from new moon to new moon
const SUN_PER_DAY = 0.98561; // degrees of solar longitude a day

const date = (t: number) => new Date(t).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

/** The next time the moon reaches a phase (0 new, 0.5 full), refined from the mean month. */
function nextPhase(now: number, target: number): number {
  const ahead = (p: number) => (((target - p) % 1) + 1) % 1;
  let t = now + ahead(moonIllumination(new Date(now)).phase) * SYNODIC * DAY;
  for (let i = 0; i < 4; i++) {
    const off = ((target - moonIllumination(new Date(t)).phase + 1.5) % 1) - 0.5;
    t += off * SYNODIC * DAY;
  }
  return t;
}

const time = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
/** A compass word for a SunCalc azimuth (radians from south, positive west). */
const compass = (az: number) => COMPASS[Math.round(((((az / RAD + 180) % 360) + 360) % 360) / 45) % 8]!;
const RAD = Math.PI / 180;

/**
 * The planets in tonight's dark sky at a place: from now, or from nightfall if it
 * is still day, to dawn (the sun 6 degrees down), each with when it is up (5
 * degrees or more) and where it stands highest.
 */
function planetsTonight(now: number, place: Place) {
  const STEP = 10 * 60000;
  const dark = (t: number) => sunPosition(new Date(t), place).altitude < -6 * RAD;
  let start = now;
  while (!dark(start) && start < now + DAY) start += STEP;
  let end = start;
  while (dark(end + STEP) && end < start + DAY) end += STEP;
  const fromNow = start === now;
  const rows: { name: string; mag: number; text: string }[] = [];
  const hidden: string[] = [];
  const samples: { t: number; ps: ReturnType<typeof planetPositions> }[] = [];
  for (let t = start; t <= end; t += STEP) samples.push({ t, ps: planetPositions(new Date(t)) });
  if (!samples.length) return { rows, hidden: [] as string[] };
  samples[0]!.ps.forEach((p, k) => {
    const up = samples
      .map(({ t, ps }) => ({ t, pos: bodyAltAz(new Date(t), place, ps[k]!.raDeg * RAD, ps[k]!.decDeg * RAD), mag: ps[k]!.mag }))
      .filter((x) => x.pos.altitude > 5 * RAD);
    if (!up.length) { hidden.push(p.name); return; }
    const first = up[0]!, last = up[up.length - 1]!;
    const peak = up.reduce((a, b) => (b.pos.altitude > a.pos.altitude ? b : a));
    const atStart = first.t === start, atEnd = last.t >= end - STEP;
    const high = `highest in the ${compass(peak.pos.azimuth)} around ${time(peak.t)}`;
    const text = atStart && atEnd ? `up all night, ${high}`
      : atStart ? `in the ${compass(first.pos.azimuth)} ${fromNow ? "now" : "after dusk"}, setting around ${time(last.t)}`
      : atEnd ? `rises around ${time(first.t)} in the ${compass(first.pos.azimuth)}, ${high}`
      : `up from ${time(first.t)} to ${time(last.t)}, ${high}`;
    rows.push({ name: p.name, mag: peak.mag, text });
  });
  rows.sort((a, b) => a.mag - b.mag);
  return { rows, hidden };
}

/** Days from now to a solar longitude, signed: negative if it passed within the last half year. */
function daysTo(lonNow: number, lon: number): number {
  return ((((lon - lonNow) % 360) + 540) % 360 - 180) / SUN_PER_DAY;
}

/**
 * Tonight in the plaza's sky, for the About page: the moon's phase and the next
 * full and new moon, the meteor showers active now and coming up, and where to
 * find the pole star. Always the real date, whatever the clock is set to.
 */
export function NightSky() {
  const place = useStore((s) => s.place);
  const setPlace = useStore((s) => s.setPlace);
  const night = useMemo(() => {
    const now = Date.now();
    const at = new Date(now);
    const moon = moonIllumination(at);
    const lon = solarLongitude(at);
    const showers = SHOWERS.map((s) => ({ s, rate: Math.round(showerZhr(s, lon)), days: daysTo(lon, s.peak) }));
    const active = showers.filter((x) => x.rate >= 2).sort((a, b) => b.rate - a.rate);
    const coming = showers
      .filter((x) => x.rate < 2)
      .map((x) => ({ ...x, days: x.days < 0 ? x.days + 365.25 : x.days }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 2);
    return { now, moon, full: nextPhase(now, 0.5), fresh: nextPhase(now, 0), active, coming };
  }, []);
  const where = place ?? timeZonePlace(new Date(night.now));
  const lat = where.lat;
  const planets = useMemo(() => planetsTonight(night.now, where), [night.now, where.lat, where.lon]); // eslint-disable-line react-hooks/exhaustive-deps
  const hemi = (v: number) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? "N" : "S"}`;
  const dark = night.moon.fraction > 0.6 ? " Its light will wash out the fainter meteors." : night.moon.fraction < 0.25 ? " A dark sky: good for meteors." : "";

  return (
    <>
      <h3>Tonight's sky</h3>
      <dl className="about-keys">
        <div>
          <dt>The moon</dt>
          <dd>
            {moonPhaseName(night.moon.phase)}, {Math.round(night.moon.fraction * 100)}% lit.{dark} Full moon {date(night.full)}; new
            moon {date(night.fresh)}.
          </dd>
        </div>
        <div>
          <dt>Meteors</dt>
          <dd>
            {night.active.length
              ? night.active.map(({ s, rate, days }, i) => (
                <span key={s.key}>
                  {i ? " " : ""}<b>{s.name}</b>: up to {rate} an hour under a dark sky,{" "}
                  {Math.abs(days) < 0.6 ? "peaking tonight" : days > 0 ? `peaking ${date(night.now + days * DAY)}` : `past their peak (${date(night.now + days * DAY)})`}.
                </span>
              ))
              : "No major shower is active; a few sporadic meteors an hour still fall."}{" "}
            Coming up: {night.coming.map(({ s, days }) => `the ${s.name}, peaking ${date(night.now + days * DAY)}`).join("; ")}.
            Set the clock to Night or Live to watch; real rates are slow, so add <code>?meteors=10</code> to the
            address for ten times as many, or <code>?meteors=geminids:20</code> to see a shower at its peak.
          </dd>
        </div>
        <div>
          <dt>Planets</dt>
          <dd>
            {planets.rows.length
              ? planets.rows.map((r, i) => (
                <span key={r.name}>{i ? " " : ""}<b>{r.name}</b> (magnitude {r.mag.toFixed(1)}): {r.text}.</span>
              ))
              : "No bright planet is up in tonight's dark sky."}
            {planets.hidden.length > 0 && <> {planets.hidden.join(", ").replace(/, ([^,]*)$/, " and $1")} {planets.hidden.length > 1 ? "are" : "is"} too near the sun to see.</>}
            {" "}In the plaza, west is toward Ad Astra and the Core, east is the entrance behind you, north is on your right
            and south on your left.
          </dd>
        </div>
        <div>
          <dt>Pole star</dt>
          <dd>
            {lat > 0
              ? <>The avenue runs east to west: from the entrance you face west, toward Ad Astra and the Core, so north
                is on your right. Polaris stands due north, {Math.round(lat)}° up, at the height of your latitude; on
                the right-hand side of the ring it may sit just above the tower tops.</>
              : <>The avenue runs east to west, and north is on your right as you face Ad Astra. From the southern
                hemisphere Polaris stays below the horizon.</>}
          </dd>
        </div>
        <div>
          <dt>Your sky</dt>
          <dd>
            {place ? <>For your location, {hemi(place.lat)}.</> : <>For your time zone, at latitude 40° N.</>}{" "}
            {!place && canLocate() && (
              <button className="text-btn" onClick={() => locate(setPlace)}>Use my location</button>
            )}
            {place && <span className="about-note"> Kept only in this browser, rounded to a tenth of a degree.</span>}
          </dd>
        </div>
      </dl>
    </>
  );
}
