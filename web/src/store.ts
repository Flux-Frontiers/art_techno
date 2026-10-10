import { create } from "zustand";

export type Phase = "start" | "walk";

/** The height slider reaches a little above the tallest statue's head. */
export const MAX_ELEVATION = 14;

type State = {
  phase: Phase;
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
};

export const useStore = create<State>((set) => ({
  phase: "start",
  nearId: null,
  listOpen: false,
  touring: false,
  elevation: 0,
  flyTo: null,
  failed: {},
  variant: {},
  setVariant: (id, index) => set((s) => ({ variant: { ...s.variant, [id]: index } })),
  enter: (tour) => set({ phase: "walk", touring: tour }),
  exit: () => set({ phase: "start", touring: false, listOpen: false, nearId: null, elevation: 0, flyTo: null }),
  setNear: (id) => set((s) => (s.nearId === id ? s : { nearId: id })),
  setListOpen: (open) => set({ listOpen: open }),
  goTo: (id) => set({ flyTo: { id, nonce: Math.random() }, listOpen: false, touring: false, phase: "walk" }),
  setTouring: (on) => set({ touring: on, listOpen: false }),
  markFailed: (id) => set((s) => ({ failed: { ...s.failed, [id]: true } })),
  setElevation: (m) => set({ elevation: Math.max(0, Math.min(MAX_ELEVATION, m)) }),
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
