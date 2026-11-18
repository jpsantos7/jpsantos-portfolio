#!/usr/bin/env bash
# Rebuilds src/assets/fonts/*.woff2 from google/fonts at a pinned commit.
# Usage: scripts/subset-fonts.sh   (needs python3; makes its own venv in a temp dir)
# Sources are downloaded into a fresh temp directory outside the repo and never executed.
set -euo pipefail

SHA="7af0d90b4d532ffa4b041937b560c6df4e7b1e95"   # github.com/google/fonts
FONTTOOLS="4.68.0"
BROTLI="1.2.1"
UNICODES="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2022,U+20AC,U+2122"

# Layout features kept: kerning, ligatures, contextual alternates and mark positioning only.
# Keeping every feature (small caps, fractions, alternates) costs about 10 KB in Bricolage alone.
FEATURES="kern,liga,calt,ccmp,locl,mark,mkmk"

out="$(cd "$(dirname "$0")/.." && pwd)/src/assets/fonts"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
base="https://raw.githubusercontent.com/google/fonts/$SHA/ofl"

python3 -m venv "$work/venv"
"$work/venv/bin/pip" install -q "fonttools==$FONTTOOLS" "brotli==$BROTLI"
mkdir "$work/src"

get() { curl -sfLo "$work/src/$1" "$base/$2"; }
get bricolage.ttf "bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
get geist.ttf "geist/Geist%5Bwght%5D.ttf"
get geistmono.ttf "geistmono/GeistMono%5Bwght%5D.ttf"
get fraunces-italic.ttf "fraunces/Fraunces-Italic%5BSOFT,WONK,opsz,wght%5D.ttf"
for d in bricolagegrotesque geist geistmono fraunces; do
  curl -sfLo "$out/OFL-$d.txt" "$base/$d/OFL.txt"
done

inst() { "$work/venv/bin/fonttools" varLib.instancer -q -o "$work/$1.ttf" "$work/src/$2.ttf" "${@:3}"; }
sub() { "$work/venv/bin/pyftsubset" "$work/$1.ttf" --unicodes="$UNICODES" --flavor=woff2 --layout-features="$FEATURES" --no-hinting --drop-tables+=meta,DSIG --output-file="$out/$2.woff2"; }

# Bricolage: wght 400-800 kept; wdth pinned 100, opsz pinned 96 (its default, the display cut).
inst bricolage bricolage wght=400:800 wdth=100 opsz=96
sub bricolage bricolage-grotesque

# Geist: wght 400-700 kept.
inst geist geist wght=400:700
sub geist geist

# Geist Mono: wght 500-700 kept (labels at 500, <strong> inside a label at 700).
inst geistmono geistmono wght=500:700
sub geistmono geist-mono

# Fraunces Italic: wght 400-700 kept (<strong> inside emphasis at 700), SOFT 0, WONK 1
# (font defaults), opsz 16 (body-size emphasis).
inst fraunces fraunces-italic wght=400:700 SOFT=0 WONK=1 opsz=16
sub fraunces fraunces-italic

ls -l "$out"
