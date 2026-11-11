"""Regenerate ACOMI launcher / login / Play Store icons from splash-mark.png.

Source of truth: src/assets/brand/splash-mark.png (transparent teal A + orange swoosh).
Black baked backgrounds are removed; adaptive + store icons use a white canvas.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MARK = ROOT / "src" / "assets" / "brand" / "splash-mark.png"

WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

# Adaptive-icon safe zone is the inner ~66%. Keep mark smaller so round masks don't clip.
FOREGROUND_SCALE = 0.58
FULL_ICON_SCALE = 0.72
IN_APP_SCALE = 0.86


def load_mark() -> Image.Image:
    mark = Image.open(MARK).convert("RGBA")
    bbox = mark.getbbox()
    if not bbox:
        raise SystemExit("splash-mark.png is empty")
    return mark.crop(bbox)


def place_mark(
    canvas_size: int,
    mark: Image.Image,
    *,
    scale: float,
    background: tuple[int, int, int, int],
) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), background)
    target = max(1, int(round(canvas_size * scale)))
    ratio = min(target / mark.width, target / mark.height)
    size = (max(1, int(round(mark.width * ratio))), max(1, int(round(mark.height * ratio))))
    resized = mark.resize(size, Image.Resampling.LANCZOS)
    x = (canvas_size - resized.width) // 2
    y = (canvas_size - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({im.size[0]}x{im.size[1]})")


def rounded_white_tile(size: int, mark: Image.Image, radius_ratio: float = 0.24) -> Image.Image:
    """Native splash_logo: white rounded tile with transparent corners + mark."""
    canvas = Image.new("RGBA", (size, size), TRANSPARENT)
    radius = max(8, int(round(size * radius_ratio)))
    tile = Image.new("RGBA", (size, size), TRANSPARENT)
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=WHITE)
    canvas.alpha_composite(tile)
    placed = place_mark(size, mark, scale=0.78, background=TRANSPARENT)
    canvas.alpha_composite(placed)
    return canvas


def main() -> None:
    mark = load_mark()

    brand = ROOT / "src" / "assets" / "brand"
    # In-app marks: transparent background (login / onboarding sit on light UI).
    for name in ("icon-light.png", "icon-dark.png", "logo.png"):
        save(place_mark(1024, mark, scale=IN_APP_SCALE, background=TRANSPARENT), brand / name)

    # Play / docs store assets — Play Console requires opaque 512.
    docs_icon = ROOT / "docs" / "play-store-assets" / "icon"
    store = place_mark(512, mark, scale=FULL_ICON_SCALE, background=WHITE)
    save(store, docs_icon / "acomi-play-store-512.png")
    save(store.copy(), docs_icon / "acomi-round-512.png")
    save(store.copy(), ROOT / "docs" / "play-store-assets" / "play-console-upload" / "app-icon" / "app-icon-512.png")
    save(
        place_mark(1080, mark, scale=FOREGROUND_SCALE, background=TRANSPARENT),
        docs_icon / "acomi-launcher-foreground.png",
    )
    save(Image.new("RGBA", (1080, 1080), WHITE), docs_icon / "acomi-launcher-background.png")

    # Android adaptive foreground densities (108dp base).
    fg_sizes = {
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432,
    }
    full_sizes = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    for density, size in fg_sizes.items():
        fg = place_mark(size, mark, scale=FOREGROUND_SCALE, background=TRANSPARENT)
        save(fg, ROOT / "android" / "app" / "src" / "main" / "res" / f"mipmap-{density}" / "ic_launcher_foreground.png")
    for density, size in full_sizes.items():
        full = place_mark(size, mark, scale=FULL_ICON_SCALE, background=WHITE)
        folder = ROOT / "android" / "app" / "src" / "main" / "res" / f"mipmap-{density}"
        save(full, folder / "ic_launcher.png")
        save(full.copy(), folder / "ic_launcher_round.png")

    # Native cold-start splash tile densities (match previous splash_logo sizes).
    splash_sizes = {
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432,
    }
    for density, size in splash_sizes.items():
        save(
            rounded_white_tile(size, mark),
            ROOT / "android" / "app" / "src" / "main" / "res" / f"drawable-{density}" / "splash_logo.png",
        )

    # iOS AppIcon set — opaque white canvas required.
    ios = ROOT / "ios" / "Acomi" / "Images.xcassets" / "AppIcon.appiconset"
    ios_specs = {
        "icon-20@2x.png": 40,
        "icon-20@3x.png": 60,
        "icon-29@2x.png": 58,
        "icon-29@3x.png": 87,
        "icon-40@2x.png": 80,
        "icon-40@3x.png": 120,
        "icon-60@2x.png": 120,
        "icon-60@3x.png": 180,
        "icon-1024.png": 1024,
    }
    for name, size in ios_specs.items():
        save(place_mark(size, mark, scale=FULL_ICON_SCALE, background=WHITE), ios / name)

    print("done")


if __name__ == "__main__":
    main()
