import bpy, sys
argv = sys.argv[sys.argv.index("--") + 1:]
cam, pct, spp = argv[0], int(argv[1]), int(argv[2])
p = bpy.context.preferences.addons["cycles"].preferences
p.compute_device_type = "METAL"; p.get_devices()
for d in p.devices: d.use = (d.type == "METAL")
s = bpy.context.scene
s.cycles.device = "GPU"; s.camera = bpy.data.objects[cam]
s.render.resolution_percentage = pct; s.cycles.samples = spp
