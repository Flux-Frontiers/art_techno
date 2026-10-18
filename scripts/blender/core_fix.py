"""Repairs to the Core's Meshy mesh, shared by the plaza build and the web model.

Meshy grew a flat lattice twig on each upper ledge corner of the Core (raw GLB units, Blender axes, about
x = +-0.13, y 0.068..0.124, z 0.69..0.74). `despur` cuts them off and caps the cuts.

As a script it writes a repaired copy of a Core GLB, for web/scripts/prep-model.sh:
    blender -b --factory-startup --python scripts/blender/core_fix.py -- <in.glb> <out.glb>
"""
import sys

import bmesh
from mathutils import Vector


def despur(bm):
    """Cut the two twigs out of the Core's mesh and cap the holes.

    :param bm: the raw Core mesh, in raw GLB units, before any scaling or centering.
    :returns: (vertices cut, faces added)
    """
    def twig(v):
        # The front silhouette is empty here at every depth, so all of this is twig. The wall beside it
        # stands at |x| <= 0.110, the ledge corner at |x| <= 0.120 below z 0.712.
        x, y, z = abs(v.co.x), v.co.y, v.co.z
        return 0.066 < y < 0.127 and 0.694 < z < 0.74 and (x > 0.1205 or (x > 0.1115 and z > 0.712))

    # The glTF import splits vertices along UV seams; welded, the mesh is closed. UVs live on loops, so welding
    # keeps them.
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    doomed = [v for v in bm.verts if twig(v)]
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    # Every open edge now rims a cut. Widen pinch points (figure-8 rims) until each rim is a simple loop.
    while pinch := [v for v in bm.verts if sum(e.is_boundary for e in v.link_edges) > 2]:
        bmesh.ops.delete(bm, geom=pinch, context="VERTS")
    # Cap each rim with a fan around its centroid, the new faces taking the mean UV of the rim.
    uv = bm.loops.layers.uv.active
    new = []
    open_edges = {e for e in bm.edges if e.is_boundary}
    while open_edges:
        e = open_edges.pop()
        ring, v = [e.verts[0]], e.verts[1]
        while v is not ring[0]:
            ring.append(v)
            e = next(f for f in v.link_edges if f in open_edges)
            open_edges.discard(e)
            v = e.other_vert(v)
        # Wind the fan against the face along the first rim edge, so the normals agree.
        lp = next(l for l in bm.edges.get(ring[:2]).link_faces[0].loops if l.vert is ring[0])
        if lp.link_loop_next.vert is ring[1]:
            ring.reverse()
        mean_uv = sum((l[uv].uv for v in ring for l in v.link_loops), Vector((0, 0)))
        mean_uv /= sum(len(v.link_loops) for v in ring)
        c = bm.verts.new(sum((v.co for v in ring), Vector()) / len(ring))
        for a, b in zip(ring, ring[1:] + ring[:1]):
            f = bm.faces.new((a, b, c))
            for l in f.loops:
                l[uv].uv = mean_uv
            new.append(f)
    return len(doomed), len(new)


if __name__ == "__main__":
    import bpy

    src, dst = sys.argv[sys.argv.index("--") + 1:]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    me = next(o for o in bpy.data.objects if o.type == "MESH").data
    bm = bmesh.new()
    bm.from_mesh(me)
    print("DESPUR", despur(bm))
    bm.to_mesh(me)
    bm.free()
    bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_image_format="AUTO")
