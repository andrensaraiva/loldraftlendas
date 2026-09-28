#!/usr/bin/env python3
"""Validate the versioned player portrait manifest and optimized image files."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "player-portraits.json"
ARCHIVE = ROOT / "src" / "data" / "archive-index.json"
KIB = 1024
MIB = 1024 * KIB
FILE_LIMITS = {
    "portrait": 140 * KIB,
    "silhouette": 30 * KIB,
}
CATALOG_LIMITS = {
    "portrait": 35 * MIB,
    "silhouette": 9 * MIB,
}
SILHOUETTE_COLORS = {
    (13, 36, 30),
    (49, 93, 72),
    (185, 243, 74),
}


def portrait_key(value: str) -> str:
    import re
    import unicodedata

    normalized = unicodedata.normalize("NFD", value.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(char for char in normalized if not unicodedata.combining(char)))


def public_path(path: str) -> Path:
    if not path.startswith("/assets/players/"):
        raise ValueError(f"Asset is outside the player directory: {path}")
    return ROOT / "public" / path.removeprefix("/")


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    archive = json.loads(ARCHIVE.read_text(encoding="utf-8"))
    expected = {portrait_key(player["name"]) for player in archive["players"]}
    if data.get("version") != "catalog-v2":
        raise SystemExit("Catalog manifest must be at version catalog-v2.")
    if data.get("status") not in {"catalog_expanding", "catalog_complete"}:
        raise SystemExit("Catalog manifest has an unexpected expansion status.")
    keys = [entry["playerKey"] for entry in entries]
    if len(keys) != len(set(keys)):
        raise SystemExit("Player keys must be unique.")
    identity_keys = [portrait_key(entry["playerName"]) for entry in entries]
    if len(identity_keys) != len(set(identity_keys)):
        raise SystemExit("Normalized player identities must be unique.")
    approved = [entry for entry in entries if entry["approval"] == "approved"]
    if len(approved) != len(entries):
        raise SystemExit("Every published catalog entry must be approved.")
    if not set(identity_keys).issubset(expected):
        raise SystemExit("Manifest contains an identity outside the historical archive.")
    if data.get("status") == "catalog_complete" and set(identity_keys) != expected:
        raise SystemExit("Complete catalog does not cover every historical identity.")
    asset_sizes: dict[str, list[int]] = {"portrait": [], "silhouette": []}
    for entry in entries:
        if entry["approval"] not in {"approved", "pending", "rejected"}:
            raise SystemExit(f"Unexpected approval state for {entry['playerName']}.")
        for field in ("portrait", "silhouette"):
            path = public_path(entry[field])
            if path.suffix.lower() != ".webp" or not path.is_file():
                raise SystemExit(f"Missing optimized {field}: {path}")
            size = path.stat().st_size
            if size > FILE_LIMITS[field]:
                raise SystemExit(
                    f"{field.title()} exceeds {FILE_LIMITS[field] / KIB:.0f} KiB: "
                    f"{path} ({size / KIB:.2f} KiB)"
                )
            asset_sizes[field].append(size)
            with Image.open(path) as image:
                if image.size != (768, 768) or image.format != "WEBP":
                    raise SystemExit(f"Unexpected image contract for {path}: {image.format} {image.size}")
                image.load()
                if field == "silhouette":
                    colors = image.convert("RGB").getcolors(maxcolors=len(SILHOUETTE_COLORS) + 1)
                    actual_colors = {color for _, color in colors} if colors else set()
                    if actual_colors != SILHOUETTE_COLORS:
                        raise SystemExit(f"Silhouette is outside the lossless three-color palette: {path}")
    for field, sizes in asset_sizes.items():
        total = sum(sizes)
        if total > CATALOG_LIMITS[field]:
            raise SystemExit(
                f"{field.title()} catalog exceeds {CATALOG_LIMITS[field] / MIB:.0f} MiB: "
                f"{total / MIB:.2f} MiB"
            )
    print(
        f"Validated {len(entries)}/{len(expected)} portrait identities "
        f"and {len(entries) * 2} WebP assets. "
        f"Portraits: {sum(asset_sizes['portrait']) / MIB:.2f}/35 MiB; "
        f"silhouettes: {sum(asset_sizes['silhouette']) / MIB:.2f}/9 MiB."
    )


if __name__ == "__main__":
    main()
