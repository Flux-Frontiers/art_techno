# Art Techno: Style Rules

*Eric Suchanek, October 2026. The living copy of this guide, with the review of every render, is kept in the Art Techno project; this is the published core.*

## Premise

Art Techno does for the compute age what Art Deco did for the machine age: it turns the infrastructure of its moment into ornament, luxury and myth.

Deco (c. 1910–1939) celebrated the dynamo, the skyscraper, the ocean liner and the airplane. Art Techno celebrates the processor, the data center, fiber, satellites and the network. It keeps Deco's discipline of symmetry, stepping, radiance and precious materials, and swaps its subject matter.

The founding observation: a circuit board is already an Art Deco object. PCB traces are routed only at 0°, 45° and 90°, which is the Deco zigzag. A board's colors are black or green solder mask, copper traces, gold contacts and white silkscreen, which is almost exactly the Deco palette of black, bronze, gold and teal. Art Techno does not impose Deco on technology. It reveals the Deco already in it.

## The Deco grammar

Seven traits recur across the reference set of reliefs, posters, lobbies, doors and glass. Art Techno keeps all seven.

| Trait | What it looks like in Deco | Reference examples |
| --- | --- | --- |
| Radiance | Sunbursts, fans and rays bursting from one point | Rocketeer poster, Mexico City eagle poster, stained-glass fan lamp |
| Stepping | Ziggurat setbacks, stepped corners, nested stepped frames | Bronze elevator doors, "Fifteen" door grille, lobby floor inlay |
| Faceting | The body cut into polished planes; muscle reads as armor | Gold relief panels of workers and the man on the wheel |
| Charged motion | Bolts, zigzags, chevrons, speed lines | Lightning-hurling figure grille, Victory poster |
| Symmetric ascent | Bilateral, vertical, fluted, always climbing | Elevator lobbies, fluted piers |
| Luxury on industry | Brass, bronze and gold on black marble, teal as jewel accent | Rose-gold lobbies, carved elevator doors |
| Borrowed, then cut to a line | Egypt, Aztec, Cubism and Africa reduced to clean geometry | Scarab medallion, eagle and serpent, gazelle and hound |

## The seven rules

These rules are the style. A piece that breaks one should do it on purpose.

1. **The sun is a processor.** Every radiating composition starts from a chip, die or node.
   - Do: rays leave a die and end in pads.
   - Don't: a literal sun or lightbulb at the center.
2. **Route at 0°, 45° and 90°, plus true arcs.** This is PCB routing law and Deco's zigzag at once.
   - Do: bolts built from 45° segments; arcs for fiber, wavefronts and orbits.
   - Don't: freehand curves, splines or arbitrary angles like 30° or 60°.
3. **Every line terminates.** Deco lines end in a point or a gem; Techno lines end in a via, pad or node.
   - Do: a filled pad, ringed via or diamond at each free end.
   - Don't: lines that fade out or bleed off the edge without purpose.
4. **Aliasing is ornament.** Steps are quantized like pixels and layers.
   - Do: setbacks as stacks; corners as pixel staircases; diminishing squares.
   - Don't: smooth gradients standing in for steps.
5. **Light is emitted, not reflected.** Deco glows from polished metal; Techno glows from within.
   - Do: edge-lit lines in black glass; backlit inlay; luminous traces.
   - Don't: neon haze, bloom, lens flare or glitch effects.
6. **The figure is a mesh.** Deco's faceted planes become polygon faces; the hero fuses with the system.
   - Do: hard planar facets with gold-on-black lighting.
   - Don't: green wireframes, visible triangulation or Matrix rain.
7. **Luxury on infrastructure.** Give data centers, fiber and satellites the reverence Deco gave dynamos and skyscrapers.
   - Do: precious materials, monumental scale, symmetry, calm.
   - Don't: grime, dystopia, irony or clutter.

## Geometry and line

Geometry is quantized: a small set of allowed angles, weights and terminations used with total consistency.

