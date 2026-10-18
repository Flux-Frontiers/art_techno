import { useEffect, useRef } from "react";
import { useStore } from "./store";

/**
 * The Gilded Circuit, the film: 30 s of the nine Spirits, a light relayed from one to the next.
 * Full screen over the start screen; it plays with sound (the button press allows it), and closes
 * at the end, on Esc or with the close button.
 */
export function Film() {
  const open = useStore((s) => s.filmOpen);
  const setOpen = useStore((s) => s.setFilmOpen);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (open) video.current?.play().catch(() => {});
  }, [open]);
  if (!open) return null;
  const base = import.meta.env.BASE_URL;
  return (
    <div className="film" role="dialog" aria-label="The Gilded Circuit, a film">
      <video
        ref={video}
        className="film-video"
        src={`${base}film/gilded-circuit.mp4`}
        poster={`${base}film/gilded-circuit.jpg`}
        controls
        playsInline
        preload="auto"
        onEnded={() => setOpen(false)}
      />
      <button className="btn btn-small film-close" onClick={() => setOpen(false)} title="Close the film (Esc)">
        Close
      </button>
    </div>
  );
}
