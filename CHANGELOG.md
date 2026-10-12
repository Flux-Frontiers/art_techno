# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Brand images** in `docs/brand/`: a README hero (a die rising as the boot
  sun over a stepped skyline, the wordmark cradled by bus runs), a 1280 x 640
  social card, horizontal and stacked wordmark lockups in outlined Josefin
  Sans, clock-wave and key-route section rules, and a brand board with the
  mark, palette, lettering, eight motifs, imagery and the seven rules.
  `docs/brand/build.py` draws and renders them all.
- **A citation block in the README**, as in the KG repos: the DOI badge, an
  APA reference and a BibTeX entry, taken from `CITATION.cff`.

### Changed

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
