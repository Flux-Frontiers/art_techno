# Posters

The source files for the Art Techno poster series and the tools that print it. The design lives
on the posters canvas on claude.ai (Art Techno · Posters, Vol. 01–17); `src/` holds a copy of
every artboard, so the PDFs are built from exactly what the canvas shows.

| Path | What |
|---|---|
| `src/*.dc.html` | One file per artboard, 720 x 1080 (posters) or 1440 x 2160 (boards). `V##`/bare names are line art, `R##` rendered, `B#` the nine-up boards. |
| `draw/line.py` | The shared parts of the Spirit line posters: the light, skyline, series plinth, frame, kicker and title. |
| `draw/<spirit>.py` | One line poster's figure (Vol. 10–15). Run it to rewrite its `src/V##-<Name>.dc.html`. |
| `draw/rendered.py` | The rendered Spirit posters: each statue's framing print in a gilt panel. |
| `draw/board.py` | The two nine-up boards, mounting the posters with `<dc-import>`. |
| `blobs.json` | Canvas image id to local master file, relative to `$ART_TECHNO_DIR`. |
| `topdf.py` | Prints any artboard to PDF (default 12 x 18 in) or a PNG preview, with headless Chrome. |

## Building

```bash
cd docs/posters
python3 draw/liberty.py                 # redraw one line poster
python3 draw/rendered.py                # rewrite the rendered posters
python3 draw/board.py                   # rewrite the boards
./topdf.py src/V15-Liberty.dc.html --png  # preview at 720 x 1080
./topdf.py src/R*.dc.html src/B*.dc.html  # PDFs, 12 x 18 in
```

Output goes to `$ART_TECHNO_DIR/posters/` (default `~/Documents/art_techno/posters/`), previews
in `previews/`. The rendered posters need the statue prints from
`scripts/blender/print_spirits.sh` in `$ART_TECHNO_DIR/blender/hero/`.

## The series' rules

- Every poster opens with the kicker, `ART TECHNO · VOL. NN · <motto>`, in IBM Plex Mono; the
  Spirit's name at the bottom is the only large type. Long names are condensed to 640 px,
  using Josefin Sans Light's measured widths, never set smaller.
- In the line posters the light is emitted: the beams and rings radiate from the glowing
  element (the torch's keyhole, the orb, the die), never from empty space.
- Every SVG id carries the poster's prefix (`l15`, `p5`, ...), so a board that inlines nine
  posters has no collisions.
- After changing a file in `src/`, publish it to the canvas too.
