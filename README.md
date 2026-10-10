# Art Techno

Art Techno does for the computer age what Art Deco did for the machine age:
monumental, symmetrical and luxurious, with circuit-board precision in place of
the machine. This repository holds the work that is meant to be built and
shared: the **Spirits Plaza** web scene, the image prompts behind each statue,
and the web-ready 3D models.

The style rules, design history and reviews of every render live in the
*Art Techno: Style Rules* doc.

## The seven rules

1. The sun is a processor.
2. Routing at 0°, 45° and 90°.
3. Every line ends in a pad or via.
4. Aliasing is ornament.
5. Light is emitted, not reflected.
6. The figure is a faceted mesh with an idealized human face.
7. Luxury on infrastructure.

Palette: obsidian `#0B100E`, panel `#121A17`, copper `#C77C48`, gold `#D4AF5A`,
solder green `#2F8F74` (under a tenth of any composition), mint `#7FBFA8`,
silkscreen `#EDE6D3`.

## The Spirits

Nine allegorical statues, each a Deco virtue retold for the compute age.

| Spirit | Allegory | Status |
| --- | --- | --- |
| Spirit of Computation | Thought and calculation | Rendered and 3D |
| Spirit of Knowledge | Wisdom | Rendered and 3D |
| Ad Astra per Aspera | Aspiration | Rendered and 3D |
| Spirit of Innovation (v3, variant A) | Invention | Rendered and 3D |
| Spirit of Life | Biology meets computation | Rendered and 3D |
| Spirit of Power | Energy | Rendered and 3D |
| Spirit of Communication | Connection | Planned |
| Spirit of Industry | Labor, the Builder | Planned |
| Spirit of Liberty | Freedom | Planned |

Each statue goes from a Grok render (prompt in [`prompts/spirits`](prompts/spirits))
to a Meshy image-to-3D model, exported as GLB at 12 m tall.

## Layout

| Path | What it is |
| --- | --- |
| [`web/`](web) | Spirits Plaza: a walk-through 3D plaza, built like the Knowledge Press forest (Vite, React, react-three-fiber, three.js). |
| [`prompts/`](prompts) | The Grok prompts, each under 4,000 characters. `history/` keeps retired rounds. |

## Adding a statue to the plaza

```bash
cd web
npm install
scripts/prep-model.sh ~/Downloads/Meshy_AI_Spirit_of_Life_texture.glb life
```

That writes `web/public/models/life.glb` (textures to 2048 WebP, geometry
meshopt-compressed; a 24 MB Meshy export comes out near 2 MB). Then add
`model: "models/life.glb"` to that Spirit in `web/src/spirits.ts`.
