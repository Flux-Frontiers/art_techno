#!/usr/bin/env bash
# Shrink a Meshy GLB for the web: geometry simplified to about 120k triangles,
# textures to 2048 WebP, geometry meshopt-compressed.
# Usage: scripts/prep-model.sh <input.glb> <spirit-id>   ->  public/models/<spirit-id>.glb
set -euo pipefail
in="$1"; id="$2"; tmp="$(mktemp -d)"
target=120000
tris=$(node -e '
  const {NodeIO}=require("@gltf-transform/core");
  new NodeIO().read(process.argv[1]).then(d=>{let t=0;for(const m of d.getRoot().listMeshes())for(const p of m.listPrimitives()){const i=p.getIndices();t+=(i?i.getCount():p.getAttribute("POSITION").getCount())/3}console.log(Math.round(t))});
' "$in")
cp "$in" "$tmp/0.glb"
if [ "$tris" -gt "$target" ]; then
  ratio=$(node -e "console.log(($target/$tris).toFixed(4))")
  echo "simplifying $tris triangles by $ratio"
  npx gltf-transform weld "$tmp/0.glb" "$tmp/0.glb"
  npx gltf-transform simplify "$tmp/0.glb" "$tmp/0.glb" --ratio "$ratio" --error 0.002
fi
npx gltf-transform resize "$tmp/0.glb" "$tmp/a.glb" --width 2048 --height 2048
npx gltf-transform webp "$tmp/a.glb" "$tmp/b.glb" --quality 82
npx gltf-transform meshopt "$tmp/b.glb" "public/models/$id.glb"
rm -rf "$tmp"
ls -la "public/models/$id.glb"
