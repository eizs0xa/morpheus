---
applyTo: "**"
---

# Morpheus — GitHub Copilot Instructions

This is the **Morpheus platform repo** — the source of the CLI, modules, templates, and docs.
It is not itself a project scaffolded by Morpheus.

## Repo layout

- `cli/` — TypeScript CLI source and Vitest tests.
- `modules/` — platform modules (core, stacks, integrations, domains, workspaces).
- `templates/` — copier templates (new-project, brownfield-overlay, migration).
- `tests/` — integration test runner and fixtures.
- `examples/` — pre-rendered template output (do not edit by hand).
- `docs/` — role-based documentation.
- `scripts/` — bootstrap scripts (bootstrap.sh, bootstrap.ps1).

## Restructuring rule — follow on every move/rename/delete
1. Before completing any restructuring task, search the full workspace for all references
   to the old path: markdown links, TypeScript imports, JSON `$ref`, GitHub Actions `uses:`,
   template variables, and hardcoded strings.
2. Update every reference in the same operation.
3. Run `get_errors` or a targeted search after to confirm no dangling references remain.

## Build & test

```bash
cd cli && pnpm install && pnpm build   # build CLI
cd cli && pnpm test                    # unit tests
node tests/run.mjs                     # integration tests
```

## Rules

1. Schema changes under `modules/core/schemas/` and TypeScript type changes in `cli/src/`
   must ship in the same PR.
2. New CLI commands must be documented in `docs/reference/cli-reference.md`.
3. `examples/` and `tests/fixtures/seek-snapshot/` are generated — do not edit by hand.
4. Follow [CONSTITUTION.md](CONSTITUTION.md): five profiles, six composition rules,
   seven stop-lines.
5. All changes go through a PR — do not push directly to `main`.
6. Never commit secrets or `.env` files.
