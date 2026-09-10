"""Build and verify the honest 2011-2025 historical-readiness inventory."""

from __future__ import annotations

import argparse
import hashlib
import json
import statistics
from collections import Counter
from pathlib import Path
from typing import Any

from build_multi_era import CONFIG, ROOT


OUT = ROOT / "data/research/multi-era"
JSON_TARGET = OUT / "readiness-2011-2025.json"
MARKDOWN_TARGET = ROOT / "docs/historical-readiness-2011-2025.md"
REVIEWS_TARGET = OUT / "external-reviews.json"
YEARS = range(2011, 2026)
ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]
REQUIRED_RESEARCH = ["matches", "evidence", "rosters", "normalization", "coverage"]
LEGAL_NOTICE = (
    "Draft Lendas isn't endorsed by Riot Games and doesn't reflect the views or opinions of "
    "Riot Games or anyone officially involved in producing or managing Riot Games properties. "
    "Riot Games, and all associated properties are trademarks or registered trademarks of Riot "
    "Games, Inc."
)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rounded(value: float) -> float:
    return round(value, 6)


def build_inventory() -> dict[str, Any]:
    players = read_json(ROOT / "src/data/multi-era.json")
    assets = read_json(OUT / "asset-manifest.json")["assets"]
    eligibility = read_json(OUT / "eligibility.json")
    draft_manifest = read_json(ROOT / "src/data/draft-region-groups.json")
    review_manifest = read_json(REVIEWS_TARGET)
    app_source = (ROOT / "src/App.tsx").read_text(encoding="utf-8")
    legal_notice_visible = LEGAL_NOTICE in " ".join(app_source.split()) and (
        "https://developer.riotgames.com/policies/general" in app_source
    )
    evidence_by_year = {
        year: read_json(OUT / f"evidence-{year}.json") for year in CONFIG
    }
    asset_keys = {
        (asset["year"], asset["championId"], asset["kind"])
        for asset in assets
        if (ROOT / asset["localFile"]).is_file()
        and digest(ROOT / asset["localFile"]) == asset["sha256"]
    }
    draft_years = {entry["year"] for entry in draft_manifest["groups"]}
    year_entries: list[dict[str, Any]] = []

    for year in YEARS:
        external_review = review_manifest["reviews"].get(
            str(year), {"status": "PENDING", "reviewer": None, "reviewedOn": None, "evidence": None}
        )
        assert external_review["status"] in {"PENDING", "APPROVED", "REJECTED"}, (
            f"{year}: invalid external review status"
        )
        if external_review["status"] == "APPROVED":
            assert all(external_review.get(key) for key in ["reviewer", "reviewedOn", "evidence"]), (
                f"{year}: an approved external review requires reviewer, reviewedOn and evidence"
            )
        artifact_paths = {
            kind: OUT / f"{kind}-{year}.json" for kind in REQUIRED_RESEARCH
        }
        artifacts = {
            kind: {
                "present": path.is_file(),
                "path": path.relative_to(ROOT).as_posix(),
                "sha256": digest(path) if path.is_file() else None,
            }
            for kind, path in artifact_paths.items()
        }
        year_players = [player for player in players if player["worldsYear"] == year]
        any_research = any(item["present"] for item in artifacts.values())
        all_research = all(item["present"] for item in artifacts.values())

        if not all_research or not year_players:
            year_entries.append(
                {
                    "year": year,
                    "status": "RESEARCHED" if any_research else "INCOMPLETE",
                    "players": len(year_players),
                    "slots": sum(len(player["championPool"]) for player in year_players),
                    "regions": {},
                    "roles": {},
                    "regionRoleMatrix": {},
                    "confidence": None,
                    "assets": {"requiredPairs": 0, "completePairs": 0, "complete": False},
                    "eligiblePools": 0,
                    "missingMetrics": {},
                    "researchArtifacts": artifacts,
                    "validationGates": {
                        "researchArtifactsComplete": all_research,
                        "productionSnapshotMatchesCoverage": False,
                        "fiveDistinctSlotsPerPlayer": False,
                        "evidenceLinked": False,
                        "assetsComplete": False,
                        "draftPoolsEligible": False,
                    },
                    "productionGates": {
                        "legalNoticeVisible": legal_notice_visible,
                        "externalReviewApproved": external_review["status"] == "APPROVED",
                    },
                    "externalReview": external_review,
                    "nextAction": "Pesquisar e normalizar esta edição do Worlds antes de habilitá-la.",
                }
            )
            continue

        coverage = read_json(artifact_paths["coverage"])
        evidence = evidence_by_year[year]
        slots = [slot for player in year_players for slot in player["championPool"]]
        champion_pairs = {(year, slot["championId"]) for slot in slots}
        complete_pairs = sum(
            (year, champion_id, "square") in asset_keys
            and (year, champion_id, "splash") in asset_keys
            for _, champion_id in champion_pairs
        )
        region_counts = Counter(player["region"] for player in year_players)
        role_counts = Counter(player["role"] for player in year_players)
        matrix = {
            region: {
                role: sum(
                    player["region"] == region and player["role"] == role
                    for player in year_players
                )
                for role in ROLES
            }
            for region in sorted(region_counts)
        }
        confidences = [slot["stats"]["confidence"] for slot in slots]
        eligible_pools = sum(
            item["year"] == year and item["count"] >= 3 for item in eligibility
        )
        gates = {
            "researchArtifactsComplete": all_research,
            "productionSnapshotMatchesCoverage": coverage["players"] == len(year_players)
            and coverage["slots"] == len(slots)
            and not coverage["missing"],
            "fiveDistinctSlotsPerPlayer": all(
                len(player["championPool"]) == 5
                and len({slot["championId"] for slot in player["championPool"]}) == 5
                for player in year_players
            ),
            "evidenceLinked": all(
                slot.get("evidenceId") in evidence for slot in slots
            ),
            "assetsComplete": complete_pairs == len(champion_pairs),
            "draftPoolsEligible": eligible_pools == len(region_counts) * len(ROLES)
            and year in draft_years,
        }
        validated = all(gates.values())
        production_gates = {
            "legalNoticeVisible": legal_notice_visible,
            "externalReviewApproved": external_review["status"] == "APPROVED",
        }
        production_ready = validated and all(production_gates.values())
        status = "PRODUCTION_READY" if production_ready else "VALIDATED" if validated else "RESEARCHED"
        year_entries.append(
            {
                "year": year,
                "status": status,
                "players": len(year_players),
                "slots": len(slots),
                "regions": dict(sorted(region_counts.items())),
                "roles": {role: role_counts[role] for role in ROLES},
                "regionRoleMatrix": matrix,
                "confidence": {
                    "minimum": rounded(min(confidences)),
                    "median": rounded(statistics.median(confidences)),
                    "mean": rounded(statistics.mean(confidences)),
                    "maximum": rounded(max(confidences)),
                    "zeroConfidenceSlots": sum(value == 0 for value in confidences),
                },
                "assets": {
                    "requiredPairs": len(champion_pairs),
                    "completePairs": complete_pairs,
                    "complete": complete_pairs == len(champion_pairs),
                },
                "eligiblePools": eligible_pools,
                "missingMetrics": {
                    name: value
                    for name, value in coverage["missingMetrics"].items()
                    if value
                },
                "researchArtifacts": artifacts,
                "validationGates": gates,
                "productionGates": production_gates,
                "externalReview": external_review,
                "nextAction": (
                    "Obter e registrar uma revisão externa independente antes de declarar readiness de produção."
                    if validated
                    else "Resolver os gates de validação que falharam antes da revisão externa."
                ),
            }
        )

    return {
        "schemaVersion": "historical-readiness-v1.0.0",
        "range": {"firstYear": 2011, "lastYear": 2025},
        "statusOrder": ["INCOMPLETE", "RESEARCHED", "VALIDATED", "PRODUCTION_READY"],
        "statusDefinitions": {
            "INCOMPLETE": "Não existe um pacote local completo de pesquisa.",
            "RESEARCHED": "Há artefatos de pesquisa, mas um ou mais gates de validação falham.",
            "VALIDATED": "Validação local determinística, evidências, pools e assets passam.",
            "PRODUCTION_READY": "Validado e aprovado por uma revisão externa independente documentada.",
        },
        "legalNotice": {
            "text": LEGAL_NOTICE,
            "source": "https://developer.riotgames.com/policies/general",
            "sourceLastUpdated": "2025-05-29",
            "verifiedOn": "2026-09-09",
            "visibleIn": "src/App.tsx",
            "note": "Policy verification is not legal advice or Riot approval of this project.",
        },
        "provenance": {
            "statistics": "Oracle's Elixir data from pinned public mirrors; hashes and limitations are recorded in downloads.json.",
            "crosschecks": "Games of Legends event totals and one aggregate per edition; not row-by-row independent verification.",
            "assets": "Versioned Riot Games Data Dragon archives with local-file SHA-256 verification.",
            "method": "scripts/data/build_multi_era.py and scripts/data/validate_multi_era.py",
            "externalReviews": "data/research/multi-era/external-reviews.json; manual records are never generated automatically.",
        },
        "years": year_entries,
    }


