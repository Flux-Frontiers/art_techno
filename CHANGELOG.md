# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Material contact sheets for Blender.** `scripts/blender/essentials_sheet.py`
  renders the 37 CC0 Blender Essentials materials, and `polyhaven_sheet.py`
  every Poly Haven texture set that has an `info.json`, each as a labeled
  sphere-on-slab swatch on panel green under the studio HDRI, for choosing
  materials. The Poly Haven swatches are box-projected at the texture's
  real-world size (capped at 2.5 m) and ordered by family. They write
  `blender/essentials/materials_sheet.png` and
  `blender/polyhaven/textures_sheet.png` in the data folder.
- **Framing prints of the Spirits.** `scripts/blender/print.py` turns a
  `hero.py` shot into a print for a 10 x 13 in mat window at 300 dpi, with a
  quarter-inch bleed under the mat (3150 x 4050, 16-bit PNG tagged 300 dpi).
  The camera is fitted to the window by projecting the statue. The floor
  fades into a charcoal gradient backdrop, so there is no horizon, and the
  backdrop and a low fill are lifted so the plinth's dark faces hold detail
  on paper. Astra's star chip emits light, with bloom. Meshy's plinths come
  out bendy at print size, so the other eight are cut at their `ownPlinth`
  top and stand on the plaza's series hex plinth; Astra keeps his steps.
  `print_spirits.sh` renders all nine, about 15 min each on Metal.

### Fixed

- **The plaza's plinth studs sit on their faces.** `create_cone` puts a
  hexagon's corners at 30 + 60k degrees, not on +x as `build_plaza.py`
  assumed, so the series plinth had its corners where the studs go: studs
  stood off their faces by up to 0.6 m. The tiers and bands are now turned
  30 degrees, as `Statue.tsx` turns its cylinders. `plaza.blend` and its
  variants need rebuilding to pick this up.

- **The Spirits' names fit their bases.** The longest names, such as Spirit of
  Computation, ran off both edges of the pad. Each line of the pad lettering
  now shrinks to fit inside the frame; shorter names keep their size.

## [0.4.0] - 2026-10-15

### Added

- **The version on the start screen**, under the controls, read from
  `web/package.json` at build time.

### Changed

