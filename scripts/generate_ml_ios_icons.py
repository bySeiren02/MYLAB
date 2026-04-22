#!/usr/bin/env python3
"""
MyLab 홈 화면 아이콘: 얇은 L + 안쪽(발 위)에 또렷한 M.
Run from repo root: python3 scripts/generate_ml_ios_icons.py
Requires Pillow.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError as e:
    raise SystemExit("Install Pillow: pip install Pillow") from e

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "frontend" / "ios" / "App" / "App" / "Assets.xcassets"

VARIANTS: list[tuple[str, str, tuple[int, int, int]]] = [
    ("AppIcon.appiconset", "AppIcon-512@2x.png", (255, 135, 161)),
    ("AppIconMint.appiconset", "AppIconMint.png", (94, 234, 212)),
    ("AppIconAmber.appiconset", "AppIconAmber.png", (251, 191, 36)),
    ("AppIconViolet.appiconset", "AppIconViolet.png", (167, 139, 250)),
    ("AppIconSky.appiconset", "AppIconSky.png", (56, 189, 248)),
]

BG = (15, 15, 20)
SAFE = 0.10


def _stroke_on_accent(accent: tuple[int, int, int]) -> tuple[int, int, int, int]:
    """밝은 악센트면 어두운 M, 어두우면 밝은 M."""
    r, g, b = accent
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if lum > 165:
        return (24, 24, 32, 255)
    return (255, 255, 255, 255)


def draw_lm_icon(accent: tuple[int, int, int], size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))
    draw = ImageDraw.Draw(img)
    m = int(size * SAFE)
    plate = (m, m, size - m, size - m)
    draw.rounded_rectangle(plate, radius=int(size * 0.22), outline=accent + (200,), width=max(4, size // 128))
    draw.rounded_rectangle(
        (m + 6, m + 6, size - m - 6, size - m - 6),
        radius=int(size * 0.2),
        fill=(22, 22, 30, 255),
    )

    # 얇은 L: 세로 막대 + 아래 가로 (비율은 1024 기준 튜닝)
    stem_left = int(size * 0.198)
    stem_w = max(22, int(size * 0.028))
    stem_top = int(size * 0.138)
    stem_bot = int(size * 0.478)
    foot_h = max(36, int(size * 0.058))
    foot_top = stem_bot
    foot_right = int(size * 0.798)

    draw.rounded_rectangle(
        (stem_left, stem_top, stem_left + stem_w, stem_bot),
        radius=max(4, stem_w // 4),
        fill=accent + (255,),
    )
    draw.rounded_rectangle(
        (stem_left, foot_top, foot_right, foot_top + foot_h),
        radius=max(6, foot_h // 3),
        fill=accent + (255,),
    )

    # M: 발 안쪽·줄기 오른쪽에 지그재그 (굵은 선)
    stem_right = stem_left + stem_w
    mx0 = stem_right + int(size * 0.055)
    my_base = foot_top + foot_h * 0.62
    my_peak = foot_top + foot_h * 0.18
    step = int(size * 0.085)
    pts = [
        (mx0, my_base),
        (mx0 + step * 0.48, my_peak),
        (mx0 + step * 1.05, my_base),
        (mx0 + step * 1.58, my_peak),
        (mx0 + step * 2.12, my_base),
    ]
    lw = max(14, int(size * 0.024))
    m_color = _stroke_on_accent(accent)
    try:
        draw.line(pts, fill=m_color, width=lw, joint="curve")
    except TypeError:
        draw.line(pts, fill=m_color, width=lw)

    return img


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
    print("Wrote L+M icons to", ASSETS)


if __name__ == "__main__":
    main()
