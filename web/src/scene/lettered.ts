import { useEffect, useMemo, useState } from "react";
import type { Texture } from "three";

/** Redraw a canvas texture once the web fonts its lettering needs are in. */
export function useLettered(draw: () => Texture, fonts: string[]) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all(fonts.map((f) => document.fonts?.load(f))).catch(() => {}).then(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const map = useMemo(draw, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => map.dispose(), [map]);
  return map;
}
