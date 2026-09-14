#!/usr/bin/env python3
"""Build KlartextMarks.woff2 and KlartextMarksQuote.woff2, the marker companion faces.

Live Preview keeps a block's source marker in the DOM as real text: "- ",
"1. ", "> ". The theme wants the caret and the hanging indent measured from
that text (Obsidian derives both from it), but does not want to SHOW the
dot, the dash, the asterisk, the plus or the angle bracket. CSS cannot hide
one character of a span, so the characters are hidden by the font instead:
this face contains empty glyphs for exactly those code points, and the
theme lists it first in the marker's font stack with a matching
unicode-range, so every other character falls through to JetBrains Mono.

Advances are chosen for the geometry, in a 1000-unit em like JetBrains
Mono, whose advance is 600 (= 1ch of the body):
  space, hyphen, asterisk, plus, greater  → 0    (take no room at all)
  period, right parenthesis               → 600  (the number keeps one
                                                  blank cell after its
                                                  digits, so "10." ends
                                                  where "10" plus a gap
                                                  would)
Vertical metrics copy JetBrains Mono's, so a line whose only content is a
marker keeps exactly the height of a line of text.

Requires fontTools and brotli:  pip install fonttools brotli
Usage (from the theme folder):  python3 fonts/make-marks.py
"""
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).parent

GLYPHS = {            # name: (code point, advance)
    ".notdef":    (None, 0),
    "space":      (0x20, 0),
    "hyphen":     (0x2D, 0),
    "asterisk":   (0x2A, 0),
    "plus":       (0x2B, 0),
    "greater":    (0x3E, 0),
    "period":     (0x2E, 600),
    "parenright": (0x29, 600),
}

# A second face for a callout's header token, which Obsidian tokenises as
# ONE span, "> [!type] ". There only the ">" may vanish: the spaces must keep
# their advance so the tag sits one cell in from the ">" and the title one
# cell after the tag.
# Every marker glyph is empty. .notdef alone gets one contour of three
# points one unit apart — a triangle 1/1000 em across, which no screen can
# draw — because Chromium's font sanitizer rejects a font whose glyph table
# is zero-length once woff2 has transformed it, and a single-point contour
# is dropped as degenerate. .notdef is never displayed anyway.
def _empty():
    return TTGlyphPen(None).glyph()
def _dot():
    pen = TTGlyphPen(None); pen.moveTo((0, 0)); pen.lineTo((1, 0)); pen.lineTo((0, 1)); pen.closePath(); return pen.glyph()


QUOTE_GLYPHS = {
    ".notdef": (None, 0),
    "greater": (0x3E, 0),
}


def build(family, ps_name, glyphs, filename):
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(list(glyphs))
    fb.setupCharacterMap({cp: name for name, (cp, _) in glyphs.items() if cp is not None})
    fb.setupGlyf({name: (_dot() if name == ".notdef" else _empty()) for name in glyphs})
    fb.setupHorizontalMetrics({name: (adv, 0) for name, (_, adv) in glyphs.items()})
    fb.setupHorizontalHeader(ascent=1020, descent=-300, lineGap=0)
    fb.setupNameTable({"familyName": family, "styleName": "Regular",
                       "uniqueFontIdentifier": family + " 1.0",
                       "fullName": family, "psName": ps_name, "version": "Version 1.0"})
    fb.setupOS2(sTypoAscender=1020, sTypoDescender=-300, sTypoLineGap=0,
                usWinAscent=1020, usWinDescent=300, sxHeight=550, sCapHeight=730,
                fsSelection=0b11000000, version=4)   # REGULAR + USE_TYPO_METRICS, as JetBrains Mono
    fb.setupPost()
    font = fb.font
    font.flavor = "woff2"
    out = HERE / filename
    font.save(out)
    print(f"{out.name}: {out.stat().st_size} bytes,", TTFont(out)["hhea"].ascent, TTFont(out)["hhea"].descent)



build("Klartext Marks", "KlartextMarks-Regular", GLYPHS, "KlartextMarks.woff2")
build("Klartext Marks Quote", "KlartextMarksQuote-Regular", QUOTE_GLYPHS, "KlartextMarksQuote.woff2")
