#!/usr/bin/env python3
"""apply-profile.py — prune overlay skills by profile.

The brownfield overlay ships ALL core skills under `.agent/skills/`. After
copier renders, this script deletes skills that are not enabled by the chosen
profile, per `modules/core/profiles.yaml`.

This script is intentionally self-contained: the profile → skills mapping is
embedded below so the overlay does not have to carry the upstream YAML into
the rendered project. Keep this table in sync with
`modules/core/profiles.yaml`.

Usage:
    apply-profile.py --profile PROFILE --dest DIR
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

# Keep in sync with modules/core/profiles.yaml.
# - "all" means keep every skill file.
# - Otherwise list the allowed skill basenames (without .md).
# - For `verifier` and `author` we also accept `*-read` variants, which the
#   platform may ship as separate files in the future; for v0.1.0 the read
#   variants are implemented by the same file + frontmatter, so we fall back
#   to the base skill name after stripping the suffix.
PROFILE_SKILLS: dict[str, object] = {
    "builder": "all",
    "verifier": [
        "evaluator",
        "reviewer",
        "tester",
        "spec-author-read",
        "planner-read",
    ],
    "author": [
        "spec-author",
        "decomposer-read",
    ],
    "explorer": [
        "lore-reader",
    ],
    "steward": "all",
}


def normalise_skill_name(name: str) -> str:
    """Strip the `-read` suffix so `spec-author-read` maps to `spec-author.md`."""

    if name.endswith("-read"):
        return name[: -len("-read")]
    return name


def allowed_skill_files(profile: str) -> set[str] | None:
    """Return the set of allowed skill filenames for a profile, or None for 'all'."""

    entry = PROFILE_SKILLS.get(profile)
    if entry is None:
        raise SystemExit(
            f"apply-profile: unknown profile '{profile}'. "
            f"Valid profiles: {sorted(PROFILE_SKILLS)}"
        )
    if entry == "all":
        return None
    assert isinstance(entry, list)
    allowed: set[str] = set()
    for name in entry:
        allowed.add(f"{normalise_skill_name(name)}.md")
    return allowed


def prune_skills(skills_dir: pathlib.Path, profile: str) -> dict[str, list[str]]:
    """Delete skill files not allowed by `profile`. Returns a summary."""

    summary = {"kept": [], "removed": []}
    if not skills_dir.is_dir():
        return summary

    allowed = allowed_skill_files(profile)
    for path in sorted(skills_dir.glob("*.md")):
        if allowed is None or path.name in allowed:
            summary["kept"].append(path.name)
            continue
        path.unlink()
        summary["removed"].append(path.name)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--profile",
        required=True,
        choices=sorted(PROFILE_SKILLS),
    )
    parser.add_argument(
        "--dest",
        required=True,
        type=pathlib.Path,
        help="Destination project root (where the overlay was rendered).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without deleting files.",
    )
    args = parser.parse_args()

    skills_dir = args.dest / ".agent" / "skills"

    if args.dry_run:
        allowed = allowed_skill_files(args.profile)
        if allowed is None:
            print(f"apply-profile: dry-run: profile '{args.profile}' keeps all skills")
        else:
            print(
                f"apply-profile: dry-run: profile '{args.profile}' would keep "
                f"{sorted(allowed)}"
            )
        return 0

    summary = prune_skills(skills_dir, args.profile)
    print(
        "apply-profile: "
        + json.dumps(
            {
                "profile": args.profile,
                "dest": str(args.dest),
                "kept": summary["kept"],
                "removed": summary["removed"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
