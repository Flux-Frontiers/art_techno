# Blender plaza scripts

Cycles renders of the Art Techno plaza and its Spirits, built in Blender
from the same layout as the web app. To install Blender and the MCP
add-on on a new Mac, see [SETUP.md](SETUP.md).

## Data lives outside the repo

The scripts are here. Everything large stays in one data folder: the
Meshy statue GLBs, the Poly Haven HDRIs and textures, the `.blend` files
and the renders. The scripts find it through `ART_TECHNO_DIR`, which
defaults to `~/Documents/art_techno`.

| Path under `$ART_TECHNO_DIR` | What | Used by |
|---|---|---|
| `meshy-raw/` | Full-resolution Meshy GLBs (`<name>_Meshy_AI_*.glb`) | `build_plaza.py`, `hero.py` |
| `polyhaven/hdris/`, `polyhaven/textures/` | CC0 HDRIs and PBR stone sets from Poly Haven | `hdri.py`, `hero.py`, `stone.py` |
| `essentials/materials/` | The 37 CC0 Blender Essentials materials (Blender Studio), downloaded from the online asset library; see its `MANIFEST.md` | `essentials_sheet.py` |
| `blender/` | `.blend` files and renders (output) | all |

The web app's `web/public/models/*.glb` files can't be used: Blender's
glTF importer doesn't support their meshopt compression.

The three fonts in `fonts/` are the web app's (Josefin Sans SemiBold,
IBM Plex Mono, Pinyon Script), under the SIL Open Font License; the
licenses are next to them.

## Scripts

| Script | Does |
|---|---|
| `build_plaza.py` | Builds the night plaza from scratch and saves `blender/plaza.blend`: nine Spirits on their plinths, pads and lettering, paving, traces, processor dais, grand terrace, the Core, floodlights, starry sky, cameras. About 50 s. |
| `day.py` | Loads a plaza file and turns it to daylight: sun, physical sky, lamps and glows off. Saves `plaza_day.blend` next to it. |
| `hdri.py` | Lights a plaza file with a Poly Haven HDRI in place of the sky. Saves `plaza_<hdri>.blend` next to it. |
| `gpu_cam.py` | Sets Metal GPU rendering, a camera, resolution percent and samples, for a command-line render. |
| `hero.py` | One Spirit as a studio product shot: studio HDRI light, dark backdrop, polished slate floor. Writes `blender/hero/`. |
| `print.py` | Turns a `hero.py` file into a framing print: 10x13 in mat window plus 1/4 in bleed at 300 dpi (3150x4050), camera fitted to the window, floor faded into a charcoal gradient backdrop (lifted so it holds detail on paper), softbox key and low fill, the star chip lit with bloom (Astra). Below 100 percent it writes a proof to `hero/proofs/` instead. Writes `<name>_print.blend` and a 16-bit `<name>_print.png` tagged 300 dpi. |
| `print_spirits.sh` | Runs `print.py` at full size for all nine Spirits, or the ones named, making any missing hero file with `hero.py` first. About 15 min each. |
| `stone.py` | Puts a Poly Haven stone set on the plaza paving and adds a low `Floor` camera, for comparing stones. |
| `essentials_sheet.py` | Contact sheet of the Blender Essentials materials, one labeled sphere-on-slab swatch each. Writes `blender/essentials/materials_sheet.png`. About 1 min at 256 samples. |

Cameras in the plaza: `Entrance` (eye height at the entrance), `Aerial`,
`Marker` (the floor marker in front of the processor), `Liberty`.

## Commands

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
S=~/repos/art_techno/scripts/blender    # this folder
cd ~/Documents/art_techno/blender       # $ART_TECHNO_DIR/blender

# Night plaza, then the daytime version, then a daytime version lit by an HDRI
$B -b --factory-startup --python $S/build_plaza.py
$B -b --factory-startup plaza.blend --python $S/day.py
$B -b --factory-startup plaza_day.blend --python $S/hdri.py -- kloofendal_48d_partly_cloudy_puresky

# Render one camera: name, resolution percent, samples
$B -b --factory-startup plaza_day.blend --python $S/gpu_cam.py \
   -o //plaza_day_Entrance_ -F PNG -f 1 -- Entrance 100 256

# Contact sheet of the Essentials materials: samples, width in px
$B -b --factory-startup --python $S/essentials_sheet.py -- 256 2800

# Studio hero shot of one Spirit
$B -b --factory-startup --python $S/hero.py -- liberty-v5 studio_small_09 256

# Framing print from a hero file: samples, resolution percent, azimuth (optional)
cd hero
$B -b --factory-startup astra-v2.blend --python $S/print.py -- 64 25     # proof, seconds
$B -b --factory-startup astra-v2.blend --python $S/print.py -- 1024 100  # final

# All nine framing prints, or just the ones named
$S/print_spirits.sh
$S/print_spirits.sh astra-v2 life-v3
```

`hdri.py` also takes a strength and a rotation in degrees:
`-- <hdri> 1.0 24`.

Notes:

- **Render from the command line, not in the open Blender.** The first GPU
  render after a Blender install compiles the Metal kernels, about 90
  seconds. Started from the open Blender, or through the MCP bridge, it
  freezes the interface for that long.
- **`-o` needs `//` or an absolute path.** A bare relative output path
  fails with "cannot save".
- **`--factory-startup`** keeps installed add-ons out of the run.
  Without it, the Alice/LG add-on floods the output with harmless
  `doRollover` log errors.
- The scripts keep no `.blend1` backups (a plaza file is about 500 MB),
  and save external files relative to the `.blend`, so the data folder
  can be copied between Macs as is.

## Keep in step with the web app

`build_plaza.py` copies its layout from the web app. When one of these
changes in `web/src`, change it here too:

| Web source | Copied into `build_plaza.py` |
|---|---|
| `spirits.ts`: `SIDE_X`, `ROWS`, `PROCESSOR`, `GRAND_TERRACE`, `BOUNDS`, each Spirit's position, height, pad, `ownPlinth` (`top`, `cx`, `cz`, `head`, `turn`), `shiftX` | `SPIRITS` and the constants at the top |
| `spirits.ts`: each Spirit's `name` and `allegory` | `NAMES` |
| `scene/Statue.tsx`: plinth tiers, `fitTiers`, pad size, corner lamps | `hex_plinth`, `fit_tiers`, the statue loop |
| `scene/Plaza.tsx`: `traceRoutes`, `Traces`, `Processor`, `Terrace`, `FloorMarker`, `Signature` | the floor, traces, dais, terrace, marker and signature sections |
| `scene/textures.ts`: `pavingTexture`, `cityTexture`, `padTexture`, `markerTexture` | `paving_image`, `city_image`, `pad_top`, the marker section |
| `landmarks.ts`: `CORE` | the Core section |

One deliberate difference: Ad Astra stands centred on his terrace here,
without the web app's `shiftX: -5.5`.
