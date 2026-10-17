"""Turn a hero shot into a framing print: 10x13 in mat window, 300 dpi, quarter-inch bleed all round.

Run: blender -b hero/<name>.blend --python scripts/blender/print.py -- [samples] [percent] [azimuth_deg]
Open the file hero.py wrote. Saves <name>_print.blend next to it and renders <name>_print.png
(16-bit, tagged 300 dpi). Below 100 percent it is a proof: proofs/<name>_az<deg>.png, no .blend.
Above it is a larger print, <name>_print@2x.png at 200, also with no .blend.
"""
import math
import os
import subprocess
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SAMPLES = int(argv[0]) if len(argv) > 0 else 1024
PCT = int(argv[1]) if len(argv) > 1 else 100

DPI = 300
WIN_IN = (10.0, 13.0)      # mat window
BLEED_IN = 0.25            # print overlaps the mat by this much on each side
FILL = 0.86                # statue bounding box as a fraction of the window, in its binding direction
W = round((WIN_IN[0] + 2 * BLEED_IN) * DPI)
H_PX = round((WIN_IN[1] + 2 * BLEED_IN) * DPI)
WIN = (WIN_IN[0] / (WIN_IN[0] + 2 * BLEED_IN), WIN_IN[1] / (WIN_IN[1] + 2 * BLEED_IN))

# Glowing parts, per Spirit: a box in units of statue height (x, z lower bounds) where green texels emit.
GLOW = {"astra-v2": {"x_min": 0.11, "z_min": 0.84, "strength": 40.0}}
EXPOSURE = 0.3             # the hero shot reads dim on paper
KEY_W = 120.0              # softbox power per square metre of statue height
# Backdrop gradient, linear: behind the figure and at the edges. Lifted so it prints as charcoal, not black.
BACKDROP = ((0.075, 0.078, 0.085), (0.022, 0.023, 0.026))
FILL_W = 25.0              # low fill from the camera's right, so the plinth's dark faces hold detail on paper
VIEW = {"computation-engine": Vector((-1, 0, 0.2))}  # as in hero.py
# Degrees round from VIEW. Most Meshy statues face -y and read best square on (Astra at 0 matches its Grok
# render); Computation, seen from -x, is a flat profile at 0. hero.py uses 28 for all.
AZIMUTH = {"computation-engine": 28.0}

scene = bpy.context.scene
name = scene.name
AZ = float(argv[2]) if len(argv) > 2 else AZIMUTH.get(name, 0.0)
statues = [o for o in scene.objects if o.type == "MESH" and o.name != "Floor"]
floor = bpy.data.objects["Floor"]
cam = scene.camera
cd = cam.data

# ---------------------------------------------------------------- series plinth in place of Meshy's
# Meshy cannot hold a straight edge, so its plinths come out bendy. As in the plaza, cut each figure
# at the top of its own plinth and stand it on the series plinth. top and head are spirits.ts
# ownPlinth values (raw model units); the plinth is build_plaza.py's hex_plinth and fit_tiers, scaled
# from plaza metres to the figure. Keep them in step. A third value is headAt, for the seated Architect.
OWN_PLINTH = {"architect": (0.235, 1.437, 8.0), "computation-engine": (0.335, 1.86), "power-v2": (0.214, 1.4),
              "knowledge-v5": (0.227, 1.82),
              "communication-v2": (0.214, 1.59), "innovation-v5-eureka": (0.262, 1.88),
              "industry-v1": (0.2, 1.35), "life-v3": (0.103, 1.76), "liberty-v5": (0.206, 1.85)}
SERIES_TIERS = (3.2, 2.7, 2.2)
PLINTH_H = 1.4
FIGURE_HEAD = 9.6


def series_mat(name, srgb, metal, rough):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*[c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
                                              for c in srgb], 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    return m


