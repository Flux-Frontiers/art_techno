import { useEffect, useRef, useState } from "react";
import { SPIRITS, STATUS_LABEL, statusOf, type Spirit } from "./spirits";
import { input, useStore } from "./store";

const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

function Chip({ s }: { s: Spirit }) {
  const failed = useStore((st) => !!st.failed[s.id]);
  const status = failed ? "render" : statusOf(s);
  return <span className={`chip chip-${status}`}>{STATUS_LABEL[status]}</span>;
}

function Start() {
  const enter = useStore((s) => s.enter);
  const placed = SPIRITS.filter((s) => s.model).length;
  const rendered = SPIRITS.filter((s) => s.render).length;
  return (
    <div className="start">
      <div className="start-card">
        <p className="eyebrow">Art Techno</p>
        <h1 className="title">Spirits Plaza</h1>
        <p className="lede">Nine allegorical statues for the compute age, set on a plaza laid out like a circuit board.</p>
        <div className="actions">
          <button id="enter-walk" className="btn btn-primary" onClick={() => enter(false)}>Walk in</button>
          <button id="enter-tour" className="btn" onClick={() => enter(true)}>Take the tour</button>
        </div>
        <p className="controls">
          {coarse ? "Left thumb to walk · drag anywhere to look" : "WASD to walk · drag to look · Shift to hurry"}
        </p>
        <p className="tally">
          <span>{placed} of 9 placed in 3D</span>
          <span>{rendered} rendered</span>
          <span>{9 - rendered} planned</span>
        </p>
        <p className="note">Framed renders stand in for each statue until its 3D model is placed.</p>
      </div>
    </div>
  );
}

function Plaque() {
  const nearId = useStore((s) => s.nearId);
  const [open, setOpen] = useState(!coarse);
  const s = SPIRITS.find((x) => x.id === nearId);
  if (!s) return null;
  return (
    <section className="plaque" aria-live="polite">
      <div className="plaque-head">
        {s.render ? <img className="thumb" src={s.render} alt="" /> : <div className="thumb thumb-empty" />}
        <div className="plaque-titles">
          <h2>{s.name}</h2>
          <p className="allegory">{s.allegory}</p>
          <Chip s={s} />
        </div>
        <button className="icon-btn" aria-expanded={open} aria-label={open ? "Hide description" : "Show description"} onClick={() => setOpen(!open)}>
          {open ? "−" : "+"}
        </button>
      </div>
      {open && (
        <div className="plaque-body">
          <p>{s.body}</p>
          <p className="attr"><span>Attribute</span>{s.attribute}</p>
        </div>
      )}
    </section>
  );
}

function List() {
  const open = useStore((s) => s.listOpen);
  const setOpen = useStore((s) => s.setListOpen);
  const goTo = useStore((s) => s.goTo);
  if (!open) return null;
  return (
    <aside className="list" aria-label="Spirits">
      <div className="list-head">
        <h2>The Spirits</h2>
        <button className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>×</button>
      </div>
      <ol>
        {SPIRITS.map((s) => (
          <li key={s.id}>
            <button className="list-item" onClick={() => goTo(s.id)}>
              <span className="li-name">{s.name}</span>
              <span className="li-meta">{s.allegory}</span>
              <Chip s={s} />
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

/** Thumb stick for phones: drag inside the ring to walk. */
function Stick() {
  const ring = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  useEffect(() => () => { input.stick.x = 0; input.stick.y = 0; }, []);
  const R = 46;
  const move = (e: React.PointerEvent) => {
    const r = ring.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; }
    setKnob({ x: dx, y: dy });
    input.stick.x = dx / R;
    input.stick.y = -dy / R;
    input.touched = performance.now();
  };
  const end = () => {
    setKnob({ x: 0, y: 0 });
    input.stick.x = 0;
    input.stick.y = 0;
  };
  return (
    <div
      ref={ring}
      className="stick"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => e.buttons || e.pointerType === "touch" ? move(e) : undefined}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Walk"
      role="application"
    >
      <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

export function HUD() {
  const phase = useStore((s) => s.phase);
  const listOpen = useStore((s) => s.listOpen);
  const setListOpen = useStore((s) => s.setListOpen);
  const touring = useStore((s) => s.touring);
  const setTouring = useStore((s) => s.setTouring);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (useStore.getState().phase !== "walk") return;
      if (e.code === "KeyL") setListOpen(!useStore.getState().listOpen);
      if (e.code === "KeyT") setTouring(!useStore.getState().touring);
      if (e.code === "Escape") setListOpen(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setListOpen, setTouring]);
  if (phase === "start") return <Start />;
  return (
    <div className="hud">
      <header className="bar">
        <span className="wordmark">Spirits Plaza</span>
        <div className="bar-actions">
          <button id="tour-toggle" className={`btn btn-small ${touring ? "btn-on" : ""}`} aria-pressed={touring} onClick={() => setTouring(!touring)}>
            {touring ? "Stop tour" : "Tour"}
          </button>
          <button id="list-toggle" className="btn btn-small" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
            Spirits
          </button>
        </div>
      </header>
      <List />
      <Plaque />
      {coarse && <Stick />}
    </div>
  );
}
