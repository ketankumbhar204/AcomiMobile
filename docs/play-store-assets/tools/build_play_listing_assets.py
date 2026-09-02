"""Build Google Play listing assets from existing ACOMI UI captures.

Does not modify application source. Run:
  python docs/play-store-assets/tools/build_play_listing_assets.py
"""

from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "screenshots" / "raw"
ICON_SRC = ROOT / "icon" / "acomi-play-store-512.png"
OUT = ROOT / "play-console-upload"

TEAL = (18, 140, 126, 255)
TEAL_DEEP = (12, 110, 99, 255)
TEAL_SOFT = (46, 168, 152, 255)
MINT = (236, 245, 242, 255)
WHITE = (255, 255, 255, 255)
BEZEL = (52, 62, 60, 255)

FONTS = Path(r"C:\Windows\Fonts")


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def rounded(im: Image.Image, radius: int) -> Image.Image:
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), radius=radius, fill=255)
    im.putalpha(mask)
    return im


def fit_contain(im: Image.Image, max_w: int, max_h: int) -> Image.Image:
    ratio = min(max_w / im.width, max_h / im.height)
    size = (max(1, int(round(im.width * ratio))), max(1, int(round(im.height * ratio))))
    return im.resize(size, Image.Resampling.LANCZOS)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        width = draw.textbbox((0, 0), trial, font=fnt)[2]
        if width <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def device_from_screenshot(
    src: Path,
    max_w: int,
    max_h: int,
    radius: int = 40,
    crop_box: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    shot = Image.open(src).convert("RGBA")
    if crop_box:
        shot = shot.crop(crop_box)
    shot = fit_contain(shot, max(1, max_w - 14), max(1, max_h - 14))
    bezel = 7
    frame = Image.new("RGBA", (shot.width + bezel * 2, shot.height + bezel * 2), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle(
        (0, 0, frame.width - 1, frame.height - 1),
        radius=radius,
        fill=BEZEL,
    )
    inner = rounded(shot, max(10, radius - 6))
    frame.paste(inner, (bezel, bezel), inner)
    return frame


def paste_with_shadow(
    canvas: Image.Image,
    card: Image.Image,
    xy: tuple[int, int],
    blur: int = 16,
    dy: int = 10,
) -> None:
    x, y = xy
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    blob = Image.new("RGBA", card.size, (0, 0, 0, 72))
    blob = rounded(blob, 36)
    shadow.paste(blob, (x, y + dy), blob)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(card, (x, y))


PHONE_SPECS = [
    {
        "raw": "02-dashboard.png",
        "out": "01-dashboard.png",
        "headline": "See Your Space at a Glance",
        "sub": "Occupancy, meals and dues in one place",
    },
    {
        "raw": "03-spaces.png",
        "out": "02-spaces.png",
        "headline": "Manage All Your Spaces",
        "sub": "Keep your properties organized",
    },
    {
        "raw": "04-accommodation.png",
        "out": "03-accommodation.png",
        "headline": "Know Your Occupancy",
        "sub": "Track rooms, beds and availability",
    },
    {
        "raw": "05-members.png",
        "out": "04-members.png",
        "headline": "Manage Your Residents",
        "sub": "Keep member information organized",
    },
    {
        "raw": "06-meals.png",
        "out": "05-meals.png",
        "headline": "Plan Meals Easily",
        "sub": "Keep your residents' meals organized",
    },
    {
        "raw": "07-payments.png",
        "out": "06-payments.png",
        "headline": "Track Payments",
        "sub": "Know what's expected, collected and pending",
    },
    {
        "raw": "08-operations.png",
        "out": "07-complaints.png",
        "headline": "Track Issues Easily",
        "sub": "Manage and resolve resident complaints",
    },
]


def build_icon() -> Path:
    dest_dir = OUT / "app-icon"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / "app-icon-512.png"
    src = Image.open(ICON_SRC).convert("RGBA")
    # Keep the existing mark. Play masks icons; extra shrink would make the A too small.
    canvas = Image.new("RGBA", (512, 512), TEAL)
    canvas.paste(src, (0, 0), src)
    canvas.convert("RGB").save(dest, "PNG")
    return dest


def build_feature_graphic() -> Path:
    dest_dir = OUT / "feature-graphic"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / "feature-graphic-1024x500.png"

    canvas = Image.new("RGBA", (1024, 500), TEAL)
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((640, -220, 1140, 280), fill=TEAL_SOFT)
    draw.ellipse((780, 260, 1240, 720), fill=TEAL_DEEP)

    icon = Image.open(ICON_SRC).convert("RGBA").resize((88, 88), Image.Resampling.LANCZOS)
    badge = Image.new("RGBA", (104, 104), (0, 0, 0, 0))
    ImageDraw.Draw(badge).rounded_rectangle((0, 0, 103, 103), radius=24, fill=WHITE)
    badge.paste(icon, (8, 8), icon)
    canvas.alpha_composite(badge, (56, 64))

    brand = font("segoeuib.ttf", 28)
    title = font("segoeuib.ttf", 46)
    tag = font("segoeui.ttf", 22)
    pill_font = font("segoeuib.ttf", 15)

    draw.text((176, 92), "ACOMI", font=brand, fill=WHITE)
    draw.text((56, 188), "Manage Your PG.", font=title, fill=WHITE)
    draw.text((56, 244), "Simply.", font=title, fill=WHITE)
    draw.text((56, 318), "Run occupancy, meals, and dues.", font=tag, fill=(235, 250, 247, 255))

    pills = ["Occupancy", "Members", "Meals", "Payments"]
    x, y = 56, 382
    for label in pills:
        tw = draw.textbbox((0, 0), label, font=pill_font)[2]
        w, h = tw + 24, 30
        draw.rounded_rectangle((x, y, x + w, y + h), radius=15, fill=WHITE)
        draw.text((x + w / 2, y + h / 2), label, font=pill_font, fill=TEAL_DEEP, anchor="mm")
        x += w + 8

    # Real dashboard UI, cropped to a readable portrait fragment (not stretched, not fake).
    dash = Image.open(RAW / "02-dashboard.png")
    crop_h = min(dash.height, int(dash.width * 1.72))
    preview = device_from_screenshot(
        RAW / "02-dashboard.png",
        max_w=300,
        max_h=470,
        radius=30,
        crop_box=(0, 0, dash.width, crop_h),
    )
    paste_with_shadow(canvas, preview, (718, 28), blur=12, dy=8)

    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(dest, "PNG")
    return dest


def build_phone_screenshot(spec: dict) -> Path:
    w, h = 1080, 1920
    canvas = Image.new("RGBA", (w, h), MINT)
    header_h = 236
    ImageDraw.Draw(canvas).rectangle((0, 0, w, header_h), fill=TEAL)

    draw = ImageDraw.Draw(canvas)
    brand = font("segoeuib.ttf", 20)
    headline_f = font("segoeuib.ttf", 40)
    sub_f = font("segoeui.ttf", 22)
    pad = 56
    max_text = w - pad * 2

    draw.text((pad, 28), "ACOMI", font=brand, fill=(220, 242, 237, 255))
    y = 72
    for line in wrap_text(draw, spec["headline"], headline_f, max_text):
        draw.text((pad, y), line, font=headline_f, fill=WHITE)
        y += 50
    y += 4
    for line in wrap_text(draw, spec["sub"], sub_f, max_text):
        draw.text((pad, y), line, font=sub_f, fill=(226, 242, 238, 255))
        y += 30

    max_device_w = w - 120
    max_device_h = h - header_h - 28
    device = device_from_screenshot(RAW / spec["raw"], max_device_w, max_device_h)
    x = (w - device.width) // 2
    y_dev = header_h - 18
    # Keep the full UI on-canvas; if the device is taller than remaining space, sit it lower.
    if y_dev + device.height > h - 20:
        y_dev = h - 20 - device.height
    paste_with_shadow(canvas, device, (x, y_dev), blur=18, dy=12)

    dest = OUT / "phone" / spec["out"]
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(dest, "PNG", optimize=True)
    return dest


def build_tablet_screenshot(spec: dict, size: tuple[int, int], dest: Path) -> Path:
    w, h = size
    canvas = Image.new("RGBA", (w, h), MINT)
    left_w = int(w * 0.38)
    ImageDraw.Draw(canvas).rectangle((0, 0, left_w, h), fill=TEAL)

    draw = ImageDraw.Draw(canvas)
    scale = w / 1920
    brand = font("segoeuib.ttf", max(18, int(22 * scale)))
    headline_f = font("segoeuib.ttf", max(28, int(42 * scale)))
    sub_f = font("segoeui.ttf", max(16, int(22 * scale)))
    pad = int(52 * scale)
    max_text = left_w - pad * 2

    draw.text((pad, int(64 * scale)), "ACOMI", font=brand, fill=(220, 242, 237, 255))
    y = int(140 * scale)
    for line in wrap_text(draw, spec["headline"], headline_f, max_text):
        draw.text((pad, y), line, font=headline_f, fill=WHITE)
        y += int(52 * scale)
    y += int(10 * scale)
    for line in wrap_text(draw, spec["sub"], sub_f, max_text):
        draw.text((pad, y), line, font=sub_f, fill=(226, 242, 238, 255))
        y += int(32 * scale)

    max_device_h = h - int(64 * scale)
    max_device_w = w - left_w - int(72 * scale)
    device = device_from_screenshot(RAW / spec["raw"], max_device_w, max_device_h)
    x = left_w + (w - left_w - device.width) // 2
    y_dev = (h - device.height) // 2
    paste_with_shadow(canvas, device, (x, y_dev), blur=16, dy=10)

    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(dest, "PNG", optimize=True)
    return dest


def clear_dir_images(folder: Path) -> None:
    if not folder.exists():
        return
    for p in list(folder.glob("*.png")) + list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg")):
        p.unlink()


def report_image(path: Path) -> dict:
    with Image.open(path) as im:
        w, h = im.size
        gcd = math.gcd(w, h)
        mode = im.mode
        fmt = im.format or path.suffix.upper().lstrip(".")
    return {
        "file": str(path.relative_to(OUT)).replace("\\", "/"),
        "w": w,
        "h": h,
        "mode": mode,
        "format": fmt,
        "kb": round(path.stat().st_size / 1024, 1),
        "ratio": f"{w // gcd}:{h // gcd}",
    }


def play_ok(kind: str, info: dict) -> str:
    w, h = info["w"], info["h"]
    if kind == "icon":
        return "YES" if w == 512 and h == 512 else "NO — must be 512x512"
    if kind == "graphic":
        return "YES" if w == 1024 and h == 500 else "NO — must be 1024x500"
    if kind == "phone":
        sides_ok = 320 <= w <= 3840 and 320 <= h <= 3840
        portrait = h > w
        return "YES" if sides_ok and portrait else "NO"
    if kind == "tablet7":
        sides_ok = 320 <= w <= 3840 and 320 <= h <= 3840
        ratio = w / h
        aspect_ok = abs(ratio - 16 / 9) < 0.02 or abs(ratio - 9 / 16) < 0.02
        return "YES" if sides_ok and aspect_ok else "NO"
    if kind == "tablet10":
        sides_ok = 1080 <= w <= 7680 and 1080 <= h <= 7680
        ratio = w / h
        aspect_ok = abs(ratio - 16 / 9) < 0.02 or abs(ratio - 9 / 16) < 0.02
        return "YES" if sides_ok and aspect_ok else "NO"
    return "?"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    old_icon = OUT / "icon"
    if old_icon.exists():
        shutil.rmtree(old_icon)

    icon = build_icon()
    graphic = build_feature_graphic()

    phone_dir = OUT / "phone"
    t7_dir = OUT / "tablet-7inch"
    t10_dir = OUT / "tablet-10inch"
    clear_dir_images(phone_dir)
    clear_dir_images(t7_dir)
    clear_dir_images(t10_dir)

    rows: list[tuple[str, dict]] = [
        ("icon", report_image(icon)),
        ("graphic", report_image(graphic)),
    ]

    for spec in PHONE_SPECS:
        p = build_phone_screenshot(spec)
        rows.append(("phone", report_image(p)))
        rows.append(("tablet7", report_image(build_tablet_screenshot(spec, (1920, 1080), t7_dir / spec["out"]))))
        rows.append(("tablet10", report_image(build_tablet_screenshot(spec, (2560, 1440), t10_dir / spec["out"]))))

    print("KIND\tFILE\tSIZE\tFORMAT\tMODE\tKB\tRATIO\tPLAY")
    for kind, r in rows:
        print(
            f"{kind}\t{r['file']}\t{r['w']}x{r['h']}\t{r['format']}\t{r['mode']}\t{r['kb']}\t{r['ratio']}\t{play_ok(kind, r)}"
        )


if __name__ == "__main__":
    main()
