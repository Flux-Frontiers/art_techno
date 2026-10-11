import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { BOUNDS, ENTRANCE, PROCESSOR, SPIRITS, viewpoint, type Spirit } from "../spirits";
import { currentTerrace, input, shown, useStore } from "../store";

const EYE = 1.7;
const WALK = 5.5;
const RUN = 11;
const LOOK = 0.0042;
const GLIDE = 2.2;
const TOUR_HOLD = 7;
/** Order of the guided tour: down the left, back up the right, then Ad Astra. */
const TOUR = ["computation", "knowledge", "innovation", "life", "liberty", "industry", "communication", "power", "astra"];

type Glide = { from: [number, number, number, number]; to: [number, number, number, number]; t: number; id: string };

function aim(px: number, pz: number, tx: number, ty: number, tz: number): [number, number] {
  const dx = tx - px, dz = tz - pz;
  return [Math.atan2(-dx, -dz), Math.atan2(ty - EYE, Math.hypot(dx, dz))];
}

/** Shortest turn from a to b. */
function wrap(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d;
}

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Highest step you can walk up, in metres. */
const STEP = 0.55;

/**
 * Height of the walkable surface under (x, z): the processor dais and its
 * green tier, the terrace and its three steps, otherwise the plaza floor.
 */
function floorAt(x: number, z: number): number {
  const px = Math.abs(x - PROCESSOR.x), pz = Math.abs(z - PROCESSOR.z);
  if (px < 1.5 && pz < 1.5) return 0.95;
  if (px < 3.5 && pz < 3.5) return 0.8;
  if (px < PROCESSOR.half && pz < PROCESSOR.half) return 0.42;
  const T = currentTerrace();
  const tx = Math.abs(x - T.x), tz = z - T.z;
  if (tx < T.halfX && Math.abs(tz) < T.halfZ) return T.height;
  const rise = T.height / T.steps;
  if (tx < T.stairHalf && tz >= T.halfZ && tz < T.halfZ + T.steps * 0.9) {
    // Step 0 is the highest, against the terrace.
    const i = Math.floor((tz - T.halfZ) / 0.9);
    return rise * (T.steps - i);
  }
  return 0;
}

/** Keep the walker off the statue pads and inside the plaza; anything else is a solid wall only if it is too high to step onto. */
function solid(x: number, z: number): [number, number] {
  x = Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, x));
  z = Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, z));
  for (const base of SPIRITS) {
    const s = shown(base);
    const h = s.pad + 0.6;
    const dx = x - s.x, dz = z - s.z;
    if (Math.abs(dx) < h && Math.abs(dz) < h) {
      // Push out along the shallower side.
      if (h - Math.abs(dx) < h - Math.abs(dz)) x = s.x + Math.sign(dx || 1) * h;
      else z = s.z + Math.sign(dz || 1) * h;
    }
  }
  return [x, z];
}

/** Move from (x, z) toward (nx, nz), climbing low steps and sliding along walls. */
function collide(x: number, z: number, nx: number, nz: number): [number, number] {
  const here = floorAt(x, z);
  const ok = (a: number, b: number) => floorAt(a, b) - here <= STEP;
  const [ax, az] = solid(nx, nz);
  if (ok(ax, az)) return [ax, az];
  const [bx, bz] = solid(nx, z);
  if (ok(bx, bz)) return [bx, bz];
  const [cx, cz] = solid(x, nz);
  if (ok(cx, cz)) return [cx, cz];
  return [x, z];
}

function glideTo(s: Spirit, from: [number, number, number, number]): Glide {
  const v = viewpoint(shown(s));
  const [yaw, pitch] = aim(v.x, v.z, s.x, v.lookY, s.z);
  return { from, to: [v.x, v.z, wrap(from[2], yaw), pitch], t: 0, id: s.id };
}

