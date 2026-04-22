#!/usr/bin/env python3
"""
MyLab iOS 1024 앱 아이콘: 다크 스쿼클 + ML 두 글자를 세로 막대가 맞닿도록(커닝) 배치.
내부 2048 렌더 후 1024로 축소.
Run: python3 scripts/generate_ml_ios_icons.py
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
OUT_SIZE = 1024
INTERNAL = 2048

VARIANTS: list[tuple[str, str, tuple[int, int, int]]] = [
    ("AppIcon.appiconset", "AppIcon-512@2x.png", (255, 135, 161)),
    ("AppIconMint.appiconset", "AppIconMint.png", (94, 234, 212)),
    ("AppIconAmber.appiconset", "AppIconAmber.png", (251, 191, 36)),
    ("AppIconViolet.appiconset", "AppIconViolet.png", (167, 139, 250)),
    ("AppIconSky.appiconset", "AppIconSky.png", (56, 189, 248)),
]


def truetype_heavy(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
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


def draw_icon(accent: tuple[int, int, int], s: int) -> Image.Image:
    """M(왼쪽)과 L(오른쪽)의 안쪽 세로 획이 맞닿도록 커닝한 ML."""
    img = Image.new("RGBA", (s, s), (18, 18, 22, 255))
    draw = ImageDraw.Draw(img)
    r_out = int(s * 0.22)
    w_line = max(s // 220, 3)
    draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=r_out, fill=(26, 26, 32, 255), outline=accent + (200,), width=w_line)

    font = truetype_heavy(int(s * 0.36))
    fill = accent + (255,)

    bbox_m = draw.textbbox((0, 0), "M", font=font)
    bbox_l = draw.textbbox((0, 0), "L", font=font)
    wm = bbox_m[2] - bbox_m[0]
    hm = bbox_m[3] - bbox_m[1]
    wl = bbox_l[2] - bbox_l[0]
    hl = bbox_l[3] - bbox_l[1]

    # M 오른쪽 세로와 L 왼쪽 세로가 겹치듯 붙도록 음수 커닝
    kern = int(s * 0.042)
    total = wm + wl - kern
    left = (s - total) // 2
    cy = s // 2

    x_m = left + wm // 2
    x_l = left + wm + wl // 2 - kern

    draw.text((x_m, cy), "M", font=font, fill=fill, anchor="mm")
    draw.text((x_l, cy), "L", font=font, fill=fill, anchor="mm")

    return img


def draw_lm_icon(accent: tuple[int, int, int]) -> Image.Image:
    big = draw_icon(accent, INTERNAL)
    return big.resize((OUT_SIZE, OUT_SIZE), Image.Resampling.LANCZOS)


def write_imageset(folder: Path, png_name: str, accent: tuple[int, int, int]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    img = draw_lm_icon(accent)
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
