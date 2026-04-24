# Writing a custom skill

> A skill is a Markdown file with YAML frontmatter plus a prescribed body. It is the unit of agent behavior Morpheus composes. This page is the spec.

## What a skill is

A **skill** tells an agent how to do one bounded thing: author a spec, review a PR, run a holdout, post a notification. Skills are:

- Discoverable via their frontmatter.
- Composable — skills in `core` are reused by stacks; stack skills reuse core skills abstractly.
- Versioned via the module they live in.
- Validated by shape, not by runtime — the CLI does not execute skills.

Existing skills live under `modules/*/skills/*.md`. Browse the [skill catalog](../reference/skill-catalog.md) for examples.

## File layout

```
modules/<kind>/<module-name>/
└── skills/
    └── <skill-name>.md
```

- `<kind>` is one of `core`, `stacks`, `workspaces`, `integrations`, `domains`.
- `<skill-name>` is a kebab-case noun or short noun phrase — the same name used in `module.yaml` > `contributes.skills`.

## Frontmatter spec

Required fields:

```yaml
---
name: <kebab-case-skill-name>      # must match the filename stem
version: 0.1.0                      # semver; starts at 0.1.0 with the module
tier: core | stack | workspace | integration | domain
description: One-sentence description of what the skill does.
when_to_use: |
  - Concrete trigger condition 1.
  - Concrete trigger condition 2.
  - 3–5 bullets; no waffle.
when_not_to_use: |
  - Out-of-scope condition 1 with the alternative.
  - Out-of-scope condition 2 with the alternative.
  - Every "not" bullet names a replacement skill or action.
inputs:
  - input_name: type (brief clarifier if needed)
outputs:
  - output_name: type (brief clarifier)
requires_profiles: [<one-or-more-of: builder, verifier, author, explorer, steward>]
---
```

Optional fields:

```yaml
requires_modules: [<module-name-and-range>]    # e.g. "core >=0.1.0 <1.0.0"
idempotent: true | false                        # default false
side_effects: [none | writes-files | runs-cli | calls-api]
```

Validation rules:

- `name` is unique **within a tier**. Two workspaces may expose a skill named `notifier`; two core skills may not.
- `tier` matches the module's kind (core skills in `core`, stack skills in a stack, etc.).
- `requires_profiles` lists at least one profile. `explorer` alone implies read-only.

## Body sections

The body has exactly five H2 sections in this order. Do not add or reorder.

```markdown
## Purpose

One paragraph. The agent reads this first. State the one outcome.

## Inputs

Detailed expectations for each input from frontmatter — what a good input looks like, what a bad input looks like, pre-conditions the caller must satisfy.

## Process

Numbered steps. 5–15 total. Each step is a verb phrase. Branches get nested lists. The agent executes this in order.

## Outputs

Detailed expectations for each output — file format, structure, naming convention, where it lands. Include a minimal example where helpful.

## Acceptance

Bulleted checklist the caller verifies before marking the skill complete. Machine-checkable where possible (file exists, schema validates, test passes).

## Common failure modes

Enumerate 3–7 failure modes the agent should recognize, with the specific next action. Format: `- **Symptom** — remediation.`
```

## Example: a minimal custom skill

```markdown
---
name: changelog-updater
version: 0.1.0
tier: core
description: Append an entry to CHANGELOG.md for a freshly merged feature.
when_to_use: |
  - A feature branch just merged to the default branch.
  - The feature has a user-visible change.
  - CHANGELOG.md exists and follows Keep a Changelog.
when_not_to_use: |
  - The change is internal-only (lint, refactor) — skip.
  - CHANGELOG.md is absent — run `changelog-bootstrap` first.
  - A release just shipped and the Unreleased section is empty — use `release-notes-author`.
inputs:
  - merge_commit: git sha
  - feature_slug: string
  - change_category: one of [Added, Changed, Fixed, Removed, Deprecated, Security]
outputs:
  - changelog_md_path: string (updated file)
requires_profiles: [builder, steward]
---

## Purpose
Append a single bullet under the `## [Unreleased]` heading of `CHANGELOG.md` that names the feature and links the merge commit.

## Inputs
Merge commit must exist on the default branch. Feature slug must match the folder under `.agent/features/`. Change category maps 1-1 to Keep a Changelog.

## Process
1. Read `CHANGELOG.md`. If no `## [Unreleased]` section, create one at the top.
2. Locate the subsection for `change_category` under Unreleased.
3. Append `- <feature summary> (<short-sha>)`.
4. Write the file.
5. Stage and create a commit with subject `docs(changelog): <feature_slug>`.

## Outputs
Updated `CHANGELOG.md` with exactly one new bullet and a single commit.

## Acceptance
- `git diff HEAD~1 -- CHANGELOG.md` shows exactly one added bullet.
- `markdownlint CHANGELOG.md` exits 0.
- The commit is conventional and signed.

## Common failure modes
- **No `[Unreleased]` section** — create one; don't write under a versioned heading.
- **Merge commit not on default branch** — refuse; this skill runs post-merge only.
- **Duplicate bullet text** — fold with the existing one; don't double-list.
```

## `requires_profiles` rules

`requires_profiles` is the list of profiles for which the skill will surface by default. It is **not** a permission boundary (per [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §2-3). The agent runtime does not block a skill based on profile — it just stops recommending it.

Guidance:

| Profile | Typical skills |
|---------|----------------|
| `builder` | coding, decomposition, integration, fixing. |
| `verifier` | testing, holdout authoring, evaluation. |
| `author` | spec authoring, PRD shaping, decomposition (read). |
| `explorer` | lore-reader and read-only tours only. |
| `steward` | constitution, lore curation, platform migration. |

If a skill is universally useful (e.g. `lore-reader`), list all five.

## Registering the skill in `module.yaml`

Every skill must appear in the contributing module's `module.yaml`:

```yaml
# modules/core/module.yaml
contributes:
  skills:
    - skills/spec-author.md
    - skills/planner.md
    - skills/changelog-updater.md    # new
```

The CLI checks this list during `agentic validate`.

## Submission via PR

1. Fork the platform repo.
2. Create a branch: `feat/skill-<skill-name>`.
3. Add the file under the correct module's `skills/` directory.
4. Add the file path to the module's `module.yaml > contributes.skills`.
5. If the skill warrants a dedicated ADR (new pattern, deviation from spine), open one under `docs/decisions/`.
6. Update [`../reference/skill-catalog.md`](../reference/skill-catalog.md) — one row per skill.
7. Add a CHANGELOG entry under `[Unreleased]` in the platform repo.
8. Open a PR. CODEOWNERS routing takes it from there.

Platform team review checks:

- Frontmatter validates against the (informal) skill shape described here.
- Body has exactly the five H2 sections.
- No overlap with an existing skill — if you're close, extend the existing skill instead.
- `requires_profiles` is consistent with the skill's read/write nature.
- One concrete example in the body.

## Related docs

- [Skill catalog](../reference/skill-catalog.md)
- [Adding a module](../for-platform-maintainers/adding-a-module.md)
- [Handling breaking changes](../for-platform-maintainers/handling-breaking-changes.md)
