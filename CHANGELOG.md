# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — AI/MLOps strategic-roadmap alignment (Phase 1–3)

**Phase 1 — Foundation / Governance**

- `platform-manifest.schema.json`: new required `governance` block (`risk_tier` 1–4, `agent_registry_id`, `intake_record_id`, `review_track`, `kill_switch`, `decommission`). Maps 1:1 to the enterprise Agent Governance Operating Model.
- `modules/core/skills/kill-switch.md` — universal containment procedure with behavioral-threshold table by risk tier.
- `modules/core/skills/decommission.md` — formal agent sunset path; preserves the artifact chain as institutional knowledge.
- `modules/integrations/governance-adlc/` — new integration module. Ships `risk-score`, `intake-submit`, `adlc-gate` skills and the four-tier risk-scoring rubric (audience × autonomy × data sensitivity × blast radius).
- `modules/integrations/git-github/`: added `branch-naming` and `conventional-commits` skills; new `commit-lint.yml` and `branch-name-check.yml` workflows; `commitlint.config.cjs.tmpl`.
- `modules/integrations/pm-jira/`: added `story-emitter` skill (emits Jira stories from `tasks.json` with risk-tier + agent-registry custom fields); new `jira-story-sync.yml` workflow; `jira-story.md.tmpl`.

**Phase 2 — Visibility & Enablement**

- `modules/integrations/coe-portal/` — new integration module. Ships `registry-sync` (pushes manifest + artifact-chain state to the Agent Registry on every merge to default) and `portal-pull` (pulls playbooks, standards, approved template updates).
- `modules/core/schemas/template.schema.json` — template manifest contract with `training_tier` (`explorer | builder | engineer`), `intake_defaults`, and `lifecycle` to support the AI Adoption Engineering curated template library.

**Phase 3 — Accountability & Intelligence**

- `cost_tags` block added to `platform-manifest.schema.json` (cost_center, platforms, primary_models, expected_monthly_usd, value_hypothesis, value_confidence) — feeds the AI ROI Measurement Framework.
- `modules/core/schemas/value-card.schema.json` — normalized agent value card, one per agent_registry_id per reporting period.
- `modules/core/templates/value-card.md.tmpl` — human-readable value-card companion.
- `modules/core/schemas/memory.schema.json` — five-layer memory schema (session, project, domain, cross_project, enterprise) with steward-approval enforcement on the shared scopes.
- `modules/core/schemas/ontology.schema.json` — domain-ontology contract with cross-domain disambiguation and append-only steward change_log.
- `modules/domains/domain-healthcare/ontology.yaml` — first example ontology applying the contract.

### Changed

- README rewritten with a Phase 1–3 compelling pitch and Strategic Alignment table.
- `modules/core/module.yaml` `contributes` extended with new skills, schemas, and templates.
- `modules/integrations/git-github/module.yaml` now prompts for `branch_prefix_pattern` and `conventional_commits_enforced`.
- `modules/integrations/pm-jira/module.yaml` now prompts for risk-tier / agent-registry custom-field IDs and `auto_emit_stories_from_tasks`.

### Notes

- All additions are additive (new fields, new modules). No constitution stop-line is modified. Existing `v0.1.0` manifests remain valid once they add the required `governance.risk_tier`. A migration script under `templates/migration/0.1.0-to-0.2.0/` is the last item to land before the `v0.2.0` cut.

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
