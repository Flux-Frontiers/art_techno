#!/usr/bin/env python3
"""Build the Art Techno brand images: the README hero, the social card, the
wordmark lockups and the section rules.

Every SVG this writes has its lettering outlined to paths, so it renders the
same anywhere, including in a GitHub README. The PNGs are rendered from those
SVGs, and the brand board from ``brand-board.html``, with headless Chrome.

usage::

    uv run --with fonttools docs/brand/build.py

Fonts (Josefin Sans, IBM Plex Mono) are fetched from google/fonts into
``~/.cache/art-techno-fonts`` on first run. Set ``CHROME`` to the browser
binary if it is not in the default macOS location.
"""

from __future__ import annotations

import math
import os
import re
import subprocess
import urllib.request
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent
DOCS = HERE.parent
CACHE = Path.home() / ".cache" / "art-techno-fonts"
CHROME = os.environ.get(
    "CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)
FONT_URLS = {
    "JosefinSans.ttf": "https://github.com/google/fonts/raw/main/ofl/josefinsans/JosefinSans%5Bwght%5D.ttf",
    "IBMPlexMono-Medium.ttf": "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf",
}

# The seven palette tokens (docs/STYLE.md).
OBSIDIAN = "#0B100E"
PANEL = "#121A17"
COPPER = "#C77C48"
GOLD = "#D4AF5A"
GREEN = "#2F8F74"
MINT = "#7FBFA8"
SILK = "#EDE6D3"

TAGLINE = "THE MACHINE AGE, RECOMPILED"


# --- Lettering -------------------------------------------------------------


class Face:
    """A font instance that sets a line of text as SVG path data.

    :param path: TTF file.
    :param weight: ``wght`` axis value for a variable font, or None.
    """

    def __init__(self, path: Path, weight: float | None = None):
        font = TTFont(path)
        if weight is not None:
            font = instantiateVariableFont(font, {"wght": weight})
        self.upm = font["head"].unitsPerEm
        self.cap = font["OS/2"].sCapHeight
        self.cmap = font.getBestCmap()
        self.glyphs = font.getGlyphSet()
        self.hmtx = font["hmtx"]

    def width(self, text: str, size: float, track: float) -> float:
        """Set width of ``text`` at ``size`` with ``track`` em of tracking.

        :param text: The line.
        :param size: Font size in user units (one em).
        :param track: Extra space after each glyph, in em; +200 is 0.2.
        """
        adv = sum(self.hmtx[self.cmap[ord(c)]][0] for c in text)
        return (adv + track * self.upm * (len(text) - 1)) * size / self.upm

    def path(self, text, x, y, size, track=0.0, anchor="start", fill=GOLD) -> str:
        """``text`` as one ``<path>``, baseline at ``y``.

        :param text: The line.
        :param x: Anchor x.
        :param y: Baseline y.
        :param size: Font size in user units.
        :param track: Tracking in em.
        :param anchor: ``start``, ``middle`` or ``end``.
        :param fill: Fill color.
        """
        w = self.width(text, size, track)
        x0 = {"start": x, "middle": x - w / 2, "end": x - w}[anchor]
        s = size / self.upm
        pen = SVGPathPen(self.glyphs)
        cx = 0.0
        for c in text:
            name = self.cmap[ord(c)]
            if c != " ":
                self.glyphs[name].draw(TransformPen(pen, (s, 0, 0, -s, x0 + cx * s, y)))
            cx += self.hmtx[name][0] + track * self.upm
        return f'<path fill="{fill}" d="{pen.getCommands()}"/>'


def fetch_fonts() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    for name, url in FONT_URLS.items():
        dest = CACHE / name
        if not dest.exists():
            print(f"fetching {name}")
            urllib.request.urlretrieve(url, dest)


# --- Drawing helpers -------------------------------------------------------


def f(v: float) -> str:
    return f"{v:.1f}".rstrip("0").rstrip(".")


def clipped_rect(x, y, w, h, c) -> str:
    """Path data for a rectangle with 45-degree corners of size ``c``."""
    return (
        f"M{f(x + c)} {f(y)}H{f(x + w - c)}L{f(x + w)} {f(y + c)}V{f(y + h - c)}"
        f"L{f(x + w - c)} {f(y + h)}H{f(x + c)}L{f(x)} {f(y + h - c)}V{f(y + c)}Z"
    )


def pad(x, y, r, fill=GOLD) -> str:
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{fill}"/>'


def via(x, y, r, color=GOLD) -> str:
    """A ringed via: a gold ring round a dark core."""
    return pad(x, y, r, color) + pad(x, y, r * 0.45, OBSIDIAN)


def diamond(x, y, r, fill=GREEN) -> str:
    return (
        f'<path fill="{fill}" d="M{f(x)} {f(y - r)}L{f(x + r)} {f(y)}'
        f'L{f(x)} {f(y + r)}L{f(x - r)} {f(y)}Z"/>'
    )


def line(pts, color, width) -> str:
    d = "M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts)
    return (
        f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{f(width)}" '
        f'stroke-linejoin="miter" stroke-linecap="butt"/>'
    )


def mark(x, y, size) -> str:
    """The die lozenge mark, copied from docs/logo, placed at ``x, y``."""
    src = (DOCS / "logo" / "art-techno-mark.svg").read_text()
    body = re.sub(r"<title>.*?</title>|<!--.*?-->", "", src.split(">", 1)[1].rsplit("</svg>", 1)[0], flags=re.S)
    return f'<svg x="{f(x)}" y="{f(y)}" width="{f(size)}" height="{f(size)}" viewBox="0 0 64 64">{body}</svg>'


def svg(w, h, body, px_w=None, px_h=None, bg=True) -> str:
    """Wrap ``body`` in an SVG root of ``w`` by ``h`` units.

    :param px_w: Rendered width in CSS px; defaults to ``w``.
    :param px_h: Rendered height in CSS px; defaults to ``h``.
    :param bg: Fill the canvas with obsidian.
    """
    ground = f'<rect width="{w}" height="{h}" fill="{OBSIDIAN}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{px_w or w}" height="{px_h or h}">{ground}{body}</svg>\n'
    )


