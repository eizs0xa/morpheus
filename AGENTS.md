# Morpheus — AGENTS.md

This is the **Morpheus platform repo** — the source of the CLI, modules, templates, and docs
that are scaffolded into other projects. It is **not** itself a project scaffolded by Morpheus.

---

## Repo layout

| Path | What lives here |
|------|-----------------|
| `cli/` | TypeScript CLI (`morpheus` / `agentic` binaries). Entry: `cli/src/index.ts`. |
| `modules/` | Platform modules — `core`, `stacks/`, `integrations/`, `domains/`, `workspaces/`. |
| `templates/` | Copier templates — `new-project/`, `brownfield-overlay/`, `migration/`. |
| `tests/` | Integration test runner (`tests/run.mjs`) and fixtures. |
| `examples/` | Pre-rendered template output for inspection and regression. |
| `docs/` | Role-based documentation (for-engineers, for-authors, etc.). |
| `scripts/` | Bootstrap scripts (`bootstrap.sh`, `bootstrap.ps1`). |

## Build & test

```bash
# Build the CLI
cd cli && pnpm install && pnpm build

# Unit tests (Vitest)
cd cli && pnpm test

# Integration tests
node tests/run.mjs
```

## Rules of engagement

### Restructuring rule — ALWAYS follow this
When any file is **moved, renamed, or deleted**:
1. Search the entire workspace for every reference to that path — imports, markdown links,
   `$ref` in JSON schemas, `uses:` in GitHub Actions workflows, template variables, and
   any hardcoded strings in source code.
2. Update every reference before considering the task complete.
3. Verify with `get_errors` or a targeted `grep_search` after updating.
4. Never leave a dangling link, broken import, or stale cross-reference.

### General rules
- Never edit `examples/` by hand — they are generated outputs. Regenerate them via the CLI.
- Never edit `tests/fixtures/seek-snapshot/` by hand — it is a locked regression snapshot.
- Module `module.yaml` changes must be reflected in the TypeScript types under `cli/src/`.
- Schema changes under `modules/core/schemas/` must ship in the same PR as any CLI type
  changes that depend on them.
- Follow [CONSTITUTION.md](CONSTITUTION.md) — five profiles, six composition rules, seven
  stop-lines. No exceptions.
- All new CLI commands must be documented in `docs/reference/cli-reference.md`.

### What agents must NOT do
- Do not add a sixth profile.
- Do not create per-profile gates or per-profile constitutions.
- Do not push directly to `main` — all changes go through a PR.
- Do not commit `.env` files or secrets.
- Do not bypass `--frozen-lockfile` in CI — update the lockfile explicitly when dependencies change.
