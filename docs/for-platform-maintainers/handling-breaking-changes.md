# Handling breaking changes

> Versioning policy, deprecation discipline, and migration-script authoring for Morpheus maintainers. A breaking change without a migration script is a broken release.

## What counts as breaking

Breaking changes include any of:

- Removing a module.
- Renaming a skill, a CLI command, a CLI flag, or an env var.
- Changing a JSON Schema in a way that rejects previously-valid documents.
- Removing a `contributes.*` entry that projects depend on.
- Changing the semantics of a manifest field (not just its shape).
- Altering composition rules in [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §1.
- Crossing any of the stop-lines in [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §6 — this is always a MAJOR **and** requires unanimous maintainer approval per §9.

What is **not** breaking:

- Adding a module.
- Adding a skill.
- Adding a CLI flag with a default.
- Adding a schema field that is optional.
- Internal refactors that don't change observable behavior.
- Typo fixes and doc corrections.

## The versioning contract

Per [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §4:

| Bump | Rules |
|------|-------|
| MAJOR (X.0.0) | Breaking. Requires migration script + deprecation runway + ADR. |
| MINOR (0.X.0) | Additive. Backward-compatible. |
| PATCH (0.0.X) | Fixes, docs, internal refactors. |

A MAJOR always requires **all** of:

1. A prior MINOR release marking the affected surface as deprecated.
2. A ≥ 60-day deprecation window before the MAJOR ships.
3. An automated migration script under `templates/migration/`.
4. A CHANGELOG entry with change + migration path + deprecation timeline.

## The deprecation timeline

```
T - 60 days (MINOR release)
  ├─ Mark surface deprecated in CHANGELOG.
  ├─ Emit deprecation warnings at runtime (CLI stderr, doc banners).
  ├─ Update docs to recommend the replacement.
  ├─ Ship the migration script as a preview (runnable but not triggered).
  │
T (MAJOR release)
  ├─ Remove the deprecated surface.
  ├─ Migration script becomes required in the update path.
  ├─ CHANGELOG entry under `## [Breaking Changes]`.
  └─ ADR under `docs/decisions/` explaining tradeoffs.
```

Do not shortcut the 60-day window. Teams need time to schedule migration work. A 60-day floor is the platform's promise; individual breaking changes can take longer if adoption hasn't caught up.

## Authoring a migration script

Migration scripts live under:

```
templates/migration/
└── <from-version>-to-<to-version>/
    ├── README.md
    ├── migrate.sh      (or migrate.py — pick one per script)
    └── tests/
        └── fixtures/
```

### Requirements for the script

- **Idempotent.** Running it twice produces the same end state.
- **Non-destructive by default.** Back up before overwriting, using the `.pre-morpheus-<VERSION>.bak` suffix convention.
- **Dry-run mode.** `--dry-run` prints the plan without mutating.
- **Exits non-zero on failure** with a clear remediation message.
- **Small.** If a migration is complex, split into composable scripts, each doing one thing.
- **Tested.** Fixture-based tests under `tests/`; a CI job runs them on every PR.

### Typical skeleton (bash)

```bash
#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=${DRY_RUN:-0}
TARGET=${1:-.}

log() { printf "[migrate] %s\n" "$*"; }
run() { if [ "$DRY_RUN" = "1" ]; then log "DRY: $*"; else eval "$@"; fi; }

# 1. preconditions
[ -f "$TARGET/platform-manifest.json" ] || { log "no manifest at $TARGET"; exit 2; }

# 2. backup
run "cp -a '$TARGET/.agent' '$TARGET/.agent.pre-morpheus-vX.bak'"

# 3. transform
# ... (idempotent edits here)

# 4. validate
( cd "$TARGET" && agentic validate )

log "migration complete"
```

### Typical skeleton (Python)

Preferred when the transformation is non-trivial (JSON edits, schema-aware rewrites):

```python
#!/usr/bin/env python3
"""Migrate a Morpheus project from vX to vY."""
import argparse
import json
import pathlib
import shutil
import sys


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("target", type=pathlib.Path)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    agent = args.target / ".agent"
    if not agent.exists():
        print(f"no .agent dir at {agent}", file=sys.stderr)
        return 2

    backup = args.target / ".agent.pre-morpheus-vY.bak"
    if not args.dry_run:
        shutil.copytree(agent, backup, dirs_exist_ok=False)
    print(f"backed up .agent -> {backup}")

    # ... idempotent transformations here

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Notifying users

Every breaking change ships with three user-facing artifacts:

1. **CHANGELOG entry** under `## [Breaking Changes]`, dated, linking the PR and the migration script.
2. **Deprecation warnings** surfaced by the CLI when the deprecated surface is used. Example: `morpheus invoke` emits `[DEPRECATION] --old-flag will be removed in vX.0.0. Use --new-flag.`
3. **Doc banners** on affected pages under `docs/`. Use an admonition at the top of the page:
   ```markdown
   > **Deprecated in vX.Y.0 — removed in v(X+1).0.0.** Use [<new surface>](…) instead.
   ```

After the MAJOR ships, remove the deprecation warnings and banners.

## ADR template for breaking changes

Every MAJOR requires an ADR. Minimum structure:

```markdown
# ADR-NNN — <Title>

- Status: accepted
- Date: YYYY-MM-DD
- Supersedes: (optional)
- Superseded by: (optional)

## Context
Why the current surface is wrong or costs too much.

## Decision
The new surface. The old surface is removed.

## Consequences
- Positive: …
- Negative: …
- Migration: link to the migration script.

## Tradeoffs considered
Alternatives evaluated and why they were rejected.
```

ADR schema: `modules/core/schemas/adr.schema.json`.

## Testing migrations

Every migration under `templates/migration/` ships with fixtures:

```
templates/migration/vX-to-vY/
└── tests/
    ├── fixtures/
    │   └── vX-project/        (a frozen vX-shaped project)
    └── test-migrate.sh        (runs the script, asserts diff)
```

CI job:

1. Copy fixture to a temp dir.
2. Run `migrate.sh` (or `.py`) against it.
3. Run `agentic validate` against the migrated output.
4. Assert no diff against a `vY-project/` golden fixture.

Test this on every PR that touches `templates/migration/`.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Users hit the breaking change with no warning | Deprecation wasn't announced in a prior MINOR. | Issue a PATCH that surfaces the warning; extend the runway. |
| Migration script only works from immediately prior version | Script chains weren't tested. | Add a test for "two versions back → current". |
| Migration leaves project in a half-migrated state | Script isn't atomic. | Make each transformation individually revertable, or wrap in a transaction using the backup. |
| Teams revert the migration | Script was destructive. | Audit backups; strengthen `--dry-run`; re-ship as PATCH. |

## Related docs

- [Publishing a release](publishing-a-release.md)
- [Adding a module](adding-a-module.md)
- [Updating the platform](../for-engineers/updating-the-platform.md)
- [Platform constitution §4-5](../../CONSTITUTION.md)
