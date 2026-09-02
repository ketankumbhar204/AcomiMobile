"""Render tablet-sized Play screenshots from real ACOMI phone captures.

Does not modify application source. Does not stretch the full screenshot.
Widens each row by inserting pixels only in long uniform runs (gutters,
card fills, header chrome) so text, icons, and controls keep native pixels.

These are rendered tablet assets, not emulator captures.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PHONE = ROOT / "phone"
OUT_7 = ROOT / "tablet-7inch"
OUT_10 = ROOT / "tablet-10inch"

# Play Console tablet screenshots must be 9:16 or 16:9.
# 7-inch: 320–3840 per side. 10-inch: 1080–7680 per side.
SIZE_7 = (1350, 2400)  # 9:16, same height as the phone capture
SIZE_10 = (1800, 3200)  # 9:16, extra viewport height

STATUS_END = 132
TAB_START = 2172
GESTURE_START = 2337

SCREENS = [
    "01-dashboard.png",
    "02-spaces.png",
    "03-accommodation.png",
    "04-members.png",
    "05-meals.png",
    "06-payments.png",
    "07-complaints.png",
]


def _color_dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def smart_widen(im: Image.Image, new_w: int, *, protect: int = 36, min_run: int = 12, tol: int = 18) -> Image.Image:
    """Widen by duplicating low-energy vertical columns (same x for every row).

    This keeps glyphs and icons aligned. Row-by-row insertion caused shimmer.
    min_run/tol are unused; kept so call sites stay valid.
    """
    del min_run, tol
    src = im.convert("RGB")
    w, h = src.size
    extra = new_w - w
    if extra == 0:
        return src
    if extra < 0:
        raise ValueError("smart_widen only expands width")

    pix = src.load()
    energy = [10**12] * w
    step = 2
    for x in range(protect, w - protect):
        e = 0
        samples = 0
        for y in range(0, h, step):
            p = pix[x, y]
            left = pix[x - 1, y]
            e += _color_dist(p, left)
            if y >= step:
                e += _color_dist(p, pix[x, y - step])
            samples += 1
        energy[x] = e / max(1, samples)

    ranked = sorted(range(protect, w - protect), key=lambda x: energy[x])
    sites: list[int] = []
    min_gap = 8
    for x in ranked:
        if all(abs(x - s) >= min_gap for s in sites):
            sites.append(x)
        if len(sites) >= min(extra, 90):
            break
    if not sites:
        sites = [w // 2]

    inserts = [0] * w
    for i in range(extra):
        inserts[sites[i % len(sites)]] += 1

    out = Image.new("RGB", (new_w, h))
    dest = out.load()
    for y in range(h):
        dx = 0
        for x in range(w):
            p = pix[x, y]
            dest[dx, y] = p
            dx += 1
            extra_here = inserts[x]
            if extra_here:
                for _ in range(extra_here):
                    dest[dx, y] = p
                    dx += 1
    return out


def widen_tab_bar(strip: Image.Image, new_w: int, tabs: int = 6) -> Image.Image:
    """Keep each tab's pixels unstretched; distribute extra width between tabs."""
    w, h = strip.size
    cell = w // tabs
    dest_cell = new_w // tabs
    dest = Image.new("RGB", (new_w, h), (255, 255, 255))
    for i in range(tabs):
        src_x0 = i * cell
        src_x1 = w if i == tabs - 1 else (i + 1) * cell
        cell_im = strip.crop((src_x0, 0, src_x1, h))
        dest_x0 = i * dest_cell
        dest_x1 = new_w if i == tabs - 1 else (i + 1) * dest_cell
        slot_w = dest_x1 - dest_x0
        x = dest_x0 + max(0, (slot_w - cell_im.width) // 2)
        dest.paste(cell_im, (x, 0))
    return dest


def has_tab_bar(name: str) -> bool:
    return name != "02-spaces.png"


def render_tablet(src: Image.Image, name: str, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    w, h = src.size
    rgb = src.convert("RGB")

    status = rgb.crop((0, 0, w, STATUS_END))
    gesture = rgb.crop((0, GESTURE_START, w, h))

    if has_tab_bar(name):
        body = rgb.crop((0, STATUS_END, w, TAB_START))
        tabs = rgb.crop((0, TAB_START, w, GESTURE_START))
        body_w = smart_widen(body, target_w)
        tabs_w = widen_tab_bar(tabs, target_w)
    else:
        body = rgb.crop((0, STATUS_END, w, GESTURE_START))
        body_w = smart_widen(body, target_w)
        tabs_w = None

    status_w = smart_widen(status, target_w, min_run=8)
    gesture_w = smart_widen(gesture, target_w, protect=40, min_run=10)

    chrome_h = STATUS_END + body_w.height + (tabs_w.height if tabs_w else 0) + gesture_w.height
    extra_h = target_h - chrome_h
    bg = body_w.getpixel((8, body_w.height - 12))

    canvas = Image.new("RGB", (target_w, target_h), bg)
    y = 0
    canvas.paste(status_w, (0, y))
    y += status_w.height
    canvas.paste(body_w, (0, y))
    y += body_w.height
    if extra_h > 0:
        y += extra_h
    if tabs_w is not None:
        canvas.paste(tabs_w, (0, y))
        y += tabs_w.height
    canvas.paste(gesture_w, (0, target_h - gesture_w.height))
    return canvas


def report(path: Path) -> str:
    with Image.open(path) as im:
        w, h = im.size
        gcd = math.gcd(w, h)
        ok_7 = 320 <= w <= 3840 and 320 <= h <= 3840 and abs(w / h - 9 / 16) < 0.01
        ok_10 = 1080 <= w <= 7680 and 1080 <= h <= 7680 and abs(w / h - 9 / 16) < 0.01
        folder = path.parent.name
        play = ok_7 if "7" in folder else ok_10
        return (
            f"{path.relative_to(ROOT).as_posix()}\t{w}x{h}\t{im.mode}\t"
            f"{round(path.stat().st_size / 1024, 1)}KB\t{w // gcd}:{h // gcd}\t"
            f"{'YES' if play else 'NO'}"
        )


def main() -> None:
    OUT_7.mkdir(parents=True, exist_ok=True)
    OUT_10.mkdir(parents=True, exist_ok=True)

    print("FILE\tSIZE\tMODE\tKB\tRATIO\tPLAY")
    for name in SCREENS:
        src_path = PHONE / name
        src = Image.open(src_path)
        t7 = render_tablet(src, name, SIZE_7)
        t10 = render_tablet(src, name, SIZE_10)
        p7 = OUT_7 / name
        p10 = OUT_10 / name
        t7.save(p7, "PNG", optimize=True)
        t10.save(p10, "PNG", optimize=True)
        print(report(p7))
        print(report(p10))


if __name__ == "__main__":
    main()
