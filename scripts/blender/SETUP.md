# Setting up Blender for the plaza scripts

How to set up a Mac to run the scripts in this folder: Blender with Metal
GPU rendering, and optionally the Blender Lab MCP add-on so Claude Code
can inspect a live Blender scene.

Requirements: an Apple Silicon Mac (`uname -m` prints `arm64`) and the
data folder described in [README.md](README.md).

## 1. Install Blender

1. Download Blender 5.2 LTS for macOS (Apple Silicon) from
   https://www.blender.org/download/ and drag it to Applications.
2. Launch it once so macOS clears the Gatekeeper prompt.
3. Edit > Preferences > System > Cycles Render Devices: choose **Metal**
   and tick the GPU. Save Preferences.

Check from Terminal:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --version | head -1
```

The Metal setting (step 3 above) can also be made from Terminal, with
Blender closed. This also turns on Allow Online Access, which the MCP
add-on needs. Save as `prefs.py`:

```python
import bpy
p = bpy.context.preferences
cp = p.addons['cycles'].preferences
cp.compute_device_type = 'METAL'
cp.refresh_devices()
for d in cp.devices:
    d.use = (d.type == 'METAL')
p.system.use_online_access = True
bpy.ops.wm.save_userpref()
```

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --python prefs.py
```

Don't add `--factory-startup` here. It makes Blender skip your saved
preferences, so saving writes factory defaults over them and disables
every add-on you had enabled.

## 2. Get the data folder

The scripts read and write `~/Documents/art_techno` unless
`ART_TECHNO_DIR` says otherwise. It needs at least `meshy-raw/` (the
statue GLBs) to build the plaza, and `polyhaven/` for the HDRI, stone and
hero scripts. See the table in [README.md](README.md).

To copy it from another Mac, leave out the `.blend1` backups (about 2 GB
of duplicates):

```bash
rsync -avh --progress --exclude '*.blend1' --exclude '.DS_Store' \
  ~/Documents/art_techno/ <user>@<host>.local:Documents/art_techno/
```

The `.blend` files are portable except the HDRI-lit plaza variants
(`plaza_<hdri>.blend`), which store their HDRI's absolute path. If the
home folder differs on the new Mac (say `/Users/egs` to
`/Users/suchanek`), relink them all in one pass:

```bash
cd ~/Documents/art_techno/blender
for f in plaza_*_*.blend; do
  /Applications/Blender.app/Contents/MacOS/Blender -b "$f" --python-expr "
import bpy, os
old, new = '/Users/egs/', os.path.expanduser('~/')
changed = False
for i in bpy.data.images:
    if i.filepath.startswith(old):
        p = new + i.filepath[len(old):]
        if os.path.exists(p):
            i.filepath = p
            changed = True
        else:
            print('MISSING', p)
if changed:
    bpy.ops.wm.save_mainfile()
"
done
```

Or, for one file: File > External Data > Find Missing Files, point it at
the `polyhaven` folder, and save. `hdri.py` can also regenerate any
variant from `plaza_day.blend`.

## 3. Smoke test

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
S=~/repos/art_techno/scripts/blender
cd ~/Documents/art_techno/blender
$B -b --factory-startup --python $S/build_plaza.py
$B -b --factory-startup plaza.blend --python $S/gpu_cam.py \
   -o //smoke_ -F PNG -f 1 -- Entrance 25 32
```

The build takes about a minute. The first render on a new install also
compiles the Metal kernels, about 90 seconds. Success is `smoke_0001.png`
in the folder.

## 4. Optional: Blender MCP for Claude Code

The official Blender Lab MCP server lets Claude Code read the open scene,
take screenshots and run Python in it. It has two parts: an add-on that
runs a socket server inside Blender on `localhost:9876`, and a server
process that Claude Code starts.

**Add-on**

1. Edit > Preferences > System: tick **Allow Online Access**. Blender
   blocks extensions that open network sockets without it.
2. Edit > Preferences > Get Extensions > the dropdown at the top right >
   **Install from Disk**, and choose the add-on zip from
   https://www.blender.org/lab/mcp-server/. Or add the Blender Lab
   repository `https://lab.blender.org/` under Repositories and install
   **MCP** from there, which also gives update notices.
