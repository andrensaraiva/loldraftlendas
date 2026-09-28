#!/usr/bin/env python3
"""Rebuild every published silhouette from its approved portrait."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from build_player_portraits import save_silhouette

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "player-portraits.json"


def public_path(value: str) -> Path:
    if not value.startswith("/assets/players/"):
        raise ValueError(f"Asset is outside the player directory: {value}")
    return ROOT / "public" / value.removeprefix("/")


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    rebuilt = 0
    for entry in entries:
        portrait_path = public_path(entry["portrait"])
        silhouette_path = public_path(entry["silhouette"])
        if not portrait_path.is_file():
            raise SystemExit(f"Missing approved portrait: {portrait_path}")
        silhouette_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = silhouette_path.with_name(f".{silhouette_path.name}.tmp")
        with Image.open(portrait_path) as portrait:
            save_silhouette(portrait.convert("RGB"), temporary_path)
        temporary_path.replace(silhouette_path)
        rebuilt += 1
    if not rebuilt:
        raise SystemExit("No portrait entries found in the manifest.")
    print(f"Rebuilt {rebuilt} lossless WebP silhouettes from approved portraits.")


if __name__ == "__main__":
    main()
