# ADR-001 — Monorepo vs multirepo

- Status: accepted
- Date: 2025-01-08
- Supersedes: —
- Superseded by: —

## Context

Morpheus ships a CLI, JSON schemas, a core module, N stack modules, two workspace modules, N integration modules, N domain modules, and templates. Every scaffolded project pins a **platform version** that records which modules at which versions were installed. Atomic compatibility between these parts matters: a given version of `core` and `stack-node` are tested and released together.

We considered two repository topologies:

1. **Monorepo** — one Git repository, one release tag, every module lives under `modules/<kind>/<name>/`, the CLI lives under `cli/`, templates under `templates/`, docs under `docs/`.
2. **Multirepo** — each module is its own repository, published independently (e.g. as an npm package or git-archive URL). The CLI reads a dependency manifest to fetch and compose modules at init time.

## Decision

**Monorepo.**

## Rationale

- **Atomic compatibility.** A PR that changes the `core` schema and the `module-resolver` in the CLI can land in one commit. Multirepo forces coordinated releases across repos or version-negotiation logic in the CLI — strictly worse for v0.1.
- **Single versioning story.** The platform tag (`v0.1.0`, `v0.2.0`, …) pins a full set of module versions. Users see one number on a release note, not a matrix.
- **Readable history.** `git log modules/stacks/stack-node/` tells you everything about the module's evolution. In a multirepo, the same story spans multiple commit histories.
- **Cheaper local dev.** Contributors clone one repo, run one `pnpm install`, work across the CLI + modules + templates in a single editor without symlink gymnastics.
- **Simpler CI.** One CI pipeline builds and tests every change. Integration tests can scaffold fixture projects without network-hitting other repos.
- **Discoverability.** New contributors read one `README.md`, browse one tree, understand the platform shape in minutes.

## Consequences

Positive:

- Shipping a platform version ships a coherent set of modules.
- Cross-module refactors are a single PR.
- The CLI imports schemas directly from `modules/core/schemas/` — no registry, no resolver, no drift.
- Contributors can fork the whole platform without tracking N repos.

Negative:

- A full clone is larger than any one module would be alone. Acceptable for v0.1; negligible given text-only contents.
- Contributors without commit access to any module still clone everything. Acceptable; they don't need write access to read.
- Module versioning becomes lockstep with the platform version in v0.1. We may relax this after Phase 5 of the [rollout guide](../for-eng-managers/rollout-guide.md) when modules mature enough to version independently.

## Tradeoffs considered

- **Multirepo with a registry.** Adds operational overhead (who hosts the registry? what's the auth story?). No v0.1 benefit that offsets the cost.
- **Monorepo with independent module tags.** E.g. `stack-node-v0.3.0` alongside `v0.1.0` platform tag. Considered but deferred — the lockstep model is simpler for v0.1 and we'll revisit when a module needs out-of-band patching.
- **Submodules.** Rejected outright — submodule UX is consistently bad and solves a problem we don't have.

## Reversibility

Reversible, at cost. If we later split to multirepo, each module moves to its own repo, the CLI gains a resolver, and the platform tag becomes a manifest file instead of a single number. The move would be a MAJOR bump with a migration script.

## Related

- [CONSTITUTION.md §4 — Versioning](../../CONSTITUTION.md)
- [ADR-002 — Copier vs cookiecutter](ADR-002-copier-vs-cookiecutter.md)
- [ADR-004 — Open questions for v0.1](ADR-004-open-questions-v0.1.md)
