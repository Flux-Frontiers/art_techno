#!/bin/bash
# Render the framing prints of the nine Spirits (10x13 in mat window, 300 dpi), one at a time.
# Each takes about 15 min on an M-series GPU. Makes the hero file with hero.py first if it is missing.
#
#   scripts/blender/print_spirits.sh                    # all nine
#   scripts/blender/print_spirits.sh astra-v2 life-v3   # just these
#
# Writes $ART_TECHNO_DIR/blender/hero/<name>_print.png and <name>_print.blend.
set -e
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
S=$(cd "$(dirname "$0")" && pwd)
ROOT=${ART_TECHNO_DIR:-~/Documents/art_techno}
SAMPLES=${SAMPLES:-1024}
NAMES=("$@")
[ ${#NAMES[@]} -eq 0 ] && NAMES=(computation-engine knowledge-v5 astra-v2 innovation-v5-eureka life-v3
  power-v2 communication-v2 industry-v1 liberty-v5)
cd "$ROOT/blender/hero"
i=0
for name in "${NAMES[@]}"; do
  i=$((i + 1))
  echo "== [$i/${#NAMES[@]}] $name ($(date +%H:%M))"
  [ -f "$name.blend" ] || "$B" -b --factory-startup --python "$S/hero.py" -- "$name" studio_small_09 256 2>&1 | rg '^HERO'
  "$B" -b --factory-startup "$name.blend" --python "$S/print.py" -- "$SAMPLES" 100 2>&1 | rg -i '^PRINT|error'
done
