"""Light a plaza file with a Poly Haven HDRI: the HDRI becomes the world, the sun lamp goes off.

Run: blender -b plaza_day.blend --python scripts/blender/hdri.py -- <hdri_id> [strength] [rotation_deg]
Saves plaza_<hdri_id>.blend next to the input file.
"""
import glob
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
HDRI = argv[0]
STRENGTH = float(argv[1]) if len(argv) > 1 else 1.0
ROT = float(argv[2]) if len(argv) > 2 else 0.0
# Large inputs and outputs (Meshy GLBs, Poly Haven assets, .blend files, renders) live outside the repo.
ROOT = os.environ.get("ART_TECHNO_DIR", os.path.expanduser("~/Documents/art_techno"))
PH = f"{ROOT}/polyhaven/hdris"

path = (glob.glob(f"{PH}/*/{HDRI}_4k.hdr") + glob.glob(f"{PH}/*/{HDRI}_2k.hdr"))[0]
s = bpy.context.scene
for name in ("Sun", "Moon"):
    if name in bpy.data.objects:
        bpy.data.objects[name].hide_render = True

w = bpy.data.worlds.new(f"HDRI {HDRI}")
s.world = w
nt = w.node_tree
env = nt.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(path)
tc = nt.nodes.new("ShaderNodeTexCoord")
mp = nt.nodes.new("ShaderNodeMapping")
mp.inputs["Rotation"].default_value = (0, 0, math.radians(ROT))
nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
nt.links.new(mp.outputs["Vector"], env.inputs["Vector"])
bg = nt.nodes["Background"]
bg.inputs["Strength"].default_value = STRENGTH
nt.links.new(env.outputs["Color"], bg.inputs["Color"])
print("HDRI", HDRI, path)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(f"//plaza_{HDRI}.blend"))
