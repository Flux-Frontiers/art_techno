"""Swap the plaza paving for a Poly Haven stone set and add a low floor-detail camera.

Run: blender -b plaza_day.blend --python scripts/blender/stone.py -- <texture_id|none> [metres_per_repeat] [save.blend]
'none' keeps the procedural paving (for comparison). The camera "Floor" looks across the
paving to Liberty's plinth. Pass a .blend path to save the result.
"""
import glob
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
TEX = argv[0]
REPEAT = float(argv[1]) if len(argv) > 1 else 2.0
SAVE = argv[2] if len(argv) > 2 else None
# Large inputs and outputs (Meshy GLBs, Poly Haven assets, .blend files, renders) live outside the repo.
ROOT = os.environ.get("ART_TECHNO_DIR", os.path.expanduser("~/Documents/art_techno"))
PH = f"{ROOT}/polyhaven/textures"


def save_portable(filepath):
    """Save with external files (HDRIs, textures) referenced relative to the .blend, so the file
    works on any Mac with the same data-folder layout. No .blend1 backup is kept."""
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=filepath)
    bpy.ops.file.make_paths_relative()
    bpy.ops.wm.save_mainfile()


s = bpy.context.scene

if TEX != "none":
    d = f"{PH}/{TEX}"
    m = bpy.data.materials.new(f"Paving {TEX}")
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / REPEAT, 1 / REPEAT, 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def img(key, non_color):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(glob.glob(f"{d}/*_{key}_*")[0])
        if non_color:
            n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n

    nt.links.new(img("Diffuse", False).outputs["Color"], b.inputs["Base Color"])
    nt.links.new(img("Rough", True).outputs["Color"], b.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(img("nor_gl", True).outputs["Color"], nm.inputs["Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.4
    bump.inputs["Distance"].default_value = 0.01
    nt.links.new(img("Displacement", True).outputs["Color"], bump.inputs["Height"])
    nt.links.new(nm.outputs["Normal"], bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    paving = bpy.data.objects["Paving"]
    paving.data.materials.clear()
    paving.data.materials.append(m)

# Low camera across the floor to Liberty's plinth (Liberty stands at Blender (16, 24)).
cd = bpy.data.cameras.new("Floor")
cd.lens = 28
cam = bpy.data.objects.new("Floor", cd)
s.collection.objects.link(cam)
cam.location = (8.5, 13.5, 1.4)
cam.rotation_euler = (Vector((15.0, 23.0, 2.2)) - cam.location).to_track_quat("-Z", "Y").to_euler()
s.camera = cam
if SAVE:
    save_portable(SAVE)
