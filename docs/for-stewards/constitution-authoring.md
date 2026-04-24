# Constitution authoring

> The 2–3 hour interview flow a steward runs to produce a project constitution. Covers what to ask, how to structure the output, and how to keep the constitution alive afterward.

## What a project constitution is

A project constitution is the **law of a single project** — separate from the platform constitution (which governs Morpheus itself, see [`../../CONSTITUTION.md`](../../CONSTITUTION.md)). It records:

- Non-negotiable conventions (naming, structure, testing baseline).
- Composition decisions that are specific to this project (which stacks, which workspace, which PM).
- Conventions that emerged organically and the team wants to enforce.
- The steward's contact and escalation path.

It is **not** a style guide, an onboarding doc, or a list of best practices. Those live elsewhere.

## Who authors it

The **steward**. One per project. Not a committee. The steward runs the interview, drafts, iterates with the team, and commits the final file.

A non-steward can propose amendments but cannot merge them. Amendments require a PR + ADR per [platform constitution](../../CONSTITUTION.md) §10.

## The interview flow

Budget 2–3 hours for a first-pass interview, split across two sessions if needed. The steward interviews **two or three senior contributors** who have shipped on this codebase for at least a quarter.

### Block 1 — Identity (20 min)

Questions:

1. What is this project's one-sentence purpose? (If answers diverge, that's the finding.)
2. Who owns it? Who is the escalation path when the steward is unavailable?
3. Which teams or organizations depend on it? Upstream and downstream.
4. What is the release cadence and why?
5. What is the worst-case incident this project has shipped, and what changed afterward?

Goal: get the project's self-image and its scars.

### Block 2 — Composition (30 min)

Questions:

1. Which stacks are primary? Secondary? Never-use?
2. Which workspace is canonical? Why?
3. Which PM tool and what's the ticket naming convention?
4. Which git provider and what's the branching model?
5. Are there domain concerns (e.g. regulatory, data residency)?
6. What modules would you add tomorrow if they existed?

Cross-check answers against [`../../modules/core/profiles.yaml`](../../modules/core/profiles.yaml) and the [module catalog](../reference/module-catalog.md). Composition rules are enforced at `agentic init`; the constitution records the team's reasoning.

### Block 3 — Conventions (40 min)

Questions:

1. What naming conventions do you enforce (files, functions, branches, commits)?
2. What's your minimum test-coverage floor and why that number?
3. What lint/format rules are non-negotiable?
4. How do you handle secrets? Where are they documented?
5. What's your PR-gate: required reviewers, required checks, merge strategy?
6. What's your commit convention (conventional commits, trailers, sign-off)?
7. Which patterns are forbidden? Why?

For each answer, drill: "How do we enforce this today? A check, a habit, or a hope?" If it's a hope, flag it for promotion to a check.

### Block 4 — Scope (20 min)

Questions:

1. What is this project explicitly **not** going to do?
2. What classes of change require a design review before a PR?
3. What classes of change can go straight to a PR without a design review?
4. What are the "never touch without the steward" surfaces?
5. What's the deprecation policy for public APIs?

Non-goals are as important as goals. A constitution that can't say no is a wiki.

### Block 5 — Review (15 min)

Questions:

1. Who reviews incoming PRs?
2. What does a good review look like? What does a bad one look like?
3. How do you handle CI failures? Re-run vs fix vs quarantine.
4. How do you handle flakes?
5. How often do you audit the lore store?

### Block 6 — Amendments (10 min)

Questions:

1. How does the constitution change?
2. How do disagreements get resolved when contributors disagree on a convention?
3. Who signs off on an amendment?
4. What's the minimum notice before a breaking convention change?

## Structure of a good constitution

Sections, in order:

```markdown
# <Project Name> Constitution

> Purpose line. One sentence.

## 1. Identity
(from Block 1)

## 2. Composition
(from Block 2 — pin stacks, workspace, PM, git, domains)

## 3. Conventions
### 3.1 Naming
### 3.2 Testing
### 3.3 Lint and format
### 3.4 Secrets
### 3.5 Commits and branches
### 3.6 PR gate

## 4. Non-goals

## 5. Review and merge

## 6. Amendments
(how this file changes)

## 7. Steward contact

## 8. Revisions
(table of <date, amendment ID, short summary>)
```

Guidelines:

- **Numbered clauses.** Every rule has a stable ID (`§3.2.1`) downstream tools can cite.
- **Short clauses.** One rule per clause. Prose that reads like legislation, not a manifesto.
- **Examples in footnotes, not in the clause.** A clause should be unambiguous without the example.
- **No diagrams in the constitution.** Diagrams live in design docs.

## The `constitution-author` skill

The core skill [`../../modules/core/skills/constitution-author.md`](../../modules/core/skills/constitution-author.md) automates the interview and the draft. Inputs:

- `project_root`
- `platform_manifest_path`
- `template_path` (usually `modules/core/templates/constitution.md.tmpl`)

Outputs:

- `constitution_md_path` — written to `.agent/constitution.md`.
- `interview_transcript_md` — internal; attach to the PR but do not commit by default.

The skill requires the `steward` profile. It refuses to run if the project has no steward recorded.

## Keeping the constitution alive

A constitution that no one reads is dead. The steward's recurring duties:

| Cadence | Task |
|---------|------|
| Monthly | Skim the lore store for advisory entries that warrant promotion to binding. Promote if needed (via amendment). |
| Quarterly | Re-interview two contributors for 30 minutes. Ask: "What rule do we follow that isn't written down?" |
| Per major release | Full re-read. File amendments for drift. |
| Per incident | Post-incident review produces at most one amendment. Not every incident needs a new rule. |

## The steward's lore-curator role

The steward is also the `lore-curator`. See [`../../modules/core/skills/lore-curator.md`](../../modules/core/skills/lore-curator.md). Flow:

1. `evaluator` opens a draft lore entry as a PR after a feature merges.
2. `lore-curator` (you, the steward) reviews.
3. Merge, request changes, or reject.
4. If the lore is strong enough, promote it into a constitutional amendment.

Lore answers *why the code looks like this*. The constitution answers *what we require and forbid*. The steward is the bridge.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Constitution reads like a style guide | Authored in isolation. | Re-run Block 3 with two senior contributors. |
| Interview runs 5+ hours | Steward let scope drift to roadmap. | Pull it back: constitution covers conventions, not the future. |
| Rules the team quietly violates | No enforcement. | Promote to CI check, or demote to advisory lore. |
| Constitution goes stale | No recurring cadence. | Add a quarterly calendar reminder. |

## Related docs

- [`constitution-author` skill](../../modules/core/skills/constitution-author.md)
- [`lore-curator` skill](../../modules/core/skills/lore-curator.md)
- [Platform constitution](../../CONSTITUTION.md)
- [ADR-004](../decisions/ADR-004-open-questions-v0.1.md)
