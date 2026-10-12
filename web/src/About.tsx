import { useEffect, useRef } from "react";
import { SPIRITS } from "./spirits";
import { useStore } from "./store";

const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

/** Every control, keyboard first; the phone gets its own list. */
const KEYS: [string, string][] = [
  ["W A S D", "walk"],
  ["← →", "turn"],
  ["Drag", "look around"],
  ["Shift", "hurry"],
  ["R / F", "raise or lower your view, up to the statues' faces (or the slider on the right)"],
  ["L", "the Spirits list: glide to any statue"],
  ["T", "start or stop the guided tour"],
  ["C", "time of day: Dusk, Night, Dawn, Day, or Live (your own sky, now)"],
  ["H", "a 1.75 m person beside every statue, for scale"],
  ["?", "this page (A on the start screen)"],
  ["Esc", "close a panel; with none open, back to the start screen"],
];

const TOUCH: [string, string][] = [
  ["Ring, bottom left", "walk"],
  ["Drag anywhere else", "look around"],
  ["Slider, right edge", "raise or lower your view"],
  ["Live / Day / …", "time of day"],
  ["Person for scale", "on a statue's card: a 1.75 m figure beside every statue"],
];

/**
 * What the plaza is, what is in it, and how to get around: the long form of
 * the start screen. Opened with A on the start screen, ? in the plaza, or the
 * About buttons.
 */
export function About() {
  const open = useStore((s) => s.aboutOpen);
  const setOpen = useStore((s) => s.setAboutOpen);
  const close = useRef<HTMLButtonElement>(null);
  // Focus moves into the page, so the walk keys rest while it is open.
  useEffect(() => { if (open) close.current?.focus(); }, [open]);
  if (!open) return null;
  return (
    <div className="about-scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="about" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <header className="about-head">
          <div>
            <p className="eyebrow">Art Techno</p>
            <h2 id="about-title">About the plaza</h2>
          </div>
          <button ref={close} className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        </header>

        <div className="about-body">
          <p className="about-lede">
            Art Techno is Art Deco rebuilt for the compute age. Where Deco celebrated and revered the dynamo,
            the airliner and the skyscraper, Art Techno gives the same devotion to the chip, the data centre and
            the satellite. The Gilded Circuit is its first public square: nine allegorical statues on a floor laid
            out like a circuit board.
          </p>

          <h3>The Spirits</h3>
          <p>
            Eight Spirits line the avenue in facing pairs, each on a chip-package pad with a three-tier
            granite plinth. Ad Astra per Aspera closes the avenue from a raised terrace, 24 m tall, twice
            the others: through hardship to the stars, the plaza's message. Behind him rises the Digital
            Pantheon, the city's great tower, 172 m of stepped server layers under a winged die and a
            boot-sun crown, two armoured guardians at its door. From the processor at the plaza's heart, his
            star sits on its winged chip. Walk up to any statue and its card tells you
            what it stands for.
          </p>
          <ul className="about-spirits">
            {SPIRITS.map((s) => (
              <li key={s.id}><span>{s.name}</span><em>{s.allegory}</em></li>
            ))}
          </ul>

          <h3>The rules of the style</h3>
          <ol className="about-rules">
            <li><b>The sun is a processor.</b> Every sunburst radiates from a chip: see the emerald die at the heart of each tower's crown.</li>
            <li><b>Route at 0°, 45° and 90°, plus true arcs.</b> Circuit routing and Deco's zigzag are the same line.</li>
            <li><b>Every line terminates</b> in a via, a pad or a node, as Deco lines end in a point or a gem.</li>
            <li><b>Aliasing is ornament.</b> Steps are quantized like pixels: the setbacks, the plinths, the terrace.</li>
            <li><b>Light is emitted, not reflected.</b> Windows, dies and flames glow from within.</li>
            <li><b>The figure is a mesh.</b> Deco's faceted planes become polygon faces.</li>
            <li><b>Luxury on infrastructure.</b> Server halls and launch pads get the gold.</li>
          </ol>
          <p>
            Look for the motifs: buses of parallel traces running down the facades, across the floor and up the
            terrace risers; Greek-key friezes routed as a single trace, sometimes doubled; heat-sink flutes,
            stacked ziggurats and boot-sun crowns on the towers.
          </p>

          <h3>The sky</h3>
          <p>
            The sky is real astronomy: the sun, the moon in its true phase, the stars of the Yale Bright
            Star Catalogue, and meteors at tonight's real rates, each shower in season falling from its radiant
            among the stars. It is turned so the sun sets behind Ad Astra. Choose Dusk, Night, Dawn or Day, or Live
            for your own sky right now. After dark the statues are carried by floodlamps at their feet.
          </p>
          <p>
            Every so often a craft crosses overhead: the <b>Packet Clipper</b>, an airliner of 45° wings and
            lift fans; <b>The Cloud</b>, an airship slung with a lit server rack; and <b>Uplink</b>, a slender
            reusable rocket climbing from a pad beyond the city on a faceted flame.
          </p>

          <h3>Getting around</h3>
          <dl className="about-keys">
            {(coarse ? TOUCH : KEYS).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          {!coarse && (
            <p className="about-note">On a phone: the ring at bottom left walks, a drag anywhere else looks.</p>
          )}

          <h3>How it was made</h3>
          <p>
            Each Spirit and craft was drawn to the style's rules, rendered in Grok, and turned into a 3D model in
            Meshy; the plinths, city, floor and sky are built in code with three.js and React. The astronomy is
            SunCalc's; the stars are the Yale Bright Star Catalogue (Hoffleit &amp; Warren, 1991); the moon is
            NASA's Lunar Reconnaissance Orbiter colour mosaic.
          </p>
        </div>
      </section>
    </div>
  );
}
