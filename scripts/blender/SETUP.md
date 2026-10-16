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

## 2. Get the data folder

The scripts read and write `~/Documents/art_techno` unless
`ART_TECHNO_DIR` says otherwise. It needs at least `meshy-raw/` (the
statue GLBs) to build the plaza, and `polyhaven/` for the HDRI, stone and
hero scripts. See the table in [README.md](README.md).

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

**Server**

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

The quilt renders in `scripts/render_spirits.sh` go through quiltwright
instead, and don't need Alice/LG.
