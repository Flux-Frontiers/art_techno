"""The rendered Spirit posters: each statue's framing print (scripts/blender/print.py) in a gilt
panel, under the series kicker and over the same title band as the line posters.

The panel is the print's own 10.5:13.5 shape, so the render is shown whole. The image is a
canvas asset (a 2000 px JPEG); blobs.json maps it to the full-resolution PNG for the PDFs.
usage: draw/rendered.py   (writes src/R<vol>-<Name>.dc.html for every Spirit in blobs.json)
"""
import json
from pathlib import Path

from line import JOSEFIN_300, TITLE_MAX

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src"
# vol, file name, print name, title, kicker line (the same as the line poster's)
SPIRITS = [
    (4, "AdAstra", "astra-v2", "AD ASTRA PER ASPERA", "THE STAR IS A PROCESSOR"),
    (5, "Power", "power-v2", "SPIRIT OF POWER", "FUSION HELD ALOFT"),
    (7, "Knowledge", "knowledge-v5", "SPIRIT OF KNOWLEDGE", "EVERY STROKE IS A CLAIM"),
    (10, "Computation", "computation-engine", "SPIRIT OF COMPUTATION", "THE ENGINE TURNED"),
    (11, "Communication", "communication-v2", "SPIRIT OF COMMUNICATION", "THE SIGNAL RAISED"),
    (12, "Innovation", "innovation-v5-eureka", "SPIRIT OF INNOVATION", "THE EUREKA MOMENT"),
    (13, "Life", "life-v3", "SPIRIT OF LIFE", "THE LIVING CODE"),
    (14, "Industry", "industry-v1", "SPIRIT OF INDUSTRY", "THE BUILDER"),
    (15, "Liberty", "liberty-v5", "SPIRIT OF LIBERTY", "THE KEY HELD HIGH"),
]
X0, Y0, PW, PH, C = 60, 64, 600, 771, 18           # the panel, and its chamfer


def chamfer(x, y, w, h, c):
    return f"M{x + c} {y}H{x + w - c}L{x + w} {y + c}V{y + h - c}L{x + w - c} {y + h}H{x + c}L{x} {y + h - c}V{y + c}Z"


def poster(vol, name, title, kicker, blob, date="2026 · 10 · 16"):
    width = sum(JOSEFIN_300[c] for c in title) * 60 + 6 * len(title)
    sx = min(1.0, TITLE_MAX / width)
    clip = f"polygon({C}px 0, {PW - C}px 0, {PW}px {C}px, {PW}px {PH - C}px, {PW - C}px {PH}px, {C}px {PH}px, 0 {PH - C}px, 0 {C}px)"
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Vol. {vol:02d} · {title.title()} (rendered)</title>
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
<div style="position: absolute; left: {X0}px; top: {Y0}px; width: {PW}px; height: {PH}px; overflow: hidden; clip-path: {clip}">
<img src="/_blob/{blob}" alt="{title.title()}: the statue on its plinth, rendered" style="position: absolute; left: 0; top: 0; width: {PW}px; height: {PH}px; object-fit: cover; display: block">
</div>
<svg viewBox="0 0 720 1080" width="720" height="1080" style="position: absolute; left: 0; top: 0; pointer-events: none" aria-hidden="true">
<path d="{chamfer(X0 - 8, Y0 - 8, PW + 16, PH + 16, C + 6)}" fill="none" stroke="#C77C48" stroke-width="2"></path>
<path d="{chamfer(X0 - 3, Y0 - 3, PW + 6, PH + 6, C + 2)}" fill="none" stroke="#D4AF5A" stroke-width="3"></path>
<path d="{chamfer(X0, Y0, PW, PH, C)}" fill="none" stroke="#0B100E" stroke-width="1.5"></path>
<polygon points="360,{Y0 - 16} 368,{Y0 - 8} 360,{Y0} 352,{Y0 - 8}" fill="#D4AF5A" stroke="#0B100E" stroke-width="1"></polygon>
<rect x="356" y="{Y0 - 12}" width="8" height="8" fill="#2F8F74" stroke="#EBD08C" stroke-width="1"></rect>
<path d="M40 860H680" stroke="#D4AF5A" stroke-width="2.4"></path><path d="M40 866H680" stroke="#D4AF5A" stroke-width=".7"></path>
<circle cx="40" cy="860" r="3.2" fill="#D4AF5A"></circle><circle cx="680" cy="860" r="3.2" fill="#D4AF5A"></circle>
<path d="M32 16H688L704 32V1048L688 1064H32L16 1048V32Z" fill="none" stroke="#D4AF5A" stroke-width="2"></path>
<path d="M38 24H682L696 38V1042L682 1056H38L24 1042V38Z" fill="none" stroke="#D4AF5A" stroke-width=".75" opacity=".7"></path>
<path d="M110 1011H146M574 1011H610" stroke="#D4AF5A" stroke-width="1"></path><polygon points="146,1011 152,1005 158,1011 152,1017" fill="#D4AF5A"></polygon><polygon points="562,1011 568,1005 574,1011 568,1017" fill="#D4AF5A"></polygon>
<circle cx="110" cy="1011" r="2.2" fill="#D4AF5A"></circle><circle cx="610" cy="1011" r="2.2" fill="#D4AF5A"></circle>
</svg>
<div style="position: absolute; left: 0; top: 34px; width: 720px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.32em; color: #7FBFA8">ART TECHNO · VOL. {vol:02d} · {kicker}</div>
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


if __name__ == "__main__":
    by_print = {Path(v).name.removesuffix("_print.png"): k for k, v in json.loads((HERE.parent / "blobs.json").read_text()).items()}
    for vol, name, prt, title, kicker in SPIRITS:
        if prt not in by_print:
            print("waiting for", prt)
            continue
        out = SRC / f"R{vol:02d}-{name}.dc.html"
        out.write_text(poster(vol, name, title, kicker, by_print[prt]))
        print(out)
