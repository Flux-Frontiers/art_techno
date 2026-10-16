"""Build the Art Techno plaza in Blender from the web app's layout (web/src/spirits.ts, Plaza.tsx, Statue.tsx).

Web axes are y-up with the avenue along z; Blender is z-up, so web (x, y, z) -> Blender (x, -z, y).
A three.js rotation about y by t is a Blender rotation about z by t.

Run: blender -b --factory-startup --python scripts/blender/build_plaza.py
Writes $ART_TECHNO_DIR/blender/plaza.blend (default root: ~/Documents/art_techno).
"""
import glob
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

# Large inputs and outputs (Meshy GLBs, Poly Haven assets, .blend files, renders) live outside the repo.
ROOT = os.environ.get("ART_TECHNO_DIR", os.path.expanduser("~/Documents/art_techno"))
RAW = f"{ROOT}/meshy-raw"
OUT = f"{ROOT}/blender/plaza.blend"

SIDE_X = 16
ROWS = [30, 12, -6, -24]
FIGURE_HEAD = 9.6
PAD_TOP = 0.3
SERIES_TIERS = (3.2, 2.7, 2.2)
PROC = dict(x=0, z=3, half=5.5)
GRAND = dict(x=0, z=-52, halfX=14, halfZ=12, height=3, steps=6, stairHalf=8)
BOUNDS = dict(minX=-32, maxX=32, minZ=-64, maxZ=54)

# id, raw GLB prefix, web x, web z, height, pad, base, ownPlinth, shiftX
SPIRITS = [
    ("computation", "computation-engine", -SIDE_X, ROWS[0], 12, 4.5, 0,
     dict(top=0.335, cx=0, cz=0, head=1.86, turn=0), 0),  # web: pi/2; the raw Meshy export needs none
    ("power", "power-v2", SIDE_X, ROWS[0], 12, 4.5, 0, dict(top=0.214, cx=0, cz=0.043, head=1.4), 0),
    ("knowledge", "knowledge-v5", -SIDE_X, ROWS[1], 12, 4.5, 0, dict(top=0.227, cx=-0.11, cz=0, head=1.82), 0),
    ("communication", "communication-v2", SIDE_X, ROWS[1], 12, 4.5, 0, dict(top=0.214, cx=0, cz=-0.011, head=1.59), 0),
    ("innovation", "innovation-v5-eureka", -SIDE_X, ROWS[2], 12, 4.5, 0, dict(top=0.262, cx=0, cz=0, head=1.88), 0),
    ("industry", "industry-v1", SIDE_X, ROWS[2], 12, 4.5, 0, dict(top=0.2, cx=0.005, cz=0, head=1.35), 0),
    ("life", "life-v3", -SIDE_X, ROWS[3], 12, 4.5, 0, dict(top=0.103, cx=-0.01, cz=0, head=1.76), 0),
    ("liberty", "liberty-v5", SIDE_X, ROWS[3], 12, 4.5, 0, dict(top=0.206, cx=0.012, cz=-0.025, head=1.85), 0),
    ("astra", "astra-v2", GRAND["x"], GRAND["z"], 24, 11.5, GRAND["height"], None, 0),
]
PLINTH_H = 1.4