3. In the add-on's preferences, turn on **Auto Start** so the bridge
   comes up with Blender. Save Preferences.

From Terminal instead, with Blender closed (the defaults are
`localhost`, `9876` and Auto Start on):

```bash
/Applications/Blender.app/Contents/MacOS/Blender --online-mode \
  --command extension install-file -r user_default -e ~/Downloads/mcp-1.0.3.zip
```

**Server**

This needs the `claude` command on the PATH. The copy that ships inside
the VS Code extension isn't. To install it:
`curl -fsSL https://claude.ai/install.sh | bash`, which puts it in
`~/.local/bin`. It also needs `uv` (`brew install uv`).

```bash
uv tool install "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp"
claude mcp add -s user blender ~/.local/bin/blender-mcp
claude mcp get blender     # with Blender running: Status: Connected
```

Upgrade later with `uv tool upgrade blender-mcp`.

Pitfalls:

- **Not `uvx blender-mcp` or `pip install blender-mcp`.** The PyPI
  package of that name is an unrelated community server.
- **Not `uvx --from git+...` as the registered command.** Building from
  git on every launch takes longer than Claude Code's 30 second connect
  limit.
- **Check for a project-scope `blender` entry.** A local or project MCP
  entry with the same name silently overrides the user one. If the tools
  disappear, `claude mcp get blender` shows which scope is in use.
- **Don't render through the bridge.** A render started from MCP blocks
  Blender's interface until it finishes, and the first one includes the
  Metal kernel compile. Render from the command line as in the README.

## 5. Optional: Looking Glass

The Alice/LG add-on (https://github.com/regcs/AliceLG) renders to a
Looking Glass display from Blender. Version 2.3.1 is the first that loads
in Blender 5.x.

1. Install the zip with **Install from Disk** under Add-ons, enable
   **View: Alice/LG**, and click **Install Dependencies** in its
   preferences. Blender pauses for about a minute while pip fetches
   OpenCV and pynng; it needs internet access.
2. Quit and relaunch Blender. The **Looking Glass** tab appears in the
   3D Viewport's N sidebar only if the dependencies were present at
   startup.
3. If the display is on this Mac, install Looking Glass Bridge from
   https://lookingglassfactory.com/software.

Step 1 from Terminal instead, with Blender closed. Save as `alice.py`:

```python
import bpy, os
bpy.ops.preferences.addon_install(filepath=os.path.expanduser("~/Downloads/AliceLG-2.3.1.zip"))
bpy.ops.preferences.addon_enable(module="AliceLG")
bpy.ops.wm.save_userpref()
```

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b --python alice.py      # install and enable
$B -b -- --alicelg-install   # install the dependencies
```

Check that the dependencies are in place:

```bash
ls ~/Library/Application\ Support/Blender/5.2/scripts/addons/AliceLG/lib/ | grep dist-info
# cffi, opencv_python 5.0.0.93, pycparser, pynng 0.9.0, sniffio
```

Notes:

- **pynng comes from PyPI.** The zip's bundled pynng wheels stop at
  Python 3.12 and Blender 5.2 runs 3.13, so installing the dependencies
  needs internet access.
- **Copying the add-on instead.** You can copy
  `~/Library/Application Support/Blender/5.2/scripts/addons/AliceLG`
  from a Mac where the dependencies are installed (leave out `logs/*.log*`
  and `__pycache__`). Copy it while Blender is closed. Blender only adds
  the user add-ons folder to Python's path if it exists at startup;
  otherwise enabling fails with `No module named 'AliceLG'`.
- **`--- Logging error ---` tracebacks** ending in `doRollover ...
  TypeError` come from the add-on's log rotation and are harmless.

The quilt renders in `scripts/render_spirits.sh` go through quiltwright
instead, and don't need Alice/LG.
