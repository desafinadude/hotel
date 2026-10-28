#!/usr/bin/env python3
"""Draw the app icon (the hotel facade on a navy tile) and write icons/ at every size the manifest uses.

Usage: python3 tools/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'icons'
NAVY = (30, 42, 68)
PAPER = (238, 226, 199)
GOLD = (201, 154, 46)
ROOM = {'R': (179, 71, 60), 'Y': (201, 154, 46), 'B': (61, 106, 163)}
LAYOUT = ['BYRRB', 'YYRRY', 'BRBYY', 'BRBRB']  # ground floor first, as in js/data.js


def draw(size, safe):
    """Draw at 4x and scale down. `safe` is the share of the tile the facade may use (maskable icons need room)."""
    S = size * 4
    img = Image.new('RGB', (S, S), NAVY)
    d = ImageDraw.Draw(img)
    w = S * safe                      # facade width
    x0 = (S - w) / 2
    gap = w * 0.035
    cell = (w - gap * 4) / 5
    roof_h = w * 0.2
    body_h = cell * 4 + gap * 3
    total = roof_h + gap * 1.5 + body_h + gap * 1.5 + w * 0.03
    y0 = (S - total) / 2
    # roof with a gold finial
    d.polygon([(x0 - w * 0.06, y0 + roof_h), (S / 2, y0), (x0 + w + w * 0.06, y0 + roof_h)], fill=PAPER)
    r = w * 0.035
    d.ellipse([S / 2 - r, y0 + roof_h * 0.55 - r, S / 2 + r, y0 + roof_h * 0.55 + r], fill=GOLD)
    # rooms: top floor first
    top = y0 + roof_h + gap * 1.5
    for row, line in enumerate(reversed(LAYOUT)):
        for col, c in enumerate(line):
            x = x0 + col * (cell + gap)
            y = top + row * (cell + gap)
            d.rounded_rectangle([x, y, x + cell, y + cell], radius=cell * 0.16, fill=ROOM[c])
    # base line
    by = top + body_h + gap * 1.5
    d.rounded_rectangle([x0 - w * 0.06, by, x0 + w + w * 0.06, by + w * 0.03], radius=w * 0.015, fill=PAPER)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    for size in (192, 512):
        draw(size, 0.62).save(OUT / f'icon-{size}.png', optimize=True)
        draw(size, 0.5).save(OUT / f'maskable-{size}.png', optimize=True)
    draw(180, 0.6).save(OUT / 'apple-touch-icon.png', optimize=True)
    draw(32, 0.78).save(OUT / 'favicon-32.png', optimize=True)
    print('icons written to', OUT)


if __name__ == '__main__':
    main()