def hexcol(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


def mat(name, color, metal=0.0, rough=0.5, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexcol(color)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = hexcol(emit)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


GOLD = mat("Gold", "#D4AF5A", 0.95, 0.25)
GRANITE = mat("Granite", "#0d1311", 0.35, 0.24)
PANEL = mat("Panel", "#121A17", 0.4, 0.4)
STONE = mat("TerraceStone", "#121a17", 0.3, 0.35)
GREEN = mat("ChipGreen", "#2F8F74", 0.3, 0.45)
LENS = mat("LampLens", "#ffdca6", 0, 0.5, "#ffdca6", 8.0)
DIE = mat("DieGlow", "#fff2cc", 0, 0.5, "#fff2cc", 2.5)
TRACE_GOLD = mat("TraceGold", "#D4AF5A", 0.8, 0.35, "#D4AF5A", 0.55)
TRACE_COPPER = mat("TraceCopper", "#C77C48", 0.8, 0.35, "#C77C48", 0.5)
VIA = mat("Via", "#D4AF5A", 0.7, 0.3, "#F0D58E", 0.9)

scene = bpy.context.scene
scene.name = "Plaza"
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)


def coll(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c


C_STATUES, C_ARCH, C_LIGHTS, C_CAMS = coll("Statues"), coll("Architecture"), coll("Lights"), coll("Cameras")


def box(name, size, loc, material, c=C_ARCH, parent=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    o.location = loc
    me.materials.append(material)
    c.objects.link(o)
    if parent:
        o.parent = parent
    return o


def prism(name, radius, height, z0, material, sides, c, parent, cap=True):
    """Upright prism with its first corner on +x (flat faces toward +-y for 6 sides)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, segments=sides, radius1=radius, radius2=radius, depth=height)
    bmesh.ops.translate(bm, vec=(0, 0, z0 + height / 2), verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    me.materials.append(material)
    c.objects.link(o)
    o.parent = parent
    return o


def web(x, z, y=0.0):
    return Vector((x, -z, y))


# ---------------------------------------------------------------- floor
# Paving and city floor are drawn as images exactly as the web app's canvases (textures.ts
# pavingTexture, cityTexture); traces follow Plaza.tsx traceRoutes.
w = BOUNDS["maxX"] - BOUNDS["minX"] + 4
d = BOUNDS["maxZ"] - BOUNDS["minZ"] + 4
cz = (BOUNDS["maxZ"] + BOUNDS["minZ"]) / 2


def hex255(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def disc_dist(px, py, cx, cy):
    return np.hypot(px - cx, py - cy)


def seg_dist(px, py, a, b):
    ax, ay = a
    bx, by = b
    vx, vy = bx - ax, by - ay
    t = np.clip(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy), 0, 1)
    return np.hypot(px - (ax + t * vx), py - (ay + t * vy))


def image_from(name, rgba):
    n = rgba.shape[0]
    im = bpy.data.images.new(name, n, n, alpha=True)
    im.pixels.foreach_set(rgba.ravel())
    im.pack()
    return im


def paving_image():
    """One 8 m tile, 1024 px: 2 m slabs, grout, gold hairline at the tile edge, vias at its corners.
    Rows run along web +z, columns along web +x. Alpha carries the gold mask."""
    N = 1024
    p = np.arange(N)
    I, J = np.meshgrid(p // 256, p // 256)
    v = 14 + ((7 * I + 13 * J) % 5)
    rgba = np.zeros((N, N, 4), np.float32)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = (v - 2) / 255, (v + 4) / 255, (v + 1) / 255
    g = np.minimum(p % 256, 256 - p % 256) < 3
    rgba[g[None, :] | g[:, None], :3] = hex255("#070A09")
    e = np.minimum(p, N - p) < 3
    edge = e[None, :] | e[:, None]
    rgba[edge, :3] = hex255("#786536")
    rgba[edge, 3] = 0.55
    dx = np.minimum(p, N - p).astype(np.float32)
    D = np.hypot(dx[None, :], dx[:, None])
    rgba[D < 14, :3] = hex255("#D4AF5A")
    rgba[D < 14, 3] = 1.0
    rgba[D < 6, :3] = hex255("#070A09")
    rgba[D < 6, 3] = 0.0
    return image_from("PavingTile", rgba)


def city_image():
    """One 48 m city tile, 1024 px: streets on a 12 m grid, vias at crossings, three gold traces."""
    N, M = 1024, 48.0
    ppm = N / M
    c = (np.arange(N) + 0.5) / ppm
    X, Z = np.meshgrid(c, c)
    rgba = np.zeros((N, N, 4), np.float32)
    rgba[..., 3] = 1
    for coord in (X, Z):
        off = (coord - 0.5625) % 12
        off = np.minimum(off, 12 - off)
        rgba[(np.abs(off - 0.469) < 0.117), :3] = hex255("#3A2210")
        rgba[off < 0.0655, :3] = hex255("#4A3A1C")
    for gx in range(4):
        for gz in range(4):
            rgba[disc_dist(X, Z, gx * 12 + 0.5625, gz * 12 + 0.5625) < 0.375, :3] = hex255("#4A3418")
    for poly in ([(6, 3), (9, 3), (13, 7), (16, 7)], [(30, 27), (34, 27), (38, 31), (42, 31)],
                 [(18, 39), (21, 39), (25, 43), (28, 43)]):
        for a, b in zip(poly, poly[1:]):
            rgba[seg_dist(X, Z, a, b) < 0.094, :3] = hex255("#5C4A22")
        for q in (poly[0], poly[-1]):
            rgba[disc_dist(X, Z, *q) < 0.375, :3] = hex255("#6E5A2C")
    return image_from("CityTile", rgba)


def tiled(nt, image, scale, loc):
    """Image node fed by Object coordinates: u = x*scale[0] + loc[0], v = y*scale[1] + loc[1]."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale[0], scale[1], 1)
    mp.inputs["Location"].default_value = (loc[0], loc[1], 0)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.extension = "REPEAT"
    nt.links.new(mp.outputs["Vector"], tex.inputs["Vector"])
    return tex


city = bpy.data.materials.new("CityFloor")
nt = city.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = hexcol("#030504")
b.inputs["Roughness"].default_value = 1.0
# Plane at the origin: object x = web x, object y = -web z; one tile per 48 m.
ctex = tiled(nt, city_image(), (1 / 48, -1 / 48), (0, 0))
nt.links.new(ctex.outputs["Color"], b.inputs["Emission Color"])
b.inputs["Emission Strength"].default_value = 0.75
bpy.ops.mesh.primitive_plane_add(size=2400, location=(0, 0, -0.02))
o = bpy.context.active_object
o.name = "CityFloor"
o.data.materials.append(city)
for c in o.users_collection:
    c.objects.unlink(o)
C_ARCH.objects.link(o)

paving = bpy.data.materials.new("Paving")
nt = paving.node_tree
b = nt.nodes["Principled BSDF"]
# Plane centred at web z = cz: object x = web x, web z = -(object y) - cz... tile lines at web x = -34 + 8k
# and web z = 0 mod 8, so u = (x + 34)/8, v = web z / 8 = (-y - cz)/8.
ptex = tiled(nt, paving_image(), (1 / 8, -1 / 8), (34 / 8, -cz / 8))
nt.links.new(ptex.outputs["Color"], b.inputs["Base Color"])
met = nt.nodes.new("ShaderNodeMapRange")
met.inputs["To Min"].default_value = 0.25
met.inputs["To Max"].default_value = 0.9
nt.links.new(ptex.outputs["Alpha"], met.inputs["Value"])
nt.links.new(met.outputs["Result"], b.inputs["Metallic"])
rou = nt.nodes.new("ShaderNodeMapRange")
rou.inputs["To Min"].default_value = 0.6
rou.inputs["To Max"].default_value = 0.3
nt.links.new(ptex.outputs["Alpha"], rou.inputs["Value"])
nt.links.new(rou.outputs["Result"], b.inputs["Roughness"])
bpy.ops.mesh.primitive_plane_add(size=1, location=web(0, cz))
o = bpy.context.active_object
o.name = "Paving"
o.scale = (w, d, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
o.data.materials.append(paving)
for c in o.users_collection:
    c.objects.unlink(o)
C_ARCH.objects.link(o)

for i, (x, z, sx, sz) in enumerate([
    (0, BOUNDS["maxZ"] + 2, w + 0.4, 0.4), (0, BOUNDS["minZ"] - 2, w + 0.4, 0.4),
    (BOUNDS["maxX"] + 2, cz, 0.4, d), (BOUNDS["minX"] - 2, cz, 0.4, d),
]):
    box(f"Kerb.{i}", (sx, sz, 0.24), web(x, z, 0.12), GOLD)

# ---------------------------------------------------------------- processor dais
h = PROC["half"]
P = web(PROC["x"], PROC["z"])
box("Dais", (2 * h, 2 * h, 0.4), P + Vector((0, 0, 0.2)), PANEL)
box("DaisGold", (2 * h - 0.3, 2 * h - 0.3, 0.02), P + Vector((0, 0, 0.41)), GOLD)
box("Chip", (7, 7, 0.4), P + Vector((0, 0, 0.6)), GREEN)
box("ChipLid", (4.2, 4.2, 0.08), P + Vector((0, 0, 0.82)), GOLD)
box("Die", (3, 3, 0.1), P + Vector((0, 0, 0.9)), DIE)
# 52 pins, 13 a side, 0.28 x 0.9, reaching 0.85 m out past the dais edge
for side in range(4):
    for j in range(13):
        t = -4.5 + 0.75 * j
        if side < 2:
            box(f"Pin.{side}.{j}", (0.28, 0.9, 0.14), P + Vector((t, 5.9 if side else -5.9, 0.08)), GOLD)
        else:
            box(f"Pin.{side}.{j}", (0.9, 0.28, 0.14), P + Vector((5.9 if side == 2 else -5.9, t, 0.08)), GOLD)

# ---------------------------------------------------------------- grand terrace
T = GRAND
TC = web(T["x"], T["z"])
box("Terrace", (2 * T["halfX"], 2 * T["halfZ"], T["height"]), TC + Vector((0, 0, T["height"] / 2)), STONE)
box("TerraceRail", (2 * T["halfX"], 0.3, 0.05), TC + Vector((0, -(T["halfZ"] - 0.15), T["height"] + 0.02)), GOLD)
rise, depth = T["height"] / T["steps"], 0.9
for i in range(T["steps"]):
    hh = rise * (i + 1)
    zz = T["halfZ"] + (T["steps"] - i) * depth - depth / 2
    box(f"Step.{i}", (2 * T["stairHalf"], depth, hh), TC + Vector((0, -zz, hh / 2)), STONE)
    box(f"Nosing.{i}", (2 * T["stairHalf"], 0.12, 0.06), TC + Vector((0, -(zz + depth / 2 - 0.05), hh)), GOLD)

# ---------------------------------------------------------------- traces (Plaza.tsx traceRoutes)
BUS_PITCH, BUS_W = 0.36, 0.15
C_TRACES = coll("Traces")


def bar(name, a, b, width, material, z=0.015, thick=0.03):
    """A trace segment between web points a, b: Box(w, 0.03, len + 0.9 w), as in the web app."""
    A, B = web(*a), web(*b)
    v = B - A
    o = box(name, (v.length + 0.9 * width, width, thick), (A + B) / 2 + Vector((0, 0, z)), material, C_TRACES)
    o.rotation_euler = (0, 0, math.atan2(v.y, v.x))
    return o


def via(name, q, zbase=0.0):
    o = prism(name, 0.17, 0.04, zbase, VIA, 14, C_TRACES, None)
    o.location = web(*q)
    return o


def offset_path(pts, dd):
    """Mitred offset of a polyline in web (x, z) by dd along its left normal (-dz, dx)/L."""
    def nrm(a, b):
        dx, dz = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dz)
        return (-dz / L, dx / L)
    out = []
    for i, q in enumerate(pts):
        if i == 0:
            n = nrm(pts[0], pts[1])
            out.append((q[0] + n[0] * dd, q[1] + n[1] * dd))
        elif i == len(pts) - 1:
            n = nrm(pts[-2], pts[-1])
            out.append((q[0] + n[0] * dd, q[1] + n[1] * dd))
        else:
            n1, n2 = nrm(pts[i - 1], q), nrm(q, pts[i + 1])
            k = 1 + n1[0] * n2[0] + n1[1] * n2[1]
            out.append((q[0] + (n1[0] + n2[0]) / k * dd, q[1] + (n1[1] + n2[1]) / k * dd))
    return out


def bus(name, pts, copper):
    for li, dd in enumerate((-BUS_PITCH, 0.0, BUS_PITCH)):
        line = offset_path(pts, dd)
        centre = li == 1
        material = TRACE_GOLD if centre or not copper else TRACE_COPPER
        width = BUS_W * 0.6 if centre else BUS_W
        for si, (a, b_) in enumerate(zip(line, line[1:])):
            bar(f"{name}.{li}.{si}", a, b_, width, material)
        via(f"{name}.{li}.via0", line[0])
        via(f"{name}.{li}.via1", line[-1])


pz, edge = PROC["z"], PROC["half"] + 0.6
for sid, _prefix, x, z, _h, pad, _base, _op, _sx in SPIRITS:
    if sid == "astra":
        continue
    sx = 1 if x > 0 else -1
    sg = 1 if z - pz > 0 else -1
    near = abs(z - pz) < 15
    lane, off = (10.2, 0.7) if near else (8.4, 2.2)
    pad_edge = abs(x) - pad - 0.1
    bus(f"Route.{sid}", [(sx * edge, pz + sg * off), (sx * lane, pz + sg * (off + lane - edge)),
                         (sx * lane, z - sg * (pad_edge - lane)), (sx * pad_edge, z)], near)
stair_foot = T["z"] + T["halfZ"] + T["steps"] * depth
for x in (-1.6, 1.6):
    bus(f"Avenue.{x}", [(x, BOUNDS["maxZ"]), (x, pz + edge)], x > 0)
    bus(f"North.{x}", [(x, pz - edge), (x, stair_foot)], x > 0)
# The two central buses climb the stair (tread and riser strips) and cross the terrace to Ad Astra's pad.
terrace_front = T["z"] + T["halfZ"]
for x in (-1.6, 1.6):
    for li, lx in enumerate((x - BUS_PITCH, x, x + BUS_PITCH)):
        centre = li == 1
        material = TRACE_GOLD if centre or x < 0 else TRACE_COPPER
        width = BUS_W * 0.6 if centre else BUS_W
        for i in range(T["steps"]):
            hh = rise * (i + 1)
            zc = T["z"] + T["halfZ"] + (T["steps"] - i) * depth - depth / 2
            box(f"Tread.{lx:.2f}.{i}", (width, depth, 0.03), web(lx, zc, hh + 0.016), material, C_TRACES)
            box(f"Riser.{lx:.2f}.{i}", (width, 0.03, rise + 0.03), web(lx, zc + depth / 2 + 0.016, hh - rise / 2 + 0.015),
                material, C_TRACES)
        box(f"Top.{lx:.2f}", (width, 0.3, 0.03), web(lx, terrace_front - 0.15, T["height"] + 0.016), material, C_TRACES)
        via(f"Top.{lx:.2f}.via", (lx, terrace_front - 0.3), T["height"])


# ---------------------------------------------------------------- lettering and inlays
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
F_DISPLAY = bpy.data.fonts.load(f"{FONTS}/JosefinSans-SemiBold.ttf")
F_MONO = bpy.data.fonts.load(f"{FONTS}/IBMPlexMono-Regular.ttf")
F_SCRIPT = bpy.data.fonts.load(f"{FONTS}/PinyonScript-Regular.ttf")
COPPER = mat("Copper", "#C77C48", 0.85, 0.3)
MINT = mat("Mint", "#7FBFA8", 0.2, 0.45)
OBSIDIAN = mat("Obsidian", "#0B100E", 0.3, 0.65)
SILK = mat("Silk", "#EDE6D3", 0.0, 0.5)
SHADOW = mat("Shadow", "#000000", 0.0, 0.8)
NAMES = {
    "computation": ("Spirit of Computation", "The engine of calculation"),
    "power": ("Spirit of Power", "Energy"),
    "knowledge": ("Spirit of Knowledge", "Wisdom, sent out"),
    "communication": ("Spirit of Communication", "Connection"),
    "innovation": ("Spirit of Innovation", "Invention"),
    "industry": ("Spirit of Industry", "Labor, the Builder"),
    "life": ("Spirit of Life", "Biology meets computation"),
    "liberty": ("Spirit of Liberty", "Freedom"),
    "astra": ("Ad Astra per Aspera", "Aspiration"),
}


def spaced(t):
    return " ".join(t)


def text(name, body, font, size, loc, material, parent=None, c=C_ARCH, max_width=None):
    """Flat lettering lying on the XY plane, centred on loc, baseline at loc, reading toward +y."""
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.font = font
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "TOP_BASELINE"
    cu.extrude = 0.0015
    cu.materials.append(material)
    o = bpy.data.objects.new(name, cu)
    c.objects.link(o)
    o.parent = parent
    o.location = loc
    if max_width:
        bpy.context.view_layer.update()
        if o.dimensions.x > max_width:  # shrink to fit, as the web app's fit()
            cu.size = size * max_width / o.dimensions.x
    return o


def slab(name, size, loc, material, parent=None, c=C_ARCH):
    return box(name, size, loc, material, c, parent)


def annulus(name, r_in, r_out, loc, thick, material, c=C_ARCH, segments=96):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    outer = [bm.verts.new((r_out * math.cos(a), r_out * math.sin(a), 0)) for a in
             (2 * math.pi * i / segments for i in range(segments))]
    inner = [bm.verts.new((r_in * math.cos(a), r_in * math.sin(a), 0)) for a in
             (2 * math.pi * i / segments for i in range(segments))]
    for i in range(segments):
        j = (i + 1) % segments
        bm.faces.new((outer[i], outer[j], inner[j], inner[i]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    me.materials.append(material)
    c.objects.link(o)
    o.location = loc
    return o


def pad_top(sid, parent, p):
    """The pad's chip-package top (textures.ts padTexture): frames, corner vias, front pins, name.
    Canvas px (u right, v down, 1024 square) map to pad-local metres; canvas bottom is the pad's front."""
    s_ = 2 * p / 1024
    z = 0.3

    def at(u, v):
        return ((u - 512) * s_, (512 - v) * s_)

    for nm, half, lw, material in (("gold", 488, 10, GOLD), ("copper", 464, 3, COPPER)):
        L, W = 2 * half * s_ + lw * s_, lw * s_
        for k, (x, y, sx, sy) in enumerate(((0, half * s_, L, W), (0, -half * s_, L, W),
                                            (half * s_, 0, W, L), (-half * s_, 0, W, L))):
            slab(f"{sid}.frame.{nm}.{k}", (sx, sy, 0.006), (x, y, z + 0.003), material, parent, C_STATUES)
    for u, v in ((48, 48), (976, 48), (48, 976), (976, 976)):
        x, y = at(u, v)
        d1 = prism(f"{sid}.cornervia", 18 * s_, 0.008, z, GOLD, 24, C_STATUES, parent)
        d1.location = (x, y, 0)
        d2 = prism(f"{sid}.cornerhole", 7 * s_, 0.010, z, OBSIDIAN, 24, C_STATUES, parent)
        d2.location = (x, y, 0)
    for u in range(120, 905, 56):
        x, y = at(u, 1007)
        slab(f"{sid}.pin", (20 * s_, 34 * s_, 0.008), (x, y, z + 0.004), GOLD, parent, C_STATUES)
    name, allegory = NAMES[sid]
    text(f"{sid}.title", spaced(name.upper()), F_DISPLAY, 58 * s_, (*at(512, 900), z + 0.004), GOLD,
         parent, C_STATUES, max_width=860 * s_)
    text(f"{sid}.allegory", spaced(allegory.upper()), F_MONO, 30 * s_, (*at(512, 950), z + 0.004), MINT,
         parent, C_STATUES, max_width=860 * s_)


# ---------------------------------------------------------------- statues
def import_glb(prefix):
    path = glob.glob(f"{RAW}/{prefix}_Meshy_AI_*.glb") or glob.glob(f"{RAW}/{prefix}_*.glb")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path[0])
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def fit_tiers(me, cut):
    r = 0.0
    for v in me.vertices:
        if cut <= v.co.z <= cut + 0.6:
            r = max(r, math.hypot(v.co.x, v.co.y))
    top = max(SERIES_TIERS[2], (r + 0.35) / math.cos(math.pi / 6))
    return (top + 1.0, top + 0.5, top)


def hex_plinth(name, height, tiers, parent):
    th = height / 3
    studs = bmesh.new()
    for i, R in enumerate(tiers):
        y0 = i * th
        prism(f"{name}.tier{i}", R, th, y0, GRANITE, 6, C_STATUES, parent)
        prism(f"{name}.band{i}a", R + 0.025, 0.06, y0 + th - 0.06, GOLD, 6, C_STATUES, parent)
        prism(f"{name}.band{i}b", R + 0.025, 0.04, y0, GOLD, 6, C_STATUES, parent)
        apothem = R * math.cos(math.pi / 6)
        n = max(3, math.floor(R / 0.34))
        for f in range(6):
            psi = math.radians(30 + 60 * f)
            nx, ny = math.cos(psi), math.sin(psi)
            for j in range(n):
                along = ((j + 0.5) / n - 0.5) * R * 0.86
                c = Vector((nx * (apothem + 0.01) - ny * along, ny * (apothem + 0.01) + nx * along, y0 + th * 0.48))
                bmesh.ops.create_uvsphere(studs, u_segments=12, v_segments=8, radius=0.075,
                                          matrix=Matrix.Translation(c))
    me = bpy.data.meshes.new(f"{name}.studs")
    studs.to_mesh(me)
    studs.free()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(f"{name}.studs", me)
    me.materials.append(GOLD)
    C_STATUES.objects.link(o)
    o.parent = parent


report = []
for sid, prefix, x, z, height, pad, base, op, shift_x in SPIRITS:
    o = import_glb(prefix)
    o.name = sid
    me = o.data
    me.name = sid
    bm = bmesh.new()
    bm.from_mesh(me)
    minz = min(v.co.z for v in bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, -minz), verts=bm.verts)
    if op and op.get("turn"):
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(op["turn"], 3, "Z"), verts=bm.verts)
    if op:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5,
                               plane_co=(0, 0, op["top"]), plane_no=(0, 0, 1), clear_inner=True)
        k = (FIGURE_HEAD - PLINTH_H) / (op["head"] - op["top"])
        bmesh.ops.translate(bm, vec=(-op["cx"], op["cz"], -op["top"]), verts=bm.verts)
        bmesh.ops.scale(bm, vec=(k, k, k), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(0, 0, PLINTH_H), verts=bm.verts)
    else:
        # Centre on the footprint of the model's own base (its bottom 3%), not the bounding
        # box, which a raised arm pulls off to one side.
        zs = [v.co.z for v in bm.verts]
        z0, z1 = min(zs), max(zs)
        cut = z0 + 0.03 * (z1 - z0)
        foot = [v.co for v in bm.verts if v.co.z < cut]
        xs = [c.x for c in foot]
        ys = [c.y for c in foot]
        k = height / (z1 - z0)
        bmesh.ops.translate(bm, vec=(-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, 0), verts=bm.verts)
        bmesh.ops.scale(bm, vec=(k, k, k), verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    for c in o.users_collection:
        c.objects.unlink(o)
    C_STATUES.objects.link(o)

    # Group: on the pad, turned to face the avenue
    fx, fz = (1, 0) if x < -1 else (-1, 0) if x > 1 else (0, 1)
    g = bpy.data.objects.new(f"{sid}.group", None)
    C_STATUES.objects.link(g)
    g.location = web(x, z, base)
    g.rotation_euler = (0, 0, math.atan2(fx, fz))

    tiers = fit_tiers(me, PLINTH_H) if op else SERIES_TIERS
    apothem = tiers[0] * math.cos(math.pi / 6)
    p = max(pad, tiers[0] + 0.5, (apothem + 0.15) / 0.69)
    box(f"{sid}.pad", (2 * p, 2 * p, 0.3), (0, 0, 0.15), PANEL, C_STATUES, g)
    pad_top(sid, g, p)
    for a, bb in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        lamp = prism(f"{sid}.lamp", 0.23, 0.22, 0.3, PANEL, 8, C_STATUES, g)
        lamp.location = (a * (p - 0.7), bb * (p - 0.7), 0)
        lens = prism(f"{sid}.lens", 0.16, 0.01, 0.52, LENS, 8, C_STATUES, g)
        lens.location = lamp.location

    holder = bpy.data.objects.new(f"{sid}.figure", None)
    C_STATUES.objects.link(holder)
    holder.parent = g
    holder.location = (shift_x, 0, PAD_TOP)
    o.parent = holder
    if op:
        hex_plinth(f"{sid}.plinth", PLINTH_H, tiers, holder)

    # Floodlights: two warm spots at the front corners of the pad, aimed up the figure
    top = FIGURE_HEAD if op else height
    for side in (-1, 1):
        ld = bpy.data.lights.new(f"{sid}.flood{side}", "SPOT")
        ld.energy = 30000 if sid == "astra" else 9000
        ld.color = (1.0, 0.78, 0.52)
        ld.spot_size = math.radians(40)
        ld.spot_blend = 0.5
        ld.shadow_soft_size = 0.3
        lo = bpy.data.objects.new(f"{sid}.flood{side}", ld)
        C_LIGHTS.objects.link(lo)
        # Pad-local front corner: the model's front is -y before the group turn
        fwd = Vector((math.sin(g.rotation_euler.z), -math.cos(g.rotation_euler.z), 0))
        right = Vector((-fwd.y, fwd.x, 0))
        reach = p + (3.0 if sid == "astra" else 2.0)
        lo.location = g.location + fwd * reach + right * side * p * 0.6 + Vector((0, 0, 0.3))
        aim = g.location + Vector((0, 0, PAD_TOP + top * 0.55))
        if sid == "astra":
            aim += Vector((shift_x, 0, 0))
        dirv = aim - lo.location
        lo.rotation_euler = dirv.to_track_quat("-Z", "Y").to_euler()
    report.append((sid, round(k, 3), [round(t, 2) for t in tiers], round(p, 2)))

# ---------------------------------------------------------------- floor marker and signature (Plaza.tsx)
MK = web(0, 10.0, 0.0)
annulus("Marker.disc", 0.0, 1.102, MK, 0.006, OBSIDIAN)
annulus("Marker.goldring", 1.102 - 0.035, 1.102 + 0.035, MK + Vector((0, 0, 0.002)), 0.008, GOLD)
annulus("Marker.copperring", 0.996 - 0.007, 0.996 + 0.007, MK + Vector((0, 0, 0.002)), 0.008, COPPER)
for k in range(8):
    a = math.radians(22.5 + 45 * k)  # canvas angle: +x is web +x, +y is web +z
    r1 = 0.820 if k % 2 == 0 else 0.703
    p0 = (0.305 * math.cos(a), 10.0 + 0.305 * math.sin(a))
    p1 = (r1 * math.cos(a), 10.0 + r1 * math.sin(a))
    bar(f"Marker.ray.{k}", p0, p1, 0.0516, GOLD, z=0.008, thick=0.006)
    d1 = prism(f"Marker.pad.{k}", 0.0656, 0.008, 0.006, GOLD, 24, C_ARCH, None)
    d1.location = web(*p1)
    d2 = prism(f"Marker.hole.{k}", 0.0258, 0.010, 0.006, OBSIDIAN, 24, C_ARCH, None)
    d2.location = web(*p1)
for nm, side, material, zz in (("gold", 0.516, GOLD, 0.008), ("green", 0.384, GREEN, 0.011), ("silk", 0.141, SILK, 0.014)):
    slab(f"Marker.die.{nm}", (side, side, 0.003), MK + Vector((0, 0, zz)), material)
text("Marker.stand", spaced("STAND") + "   " + spaced("HERE"), F_DISPLAY, 0.216, web(0, 11.448, 0.012), GOLD)
text("Marker.star", "   ".join(spaced(w) for w in "HIS STAR MEETS THE CORE".split()), F_MONO, 0.094,
     web(0, 11.624, 0.012), MINT)
# Signature near the entrance corner, a black shadow on its far side
text("Signature.shadow", "E.G. Suchanek, ’26", F_SCRIPT, 0.4375, web(27.5 + 0.016, 52.41 - 0.023, 0.006), SHADOW)
text("Signature", "E.G. Suchanek, ’26", F_SCRIPT, 0.4375, web(27.5, 52.41, 0.01), GOLD)


# ---------------------------------------------------------------- the Core (CoreTower.tsx)
# 172 m tall, centred on its footprint, standing on the floor at web (0, -300), native front toward the plaza.
CORE = dict(z=-300, height=172)
core = import_glb("core")
core.name = "Core"
cm = core.data
cb = bmesh.new()
cb.from_mesh(cm)
xs = [v.co.x for v in cb.verts]
ys = [v.co.y for v in cb.verts]
zs = [v.co.z for v in cb.verts]
k_core = CORE["height"] / (max(zs) - min(zs))
bmesh.ops.translate(cb, vec=(-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs)), verts=cb.verts)
bmesh.ops.scale(cb, vec=(k_core,) * 3, verts=cb.verts)
cb.to_mesh(cm)
cb.free()
for c in core.users_collection:
    c.objects.unlink(core)
C_ARCH.objects.link(core)
core.location = web(0, CORE["z"])
# Night glow: the facade lit by its own texture (web: emissive = base map, 0.32 scaled by city light).
for slot in core.material_slots:
    m = slot.material
    m.name = "Core." + m.name
    bs = m.node_tree.nodes.get("Principled BSDF")
    link = next((l for l in m.node_tree.links if l.to_socket == bs.inputs["Base Color"]), None)
    if link:
        m.node_tree.links.new(link.from_socket, bs.inputs["Emission Color"])
        bs.inputs["Emission Strength"].default_value = 0.22  # 0.32 x (0.5 + 0.5 x cityLit 0.35) at night
print("CORE", round(k_core, 2), [round(v * k_core, 1) for v in (max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))])