- **Angles:** 0°, 45° and 90° only. Arcs are true circular arcs from a single center. Radial rays may take any angle but must share one origin.
- **Line weights:** use three, roughly in a 4 : 1.5 : 0.75 ratio. Heavy is the primary trace, medium the companion trace, hairline the frame or guide.
- **Pairing:** a heavy trace is usually shadowed by a parallel hairline trace, like a differential pair.
- **Terminations:** filled pad (round), ringed via (round with dark core), diamond (for ceremonial ends), or square pin (for stacks and chips).
- **Stepping:** step increments are equal, like a pixel grid. Three to five steps per flight.
- **Symmetry:** bilateral by default. Radial symmetry for medallions and bursts. Asymmetry only for motion, such as a bolt or a striding figure.
- **Frames:** rectangles with 45° clipped corners, like a chip package or an octagonal Deco grille. Double frames use a heavy outer line and a hairline inner line.
- **Grid:** lay out on an 8-unit grid. Fins, pins, flutes and pixels all snap to it.

## Palette and materials

The palette is the circuit board's: dark ground, copper, gold and solder-mask green, with white kept for type.

| Token | Hex | Role | Deco ancestor |
| --- | --- | --- | --- |
| Obsidian | #0B100E | Ground, 60–70% of area | Black marble |
| Panel | #121A17 | Inset fields and frames | Dark lacquer |
| Copper | #C77C48 | Primary traces, fins, structure | Bronze |
| Gold | #D4AF5A | Pads, frames, highlights, type | Gilding, brass |
| Solder green | #2F8F74 | Dies, nodes, jewel accents, under 10% of area | Jade and teal |
| Mint | #7FBFA8 | Secondary labels, glints | Patina |
| Silkscreen | #EDE6D3 | Lettering, fine markings | Ivory, travertine |

Materials translate one for one:

| Deco material | Art Techno material |
| --- | --- |
| Black marble | Black glass, OLED black, anodized aluminum |
| Brass and bronze inlay | Copper inlay, exposed copper traces |
| Gold leaf | Gold-plated contacts and pins |
| Frosted glass panels | Edge-lit acrylic, backlit diffusers |
| Stained glass | Dichroic glass, wafer iridescence |
| Travertine and limestone | Brushed titanium, ceramic substrate |
| Wrought-iron grilles | Heat-sink fins, perforated mesh |

**Light-ground exception for ironwork.** Gates, grilles and other cut-metal silhouettes may sit on a light ground, Silkscreen #EDE6D3 or pale stone #D9D0BA, so the metal reads as a dark silhouette. The iron is near-black #151B18; copper and gold stay as accents at pads, vias and inlay, and green stays under 10% of area. Everything else keeps the obsidian ground.

## Motif lexicon

Twelve core motifs, each a direct transposition of a Deco element. New motifs should follow the same method: keep the Deco form, swap in a compute subject.

| # | Motif | Deco source | Construction |
| --- | --- | --- | --- |
| 1 | Boot sun | Sunburst crest | Rays from a chip on a horizon line, alternating long and short, each ending in a pad |
| 2 | Trace bolt | Lightning bolt, zigzag | Heavy copper bolt of 45° segments shadowed by a hairline gold trace; vias at both ends |
| 3 | Stack ziggurat | Stepped ziggurat | Five layers alternating green and black, pin row beneath, antenna and pad on top |
| 4 | Clock-wave rule | Chevron rule | Square wave between two hairlines, diamond terminals at each end |
| 5 | Heat-sink pier | Fluted pier | Vertical fins as flutes, stepped capital and plinth |
| 6 | Die lozenge | Lozenge and gem | Double diamond frame around a square die with pin ticks on four sides |
| 7 | Winged die | Scarab medallion | Chip as body, swept fins as wings, copper disk above |
| 8 | Iris porthole | Porthole in rounded square | Camera iris of six blades inside a rounded-square frame |
| 9 | Bitstream whisker | Speed lines | Converging lines dashed in irregular bit patterns, ending at a diamond |
| 10 | Fiber fountain | Frozen fountain | Arcs spraying from a stepped base, each fiber ending in a gold point |
| 11 | Graph fan | Half-fan | Edges radiating from a root node to two arcs of nodes, cross-linked |
| 12 | Pixel corner | Stepped corner | Nested corner rules with a diagonal of shrinking pixels |

Candidates for the next round: satellite fin (from aircraft fin), wafer shell (from scallop shell), signal palm (from palm leaf), and helix scroll (from volute scroll).

## The figure

The Art Techno hero is the operator fused with the system, drawn as hard polished facets, never as a wireframe.

