#!/usr/bin/env python3
"""
Post-generation pruner for the Morpheus `new-project` template.

Runs from copier's `_tasks` in the rendered project directory. Removes files
that do not apply to the chosen profile / pm_tool / workspace / stacks mix,
normalises the workspace notifier file, and stamps init timestamps into the
rendered platform-manifest.json.

Idempotent: running twice yields the same tree.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys


# ---- Profile rulebook (mirrors modules/core/profiles.yaml) ---------------

# Profile -> set of *relative* allow-list paths (when scaffolding != full).
# For "full" profiles we keep everything that module/selection pruning leaves.
PROFILE_ALLOWLIST = {
    "author": {
        "CLAUDE.md",
        "AGENTS.md",
        ".agent/constitution.md",
        ".agent/platform-manifest.json",
        ".agent/templates/feature-template/prd.md",
        ".agent/skills/spec-author.md",
        ".agent/skills/notifier.md",
        ".agent/skills/ticket-syncer-jira.md",
        ".copier-answers.yml",
        "README.md",
    },
    "explorer": {
        "CLAUDE.md",
        "AGENTS.md",
        ".agent/platform-manifest.json",
        ".agent/skills/lore-reader.md",
        ".copier-answers.yml",
        "README.md",
    },
}

# Verifier: remove coding-agent-*.md skills, keep everything else selection
# pruning leaves.
VERIFIER_DENY_SUFFIXES = ("skills/coding-agent-node.md",
                          "skills/coding-agent-python.md",
                          "skills/coding-agent-react.md")


STACK_PATHS = {
    "stack-node": [
        ".github/workflows/agent-pr-gate-node.yml",
        ".agent/skills/coding-agent-node.md",
        ".agent/skills/tester-node.md",
        ".github/instructions/node.instructions.md",
        ".agent/hooks/pre-commit-node.sh",
    ],
    "stack-python": [
        ".github/workflows/agent-pr-gate-python.yml",
        ".agent/skills/coding-agent-python.md",
        ".agent/skills/tester-python.md",
        ".github/instructions/python.instructions.md",
        ".agent/hooks/pre-commit-python.sh",
    ],
    "stack-react": [
        ".github/workflows/agent-pr-gate-react.yml",
        ".agent/skills/coding-agent-react.md",
        ".agent/skills/tester-react.md",
        ".github/instructions/react.instructions.md",
        ".agent/hooks/pre-commit-react.sh",
    ],
}

JIRA_ONLY = [
    ".github/workflows/jira-branch-check.yml",
    ".github/workflows/jira-smart-commits.yml",
    ".agent/skills/ticket-syncer-jira.md",
    ".agent/jira-transition-map.yaml",
    ".agent/mcp-config.jira.json",
]


def unlink(root: pathlib.Path, rel: str) -> None:
    p = root / rel
    if p.is_file() or p.is_symlink():
        p.unlink()
    elif p.is_dir():
        # only remove empty dirs; otherwise leave them
        try:
            p.rmdir()
        except OSError:
            pass


def prune_empty_dirs(root: pathlib.Path) -> None:
    # walk bottom-up and remove empty dirs we created.
    for p in sorted((x for x in root.rglob("*") if x.is_dir()),
                    key=lambda q: len(q.parts), reverse=True):
        try:
            p.rmdir()
        except OSError:
            pass


def normalise_notifier(root: pathlib.Path, workspace: str) -> None:
    ms = root / ".agent/skills/notifier-microsoft.md"
    gg = root / ".agent/skills/notifier-google.md"
    target = root / ".agent/skills/notifier.md"
    if workspace == "workspace-microsoft":
        if ms.exists():
            ms.replace(target)
        if gg.exists():
            gg.unlink()
    elif workspace == "workspace-google":
        if gg.exists():
            gg.replace(target)
        if ms.exists():
            ms.unlink()
    else:
        for f in (ms, gg):
            if f.exists():
                f.unlink()


def normalise_mcp(root: pathlib.Path, workspace: str, pm: str) -> None:
    """Merge workspace mcp config + jira mcp into a single mcp-config.json."""
    ms = root / ".agent/mcp-config.microsoft.json"
    gg = root / ".agent/mcp-config.google.json"
    jira = root / ".agent/mcp-config.jira.json"
    out = root / ".agent/mcp-config.json"

    merged = {"mcpServers": {}}
    if workspace == "workspace-microsoft" and ms.exists():
        merged["mcpServers"].update(json.loads(ms.read_text()).get("mcpServers", {}))
    if workspace == "workspace-google" and gg.exists():
        merged["mcpServers"].update(json.loads(gg.read_text()).get("mcpServers", {}))
    if pm == "pm-jira" and jira.exists():
        merged["mcpServers"].update(json.loads(jira.read_text()).get("mcpServers", {}))

    if merged["mcpServers"]:
        out.write_text(json.dumps(merged, indent=2) + "\n")

    for f in (ms, gg, jira):
        if f.exists():
            f.unlink()


def stamp_manifest(root: pathlib.Path) -> None:
    p = root / ".agent/platform-manifest.json"
    if not p.exists():
        return
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    text = p.read_text().replace("__NOW__", now)
    # validate JSON
    obj = json.loads(text)
    p.write_text(json.dumps(obj, indent=2) + "\n")


def apply_profile(root: pathlib.Path, profile: str) -> None:
    if profile in ("builder", "steward"):
        return  # scaffolding=full: no further pruning
    if profile == "verifier":
        for p in root.rglob("*"):
            if p.is_file() and any(str(p).endswith(s) for s in VERIFIER_DENY_SUFFIXES):
                p.unlink()
        return
    if profile in ("author", "explorer"):
        allow = PROFILE_ALLOWLIST[profile]
        for p in list(root.rglob("*")):
            if not p.is_file():
                continue
            rel = p.relative_to(root).as_posix()
            if rel not in allow:
                p.unlink()
        return


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True)
    ap.add_argument("--pm", default="none")
    ap.add_argument("--workspace", required=True)
    ap.add_argument("--stacks", default="")
    args = ap.parse_args()

    root = pathlib.Path.cwd()
    stacks = [s for s in args.stacks.split(",") if s]

    # 1. Stamp the manifest (must happen before any allowlist pruning deletes it).
    stamp_manifest(root)

    # 2. Pick the correct workspace notifier file.
    normalise_notifier(root, args.workspace)

    # 3. Merge MCP configs for selected workspace + pm.
    normalise_mcp(root, args.workspace, args.pm)

    # 4. Selection pruning: drop stack files for unselected stacks.
    for stack_name, paths in STACK_PATHS.items():
        if stack_name in stacks:
            continue
        for rel in paths:
            unlink(root, rel)

    # 5. Selection pruning: drop Jira-only files if pm != pm-jira.
    if args.pm != "pm-jira":
        for rel in JIRA_ONLY:
            unlink(root, rel)

    # 6. Profile pruning.
    apply_profile(root, args.profile)

    # 7. Clean up empty directories.
    prune_empty_dirs(root)

    return 0


if __name__ == "__main__":
    sys.exit(main())