- **The start screen holds still and waits for the plaza.** The view no
  longer drifts, and Enter and Take the tour stay disabled ("Loading the
  plaza") until every model and texture has arrived. A model that fails
  still counts, and shows its render.

### Fixed

- **No more bright band down the avenue.** The paving was polished enough
  (roughness 0.32) to mirror the studio environment at a grazing angle, a
  white band that followed the camera at every hour and was worst at dusk
  and night. It is honed now (0.6). The low sun-side light also fades out
  after sunset instead of holding a quarter strength, so it no longer glints
  off the floor left of the axis at night.

## [0.3.1] - 2026-10-14

### Fixed

- **The moon hides the stars behind it.** Stars and planets are drawn as
  points after the sky dome, which paints the moon, so they showed through
  its disc, plainest on the dark side of a crescent. Both now drop out
  inside the disc (`moonDir` in their shaders).

## [0.3.0] - 2026-10-13

### Added

- **Brand images** in `docs/brand/`: a README hero (a die rising as the boot
  sun over a stepped skyline, the wordmark cradled by bus runs), a 1280 x 640
  social card, horizontal and stacked wordmark lockups in outlined Josefin
  Sans, clock-wave and key-route section rules, and a brand board with the
  mark, palette, lettering, eight motifs, imagery and the seven rules.
  `docs/brand/build.py` draws and renders them all.
- **A citation block in the README**, as in the KG repos: the DOI badge, an
  APA reference and a BibTeX entry, taken from `CITATION.cff`.
- **The Sun Towers.** A matched pair of Meshy towers, one model drawn twice
  and mirrored, replaces the two ring towers nearest the Core. Each wears the
  boot sun as its crown, seated on a setback inside stepped arcs, gold and
  copper rays ending in pads, a bus dropping to vias below. At 120 m they
  frame the Core like gateposts from the processor. A second Meshy pass gave
  them a smaller crown, spanning just past the block below. Simplified to 40k
  triangles (1.7 MB desktop, 0.73 MB phone); `SunTowers.tsx` draws them, and
  `cityTowers()` marks their places so the aerial craft still fly round them.
- **A boot-sun crown on every tower**, drawn in code after the Sun Towers' in
  place of the flat fan of thin bars: an emerald die seated on a lower
  roofline inside three stepped arcs, long gold rays with round pads and short
  copper rays with square tips between them, and on two of the three facade
  variants a bus of six traces dropping down the face below, jogging at 45
  degrees into ring vias. Ray count follows the tower's size; spires carry a
  smaller crown. The crowns are lit gilt metal with a faint glow after dark,
  not light; only the die's core shines. Copper joins the city's materials;
  still a handful of draw calls.
- **Tonight's sky in About:** the moon's phase and how much is lit, the next
  full and new moon, the meteor showers active now with their rates and
  peak dates, the next two coming up, and where to find Polaris (north is
  on your right as you face down the avenue; it stands as high as your
  latitude). Always the real date, whatever the clock is set to.
- **The sky at your location.** On entering the plaza the browser may ask
  for your location once (About also offers "Use my location"); it is
  rounded to 0.1 degree and kept only in this browser, as in the Knowledge
  Press forest. Without it the sky keeps to your time zone at latitude 40° N.
  Browsers allow this only over https, so the LAN preview never asks.
- **`?meteors=` takes a plain multiple.** `?meteors=10` shows ten times
  tonight's real sky, sporadics and every shower in season; `?meteors=geminids:20`
  still pins one shower to its peak. The default stays at real rates, and
  About's Tonight's sky explains both.
- **A floor marker for Ad Astra's alignment.** A gold via ring in the paving
  just in front of the processor, holding a small boot sun, with STAND HERE
  lettered toward the entrance: the one spot where his star sits on the
  Core's winged chip with the Sun Towers either side. His card and About
  point to it.
- **The artist's signature,** "E.G. Suchanek, '26", inlaid in gold Pinyon
  Script in the paving at the plaza's front-right corner, reading toward the
  entrance.
- **The pole tower.** The round ring tower due north of the floor marker
  stands taller, crowned with a Meshy finial (a granite base, a collar of
  copper fins, a faceted shaft carrying a bus and a glowing chip, a needle
  ending in a gold ball) whose tip stops a degree under Polaris as seen from
  the marker: stand on it, face Ad Astra, turn right, and it points at the
  pole star. The marker now carries both of the plaza's alignments. Polaris stands
  as high as the latitude, so its height follows the sky's latitude (40 N, or
  the viewer's), and the tower widens with it so its top tier carries the
  finial's base. `PoleFinials.tsx` draws the finial on the tower and its
  mirror: gold to the north, silver to the south, so the two tell apart.
  The tower beside it is left out.
- **The planets.** Mercury, Venus, Mars, Jupiter and Saturn shine among the
  stars at their true places and brightness for the moment shown, from JPL's
  approximate orbital elements and Mallama and Hilton's magnitudes
  (`sky/planets.ts`): steady, tinted points a little larger than the
  brightest stars, through the same twilight limit, so Venus can shine in a
  dusk sky. About's Tonight's sky lists the planets up in tonight's dark sky,
  when and where, and which are too near the sun; it also says which way the
  plaza faces.

### Changed

- **The Engine turns to show its machine.** Meshy faced him down the model's
  front with the engine edge-on before him; he now stands a quarter turn
  round, so the engine's wheel columns face the avenue, his hand on the crank.
- **Twilight washes out the faint stars first.** The stars had one opacity for
  all magnitudes, so dawn, when the brilliant winter stars are up, looked
  starrier than midnight's faint autumn sky. A limiting magnitude now falls
  from 6 in full dark to about 2.4 with the sun 2 degrees down, so dusk and
  dawn show only the brightest stars and night the whole sky.
- **The city dims at night.** Windows, setback light lines and dies fall to
  about a third of their brightness in full dark (`cityLit` in
  `sky/plazaSky.ts`), and the Core's and Sun Towers' glow by half, so the
  night sky and the floodlit statues carry the scene. Dusk and day are
  unchanged.
- **Spirit of Life, redesigned: life written in code.** Her double-helix
  staff now rises into a pinned chip that radiates the fan of rays as a
  rising sun (rule 1), so the strands of life feed a processor. The halo is
  gone (with the staff it read as a saint), the dress is faceted gold and
  copper, and the cell rests in her palm. One closed piece (1.15M triangles,
  7.4 MB desktop, 3.7 MB phone); her floating halo and cell, and the thin
  hem, are fixed. Card and design-record text updated.
- **A more open skyline, thinned the same at both ends.** At the far end the
  tall needles just outside the Sun Towers, the slab behind them and the tall
  side spires (about 172 m, near the Core's height) and the tall round tower
  west of the pole tower are left out of the ring;
  at the entrance end, their mirror places. Each end keeps its central pair
  (the Sun Towers at the far end), and from the processor the Core and the
  Sun Towers stand clear against the sky. The other towers keep their places.
- **The hero heads the README** in place of the text title, which only
  repeated the wordmark; the image's alt text still names the project. The
  DOI badge moves from the top to the Citation section.
- **The README's Spirits table links each name to its render** and drops the
  Status column, which read "Rendered and 3D" on every row.
- **Spirit of Liberty, redesigned off the Statue of Liberty.** The radiant
  crown, raised arm and robe made her a copy of Bartholdi's statue. She now
  holds the torch like a scepter, a keyhole cut through its stepped flame,
  presses a padlocked chip-package tablet to her heart, and wears a faceted
  gown of stepped setbacks with a trace bus down the front and a green brow
  band. The new Meshy export is kept at full detail on desktop (917k
  triangles, 6.3 MB) and halved for phones (3.1 MB); it is closed, with no
  holes or pinch edges. Plinth cut at 0.206 of 1.90, head at 1.85. Thumbnail,
  plaque card and design-record text updated.
- **Spirit of Power, redesigned off Rockefeller Center's Atlas.** The bare
  muscular figure was the pastiche; the tech was all in the sphere. He now
  wears faceted plate (fin shoulders, a stepped chest, a server-rack abdomen),
  and buses of gold traces carry the sun's power from his palms down his arms
  and legs to the ground. The fusion core is a die, held in three thick rings
  with eight magnet coils; the halo and the thin tilted rings are gone. The new
  Meshy export is full detail on desktop (1.21M triangles, 7.7 MB) and halved
  for phones (3.9 MB); it is closed, and its thinnest wall more than doubles.
  Plinth cut at 0.214 of 1.90, head at 1.40. Thumbnail, plaque card and
  design-record text updated.
- **Spirit of Communication, redesigned off the Greek goddess.** Soft
  drapery, a hip-shot stance, wavefronts floating beside her hands and a halo
  of orbit rings made her classical. She now stands squarely in a gown cut
  like a fluted pier and holds a broadcast arch of stepped wavefronts palm to
  palm over her head, a satellite at its crest; a bus of gold traces fans out
  across her body to glowing pads. The new Meshy export is full detail on
  desktop (525k triangles, 4.2 MB) and halved for phones (1.9 MB); it is
  closed. Plinth cut at 0.214 of 1.90, head at 1.59. Thumbnail, plaque card
  and design-record text updated (and "fibre" corrected to "fiber" there).
- **Ad Astra per Aspera, re-rendered and re-sculpted.** He now grips the
  star instead of reaching for it, his face is bare with open eyes and the
  green band on the brow, and the steps are a straight staircase block. The
  new Meshy export (650k triangles, 4.6 MB desktop, 2.2 MB phone) is one
  closed piece; the shipped one had 396 holes from the Ultra remesh, and its
  thinnest part more than doubles. His star sits 5.5 m right of center, so
  `shiftX` is -5.5 to keep it before the Core's winged chip from the
  processor. Thumbnail and card text updated.
- **Spirit of Life, re-exported at full detail** from the same design (883k
  triangles, 6.3 MB desktop, 3.0 MB phone), closed where the shipped 120k
  simplify had holes. Plinth cut at 0.46 of 1.90, head at 1.80; the old entry
  set her larger than the other Spirits. Thumbnail redone.
- **Spirit of Knowledge, redesigned off the 1940s working woman.** The work
  shirt with rolled sleeves, cuffed trousers and waved hair were the
  pastiche, and nothing tied her body to the machine. She now wears a faceted
  tunic and trousers of flat planes, the green band on her brow, fin lines
  across the chest and the green belt; gold traces run along her gauntlet,
  and she carries the slate at her side. The new Meshy export (852k
  triangles, 5.8 MB desktop, 2.8 MB phone) is one closed piece with facets in
  the geometry, where the old sculpt had almost none. Plinth cut at 0.227,
  centered on the plinth, head at 1.82. Card and design-record text updated.
- **Plaque cards show the Grok renders.** Each Spirit's card image is now
  its accepted Grok render at 600 x 900, in place of a snapshot from the
  plaza: the design as judged, one figure on a dark ground, which reads
  better at card size than a statue against the towers. The README and the
  design record link the same files. `web/README.md` says so;
  `scripts/thumbnails.mjs` stays as a tool for checking a statue in the
  plaza.
- **The Architect's files are named for him.** `computation.glb` and
  `computation.jpg` held the Architect, Computation's second option, while
  the default Engine is `computation-engine`; they are now `architect.glb`
  (desktop and phone) and `architect.jpg`.
- **Spirit of Industry, re-exported at full detail** from his original
  render (1.88M triangles, 11.6 MB desktop, 6.0 MB phone): one closed piece
  where Meshy's remesh left 655 pinch edges, and the most crisply faceted
  model in the set. Plinth cut at 0.20, centered on the plinth, head at 1.35.
  "Labour" corrected to "Labor" in the design record.
- **Spirit of Innovation is Eureka, with the kneeling figure as the
  alternative.** The default is new: a woman caught springing forward with a
  joyful cry, hands pressed to her chest where two halves of a chip have just
  clicked together and a sunburst breaks out, traces running down her arms
  and legs; the only Spirit in motion. The kneeling figure, re-rendered so the
  chip sits in his palms under its circuit plan, stays as the Kneeling button
  on her card, as the Architect does for Computation. Both are new full-detail
  Meshy exports, closed single pieces (790k and 779k triangles). Files are
  named for each version: `innovation-eureka` and `innovation-kneeling`. The
  notes that called Innovation kneeling now cite the Architect.

## [0.2.0] - 2026-10-12

### Added

- **The Engine is the Spirit of Computation**: Babbage's engine, worked by
  hand, at full detail on desktop (1.98M triangles, 12.5 MB) and simplified to
  half for phones (6.4 MB). Meshy set it on the diagonal, so a new
  `ownPlinth.turn` turns it 45 degrees to stand as in its render. The
  Architect stays available as a variant.
- **Variants carry their own render and card text**, and the plaque card
  follows the variant on show.
- **A Zenodo DOI badge** in the README and the concept DOI
  (`10.5281/zenodo.23307133`) in `CITATION.cff`, with `date-released`.
- **This changelog.**

### Changed

- **The Owl-bearer is the Spirit of Knowledge**, replacing the robed figure,
  which read as priestly. Full detail on desktop (1.25M triangles, 7.9 MB),
  half for phones (3.9 MB), centered on its plinth rather than on the
  figure's striding feet. The robed figure's models and render move to
  `archive/knowledge-priestess/`.
- **`docs/README.md` is one complete design record.** It opens with where
  everything lives, then covers The Gilded Circuit (layout, city, sky, light,
  craft, scale), all nine Spirits with their allegories and attributes, the
  Core and the other architecture, the craft, motifs, posters and the first
  studies.
- **Plaque cards brought up to date.** Power, Knowledge and Life no longer
  describe their replaced Meshy plinths; Computation drops the "architect of
  the universe" allusion; Ad Astra's card describes his steps, chain and
  place in the avenue.

## [0.1.0] - 2026-10-12

First archived release.

### Added

- **The Gilded Circuit**, a walk-through 3-D plaza in the browser (Vite,
  React, Three.js), published to GitHub Pages from `main`.
- **All nine Spirits** on the plaza: Power, Life, Computation (the Architect,
  enthroned on the memory hierarchy), Knowledge, Innovation, Communication,
  Industry, Liberty, and Ad Astra per Aspera at 24 m on a grand terrace.
  Series plinths are drawn in code and sized to each figure; standing Spirits
  share one head height.
- **The Core**, the great tower that closes the avenue behind Ad Astra, with
  Ad Astra's star on its winged chip.
- **The city and sky**: an Art Techno skyline of five building kinds, haze,
  the Knowledge Press sky with a clock, meteor showers at real rates from
  their radiants, night lamps, floodlit statues, emerald chips on the crowns
  and Greek key friezes. The bus-run motif runs parallel traces over towers,
  floor and streets.
- **Aerial craft**: the sculpted Packet Clipper, Cloud and Uplink, flying
  clear of the city.
- **Visitor tools**: a start screen, an About page, plaques and a tour, a
  1.75 m scale figure beside every statue (H), a lighter model set and slim
  plaque on phones, and the Art Techno mark as favicon, touch icon and logo.
- **Style rules and design boards** in `docs/`.
- **Licensing and citation**: code under the Elastic License 2.0, artwork
  under CC BY-NC 4.0, and a `CITATION.cff`.

[Unreleased]: https://github.com/Flux-Frontiers/art_techno/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Flux-Frontiers/art_techno/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Flux-Frontiers/art_techno/releases/tag/v0.1.0
