# Skill catalog

> Every skill shipped across all modules. Each row links to the skill, states its tier, and lists the profiles that surface it by default.

## Core skills (tier: `core`)

Provided by [`../../modules/core/`](../../modules/core/).

| Skill | Requires profiles | Description |
|-------|-------------------|-------------|
| [constitution-author](../../modules/core/skills/constitution-author.md) | steward | Interview the project steward to produce an initial project-level `constitution.md` from the platform template. |
| [decomposer](../../modules/core/skills/decomposer.md) | builder, steward | Turn `plan.md` into a machine-readable `tasks.json` plus an `overlap-map.json` describing file contention between tasks. |
| [evaluator](../../modules/core/skills/evaluator.md) | verifier, steward | After a feature merges, run the holdout suite and author a draft lore entry capturing what was learned. |
| [fixer](../../modules/core/skills/fixer.md) | builder, verifier | Diagnose a CI or test failure and propose a minimal patch. Optimised for short, targeted changes. |
| [initializer](../../modules/core/skills/initializer.md) | builder, steward | Take a validated `tasks.json` and create N git worktrees, one per task, on correctly named branches. |
| [integrator](../../modules/core/skills/integrator.md) | builder, steward | Merge task PRs into the feature branch in a safe order derived from the dependency graph and overlap map. |
| [lore-curator](../../modules/core/skills/lore-curator.md) | steward | Review and merge draft lore entries submitted by `evaluator`; promote to binding or advisory. |
| [lore-reader](../../modules/core/skills/lore-reader.md) | builder, verifier, author, explorer, steward | Search and read the project's lore store. Returns cited entries in a structured form. |
| [planner](../../modules/core/skills/planner.md) | builder, author, steward | Turn `spec.md` into `plan.md` with phased architecture, dependency graph, estimates, and risk register. |
| [reviewer](../../modules/core/skills/reviewer.md) | builder, verifier, steward | Review a PR against the project constitution, originating spec, prior lore, and stack standards. |
| [spec-author](../../modules/core/skills/spec-author.md) | author, builder, steward | Turn a PRD into a structured `spec.md` that `planner` and downstream agents can consume. |

## Stack skills (tier: `stack`)

Each stack ships a coding skill and a tester skill.

### stack-node

| Skill | Requires profiles | Description |
|-------|-------------------|-------------|
| [coding-agent-node](../../modules/stacks/stack-node/skills/coding-agent-node.md) | builder, steward | Implement production-grade Node.js + TypeScript code aligned with project stack conventions and the platform constitution. |
| [tester-node](../../modules/stacks/stack-node/skills/tester-node.md) | builder, verifier, steward | Design, extend, and verify automated tests for Node.js + TypeScript using the project's chosen runner. |

### stack-python

| Skill | Requires profiles | Description |
|-------|-------------------|-------------|
| [coding-agent-python](../../modules/stacks/stack-python/skills/coding-agent-python.md) | builder, steward | Implement production-grade Python code aligned with project stack conventions, lint rules, and the platform constitution. |
| [tester-python](../../modules/stacks/stack-python/skills/tester-python.md) | builder, verifier, steward | Design, extend, and verify automated tests for Python using the project's chosen runner and coverage tool. |

### stack-react

| Skill | Requires profiles | Description |
|-------|-------------------|-------------|
| [coding-agent-react](../../modules/stacks/stack-react/skills/coding-agent-react.md) | builder, steward | Implement production-grade React + TypeScript UI code aligned with the project's design system and state conventions. |
| [tester-react](../../modules/stacks/stack-react/skills/tester-react.md) | builder, verifier, steward | Design, extend, and verify automated tests for React + TS UI using the chosen component and E2E runners. |

## Workspace skills (tier: `workspace`)

Both workspaces expose the **same skill name** (`notifier`) so downstream skills and project code can call `notifier` abstractly. Swapping workspaces is a module change, not a rewrite.

| Skill | Module | Requires profiles | Description |
|-------|--------|-------------------|-------------|
| [notifier](../../modules/workspaces/workspace-microsoft/skills/notifier.md) | workspace-microsoft | builder, verifier, steward | Post notifications to the team's primary collaboration channel (Teams). |
| [notifier](../../modules/workspaces/workspace-google/skills/notifier.md) | workspace-google | builder, verifier, steward | Post notifications to the team's primary collaboration channel (Google Chat). |

A project has exactly one `notifier` active at a time because exactly one workspace is installed.

## Integration skills (tier: `integration`)

| Skill | Module | Requires profiles | Description |
|-------|--------|-------------------|-------------|
| [ticket-syncer-jira](../../modules/integrations/pm-jira/skills/ticket-syncer-jira.md) | pm-jira | builder, author, steward | Synchronize a unit of work between a local git worktree and a Jira ticket — read ticket, create branch, emit Smart Commit trailers, drive status transitions. |

`git-github` contributes no skills today; its value is in workflows and templates. This may change in a future MINOR.

## Domain skills (tier: `domain`)

None shipped in v0.1. `domain-healthcare` is an example module with no skills.

## Profile → skill default surfacing

Derived from [`../../modules/core/profiles.yaml`](../../modules/core/profiles.yaml):

| Profile | Default skills surfaced |
|---------|-------------------------|
| `builder` | all skills in installed modules |
| `verifier` | `evaluator`, `reviewer`, `tester-*`, `spec-author` (read), `planner` (read) |
| `author` | `spec-author`, `decomposer` (read) |
| `explorer` | `lore-reader` only |
| `steward` | all skills in installed modules + `constitution-author`, `lore-curator` |

Profiles are ergonomics, not permissions — per [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §2-3. Any agent can invoke any skill; profiles only change defaults.

## Cross-checks

Every `.md` under `modules/*/skills/` or `modules/*/*/skills/` should appear here. Enumerate:

```bash
find modules -path '*/skills/*.md' | sort
```

Expected output as of v0.1.0: 20 skill files (11 core + 6 stack + 2 workspace + 1 integration).

## Related docs

- [Module catalog](module-catalog.md)
- [Writing a custom skill](../for-engineers/writing-a-custom-skill.md)
- [Adding a module](../for-platform-maintainers/adding-a-module.md)
