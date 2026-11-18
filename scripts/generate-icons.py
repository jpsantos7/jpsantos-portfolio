#!/usr/bin/env python3
# Generates the "jp." mark and every icon file (ticket 031). Outputs are committed, so the
# build never runs this; re-run it when the mark or the font changes.
#
# Geometry is the owner-approved mark E of prototype 027 (vault ticket 027), on a 100x100
# grid, text-anchor middle at x=50:
#   large  (> 32px): tile radius 18, font-size 56, baseline y 58, letter-spacing -3, dot 1x
#   small  (<= 32px): tile radius 14, font-size 60, baseline y 60, letter-spacing -5, dot 1.3x
#   maskable: no radius (full bleed), font-size 38, baseline y 56, letter-spacing -3, dot 1x
# The prototype sets "jp" plus a "." tspan with its own size, so the full stop is the
# font's period glyph in yellow, outlined like the letters. Letter-spacing follows the SVG
# rule (added after every glyph, the last included, so it counts towards centring).
# Colours come from src/design-tokens/colors.json (ink tile, bg light off-white, yellow).
#
# Outlines: src/assets/fonts/bricolage-grotesque.woff2, instanced at wght 800 (the subset
# already pins opsz 96 and wdth 100, see scripts/subset-fonts.sh).
#
# Usage (versions pinned as in fallback-metrics.py; needs node_modules for sharp):
#   python3 -m venv /tmp/fm && /tmp/fm/bin/pip install fonttools==4.68.0 brotli==1.2.1 uharfbuzz==0.57.0
#   /tmp/fm/bin/python scripts/generate-icons.py
import io
import json
import subprocess
import tempfile
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

colors = {c["name"]: c for c in json.loads((ROOT / "src/design-tokens/colors.json").read_text())["items"]}
INK = colors["ink"]["value"]
YELLOW = colors["yellow"]["value"]
PAPER = colors["bg"]["light"]

# name: (tile radius, font-size, baseline y, letter-spacing, dot scale)
VARIANTS = {
    "large": (18, 56, 58, -3, 1.0),
    "small": (14, 60, 60, -5, 1.3),
    "maskable": (0, 38, 56, -3, 1.0),
}

font = TTFont(ROOT / "src/assets/fonts/bricolage-grotesque.woff2")
font = instancer.instantiateVariableFont(font, {"wght": 800}, inplace=False)
font.flavor = None  # hb reads plain sfnt, not woff2
buf = io.BytesIO()
font.save(buf)
blob = buf.getvalue()
hbfont = hb.Font(hb.Face(blob))
upem = font["head"].unitsPerEm
cmap = font.getBestCmap()
glyphs = font.getGlyphSet()


def shape(text):
    b = hb.Buffer()
    b.add_str(text)
    b.guess_segment_properties()
    hb.shape(hbfont, b, {"liga": False})
    return [(font.getGlyphName(i.codepoint), p.x_advance) for i, p in zip(b.glyph_infos, b.glyph_positions)]


def num(v):
    return f"{v:.2f}".rstrip("0").rstrip(".") if "." in f"{v:.2f}" else f"{v:.2f}"


def outline(name, x, y, scale):
    pen = SVGPathPen(glyphs, ntos=num)
    glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, y)))
    return pen.getCommands()


def layout(variant):
    r, fs, y, ls, dot = VARIANTS[variant]
    s = fs / upem
    runs = [(shape("jp"), s, PAPER), (shape("."), s * dot, YELLOW)]
    total = sum(adv * sc + ls for run, sc, _ in runs for _, adv in run)
    x = 50 - total / 2
    paths = []  # (d, fill)
    for run, sc, fill in runs:
        for name, adv in run:
            paths.append((outline(name, x, y, sc), fill))
            x += adv * sc + ls
    return r, paths


def svg(variant):
    r, paths = layout(variant)
    body = "".join(f'<path d="{d}" fill="{f}"/>' for d, f in paths)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'<rect width="100" height="100" rx="{r}" fill="{INK}"/>{body}</svg>\n'
    )


PUBLIC.mkdir(exist_ok=True)
# The SVG favicon shows at 16 and 32 in tabs, so it carries the simplified drawing.
(PUBLIC / "icon.svg").write_text(svg("small"))
# Component data: the full-size drawing, so the header mark matches the large icon.
r, paths = layout("large")
(ROOT / "src/components").mkdir(exist_ok=True)
(ROOT / "src/components/mark-paths.json").write_text(
    json.dumps({"radius": r, "paths": [{"d": d, "role": "stop" if f == YELLOW else "letter"} for d, f in paths]}, indent=2) + "\n"
)

# Intermediate SVGs go to a temp dir outside the repo, removed even if the node step fails.
with tempfile.TemporaryDirectory() as work:
    for v in VARIANTS:
        (Path(work) / f"{v}.svg").write_text(svg(v))
    subprocess.run(["node", str(ROOT / "scripts/render-icons.mjs"), work, str(PUBLIC)], check=True)
