import { useEffect, useRef, useState } from "react";
import { SPIRITS, STATUS_LABEL, statusOf, type Spirit } from "./spirits";
import { input, MAX_ELEVATION, useStore } from "./store";

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
          {placed === SPIRITS.length ? (
            <span>All {SPIRITS.length} Spirits placed in 3D</span>
          ) : (
            <>
              <span>{placed} of {SPIRITS.length} placed in 3D</span>
              <span>{rendered} rendered</span>
              <span>{SPIRITS.length - rendered} planned</span>
            </>
          )}
        </p>
        {placed < SPIRITS.length && <p className="note">Framed renders stand in for each statue until its 3D model is placed.</p>}
      </div>
    </div>
  );
}

/** Buttons to switch between a Spirit's alternative models in place. */
function Variants({ s }: { s: Spirit }) {
  const index = useStore((st) => st.variant[s.id] ?? 0);
  const setVariant = useStore((st) => st.setVariant);
  return (
    <div className="variants" role="group" aria-label="Compare versions">
      {s.variants!.map((v, i) => (
        <button key={v.label} className={`variant ${i === index ? "variant-on" : ""}`} aria-pressed={i === index} onClick={() => setVariant(s.id, i)}>
          {v.label}
        </button>
      ))}
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
          {s.variants && s.variants.length > 1 ? <Variants s={s} /> : null}
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

/** A vertical slider on the right edge that lifts the view up the statues. */
function HeightSlider() {
  const elevation = useStore((s) => s.elevation);
  const setElevation = useStore((s) => s.setElevation);
  const track = useRef<HTMLDivElement>(null);
  const fromPointer = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    const t = 1 - (e.clientY - r.top) / r.height;
    setElevation(Math.max(0, Math.min(1, t)) * MAX_ELEVATION);
  };
  const pct = (elevation / MAX_ELEVATION) * 100;
  return (
    <div className="height" aria-label="View height">
      <span className="height-label">{Math.round(1.7 + elevation)} m</span>
      <div
        ref={track}
        className="height-track"
        role="slider"
        tabIndex={0}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={MAX_ELEVATION}
        aria-valuenow={Math.round(elevation)}
        aria-valuetext={`Eye height ${Math.round(1.7 + elevation)} metres`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
        onPointerMove={(e) => (e.buttons || e.pointerType === "touch") && fromPointer(e)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { setElevation(elevation + 1); e.preventDefault(); }
          if (e.key === "ArrowDown") { setElevation(elevation - 1); e.preventDefault(); }
        }}
      >
        <div className="height-fill" style={{ height: `${pct}%` }} />
        <div className="height-thumb" style={{ bottom: `${pct}%` }} />
      </div>
      <button className="height-reset" onClick={() => setElevation(0)} aria-label="Back to eye level">↧</button>
    </div>
  );
}

export function HUD() {
  const phase = useStore((s) => s.phase);
  const listOpen = useStore((s) => s.listOpen);
  const setListOpen = useStore((s) => s.setListOpen);
  const touring = useStore((s) => s.touring);
  const setTouring = useStore((s) => s.setTouring);
  const exit = useStore((s) => s.exit);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (useStore.getState().phase !== "walk") return;
      if (e.code === "KeyL") setListOpen(!useStore.getState().listOpen);
      if (e.code === "KeyT") setTouring(!useStore.getState().touring);
      // Escape closes the list, or with the list closed, leaves for the start screen.
      if (e.code === "Escape") { if (useStore.getState().listOpen) setListOpen(false); else exit(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setListOpen, setTouring, exit]);
  if (["thumb", "pose"].some((k) => new URLSearchParams(location.search).has(k))) return null;
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
          <button id="exit" className="btn btn-small" onClick={exit}>
            Exit
          </button>
        </div>
      </header>
      <List />
      <Plaque />
      {coarse && <Stick />}
      <HeightSlider />
    </div>
  );
}
