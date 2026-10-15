import { useEffect, useRef, useState } from "react";
import { About } from "./About";
import { SPIRITS, STATUS_LABEL, statusOf, type Spirit, withVariant } from "./spirits";
import { CLOCK_LABEL } from "./sky/plazaSky";
import { input, isInputTarget, MAX_ELEVATION, useStore } from "./store";

const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

function Chip({ s }: { s: Spirit }) {
  const failed = useStore((st) => !!st.failed[s.id]);
  const status = failed ? "render" : statusOf(s);
  return <span className={`chip chip-${status}`}>{STATUS_LABEL[status]}</span>;
}

function Start() {
  const enter = useStore((s) => s.enter);
  const setAbout = useStore((s) => s.setAboutOpen);
  const loaded = useStore((s) => s.loaded);
  return (
    <div className="start">
      <div className="start-card">
        <p className="eyebrow"><img className="mark" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />Art Techno</p>
        <h1 className="title"><span className="title-the">The</span> Gilded Circuit</h1>
        <p className="lede">Nine allegorical statues for the compute age, set on a plaza laid out like a circuit board.</p>
        <div className="actions">
          <button id="enter-walk" className="btn btn-primary" onClick={() => enter(false)} disabled={!loaded}>{loaded ? "Enter" : "Loading the plaza"}</button>
          <button id="enter-tour" className="btn" onClick={() => enter(true)} disabled={!loaded}>Take the tour</button>
          <button id="about" className="btn" onClick={() => setAbout(true)}>About</button>
        </div>
        {coarse ? (
          <p className="controls">Left thumb to walk · drag anywhere to look · the slider raises your view</p>
        ) : (
          <p className="controls keys-row">
            <span><kbd>W A S D</kbd> walk</span>
            <span><kbd>Drag</kbd> look</span>
            <span><kbd>Shift</kbd> hurry</span>
            <span><kbd>R</kbd><kbd>F</kbd> rise</span>
            <span><kbd>L</kbd> Spirits</span>
            <span><kbd>T</kbd> tour</span>
            <span><kbd>C</kbd> time of day</span>
            <span><kbd>H</kbd> person for scale</span>
            <span><kbd>A</kbd> about</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** Shows or hides the 1.75 m figure that stands beside every statue. */
function ScaleToggle() {
  const on = useStore((st) => st.scaleFigure);
  const toggle = useStore((st) => st.toggleScale);
  return (
    <div className="variants">
      <button className={`variant ${on ? "variant-on" : ""}`} aria-pressed={on} onClick={toggle} title="A 1.75 m person beside each statue (H)">
        Person for scale
      </button>
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
  const variant = useStore((st) => (nearId ? st.variant[nearId] : undefined));
  const [open, setOpen] = useState(!coarse);
  const base = SPIRITS.find((x) => x.id === nearId);
  // The card follows the variant standing on the pad: its render and its own text.
  const s = base ? withVariant(base, variant) : undefined;
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
          <ScaleToggle />
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
  const pid = useRef<number | null>(null);
  const R = 46;
  // iOS can swallow the release (a touch taken by an edge swipe, the app
  // backgrounded), which left the walk running and the stick ignoring new
  // touches. As in knowledge_press, the window watches too: the owning pointer
  // ending anywhere, every finger lifting, or the page losing focus lets go.
  useEffect(() => {
    const release = () => {
      if (pid.current === null) return;
      pid.current = null;
      input.stick.x = input.stick.y = 0;
      setKnob({ x: 0, y: 0 });
    };
    const onPointerEnd = (e: PointerEvent) => { if (e.pointerId === pid.current) release(); };
    const onTouchEnd = (e: TouchEvent) => { if (e.touches.length === 0) release(); };
    const onHidden = () => { if (document.hidden) release(); };
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onHidden);
      input.stick.x = input.stick.y = 0;
    };
  }, []);
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
  const end = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    setKnob({ x: 0, y: 0 });
    input.stick.x = 0;
    input.stick.y = 0;
  };
  return (
    <div
      ref={ring}
      className="stick"
      onPointerDown={(e) => {
        // A new touch always takes the stick, so a release that never arrived cannot leave it dead.
        pid.current = e.pointerId;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
        move(e);
      }}
      onPointerMove={(e) => { if (pid.current === e.pointerId) move(e); }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
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
  const clock = useStore((s) => s.clock);
  const cycleClock = useStore((s) => s.cycleClock);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const st = useStore.getState();
      // Escape closes About, then the list; with nothing open, leaves the plaza for the start screen.
      if (e.code === "Escape") {
        if (st.aboutOpen) st.setAboutOpen(false);
        else if (st.phase !== "walk") return;
        else if (st.listOpen) setListOpen(false);
        else exit();
        return;
      }
      // Shortcuts never fire from a held key repeating or a modifier combo.
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      // About: A on the start screen (in the plaza A walks), ? anywhere.
      if (e.key === "?" || (st.phase === "start" && e.code === "KeyA")) { st.setAboutOpen(!st.aboutOpen); return; }
      if (st.phase !== "walk" || st.aboutOpen || isInputTarget(e.target)) return;
      if (e.code === "KeyL") setListOpen(!useStore.getState().listOpen);
      if (e.code === "KeyT") setTouring(!useStore.getState().touring);
      if (e.code === "KeyC") useStore.getState().cycleClock();
      if (e.code === "KeyH") useStore.getState().toggleScale();
    };
    // A tapped button gives focus back, as in knowledge_press: left focused it
    // stays lit as if stuck, takes the walk keys, and Space or Enter fires it again.
    const unfocus = (e: PointerEvent) => {
      const b = (e.target as HTMLElement | null)?.closest?.("button");
      if (b) b.blur();
    };
    window.addEventListener("keydown", k);
    document.addEventListener("pointerup", unfocus);
    return () => {
      window.removeEventListener("keydown", k);
      document.removeEventListener("pointerup", unfocus);
    };
  }, [setListOpen, setTouring, exit]);
  if (["thumb", "pose"].some((k) => new URLSearchParams(location.search).has(k))) return null;
  if (phase === "start") return <><Start /><About /></>;
  return (
    <div className="hud">
      <header className="bar">
        <span className="wordmark"><img className="mark mark-small" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />The Gilded Circuit</span>
        <div className="bar-actions">
          <button id="clock" className="btn btn-small" onClick={cycleClock} title="Time of day (C)" aria-label={`Time of day: ${CLOCK_LABEL[clock]}. Change`}>
            {CLOCK_LABEL[clock]}
          </button>
          <button id="tour-toggle" className={`btn btn-small ${touring ? "btn-on" : ""}`} aria-pressed={touring} onClick={() => setTouring(!touring)}>
            {touring ? "Stop tour" : "Tour"}
          </button>
          <button id="list-toggle" className="btn btn-small" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
            Spirits
          </button>
          <button id="about-toggle" className="btn btn-small" title="About the plaza (?)" onClick={() => useStore.getState().setAboutOpen(true)}>
            About
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
      <About />
    </div>
  );
}
