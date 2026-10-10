# Spirits Plaza

A walk-through plaza for the nine Spirits of Art Techno, at dusk. The floor is
laid out like a circuit board: traces run at 0°, 45° and 90° from a processor
dais at the centre to a pad under every statue, and Ad Astra per Aspera closes
the avenue from a raised terrace. Statues with a 3D model stand on their pads;
the rest show their Grok render in a gold frame, and the ones not yet designed
are drawn as outlines in light.

Same stack as the Knowledge Press forest: Vite, React 19, react-three-fiber,
three.js and zustand.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints and choose **Walk in** or **Take the tour**.

| Key | Action |
| --- | --- |
| **W A S D** | walk |
| **Left / Right** | turn |
| **Drag** | look around |
| **Shift** | hurry |
| **R / F** or the slider on the right | raise or lower the view, up to the statues' faces |
| **L** | the Spirits list: jump to any statue |
| **T** | start or stop the guided tour |
| **C** or the clock button | time of day: Dusk, Night, Dawn, Day, or Live (your own time) |
| **Esc** or **Exit** | close the list; with it closed, back to the start screen |

On a phone, the ring at the bottom left walks, a drag anywhere else looks, and the slider
on the right raises the view.

## Layout of the code

| File | What it holds |
| --- | --- |
| `src/spirits.ts` | The nine Spirits: names, plaque text, where each stands, and its render or model. |
| `src/scene/Plaza.tsx` | Sky and haze, paving, floor traces, processor dais, terrace, and the city: five kinds of building (setback towers, slabs, spires, data halls and low blocks) on a circuit-board ground. |
| `src/scene/Statue.tsx` | A pad and its statue: the GLB, the framed render, or the outline of a planned piece. Floodlighting is faked in the shader, as in the forest. |
| `src/scene/Craft.tsx` | The aerial craft (Packet Clipper, Uplink, The Cloud), sent across the sky at random. A craft with a Meshy model (`MODELS`, now the Clipper's `models/clipper.glb`) flies that; the rest are built in code from their design boards. |
| `src/sky/` | The sky's clock from the Knowledge Press forest: the real sun, moon and Yale Bright Star Catalogue stars for your time zone, turned so the sun sets behind Ad Astra. |
| `src/scene/Player.tsx` | Walking, looking, collisions, glides to a statue and the tour. |
| `src/HUD.tsx` | Start screen, plaque card, Spirits list and the phone thumb stick. |

## Models

`scripts/prep-model.sh <meshy-export.glb> <spirit-id>` compresses a Meshy export
for the web and writes `public/models/<spirit-id>.glb`. Remesh it in Meshy first
(Triangle, Adaptive: Ultra); the script only simplifies if given a triangle limit. Each model is scaled
to its Spirit's `height` (12 m; Ad Astra 14 m) with its base on the pad and its
front, the model's +z, toward the avenue.

A Spirit with `ownPlinth` set in `src/spirits.ts` has its Meshy plinth cut away
and stands on the series plinth drawn in code (`HexPlinth` in
`src/scene/Statue.tsx`): three hexagonal tiers of black granite with gold rails
and studs, 1.4 m in all. Ad Astra keeps his own steps.

### Adding or replacing a statue, step by step

1. **Grok:** render the Spirit, or edit its accepted render with the matching
   prompt from the project's `prompts/spirits/plinth-edits.txt`.
2. **Meshy:** image to 3D, then **Remesh** with topology **Triangle** and target
   **Adaptive: Ultra**, and download the GLB.
3. **Compress:** `scripts/prep-model.sh <download.glb> <spirit-id>` writes
   `public/models/<spirit-id>.glb`.
4. **Measure the plinth:** `node scripts/measure-plinth.mjs public/models/<spirit-id>.glb`
   finds where the model's own plinth ends and prints an `ownPlinth` line.
   Add `--profile` to see the width at every height if the result looks off.
5. **Register it:** in `src/spirits.ts`, set `model: "models/<spirit-id>.glb"` and
   paste the `ownPlinth` line. Use `height: 1.4` for a figure standing on its
   plinth; leave `height` out to keep the figure where it is (Computation, whose
   globe sits on a low plinth).
6. **Check it:** `npm run dev`, walk up to the statue and confirm the feet (or
   globe) sit on the top tier with nothing of the old plinth showing. Nudge
   `top` up or down by a few centimetres if needed.
7. **Thumbnail:** with the site built and previewed (`npm run build && npx vite preview --port 5174`),
   `node scripts/thumbnails.mjs` remakes `public/renders/<id>.jpg`, the picture on
   each plaque card, from the plaza itself (it needs Playwright and Chromium). Then
   push; GitHub Pages rebuilds the site.

Opening the site with `?thumb=<spirit-id>` stands you at that statue's viewpoint
with the controls hidden, which is what the thumbnail script photographs.
`?pose=x,z,yaw,pitch,elevation` stands you anywhere, `?clock=night` (or `dusk`,
`dawn`, `day`, `live`) sets the sky, `?craft=clipper` (or `uplink`, `cloud`) holds
that craft in view, and
`node scripts/views.mjs <dir> "name=x,z,yaw,pitch,elevation&clock=night" ...` photographs those
poses, for checking the scene after a change.

## Credits

The sky's clock, star field and moon shader come from the Knowledge Press
forest. The astronomy is SunCalc's (Vladimir Agafonkin, BSD-2-Clause); the
stars are the Yale Bright Star Catalogue (Hoffleit & Warren 1991); the moon is
NASA's Scientific Visualization Studio LRO colour mosaic
(`public/textures/moon/CREDITS.md`).
