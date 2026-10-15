#!/bin/bash
# Render the nine Art Techno Spirits and the Architect as Looking Glass Go quilts, one at a time.
# Full Go view cone (54), past the 35 the CLI caps to. Each line: name, margin, view direction. Wide statues need a looser margin to stay inside
# every tile; Computation is seen from -x so the engine faces the viewer.
set -e
cd /Users/egs/repos/quiltwright
RAW=~/Documents/art_techno/meshy-raw
while read -r name margin vx vy vz; do
  src=$(ls $RAW/${name}_Meshy_AI_*.glb)
  poetry run quiltwright mesh "$src" --device go --view-cone 54 --margin $margin --view-direction $vx $vy $vz \
    --out renders/quilts/art_techno/$name 2>&1 | tr '\r' '\n' | rg -v 'cycles view'
done <<'LIST'
liberty-v5 0.9 0 -1 0
communication-v2 0.9 0 -1 0
life-v3 0.9 0 -1 0
power-v2 1.05 0 -1 0
astra-v2 1.05 0 -1 0
knowledge-v5 1.2 0 -1 0
innovation-v5-eureka 1.05 0 -1 0
industry-v1 1.05 0 -1 0
computation-engine 1.2 -1 0 0.2
architect 1.35 0 -1 0
LIST