def markdown(inventory: dict[str, Any]) -> str:
    lines = [
        "# Cobertura Histórica e Readiness — 2011–2025",
        "",
        "Este inventário é derivado apenas dos artefatos locais. Um ano não é promovido por estar habilitado no jogo. `PRODUCTION_READY` exige revisão externa independente registrada; por isso nenhum ano recebe esse estado automaticamente.",
        "",
        "## Estados",
        "",
    ]
    for status, definition in inventory["statusDefinitions"].items():
        lines.append(f"- **{status}:** {definition}")
    lines += [
        "",
        "## Visão Geral",
        "",
        "| Ano | Estado | Jogadores | Slots | Regiões | Pools elegíveis | Assets | Confiança média | Revisão externa |",
        "|---:|---|---:|---:|---:|---:|---|---:|---|",
    ]
    for entry in inventory["years"]:
        confidence = entry["confidence"]
        confidence_text = f'{confidence["mean"]:.4f}' if confidence else "—"
        assets = entry["assets"]
        asset_text = f'{assets["completePairs"]}/{assets["requiredPairs"]}' if assets["requiredPairs"] else "—"
        lines.append(
            f'| {entry["year"]} | {entry["status"]} | {entry["players"] or "—"} | '
            f'{entry["slots"] or "—"} | {len(entry["regions"]) or "—"} | '
            f'{entry["eligiblePools"] or "—"} | {asset_text} | {confidence_text} | '
            f'{entry["externalReview"]["status"]} |'
        )

    lines += ["", "## Anos com dados validados", ""]
    for entry in inventory["years"]:
        if entry["status"] not in {"VALIDATED", "PRODUCTION_READY"}:
            continue
        confidence = entry["confidence"]
        lines += [
            f'### {entry["year"]} — {entry["status"]}',
            "",
            "| Região | TOP | JUNGLE | MID | ADC | SUPPORT | Total |",
            "|---|---:|---:|---:|---:|---:|---:|",
        ]
        for region, counts in entry["regionRoleMatrix"].items():
            total = sum(counts.values())
            lines.append(
                f'| {region} | {counts["TOP"]} | {counts["JUNGLE"]} | {counts["MID"]} | '
                f'{counts["ADC"]} | {counts["SUPPORT"]} | {total} |'
            )
        missing = ", ".join(
            f"{name}: {value}" for name, value in entry["missingMetrics"].items()
        ) or "nenhuma"
        lines += [
            "",
            f'- Confiança dos slots: mínima {confidence["minimum"]:.4f}, mediana {confidence["median"]:.4f}, média {confidence["mean"]:.4f}, máxima {confidence["maximum"]:.4f}; slots com confiança zero: {confidence["zeroConfidenceSlots"]}.',
            f'- Assets completos: {entry["assets"]["completePairs"]}/{entry["assets"]["requiredPairs"]} pares campeão/ano.',
            f'- Métricas ausentes no snapshot normalizado: {missing}. Ausência registrada reduz a cobertura do cálculo; não vira zero fictício.',
            f'- Próximo gate: {entry["nextAction"]}',
            "",
        ]

    notice = inventory["legalNotice"]
    lines += [
        "## Proveniência e Limites",
        "",
        "- Estatísticas: Oracle's Elixir por espelhos públicos fixados por SHA-256 em `data/research/multi-era/downloads.json`.",
        "- Cross-checks: Games of Legends para totais do evento e um agregado por edição; isso não é uma segunda validação de cada linha.",
        "- Assets: distribuições históricas do Data Dragon com URL, patch, caminho local e SHA-256.",
        "- Ratings são estimativas do projeto. Comparabilidade entre eras não implica equivalência causal entre metas, formatos ou adversários.",
        "- Os anos incompletos não entram no dataset, no draft nem nas alegações de cobertura.",
        "- Revisões externas devem ser registradas manualmente em `data/research/multi-era/external-reviews.json`; o gerador nunca aprova um ano sozinho.",
        "",
        "## Aviso da Riot Games",
        "",
        f'Fonte conferida em {notice["verifiedOn"]}: [General Policies]({notice["source"]}), atualizada pela Riot em {notice["sourceLastUpdated"]}. O texto também está visível no rodapé da aplicação.',
        "",
        f"> {notice['text']}",
        "",
        "A conferência e este inventário não constituem aconselhamento jurídico, licença ou aprovação da Riot Games.",
        "",
        "## Reprodução",
        "",
        "```sh",
        "npm run data:readiness:build",
        "npm run data:readiness:validate",
        "npm run data:multi:validate",
        "```",
        "",
    ]
    return "\n".join(lines)


def rendered_outputs() -> tuple[str, str]:
    inventory = build_inventory()
    json_text = json.dumps(inventory, ensure_ascii=False, indent=2) + "\n"
    return json_text, markdown(inventory)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    json_text, markdown_text = rendered_outputs()
    if args.check:
        assert JSON_TARGET.is_file() and JSON_TARGET.read_text(encoding="utf-8") == json_text, (
            f"{JSON_TARGET.relative_to(ROOT)} is stale; run npm run data:readiness:build"
        )
        assert MARKDOWN_TARGET.is_file() and MARKDOWN_TARGET.read_text(encoding="utf-8") == markdown_text, (
            f"{MARKDOWN_TARGET.relative_to(ROOT)} is stale; run npm run data:readiness:build"
        )
        print("Historical readiness inventory is current for 2011-2025.")
        return
    JSON_TARGET.write_text(json_text, encoding="utf-8", newline="\n")
    MARKDOWN_TARGET.write_text(markdown_text, encoding="utf-8", newline="\n")
    print(f"Wrote {JSON_TARGET.relative_to(ROOT)} and {MARKDOWN_TARGET.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
