"""Turn the night plaza into daytime: physical sky, sun, lamps off, honed paving lit."""
import bpy, math
s = bpy.context.scene
for o in bpy.data.objects:
    if o.type == "LIGHT" and o.name != "Moon":
        o.hide_render = True
moon = bpy.data.objects["Moon"]
moon.name = "Sun"
moon.data.energy = 4.0
moon.data.color = (1.0, 0.96, 0.9)
moon.data.angle = math.radians(0.53)
# Late-morning sun from the right, raking across the statue faces
moon.rotation_euler = (math.radians(50), 0, math.radians(-60))
for name, strength in (("LampLens", 0.0), ("DieGlow", 0.4), ("TraceGold", 0.0), ("TraceCopper", 0.0), ("Via", 0.0)):
    m = bpy.data.materials[name]
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = strength
for m in bpy.data.materials:
    if m.name.startswith("Core."):
        m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.0
city = bpy.data.materials["CityFloor"].node_tree.nodes["Principled BSDF"]
city.inputs["Emission Strength"].default_value = 0.0
city.inputs["Base Color"].default_value = (0.045, 0.052, 0.048, 1)  # web: #3b423e in daylight
w = s.world
nt = w.node_tree
for n in list(nt.nodes):
    if n.type != "OUTPUT_WORLD":
        nt.nodes.remove(n)
sky = nt.nodes.new("ShaderNodeTexSky")
for t in ("MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "NISHITA"):
    try:
        sky.sky_type = t
        break
    except TypeError:
        pass
sky.sun_disc = False
sky.sun_elevation = math.radians(40)
sky.sun_rotation = math.radians(-60 + 90)
bg = nt.nodes.new("ShaderNodeBackground")
bg.inputs["Strength"].default_value = 0.2
nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
nt.links.new(bg.outputs["Background"], nt.nodes["World Output"].inputs["Surface"])
s.view_settings.look = "AgX - Punchy"
pv = bpy.data.materials["Paving"].node_tree.nodes["Principled BSDF"]
pv.inputs["Metallic"].default_value = 0.0
print("SKY", sky.sky_type)
bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backup
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//plaza_day.blend"))
