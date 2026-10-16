"""The nine-up boards: every Spirit's poster in one treatment, in volume order, on a 2:3 sheet.

Each poster is mounted with <dc-import>, so the board always shows the artboards as they are.
usage: draw/board.py   (writes src/B1-Line.dc.html and src/B2-Rendered.dc.html)
"""
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src"
W, H = 1440, 2160
PW, PH, GAP, LEFT, TOP = 380, 570, 36, 114, 204
SCALE = PW / 720

BOARDS = {
    "B1-Line": ("LINE", "DRAWN IN THE SEVEN RULES: FLAT FACETS, THREE LINE WEIGHTS, EVERY STROKE ENDING IN A PAD",
                ["Main", "Power", "Knowledge", "V10-Computation", "V11-Communication", "V12-Innovation",
                 "V13-Life", "V14-Industry", "V15-Liberty"]),
    "B2-Rendered": ("RENDERED", "THE STATUES AS BUILT: CYCLES RENDERS OF THE PLAZA'S MODELS ON THE SERIES PLINTH",
                    ["R04-AdAstra", "R05-Power", "R07-Knowledge", "R10-Computation", "R11-Communication",
                     "R12-Innovation", "R13-Life", "R14-Industry", "R15-Liberty"]),
}


def board(name, label, note, posters):
    cells = []
    for i, poster in enumerate(posters):
        r, c = divmod(i, 3)
        x, y = LEFT + c * (PW + GAP), TOP + r * (PH + GAP)
        cells.append(f'<div style="position: absolute; left: {x}px; top: {y}px; width: {PW}px; height: {PH}px; overflow: hidden">'
                     f'<div style="width: 720px; height: 1080px; transform: scale({SCALE:.6f}); transform-origin: 0 0">'
                     f'<dc-import name="{poster}" hint-size="720px,1080px"></dc-import></div></div>')
    grid_bottom = TOP + 3 * PH + 2 * GAP
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Nine Spirits · {label.title()}</title>
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
<div style="position: relative; width: {W}px; height: {H}px; overflow: hidden; background: #0B100E; font-family: 'Josefin Sans', sans-serif; color: #D4AF5A">
<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}" style="position: absolute; left: 0; top: 0" aria-hidden="true">
<path d="M44 20H1396L1420 44V2116L1396 2140H44L20 2116V44Z" fill="none" stroke="#D4AF5A" stroke-width="2.4"></path>
<path d="M52 30H1388L1410 52V2108L1388 2130H52L30 2108V52Z" fill="none" stroke="#D4AF5A" stroke-width=".9" opacity=".7"></path>
<path d="M80 176H1360" stroke="#D4AF5A" stroke-width="2.4"></path><path d="M80 182H1360" stroke="#D4AF5A" stroke-width=".7"></path>
<circle cx="80" cy="176" r="4" fill="#D4AF5A"></circle><circle cx="1360" cy="176" r="4" fill="#D4AF5A"></circle>
<path d="M80 {grid_bottom + 24}H1360" stroke="#D4AF5A" stroke-width="1.2"></path>
<circle cx="80" cy="{grid_bottom + 24}" r="3" fill="#D4AF5A"></circle><circle cx="1360" cy="{grid_bottom + 24}" r="3" fill="#D4AF5A"></circle>
<polygon points="720,{grid_bottom + 16} 728,{grid_bottom + 24} 720,{grid_bottom + 32} 712,{grid_bottom + 24}" fill="#D4AF5A"></polygon>
</svg>
<div style="position: absolute; left: 0; top: 64px; width: {W}px; text-align: center; font-weight: 300; font-size: 54px; line-height: 1; letter-spacing: 0.62em; text-indent: 0.62em; color: #EDE6D3">ART TECHNO</div>
<div style="position: absolute; left: 0; top: 134px; width: {W}px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 14px; letter-spacing: 0.42em; text-indent: 0.42em; color: #7FBFA8">THE NINE SPIRITS · {label}</div>
{chr(10).join(cells)}
<div style="position: absolute; left: 0; top: {grid_bottom + 48}px; width: {W}px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.3em; text-indent: 0.3em; color: #7FBFA8">{note}</div>
<div style="position: absolute; left: 0; top: {grid_bottom + 76}px; width: {W}px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.3em; text-indent: 0.3em; color: #7FBFA8">THE GILDED CIRCUIT · 2026 · 10 · 16</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":{H}}}}}'>
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
    for name, (label, note, posters) in BOARDS.items():
        out = SRC / f"{name}.dc.html"
        out.write_text(board(name, label, note, posters))
        print(out)
