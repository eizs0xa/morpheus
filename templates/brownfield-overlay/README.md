# Brownfield overlay — `templates/brownfield-overlay/`

Overlay the Morpheus platform onto an **existing** repository without modifying its source code.

> **Contract:** this overlay never writes into `src/`, `app/`, `backend/`, `frontend/`, `lib/`, `packages/`, or any other source tree. It limits itself to `.agent/`, the root pointer files (`CLAUDE.md`, `AGENTS.md`), and additive `.github/` helpers (a `morpheus-*.yml` workflow, a copilot-instructions file, a `CODEOWNERS` merge).

---

## Before you run

1. **Commit all pending work.** The overlay takes backups, but you want a clean tree.
2. **Read `CONSTITUTION.md` and `PHILOSOPHY.md` in `morpheus/`.** The overlay installs platform law into your repo; know what it is.
3. **Have the answers ready** (see [Variables](#variables)).
4. **Install [copier](https://copier.readthedocs.io/) ≥ 9.0** — `pipx install copier` or `pip install --user copier`.

---

## Files created, backed up, or merged

### Always created (if not already present)
- `.agent/constitution.md`
- `.agent/skills/*.md` (subset per profile)
- `.agent/feature-template/` (`prd.md.tmpl`, `spec.md.tmpl`, `plan.md.tmpl`, `tasks.json.tmpl`)
- `.agent/BROWNFIELD_NOTES.md`
- `platform-manifest.json`
- `.github/workflows/morpheus-constitution-check.yml` (prefixed `morpheus-` to never collide with your workflows)

### Created OR appended (when pre-existing)
- `CLAUDE.md` — Morpheus-managed section on top; original content preserved under `--- Original CLAUDE.md ---` when `existing_conventions_preserved=true`.
- `AGENTS.md` — same pattern.
- `.github/copilot-instructions.md` — same pattern.
- `.github/CODEOWNERS` — overlay entries appended under `-- morpheus additions --` marker; no pre-existing rules are removed.

### Backed up (never destructively modified)
Any pre-existing file that would be clobbered is backed up to `<path>.pre-morpheus.bak` before any change. If a `.bak` already exists, a timestamped variant is used. If you had a `.agent/` directory already, it is backed up to `.agent.pre-morpheus.bak-<timestamp>/`.

A `.morpheus-preflight.json` manifest records exactly what was backed up.

### Never touched
- `src/`, `app/`, `backend/`, `frontend/`, `lib/`, `packages/`, `dist/`, `build/`, `node_modules/`, `__pycache__/`
- Any `.github/workflows/*.yml` that is not a `morpheus-*.yml` file
- Your `package.json`, `pyproject.toml`, Dockerfiles, etc.

If you see the overlay touch any of the above, **stop and file a platform issue** — that is a contract violation.

---

## Running the overlay

```bash
# 1. From the TARGET repo's root:
cd /path/to/your/existing/repo

# 2. Run the pre-render backup script.
bash /path/to/morpheus/templates/brownfield-overlay/scripts/preserve-existing.sh

# 3. Run copier. The overlay's post-task hook will call append-existing.sh
#    and apply-profile.py automatically.
copier copy /path/to/morpheus/templates/brownfield-overlay .

# 4. Review, then commit.
git status
git add .agent platform-manifest.json CLAUDE.md AGENTS.md \
        .github/copilot-instructions.md .github/workflows/morpheus-*.yml \
        .github/CODEOWNERS
git commit -m "chore: install morpheus platform overlay"
```

If copier is not on PATH, use `python3 -m copier copy …` instead.

---

## Variables

| Name | Type | Default | Notes |
|---|---|---|---|
| `project_name` | str | `my-project` | Human-readable name. |
| `profile` | choice | `builder` | One of `builder`, `verifier`, `author`, `explorer`, `steward`. |
| `stacks` | str | `""` | Comma-separated: `stack-node,stack-python`, etc. |
| `workspace` | choice | `workspace-microsoft` | Or `workspace-google`. |
| `pm` | choice | `pm-jira` | Or empty. |
| `git` | choice | `git-github` | Only provider supported in v0.1.0. |
| `jira_project_key` | str | `""` | Required when `pm=pm-jira`. |
| `existing_conventions_preserved` | bool | `true` | When `true`, merges original `CLAUDE.md` / `AGENTS.md` back in below the Morpheus section. |
| `consent_to_overlay` | str | (required) | Must be typed exactly as `I UNDERSTAND`. |

Workspace-specific prompts (`teams_webhook_url`, `primary_channel_id`, `primary_channel_name`, `chat_space_id`) appear only for the selected workspace.

---

## How to revert

1. `rm -rf .agent platform-manifest.json .github/workflows/morpheus-*.yml`
2. Remove the Morpheus-managed sections from `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` (everything above `--- Original <filename> ---` in the overlay convention).
3. Remove the `-- morpheus additions --` block from `.github/CODEOWNERS`.
4. Restore any `*.pre-morpheus.bak` files to their original paths:
   ```bash
   for bak in $(find . -maxdepth 3 -name '*.pre-morpheus.bak*' -type f); do
     orig="${bak%.pre-morpheus.bak*}"
     cp -p "$bak" "$orig"
   done
   ```
5. Delete `.morpheus-preflight.json`.

Then commit the revert on a branch.

---

## Safety properties

- **Idempotent-safe:** `preserve-existing.sh` refuses to run twice (pass `--force` to override).
- **Already-managed detection:** if `.agent/platform-manifest.json` already exists, the pre-script exits `1` and points you at `agentic update`.
- **Explicit consent:** the overlay will not run without the operator typing `I UNDERSTAND`.
- **No workflow collisions:** every workflow file created has a `morpheus-` prefix.

---

## Acceptance testing

A minimal fixture lives under `tests/fixture-existing-repo/`. See `tests/README.md` (if present) or run a smoke render yourself:

```bash
cp -a templates/brownfield-overlay/tests/fixture-existing-repo /tmp/ws09-smoke
cd /tmp/ws09-smoke
bash /path/to/morpheus/templates/brownfield-overlay/scripts/preserve-existing.sh
copier copy --data-file /path/to/answers.yml /path/to/morpheus/templates/brownfield-overlay .
```
