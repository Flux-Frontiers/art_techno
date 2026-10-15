# Release Notes -- v0.4.0

> Released: 2026-10-15

The avenue loses the bright band that ran down its middle, and the start screen
now holds still and waits until the whole plaza has loaded before it lets you in.

## What changed

**No more bright band down the avenue.** The paving was polished enough to
mirror the scene's studio lighting at a grazing angle, so a white band ran down
the plaza toward the Core at every hour, worst at dusk and night. The paving is
honed now, which keeps a soft sheen without the glare. The low warm light from
the sun's side also fades out after sunset, so it no longer glints off the floor
to the left of the axis at night.

**The start screen waits for the plaza.** The view behind the title no longer
drifts. Enter and Take the tour stay disabled, with Enter reading "Loading the
plaza", until every model and texture has arrived, so you never walk into a
plaza still filling in. A model that fails to load does not hold you up; it shows
its render, as before.

**The version on the start screen.** The release number now appears under the
controls, read from `web/package.json` when the site is built.

## Upgrading

Nothing to do. The plaza on GitHub Pages updates on push to `main`.

---

_Full changelog: [CHANGELOG.md](CHANGELOG.md)_
