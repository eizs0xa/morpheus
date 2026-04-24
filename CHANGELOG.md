# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

(no changes)

## [0.1.0] - 2026-04-23

First public cut of the Morpheus agentic development platform. Establishes the
module/profile/composition contract, ships the `agentic` CLI with `init`,
`validate`, and `doctor`, and proves the brownfield overlay against a SEEK
metadata snapshot (see `SEEK-dogfood.report.md`).

### Platform

- Semver `v0.1.0` anchor for the platform and every shipped module.
- Five-profile install model (`builder | verifier | author | explorer | steward`) — profiles are ergonomic, not runtime permissions; no sixth profile.
- JSON-schema contract under `modules/core/schemas/`: `platform-manifest`, `module`, `profile`, `tasks`, `adr`, `amendment`, `overlap-map`.
- Composition rules enforced by the CLI module resolver: exactly one `workspace`, exactly one `git` provider, 0..1 `pm`, 0..N `stacks`, 0..N `domains`, `core` always present.
- Deterministic install order computed from module dependencies.

### Modules shipped

| Module | Kind | Version |
|---|---|---|
| `core` | mandatory | 0.1.0 |
| `stack-node` | stack | 0.1.0 |
| `stack-python` | stack | 0.1.0 |
| `stack-react` | stack | 0.1.0 |
| `workspace-microsoft` | workspace | 0.1.0 |
| `workspace-google` | workspace | 0.1.0 |
| `pm-jira` | pm integration | 0.1.0 |
| `git-github` | git provider | 0.1.0 |
| `domain-healthcare` | domain (example) | 0.1.0 |

### CLI (`cli/` → `agentic` bin)

- `agentic init` — full five-phase flow: mode detect (new/brownfield/initialized), hardware + stack detection, answer resolution (flags → answers file → `MORPHEUS_*` env → defaults), module composition with preflight checks, template render (copier), and platform-manifest write.
- `agentic init --non-interactive` — unattended install using `MORPHEUS_*` env vars or an answers file; used by CI and the brownfield dogfood.
- `agentic validate [--json]` — structural check: manifest schema, module presence/version match, contributed-file presence, composition rules still hold, `.agent/schemas/*.json` are valid draft-07.
- `agentic doctor [--json] [--skip-external] [--verbose]` — superset of validate plus stale-module, orphaned-workflow, CODEOWNERS sanity, constitution presence, git repo sanity, and best-effort Jira reachability checks.
- `agentic add`, `agentic remove` — stubs present with consistent UX; full implementations deferred to a post-0.1 minor.
- `agentic update` — not yet implemented (see Known limitations).

### Templates

- `templates/new-project/` — greenfield copier template; profile-aware rendering; composes modules into a fresh repo.
- `templates/brownfield-overlay/` — copier overlay for existing repos; contract is "never touches source code" (`src/`, `app/`, `backend/`, `frontend/`, `lib/`, `packages/`, build output, user-owned configs); runs `preserve-existing.sh` to back up any clobbered pointer files to `*.pre-morpheus.bak` before render; records a `.morpheus-preflight.json` manifest of what was backed up.
- `templates/migration/scripts/workspace-swap.sh` — implemented migration path between `workspace-microsoft` ↔ `workspace-google`.
- `templates/migration/scripts/add-stack.sh` — stub for future in-place stack addition.

### Docs

- 24 markdown docs under `docs/` covering getting-started, contributor guides per audience (`for-authors/`, `for-engineers/`, `for-explorers/`, `for-eng-managers/`, `for-platform-maintainers/`, `for-stewards/`, `for-verifiers/`), and reference material.
- 4 ADRs under `docs/decisions/`: ADR-001 monorepo vs multirepo, ADR-002 copier vs cookiecutter, ADR-003 branching model, ADR-004 open questions for v0.1.
- Root governance: `CONSTITUTION.md`, `PHILOSOPHY.md`, `CONTRIBUTING.md`, `CODEOWNERS`.

### Tests

- 34 CLI unit tests under `cli/tests/` (vitest): detectors, composers, prompts, util, and per-command behavior.
- 94 integration-test assertions under `tests/integration/` (custom harness) across five suites: `init-new-project`, `init-brownfield`, `validate-doctor`, `composition-enforcement`, `update-migration`.
- Fixtures under `tests/fixtures/` for node-only, python-only, and a SEEK-style snapshot repo.
- `pnpm test` (cli) and `pnpm test:integration` (root) both required to pass on tagged releases — wired into `.github/workflows/release.yml`.

### Known limitations

- **`agentic update` is not yet implemented.** Stub returns a clear message; tracked for v0.2.
- **`MODULE_FILE_MISSING` false positives** from `validate`/`doctor` on freshly-rendered projects — the validators check every path declared in each module's `contributes` list, but profile-filtered installs (including brownfield overlays) render only a subset. Tracked as WS-14 deviation 4b; does not affect the correctness of the rendered project.
- **Manifest location mismatch between `init` and `validate`/`doctor`** — `init` writes `platform-manifest.json` at the project root; the validators read from `.agent/platform-manifest.json`. Surfaced by the SEEK dogfood run; worked around by copying/symlinking the manifest. Fix landing in v0.1.1 (unify on `.agent/platform-manifest.json`).
- **Stdout-pipe truncation on CLI `process.exit`** — occasional loss of trailing bytes when piping CLI output through tools that close the pipe on exit. Does not affect `--json` parse results; tracked for v0.1.1.
- **Jira preflight is stubbed** — emits a warning; full initiative-link validation lands with the completed `pm-jira` integration in v0.2.

### Dogfood acceptance

Brownfield overlay was exercised against a shallow SEEK metadata snapshot at
`/tmp/morpheus-dogfood-seek/`. `init` exited 0; source-proxy files were
byte-identical pre/post (sha256); the real SEEK working copy was not
mutated; the written manifest validates against the schema. See
`SEEK-dogfood.report.md` (informational, not committed) for the full trace.

---

## Release tagging (not yet executed — morpheus is not yet a git repo)

```bash
cd morpheus
git init
git add -A
git commit -m "chore: initial morpheus platform v0.1.0"
git tag -a v0.1.0 -m "Morpheus v0.1.0"
# push when a remote is configured:
# git push --follow-tags
```

Pushing the `v0.1.0` tag triggers `.github/workflows/release.yml`, which
runs the CLI + integration test suites, extracts the `[0.1.0]` section of
this file, and publishes a GitHub Release.

---

## Pre-release history

### Initial scaffolding (pre-0.1.0 working state, now rolled into 0.1.0)

- Initial repository scaffolding (WS-01): README, PHILOSOPHY, CONSTITUTION, CONTRIBUTING, CODEOWNERS, LICENSE, issue/PR templates, CI stub, and empty directory skeleton for `cli/`, `modules/`, `templates/`, `docs/`, `examples/`, and `tests/`.
