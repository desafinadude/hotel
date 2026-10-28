#!/usr/bin/env python3
"""Cut the art contact sheets in art/sheets/ into single images and write js/art.js.

Usage: python3 tools/slice_sheets.py

Sheets are matched by their number (sheet-01-..., sheet-02-..., any image extension).
Missing sheets are skipped; the game falls back to emoji for anything without a picture.
Gutters are baked into the generated art, so each boundary is found by looking for the
light, full-length band near where the grid says it should be.
"""
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SHEETS = ROOT / 'art' / 'sheets'
OUT = ROOT / 'img'


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def game_data():
    src = (ROOT / 'js' / 'data.js').read_text()
    guests = re.findall(r"\[(\d+), '([^']+)', '([RYBG])', '[a-z]+', -?\d+, '[^']*', '[^']+'\]", src)
    staff = re.findall(r"\[(\d+), '([^']+)', \d+, '(?:opr|perm|end|once)', '[^']+'\]", src)
    return guests, staff


def sheet_specs():
    guests, staff = game_data()
    by_color = {c: [(int(n), name) for n, name, col in guests if col == c] for c in 'YBRG'}
    specs = {}
    for i, c in enumerate('YBRG', start=1):
        cells = [('guests', str(n), f'img/guests/{n}-{slug(name)}.webp') for n, name in by_color[c]]
        specs[i] = dict(cols=4, rows=4, size=384, detect=True, cells=cells)
    for k in range(3):
        part = staff[k * 16:(k + 1) * 16]
        cells = [('staff', str(int(n)), f'img/staff/{int(n):02d}-{slug(name)}.webp') for n, name in part]
        specs[5 + k] = dict(cols=4, rows=4, size=320, detect=True, cells=cells)
    specs[8] = dict(cols=2, rows=2, size=192, detect=False, inset=0.07, tight=True,
                    cells=[('items', c, f'img/items/{n}.webp') for c, n in
                           [('s', 'strudel'), ('c', 'cake'), ('w', 'wine'), ('k', 'coffee')]])
    specs[9] = dict(cols=2, rows=2, size=256, detect=True,
                    cells=[('players', str(i), f'img/players/{n}.webp') for i, n in
                           enumerate(['you', 'anna', 'franz', 'sisi'])])
    specs[10] = dict(cols=3, rows=2, size=256, detect=True, zoom=0.7,
                     cells=[('rooms', f'{c}-{st}', f'img/rooms/{c.lower()}-{st}.webp')
                            for st in ['free', 'occ'] for c in 'RYB'])
    return specs


def light(px):
    r, g, b = px[:3]
    return r > 214 and g > 205 and b > 185 and max(r, g, b) - min(r, g, b) < 48


def profile(img, axis):
    """Fraction of light pixels in every column (axis=0) or row (axis=1)."""
    w, h = img.size
    small = img.convert('RGB')
    px = small.load()
    n = w if axis == 0 else h
    m = h if axis == 0 else w
    step = max(1, m // 300)
    out = []
    for i in range(n):
        hits = total = 0
        for j in range(0, m, step):
            p = px[i, j] if axis == 0 else px[j, i]
            hits += light(p)
            total += 1
        out.append(hits / total)
    return out


def bounds(prof, cells, detect):
    """Return [(start, end)] for each cell along one axis."""
    n = len(prof)
    size = n / cells
    if not detect:
        return [(round(i * size), round((i + 1) * size)) for i in range(cells)]
    gut = [v > 0.93 for v in prof]
    # outer edges: skip any light margin
    lo = 0
    while lo < n * 0.05 and gut[lo]:
        lo += 1
    hi = n - 1
    while hi > n * 0.95 and gut[hi]:
        hi -= 1
    cuts = [(lo, lo)]
    for k in range(1, cells):
        exp = round(k * size)
        win = round(size * 0.08)
        band = [i for i in range(exp - win, exp + win) if gut[i]]
        if band:
            # keep the run of gutter pixels closest to the expected position
            runs, cur = [], [band[0]]
            for i in band[1:]:
                if i == cur[-1] + 1:
                    cur.append(i)
                else:
                    runs.append(cur)
                    cur = [i]
            runs.append(cur)
            run = min(runs, key=lambda r: abs((r[0] + r[-1]) / 2 - exp))
            cuts.append((run[0], run[-1] + 1))
        else:
            cuts.append((exp, exp))
    cuts.append((hi + 1, hi + 1))
    return [(cuts[i][1], cuts[i + 1][0]) for i in range(cells)]


def object_box(img, box):
    x0, y0, x1, y1 = box
    px = img.load()
    xs, ys = [], []
    for y in range(y0, y1, 2):
        for x in range(x0, x1, 2):
            if not light(px[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        return box
    pad = round((x1 - x0) * 0.04)
    bx0, bx1, by0, by1 = min(xs), max(xs), min(ys), max(ys)
    side = max(bx1 - bx0, by1 - by0) + 2 * pad
    cx, cy = (bx0 + bx1) // 2, (by0 + by1) // 2
    return (cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)


def slice_sheet(path, spec, art):
    img = Image.open(path).convert('RGB')
    xs = bounds(profile(img, 0), spec['cols'], spec['detect'])
    ys = bounds(profile(img, 1), spec['rows'], spec['detect'])
    inset = spec.get('inset', 0.02)
    for idx, (group, key, rel) in enumerate(spec['cells']):
        r, c = divmod(idx, spec['cols'])
        x0, x1 = xs[c]
        y0, y1 = ys[r]
        dx, dy = round((x1 - x0) * inset), round((y1 - y0) * inset)
        x0, x1, y0, y1 = x0 + dx, x1 - dx, y0 + dy, y1 - dy
        if spec.get('tight'):
            # trim to the object so small icons are not mostly background
            x0, y0, x1, y1 = object_box(img, (x0, y0, x1, y1))
        side = min(x1 - x0, y1 - y0)  # centre a square crop
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        if spec.get('zoom'):
            # close-up of the middle (the door), keeping the floor in view
            side = round(side * spec['zoom'])
            cy = y1 - side // 2
        cell = img.crop((cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side))
        cell = cell.resize((spec['size'], spec['size']), Image.LANCZOS)
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        cell.save(dest, 'WEBP', quality=82, method=6)
        art.setdefault(group, {})[key] = rel


def main():
    art = {}
    found = {}
    for f in SHEETS.iterdir() if SHEETS.exists() else []:
        m = re.match(r'sheet-(\d+)', f.name)
        if m:
            found[int(m.group(1))] = f
    for num, spec in sorted(sheet_specs().items()):
        if num in found:
            slice_sheet(found[num], spec, art)
            print(f'sheet {num:02d}: {len(spec["cells"])} images')
        else:
            print(f'sheet {num:02d}: missing, skipped')
    js = ('// Generated by tools/slice_sheets.py from art/sheets/. Do not edit by hand.\n'
          f'const ART = {json.dumps(art, indent=2, sort_keys=True)};\n')
    (ROOT / 'js' / 'art.js').write_text(js)


if __name__ == '__main__':
    main()
