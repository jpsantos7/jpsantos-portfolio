#!/usr/bin/env python3
# Derives size-adjust and ascent/descent overrides for the fallback @font-face rules in
# src/css/global/fonts.css.
#
# size-adjust = rendered width of a fixed mixed-case English sample in the real face at the
# weight in use, over the same sample in the local fallback face at size-adjust 100%.
# Both widths are SHAPED with HarfBuzz (the engine Chromium, Firefox and WebKit use for
# layout), so kerning is included, which raw hmtx advances would miss. Ligatures are off in
# the sample because browsers disable them when letter-spacing is not 0, and every role
# here is tracked. Letter-spacing is in em of the unadjusted font size, so it adds the
# same amount to both faces and cancels out of the ratio.
# Ascent and descent are the real face's hhea metrics at that weight, divided by
# size-adjust (the descriptors are applied after the scaling).
#
# Usage (needs fonttools, brotli and uharfbuzz; versions pinned below):
#   python3 -m venv /tmp/fm && /tmp/fm/bin/pip install fonttools==4.68.0 brotli==1.2.1 uharfbuzz==0.57.0
#   /tmp/fm/bin/python scripts/fallback-metrics.py [--linux DIR]
# Real faces are the shipped files in src/assets/fonts. Local faces are the macOS system
# fonts. --linux DIR points at a folder holding the Linux look-alikes (LiberationSans-*.ttf,
# LiberationSerif-Italic.ttf, LiberationSerif-BoldItalic.ttf, LiberationMono-*.ttf, Arimo.ttf,
# Tinos-Italic.ttf, Tinos-BoldItalic.ttf, Cousine-Regular.ttf, Cousine-Bold.ttf) and also
# prints their size-adjust, to check the local() fallbacks listed after Arial, Times New
# Roman and Courier New in fonts.css hold the same overrides.
#
# Local fonts the numbers in fonts.css were measured against (name table, version string):
#   macOS 27.2.1: Arial and Arial Bold "Version 5.01.2x", Times New Roman Italic and Bold
#   Italic "Version 5.00.3x", Courier New and Courier New Bold "Version 5.00.2x".
# Confirmed metric-identical to them (+0.00% shaped width of the sample): Liberation Sans
# Regular and Bold, Liberation Serif Italic and Bold Italic, Liberation Mono Regular and
# Bold, all 2.1.5 (also the version of Ubuntu 24.04's fonts-liberation 1:2.1.5-3); Arimo
# "Version 1.341", Tinos Italic and Bold Italic "Version 1.340", Cousine Regular and Bold
# "Version 1.241" (google/fonts at the commit pinned in scripts/subset-fonts.sh). Re-run
# with --linux if a platform font is updated.
import io
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "src/assets/fonts"
MAC = Path("/System/Library/Fonts/Supplemental")

SAMPLE = (
    "When a team ships a feature, the people who rely on a keyboard or a screen reader are "
    "often the last to find out whether it works. Good interface work starts with plain "
    "markup, clear labels and enough contrast, and it keeps the details small: a focus ring "
    "that is easy to see, a heading that says what follows, a form that explains its own "
    "errors. Selected work, case study, about, contact. Role: lead designer. Outcome: fewer "
    "support requests and a faster checkout for everyone. Read the full story of how we "
    "rebuilt the booking flow in three months, with the people who used it every day."
)
FEATURES = {"liga": False, "clig": False, "kern": True}


def load(path, axes):
    """Open a font (instanced at axes, if any) as (HarfBuzz font, hhea metrics)."""
    f = TTFont(path)
    if axes:
        f = instancer.instantiateVariableFont(f, axes)
    buf = io.BytesIO()
    f.flavor = None
    f.save(buf)
    face = hb.Face(buf.getvalue())
    font = hb.Font(face)
    upm = f["head"].unitsPerEm
    h = f["hhea"]
    return font, upm, (h.ascent / upm, -h.descent / upm, h.lineGap / upm)


