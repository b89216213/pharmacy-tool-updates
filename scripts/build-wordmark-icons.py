"""Build the six matching lettermarks from Noto Sans TC ExtraBold outlines.

Usage: python3 scripts/build-wordmark-icons.py /path/to/noto-sans-tc-chinese-traditional-800-normal.woff
Then run node scripts/render-wordmark-icons.mjs to export the Chrome PNG sizes.
The committed SVG paths do not need any font installed on hospital computers.
"""
from pathlib import Path
import json
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parents[1]
font = TTFont(sys.argv[1])
glyphs = font.getGlyphSet()
scale = 94 / font['head'].unitsPerEm
for item in json.loads((root / 'branding/tools.json').read_text()):
    glyph = glyphs[font.getBestCmap()[ord(item['character'])]]
    bounds = BoundsPen(glyphs)
    glyph.draw(bounds)
    x0, y0, x1, y1 = bounds.bounds
    pen = SVGPathPen(glyphs)
    glyph.draw(TransformPen(pen, (scale, 0, 0, -scale,
        64 - scale * (x0 + x1) / 2, 64 + scale * (y0 + y1) / 2)))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
        f'<title>{item["character"]}</title><rect x="2" y="2" width="124" height="124" rx="26" fill="{item["color"]}"/>'
        f'<path fill="#fff" d="{pen.getCommands()}"/></svg>\n')
    target = root / item['extension'] / 'icons'
    target.mkdir(parents=True, exist_ok=True)
    (target / item['svgName']).write_text(svg)
print('Built 6 outlined lettermark SVGs')
