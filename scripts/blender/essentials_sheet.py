"""Contact sheet of the Blender Essentials materials: one sphere-on-slab swatch per material, labeled.

Run: blender -b --factory-startup --python scripts/blender/essentials_sheet.py -- [samples] [width_px]
Reads $ART_TECHNO_DIR/essentials/materials/*.blend (see the MANIFEST.md there) and writes
$ART_TECHNO_DIR/blender/essentials/materials_sheet.png. Lit by the studio_small_09 HDRI.
"""
import glob
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SPP = int(argv[0]) if len(argv) > 0 else 128
WIDTH = int(argv[1]) if len(argv) > 1 else 2800
# Large inputs and outputs (Meshy GLBs, Poly Haven assets, .blend files, renders) live outside the repo.
ROOT = os.environ.get("ART_TECHNO_DIR", os.path.expanduser("~/Documents/art_techno"))
LIB = f"{ROOT}/essentials/materials"
HDRI = f"{ROOT}/polyhaven/hdris/studio/studio_small_09_2k.hdr"
OUT = f"{ROOT}/blender/essentials/materials_sheet.png"
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts", "JosefinSans-SemiBold.ttf")

COLS = 7
CELL_X, CELL_Y = 1.7, 2.1  # metres between swatch centres
OBSIDIAN = (0.0037, 0.0052, 0.0044)  # #0B100E, linear
PANEL = (0.0060, 0.0103, 0.0087)  # #121A17, linear
SILK = (0.84, 0.79, 0.65)  # #EDE6D3, linear

s = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

# Append every material; the file name gives the family, which orders the sheet.
mats = []
for path in sorted(glob.glob(f"{LIB}/*.blend")):
    with bpy.data.libraries.load(path) as (src, dst):
        dst.materials = list(src.materials)
    mats += sorted(dst.materials, key=lambda m: m.name)


def mesh_object(name, build, mat):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    build(bm)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    s.collection.objects.link(ob)
    return ob


def emission(name, color, strength=1.0):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*color, 1)
    e.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs["Emission"], out.inputs["Surface"])
    return m


def label(text, size, loc, mat):
    cu = bpy.data.curves.new(text, "FONT")
    cu.body = text
    cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    cu.size = size
    cu.align_x = "CENTER"
    cu.materials.append(mat)
    ob = bpy.data.objects.new(f"Label {text}", cu)
    ob.location = loc
    s.collection.objects.link(ob)
    return ob


silk = emission("Silkscreen", SILK)
rows = math.ceil(len(mats) / COLS)
for i, m in enumerate(mats):
    r, c = divmod(i, COLS)
    x = (c - (COLS - 1) / 2) * CELL_X
    y = ((rows - 1) / 2 - r) * CELL_Y
    slab = mesh_object(f"Slab {m.name}", lambda bm: bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True), m)
    for v in slab.data.vertices:
        v.co.z = v.co.z * 0.16 + 0.08
        v.co.x *= 1.2
        v.co.y *= 1.2
    bev = slab.modifiers.new("Bevel", "BEVEL")
    bev.width, bev.segments = 0.02, 3
    slab.location = (x, y, 0)
    ball = mesh_object(
        f"Ball {m.name}",
        lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=96, v_segments=48, radius=0.45, calc_uvs=True),
        m,
    )
    ball.location = (x, y, 0.16 + 0.45)
    label(m.name, 0.16, (x, y - 0.95, 0.0), silk)

label("BLENDER ESSENTIALS  /  %d MATERIALS" % len(mats), 0.34, (0, (rows / 2) * CELL_Y + 0.15, 0), silk)

# Floor in panel green-black, so glass and water have something under them.
fm = bpy.data.materials.new("Panel")
b = fm.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (*PANEL, 1)
b.inputs["Roughness"].default_value = 0.6
floor = mesh_object("Floor", lambda bm: bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=40), fm)
floor.location.z = -0.001

# World: the HDRI lights everything; camera rays see obsidian.
w = bpy.data.worlds.new("Studio")
s.world = w
nt = w.node_tree
env = nt.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(HDRI)
lp = nt.nodes.new("ShaderNodeLightPath")
mix = nt.nodes.new("ShaderNodeMixRGB")
mix.inputs["Color2"].default_value = (*OBSIDIAN, 1)
nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
nt.links.new(env.outputs["Color"], mix.inputs["Color1"])
nt.links.new(mix.outputs["Color"], nt.nodes["Background"].inputs["Color"])

# Orthographic camera looking down the grid at 40 degrees from vertical.
tilt = math.radians(40)
cd = bpy.data.cameras.new("Sheet")
cd.type = "ORTHO"
cd.ortho_scale = COLS * CELL_X + 0.6
cam = bpy.data.objects.new("Sheet", cd)
s.collection.objects.link(cam)
cam.rotation_euler = (tilt, 0, 0)
cam.location = Vector((0, -0.35, 0.3)) + Vector((0, -math.sin(tilt), math.cos(tilt))) * 30
s.camera = cam
depth = rows * CELL_Y + 0.8
s.render.resolution_x = WIDTH
s.render.resolution_y = int(WIDTH * (depth * math.cos(tilt) + 1.2) / cd.ortho_scale)

p = bpy.context.preferences.addons["cycles"].preferences
p.compute_device_type = "METAL"
p.get_devices()
for d in p.devices:
    d.use = d.type == "METAL"
s.render.engine = "CYCLES"
s.cycles.device = "GPU"
s.cycles.samples = SPP
s.cycles.use_denoising = True
s.view_settings.view_transform = "AgX"
s.render.image_settings.file_format = "PNG"
os.makedirs(os.path.dirname(OUT), exist_ok=True)
s.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("SHEET", OUT, len(mats), "materials")