export function Player() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const pose = useRef({ x: ENTRANCE.x, z: ENTRANCE.z, yaw: 0, pitch: 0.12 });
  const glide = useRef<Glide | null>(null);
  const hold = useRef(0);
  const tourIx = useRef(-1);
  const lastFly = useRef<number | null>(null);
  const lastPhase = useRef(useStore.getState().phase);
  const lift = useRef(0);

  // Keyboard and drag-to-look.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      input.keys.add(e.code);
      if (["KeyR", "KeyF", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        input.touched = performance.now();
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.code);
    const blur = () => input.keys.clear();
    const el = gl.domElement;
    let drag: { id: number; x: number; y: number } | null = null;
    const pd = (e: PointerEvent) => {
      if (drag) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const pm = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      input.look.dx += e.clientX - drag.x;
      input.look.dy += e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      input.touched = performance.now();
    };
    const pu = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id) drag = null;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    el.addEventListener("pointerdown", pd);
    el.addEventListener("pointermove", pm);
    el.addEventListener("pointerup", pu);
    el.addEventListener("pointercancel", pu);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      el.removeEventListener("pointerdown", pd);
      el.removeEventListener("pointermove", pm);
      el.removeEventListener("pointerup", pu);
      el.removeEventListener("pointercancel", pu);
    };
  }, [gl]);

  // ?thumb=<spirit-id>: stand at that statue's viewpoint at once, for making
  // plaque thumbnails (scripts/thumbnails.mjs).
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    // ?pose=x,z,yaw,pitch,elevation: stand anywhere, for checking views.
    const at = q.get("pose")?.split(",").map(Number);
    if (at && at.length >= 4 && at.every(Number.isFinite)) {
      Object.assign(pose.current, { x: at[0], z: at[1], yaw: at[2], pitch: at[3] });
      useStore.setState({ phase: "walk", elevation: at[4] ?? 0 });
      // &variant=astra:1 shows a Spirit's other version.
      const [vid, vi] = (q.get("variant") ?? "").split(":");
      if (vid && vi) useStore.getState().setVariant(vid, Number(vi));
      document.documentElement.dataset.thumb = "pose";
      return;
    }
    const id = q.get("thumb");
    const s = SPIRITS.find((x) => x.id === id);
    if (!s) return;
    const v = viewpoint(shown(s));
    const [yaw, pitch] = aim(v.x, v.z, s.x, v.lookY, s.z);
    Object.assign(pose.current, { x: v.x, z: v.z, yaw, pitch });
    useStore.setState({ phase: "walk" });
    // &v=1 shows that Spirit's second variant, and so on.
    const variant = Number(new URLSearchParams(location.search).get("v") ?? 0);
    if (variant) useStore.getState().setVariant(s.id, variant);
    document.documentElement.dataset.thumb = id!;
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useStore.getState();
    const p = pose.current;
    const now = performance.now();

    // Back on the start screen: return to the entrance, facing down the avenue.
    if (st.phase === "start" && lastPhase.current === "walk") {
      Object.assign(p, { x: ENTRANCE.x, z: ENTRANCE.z, yaw: 0, pitch: 0.12 });
      glide.current = null;
      tourIx.current = -1;
      lift.current = floorAt(p.x, p.z);
    }
    lastPhase.current = st.phase;

    // A jump from the list.
    if (st.flyTo && st.flyTo.nonce !== lastFly.current) {
      lastFly.current = st.flyTo.nonce;
      const s = SPIRITS.find((x) => x.id === st.flyTo!.id);
      if (s) glide.current = glideTo(s, [p.x, p.z, p.yaw, p.pitch]);
      tourIx.current = -1;
    }
    // Start or continue the tour.
    if (st.touring && !glide.current && st.phase === "walk") {
      if (tourIx.current < 0 || hold.current <= 0) {
        tourIx.current = (tourIx.current + 1) % TOUR.length;
        const s = SPIRITS.find((x) => x.id === TOUR[tourIx.current])!;
        glide.current = glideTo(s, [p.x, p.z, p.yaw, p.pitch]);
        hold.current = TOUR_HOLD;
      } else hold.current -= Math.min(rawDt, 0.3);
    }
    if (!st.touring) tourIx.current = -1;

    const steering =
      input.keys.size > 0 || Math.abs(input.stick.x) + Math.abs(input.stick.y) > 0.08 || input.look.dx !== 0 || input.look.dy !== 0;
    if (steering && (glide.current || st.touring) && st.phase === "walk") {
      // Any steering takes the controls back.
      glide.current = null;
      if (st.touring) st.setTouring(false);
    }

    if (glide.current) {
      const g = glide.current;
      // Glides keep wall-clock time even when frames are slow.
      g.t = Math.min(1, g.t + Math.min(rawDt, 0.3) / GLIDE);
      const k = ease(g.t);
      p.x = g.from[0] + (g.to[0] - g.from[0]) * k;
      p.z = g.from[1] + (g.to[1] - g.from[1]) * k;
      p.yaw = g.from[2] + (g.to[2] - g.from[2]) * k;
      p.pitch = g.from[3] + (g.to[3] - g.from[3]) * k;
      if (g.t >= 1) glide.current = null;
    } else if (st.phase === "walk") {
      p.yaw -= input.look.dx * LOOK;
      p.pitch = Math.max(-0.6, Math.min(1.0, p.pitch - input.look.dy * LOOK));
      const k = input.keys;
      const run = k.has("ShiftLeft") || k.has("ShiftRight");
      let fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) + input.stick.y;
      let side = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0) + input.stick.x;
      // Arrow keys turn rather than strafe.
      p.yaw += ((k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0)) * 1.8 * dt;
      const mag = Math.hypot(fwd, side);
      if (mag > 1) { fwd /= mag; side /= mag; }
      const v = (run ? RUN : WALK) * dt;
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      const rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
      [p.x, p.z] = collide(p.x, p.z, p.x + (fx * fwd + rx * side) * v, p.z + (fz * fwd + rz * side) * v);
    } else {
      // On the start screen the view drifts gently down the avenue.
      p.yaw = Math.sin(now / 9000) * 0.12;
    }
    input.look.dx = 0;
    input.look.dy = 0;

    // Ease the eye up and down steps rather than snapping.
    // R and F raise and lower the view, like the height slider.
    const rise = (input.keys.has("KeyR") ? 1 : 0) - (input.keys.has("KeyF") ? 1 : 0);
    if (rise) st.setElevation(st.elevation + rise * 6 * dt);
    lift.current += (floorAt(p.x, p.z) + st.elevation - lift.current) * Math.min(1, dt * 6);
    camera.position.set(p.x, EYE + lift.current, p.z);
    camera.rotation.set(p.pitch, p.yaw, 0, "YXZ");

    // The plaque for the Spirit in front of you, near enough to read.
    let best: string | null = null;
    let bestD = Infinity;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    for (const base of SPIRITS) {
      const s = shown(base);
      const dx = s.x - p.x, dz = s.z - p.z;
      const d = Math.hypot(dx, dz);
      // Ad Astra is seen from further back the taller he stands; his card shows from his tour stop and nearer.
      const reach = s.id === "astra" ? 19 * (s.height / 14) + 8 : 21;
      if (d > reach) continue;
      const cos = (dx * fx + dz * fz) / (d || 1);
      if (cos < 0.55) continue;
      // Facing the great figure squarely, he outranks the nearer statues beside the avenue.
      const dist = s.id === "astra" && cos > 0.9 ? 0 : d;
      if (dist < bestD) { bestD = dist; best = s.id; }
    }
    if (st.phase === "walk") st.setNear(best);
  });
  return null;
}
