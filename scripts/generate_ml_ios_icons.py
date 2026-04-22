#!/usr/bin/env python3
"""
MyLab 'ML' monogram app icons for iOS (1024 universal).
Run from repo root: python3 scripts/generate_ml_ios_icons.py
Requires Pillow.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as e:
    raise SystemExit("Install Pillow: pip install Pillow") from e

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "frontend" / "ios" / "App" / "App" / "Assets.xcassets"

# (imageset_dir_name, filename inside set, accent RGB, label for debug)
VARIANTS: list[tuple[str, str, tuple[int, int, int]]] = [
    ("AppIcon.appiconset", "AppIcon-512@2x.png", (255, 135, 161)),  # rose — primary
    ("AppIconMint.appiconset", "AppIconMint.png", (94, 234, 212)),
    ("AppIconAmber.appiconset", "AppIconAmber.png", (251, 191, 36)),
    ("AppIconViolet.appiconset", "AppIconViolet.png", (167, 139, 250)),
    ("AppIconSky.appiconset", "AppIconSky.png", (56, 189, 248)),
]

BG = (15, 15, 20)
SAFE = 0.12  # margin ratio


def truetype_bold(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for p in candidates:
        if os.path.isfile(p):
            try:
                return ImageFont.truetype(p, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_ml_icon(accent: tuple[int, int, int], size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))
    draw = ImageDraw.Draw(img)
    m = int(size * SAFE)
    inner = size - 2 * m

    # Soft rounded plate
    plate = (m, m, size - m, size - m)
    draw.rounded_rectangle(plate, radius=int(size * 0.22), outline=accent + (200,), width=max(4, size // 128))
    draw.rounded_rectangle(
        (m + 6, m + 6, size - m - 6, size - m - 6),
        radius=int(size * 0.2),
        fill=(22, 22, 30, 255),
    )

    font_size = int(inner * 0.52)
    font = truetype_bold(font_size)
    text = "ML"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2 - int(size * 0.02)

    # Glow
    for dx, dy, alpha in ((4, 4, 40), (2, 2, 70), (0, 0, 255)):
        c = accent + (alpha,)
        draw.text((tx + dx, ty + dy), text, font=font, fill=c)

    draw.text((tx, ty), text, font=font, fill=accent + (255,))

    # Accent underline (lab)
    uw = int(size * 0.38)
    ux = (size - uw) // 2
    uy = ty + th + int(size * 0.04)
    draw.rounded_rectangle((ux, uy, ux + uw, uy + max(6, size // 64)), radius=4, fill=accent + (230,))

    return img


def write_imageset(folder: Path, png_name: str, accent: tuple[int, int, int]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    img = draw_ml_icon(accent)
    img.save(folder / png_name, "PNG")
    contents = {
        "images": [
            {
                "filename": png_name,
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024",
            }
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (folder / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    for set_dir, fname, accent in VARIANTS:
        write_imageset(ASSETS / set_dir, fname, accent)
    print("Wrote ML icons to", ASSETS)


if __name__ == "__main__":
    main()
