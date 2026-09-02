"""Export real ACOMI Play Store screenshots from captured phone UI.

Does not modify application source. Does not invent tablet layouts.
Run:
  python docs/play-store-assets/tools/export_play_screenshots.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "screenshots" / "raw"
PHONE_OUT = ROOT / "phone"
TABLET_7 = ROOT / "tablet-7inch"
TABLET_10 = ROOT / "tablet-10inch"

PHONE_MAP = [
    ("02-dashboard.png", "01-dashboard.png"),
    ("03-spaces.png", "02-spaces.png"),
    ("04-accommodation.png", "03-accommodation.png"),
    ("05-members.png", "04-members.png"),
    ("06-meals.png", "05-meals.png"),
    ("07-payments.png", "06-payments.png"),
    ("08-operations.png", "07-complaints.png"),
]


def to_play_png(src: Path, dest: Path) -> dict:
    im = Image.open(src)
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        out = bg
    else:
        out = im.convert("RGB")
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "PNG", optimize=True)
    w, h = out.size
    gcd = math.gcd(w, h)
    return {
        "file": dest.relative_to(ROOT).as_posix(),
        "w": w,
        "h": h,
        "mode": "RGB",
        "kb": round(dest.stat().st_size / 1024, 1),
        "ratio": f"{w // gcd}:{h // gcd}",
        "orientation": "portrait" if h > w else "landscape",
    }


def play_phone_ok(info: dict) -> str:
    w, h = info["w"], info["h"]
    if not (320 <= w <= 3840 and 320 <= h <= 3840):
        return "NO — side outside 320–3840"
    if h <= w:
        return "NO — expected portrait"
    return "YES"


def main() -> None:
    PHONE_OUT.mkdir(parents=True, exist_ok=True)
    TABLET_7.mkdir(parents=True, exist_ok=True)
    TABLET_10.mkdir(parents=True, exist_ok=True)

    for old in PHONE_OUT.glob("*.png"):
        old.unlink()

    print("PHONE")
    print("FILE\tSIZE\tKB\tRATIO\tORIENTATION\tPLAY")
    for src_name, dest_name in PHONE_MAP:
        src = RAW / src_name
        if not src.exists():
            raise FileNotFoundError(src)
        info = to_play_png(src, PHONE_OUT / dest_name)
        print(
            f"{info['file']}\t{info['w']}x{info['h']}\t{info['kb']}\t{info['ratio']}\t{info['orientation']}\t{play_phone_ok(info)}"
        )

    print()
    print("TABLET")
    print("No native tablet captures exist. No tablet images written.")
    print(f"Empty folders kept at: {TABLET_7.relative_to(ROOT)} and {TABLET_10.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
