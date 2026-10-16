"""Studio hero shot of one Spirit: Poly Haven studio HDRI light, dark backdrop, polished slate floor.

Run: blender -b --factory-startup --python scripts/blender/hero.py -- <name> [hdri_id] [samples]
<name> is a meshy-raw prefix as in scripts/render_spirits.sh (liberty-v5, astra-v2, ...).
Writes $ART_TECHNO_DIR/blender/hero/<name>.blend and <name>_<hdri_id>.png.
"""
import glob
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
NAME = argv[0]
HDRI = argv[1] if len(argv) > 1 else "studio_small_09"
SAMPLES = int(argv[2]) if len(argv) > 2 else 256

# Large inputs and outputs (Meshy GLBs, Poly Haven assets, .blend files, renders) live outside the repo.
ROOT = os.environ.get("ART_TECHNO_DIR", os.path.expanduser("~/Documents/art_techno"))
RAW = f"{ROOT}/meshy-raw"
PH = f"{ROOT}/polyhaven"
OUT = f"{ROOT}/blender/hero"
os.makedirs(OUT, exist_ok=True)
# View direction from the statue to the camera, as in render_spirits.sh (Computation faces -x).
VIEW = {"computation-engine": Vector((-1, 0, 0.2))}

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
scene = bpy.context.scene
scene.name = NAME

# ---------------------------------------------------------------- statue
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=glob.glob(f"{RAW}/{NAME}_*.glb")[0])
meshes = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
shift = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
for o in meshes:
    if o.parent is None or o.parent not in meshes:
        o.location += shift
for o in [o for o in bpy.data.objects if o not in before and o.type != "MESH" and o.parent is None]:
    o.location += shift
size = hi - lo
H = size.z

# ---------------------------------------------------------------- slate floor
tex = f"{PH}/textures/slate_floor"


def img(node_tree, pattern, non_color):
    path = glob.glob(f"{tex}/*{pattern}*")[0]
    n = node_tree.nodes.new("ShaderNodeTexImage")
    n.image = bpy.data.images.load(path)
    if non_color:
        n.image.colorspace_settings.name = "Non-Color"
    return n


m = bpy.data.materials.new("Slate")
nt = m.node_tree
b = nt.nodes["Principled BSDF"]
tc = nt.nodes.new("ShaderNodeTexCoord")
mp = nt.nodes.new("ShaderNodeMapping")
mp.inputs["Scale"].default_value = (1 / 1.5, 1 / 1.5, 1)  # one 2k tile per 1.5 m (statue units)
nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
diff = img(nt, "Diffuse", False)
rough = img(nt, "Rough", True)
nor = img(nt, "nor_gl", True)
for n in (diff, rough, nor):
    nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
dark = nt.nodes.new("ShaderNodeMix")
dark.data_type = "RGBA"
dark.blend_type = "MULTIPLY"
dark.inputs["Factor"].default_value = 1.0
dark.inputs["B"].default_value = (0.3, 0.3, 0.32, 1)
nt.links.new(diff.outputs["Color"], dark.inputs["A"])
nt.links.new(dark.outputs["Result"], b.inputs["Base Color"])
rr = nt.nodes.new("ShaderNodeMapRange")  # keep it polished: squeeze roughness down
rr.inputs["To Min"].default_value = 0.05
rr.inputs["To Max"].default_value = 0.35
nt.links.new(rough.outputs["Color"], rr.inputs["Value"])
nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
nm = nt.nodes.new("ShaderNodeNormalMap")
nt.links.new(nor.outputs["Color"], nm.inputs["Color"])
nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
bpy.ops.mesh.primitive_plane_add(size=60 * H / 1.9, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "Floor"
floor.data.materials.append(m)

# ---------------------------------------------------------------- studio HDRI, dark to the camera
hdr = (glob.glob(f"{PH}/hdris/*/{HDRI}_4k.hdr") + glob.glob(f"{PH}/hdris/*/{HDRI}_2k.hdr"))[0]
w = bpy.data.worlds.new("Studio")
scene.world = w
wn = w.node_tree
env = wn.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(hdr)
wmap = wn.nodes.new("ShaderNodeMapping")
wmap.inputs["Rotation"].default_value = (0, 0, math.radians(200))
wtc = wn.nodes.new("ShaderNodeTexCoord")
wn.links.new(wtc.outputs["Generated"], wmap.inputs["Vector"])
wn.links.new(wmap.outputs["Vector"], env.inputs["Vector"])
light_bg = wn.nodes["Background"]
wn.links.new(env.outputs["Color"], light_bg.inputs["Color"])
backdrop = wn.nodes.new("ShaderNodeBackground")
backdrop.inputs["Color"].default_value = (0.006, 0.007, 0.01, 1)
lp = wn.nodes.new("ShaderNodeLightPath")
mix = wn.nodes.new("ShaderNodeMixShader")
wn.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
wn.links.new(light_bg.outputs["Background"], mix.inputs[1])
wn.links.new(backdrop.outputs["Background"], mix.inputs[2])
wn.links.new(mix.outputs["Shader"], wn.nodes["World Output"].inputs["Surface"])

# ---------------------------------------------------------------- camera: low three-quarter, fitted
cd = bpy.data.cameras.new("Hero")
cd.lens = 70
cd.sensor_fit = "AUTO"
cam = bpy.data.objects.new("Hero", cd)
scene.collection.objects.link(cam)
scene.camera = cam
scene.render.resolution_x, scene.render.resolution_y = 1080, 1350
half_v = math.atan(cd.sensor_width / 2 / cd.lens)            # portrait: sensor spans the height
half_h = math.atan(math.tan(half_v) * 1080 / 1350)
base = VIEW.get(NAME, Vector((0, -1, 0))).normalized()
az = math.radians(28)
view = Vector((base.x * math.cos(az) - base.y * math.sin(az), base.x * math.sin(az) + base.y * math.cos(az), 0))
target = Vector((0, 0, 0.47 * H))
reach = max(0.62 * H / math.tan(half_v), 0.62 * max(size.x, size.y) / math.tan(half_h))
cam.location = target + view.normalized() * reach + Vector((0, 0, -0.22 * H))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
cd.clip_end = 100 * H

# ---------------------------------------------------------------- render
scene.render.engine = "CYCLES"
p = bpy.context.preferences.addons["cycles"].preferences
p.compute_device_type = "METAL"
p.get_devices()
for d in p.devices:
    d.use = d.type == "METAL"
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy"
scene.render.filepath = f"{OUT}/{NAME}_{HDRI}.png"
bpy.ops.wm.save_as_mainfile(filepath=f"{OUT}/{NAME}.blend")
bpy.ops.render.render(write_still=True)
print("HERO", NAME, HDRI, "H", round(H, 3), "size", [round(v, 3) for v in size])
