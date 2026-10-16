"""Shared drawing for the Spirit line posters (Vol. 10-15): the light, the skyline, the series
plinth, the frame and the title. Vol. 05's layout under the series' kicker line (as Vols. 04, 06-08). Each Spirit's module draws only its figure.

A figure module calls ``build(...)`` with a function that draws onto the Poster; ``build`` writes
the artboard to ``src/V<vol>-<Name>.dc.html``. The palette and the 720 x 1080 frame are the
canvas's own. Every id carries the poster's prefix, so a board that inlines nine posters has no
collisions.
"""

from __future__ import annotations

from pathlib import Path

HI, MID, SH, DEEP = "#EBD08C", "#D4AF5A", "#A8873F", "#6E5626"
CU, CUL, CUD = "#C77C48", "#E8A877", "#8E5530"
GRN, MINT, SILK, OBS, PANEL = "#2F8F74", "#7FBFA8", "#EDE6D3", "#0B100E", "#121A17"
CX = 360
# Advance widths of Josefin Sans Light (wght 300), in em, measured from the font with fontTools.
JOSEFIN_300 = {"A": 0.706, "B": 0.59, "C": 0.691, "D": 0.736, "E": 0.639, "F": 0.578, "G": 0.741, "H": 0.752,
               "I": 0.275, "J": 0.33, "K": 0.655, "L": 0.603, "M": 0.906, "N": 0.822, "O": 0.862, "P": 0.554,
               "Q": 0.882, "R": 0.633, "S": 0.581, "T": 0.577, "U": 0.707, "V": 0.702, "W": 0.993, "X": 0.62,
               "Y": 0.661, "Z": 0.703, " ": 0.307}
TITLE_MAX = 640          # px; SPIRIT OF LIBERTY, the longest title set at full width, is 638
SRC = Path(__file__).resolve().parent.parent / "src"


class Poster:
    def __init__(self, prefix: str):
        self.p = prefix
        self.out: list[str] = []

    def w(self, s: str) -> None:
        self.out.append(s)

    def poly(self, pts, fill, extra=""):
        self.w(f'<polygon points="{" ".join(f"{x:g},{y:g}" for x, y in pts)}" fill="{fill}"{extra}></polygon>')

    def both(self, pts, fill_left, fill_right, extra=""):
        """A facet on the left and its mirror on the right, each in its own tone."""
        self.poly(pts, fill_left, extra)
        self.poly([(2 * CX - x, y) for x, y in pts], fill_right, extra)

    def pads(self, pts, r=2.4, fill=MID):
        self.w("".join(f'<circle cx="{x:g}" cy="{y:g}" r="{r}" fill="{fill}"></circle>' for x, y in pts))

    # ---------------------------------------------------------------- the light: rays and rings
    def light(self, fx, fy, angles=(-150, -120, -96, -72, -50, -28, 28, 50, 72, 96, 120, 150)):
        p = self.p
        self.defs = f'''<clipPath id="{p}clip"><path d="M38 24H682L696 38V860H24V38Z"></path></clipPath>
<pattern id="{p}win" width="10" height="12" patternUnits="userSpaceOnUse"><rect x="2" y="3" width="2.5" height="5" fill="{MID}" opacity=".6"></rect><rect x="6.5" y="3" width="2.5" height="5" fill="{MINT}" opacity=".35"></rect></pattern>
<pattern id="{p}win2" width="14" height="14" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="3" height="4" fill="{SILK}" opacity=".3"></rect><rect x="9" y="4" width="3" height="4" fill="{MID}" opacity=".45"></rect></pattern>
<g id="{p}beam"><polygon points="{fx},{fy} {fx - 16},-560 {fx + 16},-560" fill="{MID}" opacity=".06"></polygon><path d="M{fx} {fy}L{fx - 16} -560M{fx} {fy}L{fx + 16} -560" stroke="{MID}" stroke-width=".6" opacity=".22"></path></g>'''
        self.w(f'<g clip-path="url(#{p}clip)">')
        for r, c in ((520, "#0E1512"), (380, "#111A16"), (260, "#15201B"), (170, "#192620")):
            self.w(f'<circle cx="{fx}" cy="{fy}" r="{r}" fill="{c}"></circle>')
        for a in angles:
            self.w(f'<use href="#{p}beam" transform="rotate({a} {fx} {fy})"></use>')
        self.w(f'<circle cx="{fx}" cy="{fy}" r="120" fill="none" stroke="{MINT}" stroke-width=".7" opacity=".45" stroke-dasharray="3 3 9 3 3 12"></circle>')
        self.w(f'<circle cx="{fx}" cy="{fy}" r="92" fill="none" stroke="{MID}" stroke-width=".8" opacity=".5"></circle>')
        self.w("</g>")

    # ---------------------------------------------------------------- skyline, as in Vol. 05
    def skyline(self):
        p = self.p
        for x, y, tw, th in ((40, 560, 70, 300), (110, 640, 40, 220), (560, 650, 50, 210),
                             (610, 590, 70, 270), (520, 700, 40, 160), (150, 700, 50, 160)):
            self.w(f'<rect x="{x}" y="{y}" width="{tw}" height="{th}" fill="#16211C"></rect>')
            self.w(f'<rect x="{x + 6}" y="{y + 8}" width="{tw - 12}" height="{th - 16}" fill="url(#{p}win)"></rect>')
            self.w(f'<path d="M{x} {y}H{x + tw}" stroke="{MID}" stroke-width="1.6"></path>')
            self.w(f'<path d="M{x + tw / 2:g} {y}V{y - 16}" stroke="{MID}" stroke-width="1"></path><circle cx="{x + tw / 2:g}" cy="{y - 18}" r="2.4" fill="{SILK}"></circle>')
        self.w('<g fill="#0E1512"><rect x="40" y="760" width="70" height="100"></rect><rect x="610" y="760" width="70" height="100"></rect><rect x="110" y="790" width="80" height="70"></rect><rect x="530" y="790" width="80" height="70"></rect></g>')
        self.w(f'<rect x="46" y="770" width="58" height="82" fill="url(#{p}win2)" opacity=".8"></rect><rect x="616" y="770" width="58" height="82" fill="url(#{p}win2)" opacity=".8"></rect>')

    # ---------------------------------------------------------------- the series hex plinth, in elevation
    def plinth(self, top_hw=110, cx=CX):
        """Three tiers from y 784 to 856; top_hw is the top tier's half-width (front face)."""
        for y0, y1, hw in ((832, 856, top_hw + 40), (808, 832, top_hw + 20), (784, 808, top_hw)):
            side = hw * 0.5
            self.poly([(cx - hw - side, y0 + 4), (cx - hw, y0), (cx - hw, y1), (cx - hw - side, y1)], "#16211C")
            self.poly([(cx + hw, y0), (cx + hw + side, y0 + 4), (cx + hw + side, y1), (cx + hw, y1)], "#0E1512")
            self.poly([(cx - hw, y0), (cx + hw, y0), (cx + hw, y1), (cx - hw, y1)], PANEL)
            self.w(f'<path d="M{cx - hw - side:g} {y0 + 4}L{cx - hw:g} {y0}H{cx + hw:g}L{cx + hw + side:g} {y0 + 4}" fill="none" stroke="{MID}" stroke-width="1.6"></path>')
            self.w(f'<path d="M{cx - hw:g} {y0}V{y1}M{cx + hw:g} {y0}V{y1}" stroke="{CU}" stroke-width="1"></path>')
            n = int(hw * 2 / 24)
            self.pads([(cx - hw + (i + 0.5) * 2 * hw / n, (y0 + y1) / 2) for i in range(n)])
        b = (top_hw + 40) * 1.5
        self.w(f'<path d="M{cx - b:g} 856H{cx + b:g}" stroke="{MID}" stroke-width="1.6"></path>')

    # ---------------------------------------------------------------- frame and title rules
    def frame(self):
        self.w(f'<path d="M40 860H680" stroke="{MID}" stroke-width="2.4"></path><path d="M40 866H680" stroke="{MID}" stroke-width=".7"></path>')
        self.pads([(40, 860), (680, 860)], 3.2)
        self.w(f'<path d="M32 16H688L704 32V1048L688 1064H32L16 1048V32Z" fill="none" stroke="{MID}" stroke-width="2"></path>')
        self.w(f'<path d="M38 24H682L696 38V1042L682 1056H38L24 1042V38Z" fill="none" stroke="{MID}" stroke-width=".75" opacity=".7"></path>')
        self.w(f'<path d="M110 1011H146M574 1011H610" stroke="{MID}" stroke-width="1"></path><polygon points="146,1011 152,1005 158,1011 152,1017" fill="{MID}"></polygon><polygon points="562,1011 568,1005 574,1011 568,1017" fill="{MID}"></polygon>')
        self.pads([(110, 1011), (610, 1011)], 2.2)


