import { useMemo } from "react";
import { canLocate, locate } from "./sky/location";
import { SHOWERS, showerZhr } from "./sky/meteors";
import { moonIllumination, moonPhaseName, solarLongitude, timeZonePlace } from "./sky/sky";
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
  const lat = (place ?? timeZonePlace(new Date(night.now))).lat;
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
