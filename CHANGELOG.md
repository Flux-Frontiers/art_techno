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
