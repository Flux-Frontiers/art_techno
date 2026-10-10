# Art Techno

Art Techno does for the computer age what Art Deco did for the machine age:
monumental, symmetrical and luxurious, with circuit-board precision in place of
the machine. This repository holds the work that is meant to be built and
shared: the **Spirits Plaza** web scene and the web-ready 3D models.

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

Each statue goes from a Grok render to a Meshy image-to-3D model, exported as
GLB at 12 m tall. The image prompts are kept in the Art Techno project, not here.

## Layout

| Path | What it is |
| --- | --- |
| [`web/`](web) | Spirits Plaza: a walk-through 3D plaza, built like the Knowledge Press forest (Vite, React, react-three-fiber, three.js). |

## Adding a statue to the plaza

The full workflow (Grok, Meshy remesh, compress, measure the plinth, register,
check) is in [`web/README.md`](web/README.md#adding-or-replacing-a-statue-step-by-step).
In short:

```bash
cd web
npm install
scripts/prep-model.sh ~/Downloads/Meshy_AI_Spirit_of_Life_texture.glb life
node scripts/measure-plinth.mjs public/models/life.glb
```

then paste the printed `ownPlinth` line and `model: "models/life.glb"` into that
Spirit in `web/src/spirits.ts`.
