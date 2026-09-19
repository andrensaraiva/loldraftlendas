#!/usr/bin/env python3
"""Optimize master portraits and derive deterministic duotone silhouette fallbacks."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

SIZE = (768, 768)
DARK = (13, 36, 30)
MID = (49, 93, 72)
LIGHT = (185, 243, 74)


def derive_silhouette(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    result = Image.new("RGB", image.size, DARK)
    mid_mask = gray.point(lambda value: 255 if value >= 62 else 0)
    light_mask = gray.point(lambda value: 255 if value >= 154 else 0)
    result.paste(MID, mask=mid_mask)
    result.paste(LIGHT, mask=light_mask)
    return result


def process(source: Path, portraits: Path, silhouettes: Path) -> tuple[Path, Path]:
    with Image.open(source) as master:
        portrait = ImageOps.fit(master.convert("RGB"), SIZE, Image.Resampling.LANCZOS)
    portrait_path = portraits / f"{source.stem}.webp"
    silhouette_path = silhouettes / f"{source.stem}.webp"
    portrait.save(portrait_path, "WEBP", quality=86, method=6)
    derive_silhouette(portrait).save(silhouette_path, "WEBP", quality=82, method=6)
    return portrait_path, silhouette_path


def contact_sheet(portraits: list[Path], destination: Path) -> None:
    thumb_size = 320
    label_height = 42
    columns = 5
    rows = (len(portraits) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * thumb_size, rows * (thumb_size + label_height)), "#f7f8f4")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=20)
    for index, portrait_path in enumerate(portraits):
        with Image.open(portrait_path) as image:
            thumb = ImageOps.fit(image.convert("RGB"), (thumb_size, thumb_size))
        x = (index % columns) * thumb_size
        y = (index // columns) * (thumb_size + label_height)
        sheet.paste(thumb, (x, y))
        draw.text((x + 12, y + thumb_size + 10), portrait_path.stem.upper(), fill="#173f2b", font=font)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "WEBP", quality=88, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Directory containing square PNG masters")
    parser.add_argument("portraits", type=Path, help="Directory for optimized portrait WebP files")
    parser.add_argument("silhouettes", type=Path, help="Directory for derived silhouette WebP files")
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()
    args.portraits.mkdir(parents=True, exist_ok=True)
    args.silhouettes.mkdir(parents=True, exist_ok=True)
    generated = [
        process(source, args.portraits, args.silhouettes)[0]
        for source in sorted(args.source.glob("*.png"))
    ]
    if not generated:
        raise SystemExit(f"No PNG masters found in {args.source}")
    if args.contact_sheet:
        contact_sheet(generated, args.contact_sheet)
    print(f"Generated {len(generated)} portraits and silhouettes at {SIZE[0]}px.")


if __name__ == "__main__":
    main()
