#!/usr/bin/env python3
"""Print a poster artboard from the Art Techno posters canvas to PDF or PNG with headless Chrome.

The sources are the canvas's ``.dc.html`` artboards, kept in ``src/``. Each is lifted out of
its ``<x-dc>`` wrapper into a plain page: the ``<helmet>`` goes to ``<head>``, every
``<dc-import name="X">`` is replaced by X's own content, and every ``/_blob/<id>`` image is
pointed at the local file ``blobs.json`` names for it (full resolution, not the canvas copy).

usage::

    docs/posters/topdf.py src/Power.dc.html                 # PDF, 12 x 18 in
    docs/posters/topdf.py src/Power.dc.html --png           # PNG preview at the artboard's size
    docs/posters/topdf.py src/*.dc.html --width-in 24       # 24 x 36 in

Writes to ``$ART_TECHNO_DIR/posters/`` (default ``~/Documents/art_techno/posters/``).
Set ``CHROME`` to the browser binary if it is not in the default macOS location.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = Path(os.environ.get("ART_TECHNO_DIR", Path.home() / "Documents/art_techno"))
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")


def blobs() -> dict[str, Path]:
    """Map of canvas blob id to local file; paths are relative to $ART_TECHNO_DIR."""
    f = HERE / "blobs.json"
    return {k: ROOT / v for k, v in json.loads(f.read_text()).items()} if f.exists() else {}


def parts(path: Path) -> tuple[str, str, tuple[int, int]]:
    """The helmet, the body inside <x-dc>, and the $preview size of one artboard."""
    text = path.read_text()
    body = re.search(r"<x-dc>(.*)</x-dc>", text, re.S).group(1)
    helmet = ""
    m = re.search(r"<helmet>(.*?)</helmet>", body, re.S)
    if m:
        helmet, body = m.group(1), body.replace(m.group(0), "", 1)
    pv = re.search(r'"\$preview"\s*:\s*\{\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+)', text)
    return helmet, body, (int(pv.group(1)), int(pv.group(2)))


def flatten(path: Path, heads: list[str]) -> str:
    """The artboard's body with its dc-imports inlined; collects every helmet into heads."""
    helmet, body, _ = parts(path)
    if helmet not in heads:
        heads.append(helmet)

    def child(m: re.Match) -> str:
        name = re.search(r'name="([^"]+)"', m.group(1)).group(1)
        return flatten(path.parent / f"{name}.dc.html", heads)

    return re.sub(r"<dc-import([^>]*)></dc-import>", child, body)


def page(path: Path, zoom: float, size_in: tuple[float, float] | None) -> str:
    heads: list[str] = []
    body = flatten(path, heads)
    for bid, local in blobs().items():
        body = body.replace(f"/_blob/{bid}", local.as_uri())
    missing = sorted(set(re.findall(r"/_blob/([0-9a-f]+)", body)))
    if missing:
        raise SystemExit(f"{path.name}: no local file in blobs.json for {', '.join(missing)}")
    at_page = f"@page {{ size: {size_in[0]}in {size_in[1]}in; margin: 0 }}" if size_in else ""
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        + "".join(heads)
        + f"<style>{at_page} html, body {{ margin: 0; background: #0B100E }}"
        + f" .poster {{ zoom: {zoom}; width: fit-content }}"
        + " * { -webkit-print-color-adjust: exact; print-color-adjust: exact }</style>"
        + f'</head><body><div class="poster">{body}</div></body></html>'
    )


def render(path: Path, out_dir: Path, width_in: float, png: bool) -> Path:
    _, _, (w, h) = parts(path)
    stem = path.name.removesuffix(".dc.html")
    if png:
        html, out = page(path, 1.0, None), out_dir / "previews" / f"{stem}.png"
        flags = [f"--screenshot={out}", f"--window-size={w},{h}"]
    else:
        zoom = width_in * 96 / w
        html, out = page(path, zoom, (width_in, round(width_in * h / w, 3))), out_dir / f"{stem}.pdf"
        flags = [f"--print-to-pdf={out}", "--no-pdf-header-footer"]
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--allow-file-access-from-files", "--virtual-time-budget=8000",
                    *flags, Path(f.name).as_uri()], check=True, capture_output=True)
    os.unlink(f.name)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("sources", nargs="+", type=Path)
    ap.add_argument("--width-in", type=float, default=12.0, help="PDF page width in inches (default 12)")
    ap.add_argument("--png", action="store_true", help="PNG preview at the artboard's own size")
    ap.add_argument("--out", type=Path, default=ROOT / "posters")
    a = ap.parse_args()
    for src in a.sources:
        print(render(src.resolve(), a.out, a.width_in, a.png))


if __name__ == "__main__":
    main()