# --- The scene: boot sun over a skyline ------------------------------------


def frame(w, h) -> str:
    """Double frame with 45-degree corners and a green diamond at each corner."""
    out = [
        f'<path d="{clipped_rect(20, 20, w - 40, h - 40, 36)}" fill="none" stroke="{GOLD}" stroke-width="4"/>',
        f'<path d="{clipped_rect(34, 34, w - 68, h - 68, 28)}" fill="none" stroke="{GOLD}" stroke-width="1.5" stroke-opacity=".6"/>',
    ]
    for cx, cy in ((44, 44), (w - 44, 44), (44, h - 44), (w - 44, h - 44)):
        out.append(diamond(cx, cy, 7))
    return "".join(out)


def tower(cx, base, w, h, windows) -> str:
    """A data-center tower: a stepped crown of three equal setbacks, an
    antenna ending in a pad, and lit window rows like a server rack.

    :param cx: Center x.
    :param base: Baseline y.
    :param w: Shaft width.
    :param h: Total height to the top setback.
    :param windows: Window color.
    """
    step = 8
    crown = 3 * step
    x0, top = cx - w / 2, base - h
    shaft_top = top + crown
    pts = [(x0, base), (x0, shaft_top)]
    for i in range(3):
        pts += [(x0 + (i + 1) * step, shaft_top - i * step), (x0 + (i + 1) * step, shaft_top - (i + 1) * step)]
    pts = pts[:-1] + [(x0 + 3 * step, top)]
    right = [(2 * cx - px, py) for px, py in reversed(pts)]
    poly = pts + right
    d = "M" + "L".join(f"{f(px)} {f(py)}" for px, py in poly) + "Z"
    out = [f'<path d="{d}" fill="{PANEL}" stroke="{GOLD}" stroke-width="1.5" stroke-linejoin="miter"/>']
    # Antenna and pad.
    out.append(line([(cx, top), (cx, top - 28)], GOLD, 1.5) + pad(cx, top - 28, 3))
    # Window rows: dashes on an 8-unit grid, inset from the walls.
    rows = []
    y = shaft_top + 16
    cols = max(2, int((w - 16) // 16))
    span = cols * 16 - 8
    while y < base - 12:
        for c in range(cols):
            wx = cx - span / 2 + c * 16
            rows.append(f"M{f(wx)} {f(y)}h8")
        y += 12
    out.append(f'<path d="{"".join(rows)}" stroke="{windows}" stroke-width="2.5" fill="none"/>')
    return "".join(out)


def scene(w, h, sx, horizon, sun_r, towers, word_y, word_w, corners=False) -> str:
    """The hero composition, after the boot-sun and emblem-over-city posters.

    :param w: Canvas width.
    :param h: Canvas height.
    :param sx: Axis x (the die sits on it).
    :param horizon: Horizon y.
    :param sun_r: Long-ray radius.
    :param towers: ``(offset, width, height, window_color)`` for one side;
        mirrored about the axis.
    :param word_y: Wordmark baseline.
    :param word_w: Wordmark width.
    :param corners: Set part-number captions in the lower corners.
    """
    josefin = Face(CACHE / "JosefinSans.ttf", 600)
    mono = Face(CACHE / "IBMPlexMono-Medium.ttf")
    out = []

    # Sky: a sunburst of alternating panel wedges, clipped to the frame and the horizon.
    out.append(
        f'<clipPath id="sky"><path d="{clipped_rect(36, 36, w - 72, horizon - 36, 26)}"/></clipPath>'
    )
    wedges = []
    n = 36
    R = max(w, h) * 1.5
    for i in range(0, n, 2):
        a0, a1 = math.pi * i / n, math.pi * (i + 1) / n
        wedges.append(
            f"M{f(sx)} {f(horizon)}L{f(sx - R * math.cos(a0))} {f(horizon - R * math.sin(a0))}"
            f"L{f(sx - R * math.cos(a1))} {f(horizon - R * math.sin(a1))}Z"
        )
    out.append(f'<path clip-path="url(#sky)" fill="{PANEL}" d="{"".join(wedges)}"/>')

    # Wavefront arcs round the die.
    for r, op in ((sun_r * 0.42, 0.7), (sun_r * 0.48, 0.45)):
        out.append(
            f'<path d="M{f(sx - r)} {f(horizon)}A{f(r)} {f(r)} 0 0 1 {f(sx + r)} {f(horizon)}" '
            f'fill="none" stroke="{COPPER}" stroke-width="1.5" stroke-opacity="{op}"/>'
        )

    # Boot sun: rays from the die, alternating long and short, each ending in a pad.
    die = 64
    r0 = die * 1.05
    for k in range(-6, 7):
        a = math.radians(90 + 10 * k)
        long = k % 2 == 0
        r1 = sun_r if long else sun_r * 0.72
        x0, y0 = sx + r0 * math.cos(a), horizon - r0 * math.sin(a)
        x1, y1 = sx + r1 * math.cos(a), horizon - r1 * math.sin(a)
        out.append(line([(x0, y0), (x1, y1)], GOLD if long else COPPER, 3 if long else 2))
        out.append(pad(x1, y1, 5 if long else 3.5, GOLD if long else COPPER))

    # Skyline, mirrored. Drawn over the rays.
    for off, tw, th, col in towers:
        for side in (-1, 1):
            out.append(tower(sx + side * off, horizon, tw, th, col))

    # Horizon line ending in vias at the frame.
    out.append(line([(52, horizon), (w - 52, horizon)], GOLD, 2.5))
    out.append(via(52, horizon, 6) + via(w - 52, horizon, 6))

    # The die: a chip package straddling the horizon, the mark inside.
    out.append(f'<path d="{clipped_rect(sx - die, horizon - die, 2 * die, 2 * die, 12)}" fill="{OBSIDIAN}" stroke="{GOLD}" stroke-width="3"/>')
    out.append(mark(sx - die + 8, horizon - die + 8, 2 * die - 16))

    # Bus runs (motif 13): three square pins each side of the package's lower
    # edge feed a three-trace bus that runs out above the wordmark, turns down
    # through two nested 45-degree bends at constant pitch, and ends in a
    # staggered row of vias.
    p = 12
    pin_y = horizon + die + 10
    for side in (-1, 1):
        for j in range(3):  # j = 0 is the pin nearest the axis: it runs highest and turns outermost
            px = sx + side * 16 * (j + 1)
            y = pin_y + 10 + j * p
            x = sx + side * (word_w / 2 + 72 - j * p)
            turn = 28 - j * p * (2 - math.sqrt(2))
            end = word_y - 30 + j * 14
            col, wdt = (COPPER, 3) if j == 2 else (GOLD, 2)
            out.append(line([(px, horizon + die), (px, pin_y)], GOLD, 3))
            out.append(line([(px, pin_y), (px, y), (x - side * turn, y), (x, y + turn), (x, end)], col, wdt))
            out.append(via(x, end, 5 if j == 2 else 4.5, col))

    # Wordmark and tagline.
    size = word_w / josefin.width("ART TECHNO", 1, 0.2)
    out.append(josefin.path("ART TECHNO", sx, word_y, size, 0.2, "middle", GOLD))
    tag_size = size * 0.22
    out.append(mono.path(TAGLINE, sx, word_y + size * 0.55, tag_size, 0.32, "middle", SILK))
    # Clock-wave rules either side of the tagline, diamond terminals.
    tw = mono.width(TAGLINE, tag_size, 0.32)
    ty = word_y + size * 0.55 - tag_size * 0.35
    for side in (-1, 1):
        a = sx + side * (tw / 2 + 28)
        b = sx + side * (word_w / 2)
        out.append(clock_wave(min(a, b), max(a, b), ty, 6, 12, MINT))

    out.append(mono.path("A STYLE AFTER ART DECO  ·  ROUTED AT 0°, 45° AND 90°", sx, 78, 18, 0.3, "middle", MINT))
    if corners:
        cy = word_y + size * 0.55
        out.append(mono.path("AT-01  ·  2026 · 10 · 12", 92, cy, 16, 0.3, "start", MINT))
        out.append(mono.path("THE GILDED CIRCUIT", w - 92, cy, 16, 0.3, "end", MINT))
    return "".join(out)


def clock_wave(x0, x1, y, amp, period, color) -> str:
    """Clock-wave rule (motif 4): a square wave with diamond terminals."""
    hi = False
    n = int((x1 - x0 - 16) // (period / 2))
    xs = x0 + 8 + ((x1 - x0 - 16) - n * period / 2) / 2
    pts = [(x0 + 8, y + amp), (xs, y + amp)]
    x = xs
    for _ in range(n):
        yy = y - amp if not hi else y + amp
        pts += [(x, yy), (x + period / 2, yy)]
        x += period / 2
        hi = not hi
    pts += [(x, y + amp), (x1 - 8, y + amp)]
    return line(pts, color, 1.5) + diamond(x0 + 4, y + amp, 4, color) + diamond(x1 - 4, y + amp, 4, color)


HERO_TOWERS = [
    (236, 56, 72, GOLD),
    (316, 72, 112, COPPER),
    (400, 64, 156, GOLD),
    (484, 88, 212, GOLD),
    (572, 64, 164, GREEN),
    (660, 96, 268, COPPER),
    (760, 72, 208, GOLD),
    (852, 88, 296, GOLD),
]

CARD_TOWERS = [
    (236, 56, 72, GOLD),
    (316, 72, 112, COPPER),
    (400, 64, 156, GOLD),
    (484, 88, 212, GOLD),
    (572, 64, 164, GREEN),
    (668, 88, 272, COPPER),
]


def build_hero() -> None:
    w, h = 2000, 800
    body = frame(w, h) + scene(w, h, w / 2, 432, 352, HERO_TOWERS, 664, 1040, corners=True)
    (HERE / "hero.svg").write_text(svg(w, h, body, 1000, 400))


def build_card() -> None:
    w, h = 1600, 800
    body = frame(w, h) + scene(w, h, w / 2, 432, 340, CARD_TOWERS, 664, 980)
    (HERE / "social-card.svg").write_text(svg(w, h, body, 640, 320))


# --- Wordmark lockups and rules --------------------------------------------


def build_wordmarks() -> None:
    josefin = Face(CACHE / "JosefinSans.ttf", 600)
    mono = Face(CACHE / "IBMPlexMono-Medium.ttf")
    size = 100
    cap = josefin.cap * size / josefin.upm
    tw = josefin.width("ART TECHNO", size, 0.2)

    # Horizontal: mark at twice the cap height, half a mark of space, text on the mark's center line.
    m = 2 * cap
    gap = m / 2
    pad_ = cap / 2
    w = pad_ + m + gap + tw + pad_
    h = pad_ + m + pad_
    body = mark(pad_, pad_, m) + josefin.path("ART TECHNO", pad_ + m + gap, pad_ + m / 2 + cap / 2, size, 0.2)
    (HERE / "wordmark.svg").write_text(svg(f(w), f(h), body, bg=False))

    # Stacked: mark over the wordmark over the tagline.
    m = 3 * cap
    tag = size * 0.19
    w = pad_ + tw + pad_
    my = pad_
    wy = my + m + cap * 0.9 + cap
    ty = wy + cap * 0.75 + tag
    h = ty + pad_
    body = (
        mark(w / 2 - m / 2, my, m)
        + josefin.path("ART TECHNO", w / 2, wy, size, 0.2, "middle")
        + mono.path(TAGLINE, w / 2, ty, tag, 0.32, "middle", SILK)
    )
    (HERE / "wordmark-stacked.svg").write_text(svg(f(w), f(h), body, bg=False))


def build_rules() -> None:
    """Section rules for docs: the clock wave and the key route, on obsidian."""
    w, h = 1600, 48
    body = clock_wave(16, w - 16, h / 2, 8, 24, GOLD)
    (HERE / "rule-clock-wave.svg").write_text(svg(w, h, body, 800, 24))

    # Key route (motif 14): up from the line, across, down, back, and down to
    # the line again, every turn a right angle; a whole number of keys.
    k = 12
    n = int((w - 64) // (4 * k))
    x = (w - n * 4 * k) / 2
    top, mid, low = h / 2 - 12, h / 2, h / 2 + 12
    pts = [(22, low)]
    for _ in range(n):
        pts += [(x, low), (x, top), (x + 3 * k, top), (x + 3 * k, mid), (x + k, mid), (x + k, low)]
        x += 4 * k
    pts += [(w - 22, low)]
    body = line(pts, COPPER, 2.5) + via(16, low, 6) + via(w - 16, low, 6)
    (HERE / "rule-key-route.svg").write_text(svg(w, h, body, 800, 24))


# --- Rendering -------------------------------------------------------------


def render(src: Path, out: Path, w: int, h: int, scale: float = 2, wait: int = 0) -> None:
    """Screenshot ``src`` (SVG or HTML) at ``w`` by ``h`` CSS px.

    :param scale: Device scale factor; the PNG is ``scale`` times the size.
    :param wait: Virtual-time budget in ms, for pages that load web fonts.
    """
    args = [
        CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
        f"--window-size={w},{h}", f"--force-device-scale-factor={scale}",
        f"--screenshot={out}", src.as_uri(),
    ]
    if wait:
        args.insert(-1, f"--virtual-time-budget={wait}")
    subprocess.run(args, check=True, capture_output=True)
    print(out.relative_to(DOCS.parent))


def main() -> None:
    fetch_fonts()
    build_hero()
    build_card()
    build_wordmarks()
    build_rules()
    render(HERE / "hero.svg", HERE / "hero.png", 1000, 400)
    render(HERE / "social-card.svg", HERE / "social-card.png", 640, 320)
    board = HERE / "brand-board.html"
    if board.exists():
        render(board, HERE / "brand-board.png", 1600, 1100, 1.5, wait=15000)


if __name__ == "__main__":
    main()
