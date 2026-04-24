# Migrations — `templates/migration/`

Migrations transform an **already-initialised** Morpheus project from one platform configuration to another. They are not greenfield scaffolding and not brownfield overlaying; they assume `.agent/platform-manifest.json` already exists.

> **Rule of thumb:** if you need to scaffold, use `templates/new-project/`. If you need to retrofit a pre-existing repo, use `templates/brownfield-overlay/`. If you already have a Morpheus project and want to change its composition, use a migration.

---

## Available migrations

| Script | Purpose | Artifact A reference |
|---|---|---|
| `scripts/workspace-swap.sh` | Swap the single workspace module (e.g. `workspace-microsoft` → `workspace-google`). | §8 "Google migration" |
| `scripts/add-stack.sh` (stub) | Add a new stack module to an existing project. | §8 pattern — **TODO** |

---

## Contract for every migration script

1. **Shebang + strict mode.** `#!/usr/bin/env bash` and `set -euo pipefail`.
2. **`--dry-run` flag.** Prints every mutation without performing it.
3. **Guarded by git.** Refuses to run outside a git working tree.
4. **Branch first.** Creates `morpheus/migration/<name>-YYYY-MM-DD` and commits into it. Does NOT push.
5. **Manifest-authoritative.** Reads `.agent/platform-manifest.json` to detect current state. Writes the updated manifest at the end.
6. **Idempotent on re-run.** Running twice with the same args is a no-op (or a clearly refused operation).
7. **Leaves a migration note.** Appends a dated bullet under `.agent/MIGRATIONS.md` (creating it if missing).

---

## Running `workspace-swap.sh`

```bash
# Dry-run first — always.
bash templates/migration/scripts/workspace-swap.sh \
  --from workspace-microsoft --to workspace-google --dry-run

# Real run.
bash templates/migration/scripts/workspace-swap.sh \
  --from workspace-microsoft --to workspace-google

# The script prints a PR-ready summary. Push and open a PR:
git push --set-upstream origin morpheus/migration/workspace-swap-YYYY-MM-DD
```

The script:
- removes the old workspace's skill file (`skills/notifier.md`) from `.agent/skills/`
- copies the new workspace's `skills/notifier.md` into `.agent/skills/` (from the resolved module path)
- rewrites the MCP config: Teams/Outlook ↔ Google Chat/Gmail, OneDrive ↔ Drive
- updates `platform-manifest.json.modules` to replace the old workspace key with the new one
- bumps `last_updated_at`
- stages & commits on a `morpheus/migration/workspace-swap-…` branch

The script does NOT push, and it does NOT delete the old MCP config; the old config becomes `.agent/mcp-config.json.pre-swap.bak` so a reviewer can diff.

---

## Adding a new migration

Use `workspace-swap.sh` as the reference implementation. Every new migration should:
1. Live under `scripts/<name>.sh` (or `.py` if genuinely needed).
2. Have its own section in this README.
3. Have an accompanying dry-run smoke test under `tests/`.
