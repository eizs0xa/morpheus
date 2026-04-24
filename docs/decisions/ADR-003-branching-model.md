# ADR-003 — Branching model

- Status: accepted
- Date: 2025-01-08
- Supersedes: —
- Superseded by: —

## Context

Morpheus manages three related streams of work:

1. **Platform development** — evolving the platform itself (core, modules, CLI, templates, docs).
2. **Parallel agent work** — multiple coding agents working on sub-tasks of a single feature.
3. **Release history** — preserving the record of what shipped, when.

The branching model must:

- Give stable release tags.
- Let parallel agents work on one feature concurrently without stomping each other.
- Make integration order deterministic (the `integrator` skill consumes a dependency graph).
- Encode the PM ticket key in branch names so CI can validate them (e.g. `jira-branch-check`).

## Decision

Use this model:

```
main
  ├─ release/YYYY.WW           (cut for each release)
  │
  └─ feature/<ISSUE_KEY>       (one per feature)
        ├─ agent/<ISSUE_KEY>/T001
        ├─ agent/<ISSUE_KEY>/T002
        └─ agent/<ISSUE_KEY>/T003
```

- `main` is the default branch. Always green.
- `release/YYYY.WW` is a release branch cut at scope-freeze time. `YYYY.WW` is ISO year-week (e.g. `release/2025.06`).
- `feature/<ISSUE_KEY>` branches from `main` and aggregates all agent task branches for one feature. `ISSUE_KEY` matches the PM ticket (`PROJ-1234`).
- `agent/<ISSUE_KEY>/T<NNN>` branches from the corresponding `feature/` branch. `T<NNN>` is the task ID from `tasks.json`.

## Rationale

- **Parallel-safe agent work.** Each agent owns one `agent/…/T<NNN>` branch. They never commit to each other's branches.
- **Integrator-friendly.** The `integrator` skill reads `tasks.json` + `overlap-map.json` and merges agent branches into the feature branch in a safe order. The naming convention lets it enumerate branches mechanically.
- **CI-verifiable.** `jira-branch-check.yml` rejects branches missing `<ISSUE_KEY>`. The pattern `feature/<ISSUE_KEY>` and `agent/<ISSUE_KEY>/T<NNN>` both satisfy it.
- **Ticket-pinned provenance.** Every commit in the tree traces to a ticket via branch name, without needing per-commit trailers. Smart Commits still ship trailers; branch names are the belt-and-suspenders.
- **Readable release history.** `release/YYYY.WW` branches let us ship hotfixes from a frozen point without blocking `main`.

## Consequences

Positive:

- Agent work is parallelizable without contention.
- The integrator has a deterministic merge order input.
- CI rules are simple regexes, not human judgment.
- Releases cut cleanly; hotfixes have a home.

Negative:

- Branch names get long. `agent/PROJ-1234/T005` is 20+ characters before the task verb. Acceptable — CI and the integrator care, humans type `git checkout ag<TAB>` and move on.
- Weekly-numbered releases drift if a release slips into the next week. We keep the branch name frozen at cut time; the tag (`v0.1.1`) is the authoritative identifier regardless of the branch name.

## Tradeoffs considered

- **GitHub Flow (feature branches off `main`, no releases).** Rejected. We need release branches for hotfix isolation; GitHub Flow is a regression here.
- **Git Flow (develop + release + feature + hotfix).** Rejected. Heavier than needed; the `develop` branch adds a merge step without value for our cadence.
- **Trunk-based development (everything on `main`, feature flags).** Rejected. Feature flags are a great runtime tool but don't replace parallel-task isolation for coding agents.
- **Ticket-less branches.** Rejected. Makes Jira preflight and branch-pattern enforcement impossible.

## Naming examples

Good:

- `feature/PROJ-1234`
- `agent/PROJ-1234/T001`
- `agent/PROJ-1234/T012`
- `release/2025.06`
- `release/2025.06-hotfix-1` (if a hotfix requires its own branch off the release branch)

Bad (CI rejects or integrator misreads):

- `feature/coupon-engine` — missing issue key.
- `agent/T001` — missing issue key.
- `agent/PROJ-1234-T001` — wrong separator; agent path uses `/`.
- `rel-2025-06` — wrong prefix.
- `main-dev` — no long-lived branches besides `main` itself.

## Reversibility

Reversible. If a team prefers a different convention, they can fork the `jira-branch-check` workflow and the `integrator` skill in their project. The platform defaults remain the defaults; overrides live in the project.

## Related

- [`jira-branch-check.yml`](../../modules/integrations/pm-jira/workflows/jira-branch-check.yml.tmpl)
- [`integrator` skill](../../modules/core/skills/integrator.md)
- [`initializer` skill](../../modules/core/skills/initializer.md)
- [`decomposer` skill](../../modules/core/skills/decomposer.md)
- [Publishing a release](../for-platform-maintainers/publishing-a-release.md)