# ---------------------------------------------------------------- dais glow and moon
ld = bpy.data.lights.new("DieGlow", "POINT")
ld.energy = 250
ld.color = (1.0, 0.84, 0.63)
ld.shadow_soft_size = 1.0
lo = bpy.data.objects.new("DieGlow", ld)
C_LIGHTS.objects.link(lo)
lo.location = P + Vector((0, 0, 2.5))

ld = bpy.data.lights.new("Moon", "SUN")
ld.energy = 1.2
ld.color = (0.62, 0.72, 1.0)
ld.angle = math.radians(1.0)
lo = bpy.data.objects.new("Moon", ld)
C_LIGHTS.objects.link(lo)
lo.rotation_euler = (math.radians(55), 0, math.radians(-140))

# ---------------------------------------------------------------- night sky
world = bpy.data.worlds.new("Night")
scene.world = world
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes["Background"]
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[0].color = (0.035, 0.03, 0.045, 1)
ramp.color_ramp.elements[1].position = 0.35
ramp.color_ramp.elements[1].color = (0.002, 0.004, 0.012, 1)
nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
vor = nt.nodes.new("ShaderNodeTexVoronoi")
vor.inputs["Scale"].default_value = 420
vor.feature = "F1"
star = nt.nodes.new("ShaderNodeMapRange")
star.inputs["From Min"].default_value = 0.06
star.inputs["From Max"].default_value = 0.0
star.inputs["To Min"].default_value = 0.0
star.inputs["To Max"].default_value = 3.0
nt.links.new(tc.outputs["Generated"], vor.inputs["Vector"])
nt.links.new(vor.outputs["Distance"], star.inputs["Value"])
add = nt.nodes.new("ShaderNodeMix")
add.data_type = "RGBA"
add.blend_type = "ADD"
add.inputs["Factor"].default_value = 1.0
nt.links.new(ramp.outputs["Color"], add.inputs["A"])
nt.links.new(star.outputs["Result"], add.inputs["B"])
nt.links.new(add.outputs["Result"], bg.inputs["Color"])


# ---------------------------------------------------------------- cameras
def camera(name, loc, look, lens):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_end = 3000
    o = bpy.data.objects.new(name, cd)
    C_CAMS.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o


cam_aerial = camera("Aerial", web(0, 95, 42), web(0, -8, 0), 30)
camera("Entrance", web(0, 48, 1.7), web(0, -52, 13), 24)
camera("Marker", web(0, 10, 1.7), web(-3, -52, 14), 30)
camera("Liberty", web(1, -8, 1.5), web(SIDE_X, -24, 5.2), 30)
scene.camera = cam_aerial

# ---------------------------------------------------------------- render settings
scene.render.engine = "CYCLES"
scene.cycles.device = "GPU"
scene.cycles.samples = 256
scene.cycles.use_adaptive_sampling = True
scene.cycles.use_denoising = True
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy"

bpy.ops.wm.save_as_mainfile(filepath=OUT)
for r in report:
    print("PLAZA", *r)