def width(font, upm):
    buf = hb.Buffer()
    buf.add_str(SAMPLE)
    buf.guess_segment_properties()
    hb.shape(font, buf, FEATURES)
    return sum(p.x_advance for p in buf.glyph_positions) / upm


def measure(path, axes=None):
    font, upm, metrics = load(path, axes)
    return width(font, upm), metrics


# role, weight, real file + axes, local fallbacks (name -> file)
CASES = [
    ("Bricolage 400", "bricolage-grotesque.woff2", {"wght": 400}, "arial"),
    ("Bricolage 700", "bricolage-grotesque.woff2", {"wght": 700}, "arial-bold"),
    ("Bricolage 800", "bricolage-grotesque.woff2", {"wght": 800}, "arial-bold"),
    ("Geist 400", "geist.woff2", {"wght": 400}, "arial"),
    ("Geist 700", "geist.woff2", {"wght": 700}, "arial-bold"),
    ("Geist Mono 500", "geist-mono.woff2", {"wght": 500}, "courier"),
    ("Geist Mono 700", "geist-mono.woff2", {"wght": 700}, "courier-bold"),
    ("Fraunces Italic 400", "fraunces-italic.woff2", {"wght": 400}, "times-italic"),
    ("Fraunces Italic 700", "fraunces-italic.woff2", {"wght": 700}, "times-bold-italic"),
]
MAC_FACES = {
    "arial": MAC / "Arial.ttf",
    "arial-bold": MAC / "Arial Bold.ttf",
    "courier": MAC / "Courier New.ttf",
    "courier-bold": MAC / "Courier New Bold.ttf",
    "times-italic": MAC / "Times New Roman Italic.ttf",
    "times-bold-italic": MAC / "Times New Roman Bold Italic.ttf",
}


def linux_faces(d):
    d = Path(d)
    return {
        "arial": [d / "liberation-fonts-ttf-2.1.5/LiberationSans-Regular.ttf"],
        "arial-bold": [d / "liberation-fonts-ttf-2.1.5/LiberationSans-Bold.ttf"],
        "courier": [
            d / "liberation-fonts-ttf-2.1.5/LiberationMono-Regular.ttf",
            d / "Cousine-Regular.ttf",
        ],
        "courier-bold": [
            d / "liberation-fonts-ttf-2.1.5/LiberationMono-Bold.ttf",
            d / "Cousine-Bold.ttf",
        ],
        "times-bold-italic": [
            d / "liberation-fonts-ttf-2.1.5/LiberationSerif-BoldItalic.ttf",
            d / "Tinos-BoldItalic.ttf",
        ],
        "times-italic": [
            d / "liberation-fonts-ttf-2.1.5/LiberationSerif-Italic.ttf",
            d / "Tinos-Italic.ttf",
        ],
    }


def main():
    linux = sys.argv[sys.argv.index("--linux") + 1] if "--linux" in sys.argv else None
    lin = linux_faces(linux) if linux else {}
    for name, file, axes, local in CASES:
        rw, (a, d, g) = measure(FONTS / file, axes)
        fw, _ = measure(MAC_FACES[local])
        s = rw / fw
        print(
            f"{name}: size-adjust {s * 100:.2f}%  ascent-override {a / s * 100:.2f}%  "
            f"descent-override {d / s * 100:.2f}%  line-gap {g / s * 100:.2f}%"
        )
        for p in lin.get(local, []):
            lw, _ = measure(p)
            print(
                f"    on {p.name}: needs {rw / lw * 100:.2f}% "
                f"({(s * lw / rw - 1) * 100:+.2f}% width with the rule above)"
            )
    if linux:
        # Arimo is variable (wght); Arial Bold's look-alike is the 700 instance.
        for label, axes, local in (("Arimo 400", {"wght": 400}, "arial"), ("Arimo 700", {"wght": 700}, "arial-bold")):
            fw, _ = measure(MAC_FACES[local])
            aw, _ = measure(Path(linux) / "Arimo.ttf", axes)
            print(f"{label} vs {MAC_FACES[local].name}: {(aw / fw - 1) * 100:+.3f}% width")


if __name__ == "__main__":
    main()
