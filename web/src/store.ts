import { DefaultLoadingManager } from "three";
import { create } from "zustand";
import { SPIRITS, type Spirit, type Terrace, TERRACE, withVariant } from "./spirits";
import { CLOCK_ORDER, plazaSky, saveClock, savedClock, type SkyState, type TimeMode } from "./sky/plazaSky";
import { requestPlace, savedPlace, savePlace } from "./sky/location";
import type { Place } from "./sky/sky";

export type Phase = "start" | "walk";

/** The height slider reaches a little above the tallest statue's head. */
export const MAX_ELEVATION = 14;

type State = {
  phase: Phase;
  /** Every model and texture has arrived (or failed): the start screen's Enter waits for it. */
  loaded: boolean;
  /** The Spirit whose plaque is showing. */
  nearId: string | null;
  listOpen: boolean;
  touring: boolean;
  /** How far above eye level the camera floats, in metres, to see the statues' faces. */
  elevation: number;
  /** A request to glide to a Spirit; the nonce lets the same one be asked twice. */
  flyTo: { id: string; nonce: number } | null;
  /** Models that failed to load fall back to their render. */
  failed: Record<string, true>;
  /** The sky's clock mode, and the sky it gives. */
  clock: TimeMode;
  sky: SkyState;
  /** Step to the next clock mode, or set one. */
  cycleClock: () => void;
  setClock: (mode: TimeMode) => void;
  /** Recompute the sky for now (the live clock moves). */
  tickSky: () => void;
  /** The viewer's place for the sky, when they have shared it; otherwise the time zone stands in. */
  place: Place | null;
  setPlace: (p: Place) => void;
  /** The variant shown for each Spirit that has more than one model. */
  variant: Record<string, number>;
  setVariant: (id: string, index: number) => void;
  enter: (tour: boolean) => void;
  /** Leave the plaza for the start screen, back at the entrance. */
  exit: () => void;
  setNear: (id: string | null) => void;
  setListOpen: (open: boolean) => void;
  goTo: (id: string) => void;
  setTouring: (on: boolean) => void;
  markFailed: (id: string) => void;
  setElevation: (m: number) => void;
  /** A 1.75 m figure stands beside every statue, for scale. */
  scaleFigure: boolean;
  toggleScale: () => void;
  /** The About page: what the plaza is and how to get around. */
  aboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;
};

function savedScale(): boolean {
  try {
    if (new URLSearchParams(location.search).has("scale")) return true;
    return localStorage.getItem("plaza.scale") === "1";
  } catch { return false; }
}

const initialClock = savedClock();
const initialPlace = savedPlace();

export const useStore = create<State>((set, get) => ({
  phase: "start",
  loaded: false,
  clock: initialClock,
  sky: plazaSky(initialClock, undefined, initialPlace),
  place: initialPlace,
  setPlace: (p) => { savePlace(p); set((s) => ({ place: p, sky: plazaSky(s.clock, undefined, p) })); },
  cycleClock: () => get().setClock(CLOCK_ORDER[(CLOCK_ORDER.indexOf(get().clock) + 1) % CLOCK_ORDER.length]!),
  setClock: (mode) => { saveClock(mode); set((s) => ({ clock: mode, sky: plazaSky(mode, undefined, s.place) })); },
  tickSky: () => set((s) => ({ sky: plazaSky(s.clock, undefined, s.place) })),
  nearId: null,
  listOpen: false,
  touring: false,
  elevation: 0,
  flyTo: null,
  failed: {},
  variant: {},
  setVariant: (id, index) => set((s) => ({ variant: { ...s.variant, [id]: index } })),
  enter: (tour) => {
    set({ phase: "walk", touring: tour, aboutOpen: false });
    requestPlace(get().place, (p) => get().setPlace(p));
  },
  exit: () => set({ phase: "start", touring: false, listOpen: false, aboutOpen: false, nearId: null, elevation: 0, flyTo: null }),
  setNear: (id) => set((s) => (s.nearId === id ? s : { nearId: id })),
  setListOpen: (open) => set({ listOpen: open }),
  goTo: (id) => set({ flyTo: { id, nonce: Math.random() }, listOpen: false, touring: false, phase: "walk" }),
  setTouring: (on) => set({ touring: on, listOpen: false }),
  markFailed: (id) => set((s) => ({ failed: { ...s.failed, [id]: true } })),
  setElevation: (m) => set({ elevation: Math.max(0, Math.min(MAX_ELEVATION, m)) }),
  aboutOpen: false,
  setAboutOpen: (open) => set({ aboutOpen: open, listOpen: false }),
  scaleFigure: savedScale(),
  toggleScale: () => {
    const on = !get().scaleFigure;
    try { localStorage.setItem("plaza.scale", on ? "1" : "0"); } catch { /* storage blocked */ }
    set({ scaleFigure: on });
  },
}));

/** Movement input shared by the keyboard, the touch stick and the player. */
export const input = {
  keys: new Set<string>(),
  /** Touch stick, each axis in [-1, 1]: x right, y forward. */
  stick: { x: 0, y: 0 },
  /** Look deltas in pixels, consumed each frame. */
  look: { dx: 0, dy: 0 },
  /** Set whenever the viewer steers, so a glide or the tour can yield. */
  touched: 0,
};

/** Let go of everything: keys, stick and look. Called whenever a release may have been lost. */
export function resetInput() {
  input.keys.clear();
  input.stick.x = input.stick.y = 0;
  input.look.dx = input.look.dy = 0;
}

/** Keys typed into a control belong to it, not to the walk. */
export function isInputTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='dialog'], [role='slider']"));
}

// Every loader in the scene uses three's default manager, and all of them start as the scene
// mounts, so its first onLoad is the whole plaza in. A model that fails still counts: it shows its render.
DefaultLoadingManager.onLoad = () => useStore.setState({ loaded: true });

// Clear on every phase change (Enter, Exit), so nothing carries over.
useStore.subscribe((s, prev) => { if (s.phase !== prev.phase) resetInput(); });

/** A Spirit as it stands now, with its chosen variant. */
export function shown(s: Spirit): Spirit {
  return withVariant(s, useStore.getState().variant[s.id]);
}

/** Ad Astra's terrace as it stands now: it grows with him. */
export function currentTerrace(): Terrace {
  const astra = SPIRITS.find((x) => x.id === "astra")!;
  return shown(astra).terrace ?? TERRACE;
}