- **Faceting:** keep Deco's planar musculature from the gold relief panels. Planes are large, flat and few, about 8 to 12 per limb. Lighting comes from one side so facets read as gold against shadow.
- **Fusion:** the body carries the machine. Shoulders become heat-sink fins, the spine a bus of parallel traces, joints become vias, the helmet an iris or sensor housing.
- **Pose:** monumental and purposeful. The striding, lifting and hurling poses of the references carry over: lifting a die like a sun, routing a trace like a spear, holding up a stack.
- **Face:** an idealized human face, calm, in the manner of Deco statuary, with no expression beyond resolve. The human face is key: helmets, visors and masks push the figure toward a robot. A green band across the brow or eyes is the preferred tech accent.
- **Scale:** figures are colossal against the architecture, as in the Rocketeer and Victory posters.
- **Avoid:** cyborg gore, exposed wiring, robots with faces, and visible polygon triangulation.

## Typography and lettering

Lettering is geometric Deco capitals with chip-silkscreen discipline: wide, tracked, monoline and precise.

- **Display:** geometric sans capitals with Deco quirks, such as a high-waisted E, a pointed A and a circular O. Track wide, about +150 to +250.
- **Stencil cuts:** small notches in strokes, as if etched in silkscreen or cut from copper. Use one cut per letter at most.
- **Secondary text:** a monospaced or technical face in small caps for dates, part numbers and captions, like the markings on a chip package.
- **Numerals:** treat them as part numbers. A date may read like a die marking, such as "2026 · 10 · 09".
- **Placement:** symmetric bands at top and bottom, as in the Rocketeer and Victory posters, or vertical bands down the sides, as in the Mexico City poster.
- **Color:** gold or silkscreen white on obsidian. Never copper for body text; it lacks contrast.
- **Avoid:** pixel fonts, glitch type, futuristic display faces with sci-fi clichés.

## Composition patterns

Art Techno uses Deco's proven layouts, re-skinned.

**Posters**

- **Ascension:** a central faceted figure rising above a skyline of server stacks, lit by a boot sun behind. Title band on top, date band on bottom. After the Rocketeer poster.
- **Emblem over city:** a winged die or graph fan presiding over a stepped skyline of data-center towers, with text running around the border. After the Mexico City poster.
- **Labor panel:** a single figure working a machine, cropped tight in a clipped-corner frame. After the gold relief panels.

**Architecture and interiors**

- Lobby walls of black glass with copper trace inlay rising in stepped, symmetric patterns, as in the elevator-lobby references.
- Elevator doors with nested stepped traces ending in gold pads.
- Grilles and gates built from heat-sink fins and trace bolts instead of scrolls.

**Objects**

- A fan lamp of dichroic glass rising from a chip-shaped base, after the stained-glass lamp.
- Device housings with fluted heat-sink sides and a die-lozenge badge.

## Anti-patterns

Art Techno fails when it drifts into one of four neighboring styles.

| Drift | Symptoms | Fix |
| --- | --- | --- |
| Cyberpunk | Neon pink and cyan, rain, grime, dystopia, glitch | Restore calm, symmetry and precious materials; emit light, don't haze it |
| Generic tech | Blue gradients, hexagon grids, circuit textures as wallpaper | Use traces as structure and ornament, never as background texture |
| Retro-futurism | Rayguns, fins, chrome bubbles, 1950s optimism | Subjects must be real present-day infrastructure |
| Deco pastiche | Plain Deco with a chip pasted on | Every motif must be rebuilt from a compute subject, not decorated with one |

Two quick tests: if it would fit a 1980s sci-fi film, it has drifted toward cyberpunk. If removing the tech subject leaves pure Deco, it is pastiche.

## Checklist

Run every piece through these ten checks before calling it Art Techno.

- [ ] One clear origin point radiates the composition, and it is a chip, die or node
- [ ] All lines run at 0°, 45° or 90°, or are true arcs or radial rays
- [ ] Every free line end has a pad, via, diamond or pin
- [ ] Steps are equal and quantized, three to five per flight
- [ ] Bilateral or radial symmetry, broken only for motion
- [ ] Palette stays within the seven tokens on an obsidian ground (light ground only for ironwork); green covers under 10% of area
- [ ] Light reads as emitted from lines, with no haze, bloom or glitch
- [ ] Any figure is faceted, monumental and fused with the machine
- [ ] Lettering is wide-tracked geometric capitals with part-number secondary text
- [ ] It passes both drift tests: not cyberpunk, not Deco pastiche