def prism(name, radius, height, z0, material, sides, rot):
    """Upright prism with a corner at angle rot from +x. create_cone puts 6-gon corners at 30 + 60k degrees."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=sides, radius1=radius, radius2=radius, depth=height)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot - math.pi / sides, 3, "Z"), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, z0 + height / 2), verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    me.materials.append(material)
    scene.collection.objects.link(o)
    return o


own = OWN_PLINTH.get(name)
if own:
    top, head, head_at = (*own, FIGURE_HEAD)[:3]
    s = (head - top) / (head_at - PLINTH_H)          # plaza metres -> model units
    for o in statues:
        o.data.transform(o.matrix_world)
        o.matrix_world = Matrix.Identity(4)
    base_pts = [v.co for o in statues for v in o.data.vertices if v.co.z < 0.5 * top]
    cx = (min(p.x for p in base_pts) + max(p.x for p in base_pts)) / 2
    cy = (min(p.y for p in base_pts) + max(p.y for p in base_pts)) / 2
    r = 0.0
    for o in statues:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5,
                               plane_co=(0, 0, top), plane_no=(0, 0, 1), clear_inner=True)
        bmesh.ops.translate(bm, vec=(-cx, -cy, PLINTH_H * s - top), verts=bm.verts)
        for v in bm.verts:                                # fit_tiers: the figure's reach just above the cut
            if v.co.z <= PLINTH_H * s + 0.6 * s:
                r = max(r, math.hypot(v.co.x, v.co.y))
        bm.to_mesh(o.data)
        bm.free()
    t_top = max(SERIES_TIERS[2] * s, (r + 0.35 * s) / math.cos(math.pi / 6))
    tiers = (t_top + 1.0 * s, t_top + 0.5 * s, t_top)
    # A flat face toward the camera's side of the statue, as the plaza turns each pad to the avenue.
    vb = VIEW.get(name, Vector((0, -1, 0)))
    rot = math.atan2(vb.y, vb.x) + math.pi / 2
    gold = series_mat("SeriesGold", (0xD4 / 255, 0xAF / 255, 0x5A / 255), 0.95, 0.25)
    granite = series_mat("SeriesGranite", (0x0d / 255, 0x13 / 255, 0x11 / 255), 0.35, 0.24)
    th = PLINTH_H * s / 3
    studs = bmesh.new()
    for i, R in enumerate(tiers):
        y0 = i * th
        statues.append(prism(f"Plinth.tier{i}", R, th, y0, granite, 6, rot))
        prism(f"Plinth.band{i}a", R + 0.025 * s, 0.06 * s, y0 + th - 0.06 * s, gold, 6, rot)
        prism(f"Plinth.band{i}b", R + 0.025 * s, 0.04 * s, y0, gold, 6, rot)
        apothem = R * math.cos(math.pi / 6)
        n = max(3, math.floor(R / s / 0.34))
        for f in range(6):
            psi = math.radians(30 + 60 * f) + rot
            nx, ny = math.cos(psi), math.sin(psi)
            for j in range(n):
                along = ((j + 0.5) / n - 0.5) * R * 0.86
                c = Vector((nx * (apothem + 0.01 * s) - ny * along, ny * (apothem + 0.01 * s) + nx * along,
                            y0 + th * 0.48))
                bmesh.ops.create_uvsphere(studs, u_segments=12, v_segments=8, radius=0.075 * s,
                                          matrix=Matrix.Translation(c))
    sme = bpy.data.meshes.new("Plinth.studs")
    studs.to_mesh(sme)
    studs.free()
    for p in sme.polygons:
        p.use_smooth = True
    sme.materials.append(gold)
    so = bpy.data.objects.new("Plinth.studs", sme)
    scene.collection.objects.link(so)

# ---------------------------------------------------------------- statue points
parts = []
for o in statues:
    c = np.empty(len(o.data.vertices) * 3)
    o.data.vertices.foreach_get("co", c)
    M = np.array(o.matrix_world)
    parts.append(c.reshape(-1, 3) @ M[:3, :3].T + M[:3, 3])
co = np.concatenate(parts)
H = float(co[:, 2].max())
pts = [Vector(p) for part in parts for p in part[::25 if len(part) > 5000 else 1]]  # every plinth corner

# ---------------------------------------------------------------- backdrop: one window-space gradient
# The same node group colors the camera's view of the world and the far floor, so there is no horizon.
grad = bpy.data.node_groups.new("PrintBackdrop", "ShaderNodeTree")
grad.interface.new_socket("Window", in_out="INPUT", socket_type="NodeSocketVector")
grad.interface.new_socket("Color", in_out="OUTPUT", socket_type="NodeSocketColor")
gi = grad.nodes.new("NodeGroupInput")
go = grad.nodes.new("NodeGroupOutput")
centre = grad.nodes.new("ShaderNodeVectorMath")
centre.operation = "SUBTRACT"
centre.inputs[1].default_value = (0.5, 0.58, 0)
aspect = grad.nodes.new("ShaderNodeVectorMath")
aspect.operation = "MULTIPLY"
aspect.inputs[1].default_value = (W / H_PX, 1, 0)
dist = grad.nodes.new("ShaderNodeVectorMath")
dist.operation = "LENGTH"
ramp = grad.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.interpolation = "EASE"
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[0].color = (*BACKDROP[0], 1)
ramp.color_ramp.elements[1].position = 0.75
ramp.color_ramp.elements[1].color = (*BACKDROP[1], 1)
grad.links.new(gi.outputs["Window"], centre.inputs[0])
grad.links.new(centre.outputs[0], aspect.inputs[0])
grad.links.new(aspect.outputs[0], dist.inputs[0])
grad.links.new(dist.outputs["Value"], ramp.inputs["Fac"])
grad.links.new(ramp.outputs["Color"], go.inputs["Color"])

wn = scene.world.node_tree
backdrop = next(n for n in wn.nodes if n.type == "BACKGROUND" and not n.inputs["Color"].is_linked)
wtc = wn.nodes.new("ShaderNodeTexCoord")
wg = wn.nodes.new("ShaderNodeGroup")
wg.node_tree = grad
wn.links.new(wtc.outputs["Window"], wg.inputs["Window"])
wn.links.new(wg.outputs["Color"], backdrop.inputs["Color"])

# ---------------------------------------------------------------- floor: polished slate near, backdrop far
fm = floor.active_material
fn = fm.node_tree
slate_out = fn.nodes["Material Output"].inputs["Surface"].links[0].from_socket
ftc = fn.nodes.new("ShaderNodeTexCoord")
fg = fn.nodes.new("ShaderNodeGroup")
fg.node_tree = grad
fn.links.new(ftc.outputs["Window"], fg.inputs["Window"])
far = fn.nodes.new("ShaderNodeEmission")
fn.links.new(fg.outputs["Color"], far.inputs["Color"])
lp = fn.nodes.new("ShaderNodeLightPath")
black = fn.nodes.new("ShaderNodeBsdfDiffuse")
black.inputs["Color"].default_value = (0, 0, 0, 1)
seen = fn.nodes.new("ShaderNodeMixShader")       # far floor shows the backdrop only to the camera
fn.links.new(lp.outputs["Is Camera Ray"], seen.inputs["Fac"])
fn.links.new(black.outputs["BSDF"], seen.inputs[1])
fn.links.new(far.outputs["Emission"], seen.inputs[2])
# Fade by height in the frame, not by distance: from a low camera the far floor is a sliver under
# the horizon, so a distance fade shows as a hard line. The range is set after the camera fit.
wy = fn.nodes.new("ShaderNodeSeparateXYZ")
fn.links.new(ftc.outputs["Window"], wy.inputs["Vector"])
fade = fn.nodes.new("ShaderNodeMapRange")
fade.interpolation_type = "SMOOTHSTEP"
fn.links.new(wy.outputs["Y"], fade.inputs["Value"])
# Below the plinth too: the slate mirrors the dark studio and prints as a black band, so keep
# only a strip at the plinth's foot for the contact reflection.
fade_low = fn.nodes.new("ShaderNodeMapRange")
fade_low.interpolation_type = "SMOOTHSTEP"
fade_low.inputs["To Min"].default_value = 1.0
fade_low.inputs["To Max"].default_value = 0.0
fn.links.new(wy.outputs["Y"], fade_low.inputs["Value"])
both = fn.nodes.new("ShaderNodeMath")
both.operation = "MAXIMUM"
fn.links.new(fade.outputs["Result"], both.inputs[0])
fn.links.new(fade_low.outputs["Result"], both.inputs[1])
fmix = fn.nodes.new("ShaderNodeMixShader")
fn.links.new(both.outputs["Value"], fmix.inputs["Fac"])
fn.links.new(slate_out, fmix.inputs[1])
fn.links.new(seen.outputs["Shader"], fmix.inputs[2])
fn.links.new(fmix.outputs["Shader"], fn.nodes["Material Output"].inputs["Surface"])

# ---------------------------------------------------------------- glow: green texels inside the box emit
g = GLOW.get(name)
for mat in {m for o in statues for m in o.data.materials if m and m.use_nodes} if g else ():
    sn = mat.node_tree
    bsdf = next(n for n in sn.nodes if n.type == "BSDF_PRINCIPLED")
    base = bsdf.inputs["Base Color"].links[0].from_socket
    sep = sn.nodes.new("ShaderNodeSeparateColor")
    sn.links.new(base, sep.inputs["Color"])
    rb = sn.nodes.new("ShaderNodeMath")
    rb.operation = "MAXIMUM"
    sn.links.new(sep.outputs["Red"], rb.inputs[0])
    sn.links.new(sep.outputs["Blue"], rb.inputs[1])
    green = sn.nodes.new("ShaderNodeMath")
    green.operation = "SUBTRACT"
    sn.links.new(sep.outputs["Green"], green.inputs[0])
    sn.links.new(rb.outputs["Value"], green.inputs[1])
    gmask = sn.nodes.new("ShaderNodeMapRange")
    gmask.inputs["From Min"].default_value = 0.02
    gmask.inputs["From Max"].default_value = 0.08
    sn.links.new(green.outputs["Value"], gmask.inputs["Value"])
    sgeo = sn.nodes.new("ShaderNodeNewGeometry")
    spos = sn.nodes.new("ShaderNodeSeparateXYZ")
    sn.links.new(sgeo.outputs["Position"], spos.inputs["Vector"])
    inx = sn.nodes.new("ShaderNodeMath")
    inx.operation = "GREATER_THAN"
    inx.inputs[1].default_value = g["x_min"] * H
    sn.links.new(spos.outputs["X"], inx.inputs[0])
    inz = sn.nodes.new("ShaderNodeMath")
    inz.operation = "GREATER_THAN"
    inz.inputs[1].default_value = g["z_min"] * H
    sn.links.new(spos.outputs["Z"], inz.inputs[0])
    m1 = sn.nodes.new("ShaderNodeMath")
    m1.operation = "MULTIPLY"
    sn.links.new(inx.outputs["Value"], m1.inputs[0])
    sn.links.new(inz.outputs["Value"], m1.inputs[1])
    m2 = sn.nodes.new("ShaderNodeMath")
    m2.operation = "MULTIPLY"
    sn.links.new(m1.outputs["Value"], m2.inputs[0])
    sn.links.new(gmask.outputs["Result"], m2.inputs[1])
    # Not seen in glossy rays: the gold facets would mirror the chip as a hard square.
    slp = sn.nodes.new("ShaderNodeLightPath")
    notgloss = sn.nodes.new("ShaderNodeMath")
    notgloss.operation = "SUBTRACT"
    notgloss.inputs[0].default_value = 1.0
    sn.links.new(slp.outputs["Is Glossy Ray"], notgloss.inputs[1])
    m3 = sn.nodes.new("ShaderNodeMath")
    m3.operation = "MULTIPLY"
    sn.links.new(m2.outputs["Value"], m3.inputs[0])
    sn.links.new(notgloss.outputs["Value"], m3.inputs[1])
    strength = sn.nodes.new("ShaderNodeMath")
    strength.operation = "MULTIPLY"
    strength.inputs[1].default_value = g["strength"]
    sn.links.new(m3.outputs["Value"], strength.inputs[0])
    sn.links.new(base, bsdf.inputs["Emission Color"])
    sn.links.new(strength.outputs["Value"], bsdf.inputs["Emission Strength"])

# ---------------------------------------------------------------- camera: fit the statue to the window
scene.render.resolution_x, scene.render.resolution_y = W, H_PX
scene.render.resolution_percentage = PCT
cd.shift_x = cd.shift_y = 0
base = VIEW.get(name, Vector((0, -1, 0))).normalized()
az = math.radians(AZ)
view = Vector((base.x * math.cos(az) - base.y * math.sin(az), base.x * math.sin(az) + base.y * math.cos(az), 0)).normalized()
target = Vector((0, 0, 0.47 * H))
d = 3 * H
for _ in range(8):
    cam.location = target + view * d + Vector((0, 0, -0.22 * H))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()
    ndc = [world_to_camera_view(scene, cam, p) for p in pts]
    xs, ys = [v.x for v in ndc], [v.y for v in ndc]
    sx, sy = max(xs) - min(xs), max(ys) - min(ys)
    d *= max(sx / (FILL * WIN[0]), sy / (FILL * WIN[1]))
    # Shift is measured in the larger frame dimension (the height, in portrait).
    cd.shift_x += ((max(xs) + min(xs)) / 2 - 0.5) * W / H_PX
    cd.shift_y += (max(ys) + min(ys)) / 2 - 0.5
ndc = [world_to_camera_view(scene, cam, p) for p in pts]
base_y = min(v.y for v in ndc)                    # bottom of the plinth in the frame
fade.inputs["From Min"].default_value = base_y - 0.05
fade.inputs["From Max"].default_value = base_y + 0.01
fade_low.inputs["From Min"].default_value = base_y - 0.04
fade_low.inputs["From Max"].default_value = base_y - 0.005

# ---------------------------------------------------------------- glow: bloom around the chip
if g:
    comp = bpy.data.node_groups.new("PrintBloom", "CompositorNodeTree")
    comp.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = comp.nodes.new("CompositorNodeRLayers")
    glare = comp.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Quality"].default_value = "High"
    glare.inputs["Threshold"].default_value = 1.5
    glare.inputs["Strength"].default_value = 1.0
    glare.inputs["Size"].default_value = 0.6
    gout = comp.nodes.new("NodeGroupOutput")
    comp.links.new(rl.outputs["Image"], glare.inputs["Image"])
    comp.links.new(glare.outputs["Image"], gout.inputs["Image"])
    scene.compositing_node_group = comp

# ---------------------------------------------------------------- key: a softbox high on the camera's left
kd = bpy.data.lights.new("Key", "AREA")
kd.shape = "RECTANGLE"
kd.size, kd.size_y = 0.6 * H, 1.0 * H
kd.energy = KEY_W * H * H
kd.color = (1.0, 0.95, 0.88)
key = bpy.data.objects.new("Key", kd)
left = view.cross(Vector((0, 0, 1))).normalized()
key.location = target + (view * math.cos(math.radians(45)) - left * math.sin(math.radians(45))) * 2.2 * H + Vector((0, 0, 1.2 * H))
key.rotation_euler = (target - key.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(key)
fd = bpy.data.lights.new("Fill", "AREA")
fd.size = 1.5 * H
fd.energy = FILL_W * H * H
fd.color = (0.9, 0.95, 1.0)
fill = bpy.data.objects.new("Fill", fd)
fill.location = target + (view * math.cos(math.radians(40)) + left * math.sin(math.radians(40))) * 2.5 * H + Vector((0, 0, -0.2 * H))
fill.rotation_euler = (Vector((0, 0, 0.2 * H)) - fill.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(fill)

# ---------------------------------------------------------------- render
scene.cycles.samples = SAMPLES
scene.cycles.adaptive_threshold = 0.005
scene.view_settings.exposure = EXPOSURE
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_depth = "16"
scene.render.image_settings.compression = 15
if PCT < 100:
    out = bpy.path.abspath(f"//proofs/{name}_az{AZ:g}.png")
elif PCT > 100:                                    # for large prints: same 300 dpi tag, so 21x27 in at 200
    out = bpy.path.abspath(f"//{name}_print@{PCT / 100:g}x.png")
else:
    out = bpy.path.abspath(f"//{name}_print.png")
    bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backup
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(f"//{name}_print.blend"))
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
subprocess.run(["sips", "-s", "dpiWidth", str(DPI), "-s", "dpiHeight", str(DPI), out], check=True,
               stdout=subprocess.DEVNULL)
print("PRINT", name, f"{W}x{H_PX} @ {PCT}%", "samples", SAMPLES, "az", AZ, "d", round(d, 3),
      "shift", round(cd.shift_x, 3), round(cd.shift_y, 3), "->", out)
