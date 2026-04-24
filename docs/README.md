# Morpheus Documentation

> Versioned docs for the Morpheus agentic development platform. Find your audience below and follow the link.

## Start here

**New to Morpheus?** Read [getting-started.md](getting-started.md). It covers the three entry paths — greenfield, brownfield, and learning-only — in the order most users need them.

**Already scaffolded a project?** Jump to the engineer docs or the [CLI reference](reference/cli-reference.md).

## By audience

### Engineers — writing and shipping code
- [New-project walkthrough](for-engineers/new-project-walkthrough.md) — greenfield scaffold with `builder`, `stack-node`, `stack-react`, `pm-jira`.
- [Brownfield walkthrough](for-engineers/brownfield-walkthrough.md) — overlay Morpheus onto an existing repo without breakage.
- [Updating the platform](for-engineers/updating-the-platform.md) — when and how to run `agentic update`; copier three-way merge.
- [Writing a custom skill](for-engineers/writing-a-custom-skill.md) — frontmatter spec, body sections, submission flow.

### Verifiers — tests, holdouts, acceptance
- [Holdout authoring](for-verifiers/holdout-authoring.md) — what a holdout test is, where it lives, what the evaluator skill expects.

### Authors — specs, PRDs, design docs
- [PRD to spec walkthrough](for-authors/prd-to-spec-walkthrough.md) — the `author` profile workflow and hand-off to `builder`.

### Explorers — reading, mapping, learning
- [Codebase tour](for-explorers/codebase-tour.md) — what the `explorer` profile gives you and how to search lore.

### Stewards — constitution, conventions, lore
- [Constitution authoring](for-stewards/constitution-authoring.md) — the interview flow that produces a project constitution.

### Engineering managers — rollout, metrics, escalation
- [Rollout guide](for-eng-managers/rollout-guide.md) — six-phase adoption plan with management checkpoints.
- [Measuring impact](for-eng-managers/measuring-impact.md) — adoption, freshness, engagement, quality, velocity, cost.
- [Escalation paths](for-eng-managers/escalation-paths.md) — who owns what; when to file a module request.

### Platform maintainers — evolving Morpheus itself
- [Adding a module](for-platform-maintainers/adding-a-module.md) — checklist, schema compliance, composition impact.
- [Publishing a release](for-platform-maintainers/publishing-a-release.md) — on-demand release workflow.
- [Handling breaking changes](for-platform-maintainers/handling-breaking-changes.md) — versioning policy, deprecation, migration scripts.

## Reference

- [Module catalog](reference/module-catalog.md) — every module shipped today.
- [Skill catalog](reference/skill-catalog.md) — every skill with its tier and profile mapping.
- [CLI reference](reference/cli-reference.md) — every command, flag, env var, and exit code.
- [Schemas](reference/schemas.md) — JSON Schema contracts and examples.

## Decisions

Architecture Decision Records live under [decisions/](decisions/). They document the **why** behind irreversible choices.

- [ADR-001 — Monorepo vs multirepo](decisions/ADR-001-monorepo-vs-multirepo.md)
- [ADR-002 — Copier vs cookiecutter](decisions/ADR-002-copier-vs-cookiecutter.md)
- [ADR-003 — Branching model](decisions/ADR-003-branching-model.md)
- [ADR-004 — Open questions for v0.1](decisions/ADR-004-open-questions-v0.1.md)

## Related platform docs

These live at the repo root because they govern the platform itself, not just its documentation:

- [`../CONSTITUTION.md`](../CONSTITUTION.md) — composition rules, stop-lines, versioning policy.
- [`../PHILOSOPHY.md`](../PHILOSOPHY.md) — the thesis and design tenets.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — how to contribute.
- [`../CHANGELOG.md`](../CHANGELOG.md) — release notes.

## Conventions used in these docs

- **CLI examples** are fenced with `bash` and show the literal command you run.
- **File paths** are workspace-relative unless shown with `/` absolute.
- **Placeholders** appear in `<angle-brackets>` or as `{{variable}}` where copier templates are involved.
- **Profiles** are always one of the five canonical names: `builder | verifier | author | explorer | steward`.
