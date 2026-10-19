# Release Notes -- v0.5.0

> Released: 2026-10-18

The Core, the great tower at the end of the avenue, gets a new texture, loses
two stray twigs Meshy grew on its ledges, and carries a real inscription over
its door. The plaza gains a Home button and plays the Gilded Circuit film from
the start screen, and the repo now holds the scripts that rebuild the plaza in
Blender.

## What changed

**The Core, refinished.** A new Meshy texture on the same mesh keeps the dark
stone and bronze with crisper edges and highlights. The twigs that branched off
its upper ledges are cut away and the cuts capped, in a small script the
Blender build and the web copies both use. Over the door, a plate set into the
recessed panel replaces Meshy's garbled lettering with three chained lines:
DATA IS STRUCTURE / STRUCTURE IS ORDER / ORDER IS LIGHT, in the plaza's Josefin
Sans and an aged gold.

**Getting around.** A Home button in the top bar glides you back to the
entrance without leaving the plaza, and no plaque cards flash past on the way.
For those who find it, there is also a hidden way to stand at the Core's door
and walk the avenue back.

**The film.** The start screen's Watch the film plays The Gilded Circuit, a
30-second film of the nine Spirits, full screen with sound.

**The plaza in Blender.** `scripts/blender/` rebuilds the plaza in Blender from
the web app's own layout, with daylight, HDRI and stone variants, studio hero
shots of each Spirit, and material contact sheets. A separate script renders the
Spirits as Looking Glass quilts. The design boards and posters, and now the
framing-print scripts, are kept privately.

**Fixes.** Computation now faces the avenue like the other Spirits, the studs on
the Blender plaza's plinths sit on their faces, and the longest Spirit names fit
their bases.

## Upgrading

Nothing to do. The plaza on GitHub Pages updates on push to `main`. Anyone
rebuilding the plaza in Blender should rerun `build_plaza.py` to pick up the
Core's repair and inscription.

---

_Full changelog: [CHANGELOG.md](CHANGELOG.md)_
