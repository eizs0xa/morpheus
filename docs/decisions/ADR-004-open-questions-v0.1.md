# ADR-004 — Open questions for v0.1

- Status: accepted
- Date: 2025-01-08
- Supersedes: —
- Superseded by: —

## Context

Before Layer 4 of the execution plan (the CLI layer), six open questions blocked progress. Each question had a defensible answer but no recorded rationale. This ADR resolves them as **v0.1** decisions. Any of these may revisit at v0.2+ if real-world use surfaces a better answer; until then, these are the platform's working assumptions.

The questions come from `EXECUTION_PLAN.md` §6.

## Decision

### Q1 — CLI language stack

**Decision:** Node + TypeScript CLI shell, Python `copier` invoked as a subprocess for template rendering.

**Rationale:**

- TypeScript gives us strong types over `module.yaml` schemas and the manifest shape without a runtime overhead.
- The agent ecosystem (Claude, Copilot, Cursor) is fluent in Node tooling; contributors will feel at home.
- Copier is the best-in-class template engine with native update support ([ADR-002](ADR-002-copier-vs-cookiecutter.md)). Rewriting it in Node would be a multi-quarter effort with no user-visible benefit.
- The subprocess boundary is clean: we wrap it in `composers/file-renderer.ts` and mock in tests.

### Q2 — Distribution

**Decision:** clone-the-repo for v0.1.0. No npm publish, no homebrew tap, no standalone installer.

**Rationale:**

- v0.1 is aimed at a friendly pilot — 1–5 teams inside the authoring org. Cloning the repo is fine at this scale.
- Packaging (npm, brew, etc.) is a separate engineering effort. Doing it in v0.1 is yak-shaving.
- Deferring distribution lets us iterate on the CLI surface without worrying about release hygiene.

**Revisit trigger:** when the pilot expands beyond the authoring org, or when the CLI version inside rendered projects drifts from the platform checkout too often.

### Q3 — Docs hosting

**Decision:** in-repo Markdown under `docs/` for v0.1.0. No static site generator, no docs.morpheus.dev, no MkDocs, no Docusaurus.

**Rationale:**

- GitHub renders Markdown well. Relative links work out of the box. Search works via code search.
- A static site generator is a maintenance commitment — theme updates, deploy pipeline, broken-link CI. Not worth it at v0.1.
- When we do pick a generator, we want to pick from a position of knowing what we need, not guess.

**Revisit trigger:** when docs hit ~100 files or when we ship a public-facing platform (Phase 4+ in the rollout guide).

### Q4 — Lore storage

**Decision:** flat Markdown files under `.agent/lore/` searchable with `ripgrep`. No embeddings, no vector DB, no search service.

**Rationale:**

- Lore is editorial, not conversational. It lives a long time and is read intentionally.
- Under ~500 entries, ripgrep is faster than any embedding round-trip and produces exact, auditable matches.
- Embeddings introduce hidden dependencies and a non-trivial ops surface. The v0.1 pilot does not earn that complexity.
- If we later need semantic search, we can layer it on top of the flat files — the file format is the contract.

**Revisit trigger:** when a project's lore store exceeds 500 entries or when the steward reports that query recall is a real problem.

### Q5 — Platform release cadence

**Decision:** on-demand release for the first 6 months. No fixed schedule.

**Rationale:**

- The platform is young. Forcing a schedule forces either artificial batching (bad) or underbaked releases (worse).
- On-demand gives maintainers the freedom to ship when a coherent slice is ready.
- After Phase 5, we reconsider (see [rollout-guide.md](../for-eng-managers/rollout-guide.md)).

**Revisit trigger:** after Phase 5, or when on-demand releases start clustering (e.g. > 1/week consistently), indicating the on-demand model has stopped scaling.

### Q6 — Domain-module authorship

**Decision:** platform team only until a contribution guide is written. `domain-healthcare` in v0.1 is example-only (`status: example`).

**Rationale:**

- Domain modules encode regulatory or policy-heavy constraints. Getting them wrong is expensive.
- The platform team needs to ship at least one non-example domain itself before it can guide others.
- A contribution guide for domain modules is a separate writing task — we'd rather ship it intentionally than accept half-baked contributions.

**Revisit trigger:** when the platform team ships a production-ready domain module and the contribution guide lands.

## Consequences

Positive:

- Every blocking question has an explicit answer with a revisit trigger.
- Contributors can cite this ADR when a "why didn't we do X" question surfaces.
- Future ADRs can supersede specific sections here without touching unrelated ones.

Negative:

- Six decisions in one ADR is unusual. Future ADRs should be narrower. This one is a bootstrap aggregate; subsequent ADRs should target one decision each.

## Tradeoffs considered

See each question's rationale above. The common thread: **defer complexity until it's earned**. v0.1 is a pilot. Every decision optimizes for "learn and iterate," not "design for scale we don't have yet."

## Reversibility

Every decision here is reversible. The most likely candidates to flip:

- **Q2** (Distribution) — first to move when adoption expands.
- **Q3** (Docs hosting) — second to move when doc volume grows.
- **Q4** (Lore storage) — third; ripgrep on 500 entries is already fast, so pressure will come from recall, not latency.

## Related

- [EXECUTION_PLAN.md §6](../../EXECUTION_PLAN.md)
- [Rollout guide](../for-eng-managers/rollout-guide.md)
- [ADR-001 — Monorepo vs multirepo](ADR-001-monorepo-vs-multirepo.md)
- [ADR-002 — Copier vs cookiecutter](ADR-002-copier-vs-cookiecutter.md)
- [ADR-003 — Branching model](ADR-003-branching-model.md)