def build(vol: int, name: str, prefix: str, tagline: str, light: tuple[float, float], figure,
          plinth_hw: float = 110, date: str = "2026 · 10 · 16") -> Path:
    """Draw one poster: background and skyline, plinth, the figure (drawn by figure(p)), frame, title."""
    p = Poster(prefix)
    p.light(*light)
    p.skyline()
    p.plinth(plinth_hw)
    figure(p)
    p.frame()
    title = f"SPIRIT OF {name.upper()}"
    width = sum(JOSEFIN_300[c] for c in title) * 60 + 6 * len(title)      # 60 px, 0.1 em tracking
    sx = min(1.0, TITLE_MAX / width)        # long names are condensed, never made smaller
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Vol. {vol} · Spirit of {name}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&amp;family=Josefin+Sans:wght@300;400;600;700&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#D4AF5A}}a:hover{{color:#EBD08C}}
</style>
</helmet>
<div style="position: relative; width: 720px; height: 1080px; overflow: hidden; background: #0B100E; font-family: 'Josefin Sans', sans-serif; color: #D4AF5A">
<svg viewBox="0 0 720 1080" width="720" height="1080" style="position: absolute; left: 0; top: 0" aria-hidden="true">
<defs>
{p.defs}
</defs>
{chr(10).join(p.out)}
</svg>
<div style="position: absolute; left: 0; top: 34px; width: 720px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.32em; color: #7FBFA8">ART TECHNO · VOL. {vol} · {tagline}</div>
<div style="position: absolute; left: -140px; top: 896px; width: 1000px; text-align: center; font-weight: 300; font-size: 60px; line-height: 1; letter-spacing: 0.1em; text-indent: 0.1em; color: #D4AF5A; transform: scale({sx:.3f}, 1.55); transform-origin: 50% 0; white-space: nowrap">{title}</div>
<div style="position: absolute; left: 0; top: 1006px; width: 720px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.3em; text-indent: 0.3em; color: #7FBFA8">THE GILDED CIRCUIT · {date}</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":720,"height":1080}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''
    out = SRC / f"V{vol}-{name}.dc.html"
    out.write_text(html)
    return out
