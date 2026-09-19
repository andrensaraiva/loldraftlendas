#!/usr/bin/env python3
"""Validate the versioned player portrait manifest and optimized image files."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "player-portraits.json"


def public_path(path: str) -> Path:
    if not path.startswith("/assets/players/"):
        raise ValueError(f"Asset is outside the player directory: {path}")
    return ROOT / "public" / path.removeprefix("/")


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    if data.get("version") != "pilot-v1" or len(entries) != 10:
        raise SystemExit("Pilot manifest must contain ten entries at version pilot-v1.")
    keys = [entry["playerKey"] for entry in entries]
    if len(keys) != len(set(keys)):
        raise SystemExit("Player keys must be unique.")
    for entry in entries:
        if entry["approval"] not in {"pending", "approved", "rejected"}:
            raise SystemExit(f"Invalid approval state for {entry['playerName']}.")
        for field in ("portrait", "silhouette"):
            path = public_path(entry[field])
            if path.suffix.lower() != ".webp" or not path.is_file():
                raise SystemExit(f"Missing optimized {field}: {path}")
            with Image.open(path) as image:
                if image.size != (768, 768) or image.format != "WEBP":
                    raise SystemExit(f"Unexpected image contract for {path}: {image.format} {image.size}")
    print(f"Validated {len(entries)} portrait identities and {len(entries) * 2} WebP assets.")


if __name__ == "__main__":
    main()
