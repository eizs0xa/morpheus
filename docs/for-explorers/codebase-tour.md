# Codebase tour

> What the `explorer` profile gives you, and how to read a project's lore without modifying anything.

## What `explorer` is for

You want to understand a codebase — yours, a teammate's, or an OSS repo — without risk of accidental modification. `explorer` is the **read-only** profile. Per [`../../modules/core/profiles.yaml`](../../modules/core/profiles.yaml):

```yaml
explorer:
  modules: [core-readonly]
  skills_enabled: [lore-reader]
  scaffolding: none
  can_commit_code: false
```

No scaffolding is produced. No agent will surface coding, testing, or spec-authoring skills. The only skill offered is `lore-reader`.

## When to use `explorer`

- Onboarding into a codebase you've never seen.
- Pre-reading before a design discussion — you want context without touching anything.
- Auditing a project (security, compliance, architecture review).
- Demoing Morpheus to someone who isn't ready to commit to a writing profile.

## When not to use `explorer`

- You need to ship code — use `builder`.
- You need to write tests or holdouts — use `verifier`.
- You need to write a PRD or spec — use `author`.
- You will amend the constitution — use `steward`.

Swap at any time:

```bash
morpheus invoke --profile builder --resume
```

`--resume` preserves the manifest and bumps the profile in-place.

## Initial setup

```bash
cd <any-repo>
morpheus invoke --profile explorer
```

This writes a minimal `platform-manifest.json` recording `profile: explorer`. Nothing else is added.

## The tour

### `agentic tour` (planned)

A future command that walks an agent through the codebase structure. The design:

```bash
agentic tour                        # full tour, top-down
agentic tour --depth 2              # abbreviated
agentic tour --module auth          # focus on a subsystem
agentic tour --since v1.4.0         # only what changed since a tag
```

For v0.1.0, do the tour manually with an agent runtime:

> "I am in the `explorer` profile. Read `.agent/platform-manifest.json`, then walk me through the top-level directories and explain each one."

The `lore-reader` skill gives the agent the structured entry point into prior decisions as it tours.

### `agentic lore search`

Lore is the project's editorial memory — decisions, conventions, gotchas, why certain code looks the way it does. See the `lore-reader` skill contract: [`../../modules/core/skills/lore-reader.md`](../../modules/core/skills/lore-reader.md).

v0.1.0 storage is flat-file + ripgrep ([ADR-004](../decisions/ADR-004-open-questions-v0.1.md)). Structure:

```
.agent/
└── lore/
    ├── <slug-1>.md
    ├── <slug-2>.md
    └── index.md          (optional, steward-curated)
```

Each lore entry has frontmatter:

```yaml
---
id: L-023
status: binding | advisory | deprecated
scope: [<paths-or-modules>]
tags: [<kebab-case>]
author: <name>
date: YYYY-MM-DD
---
```

Search patterns:

```bash
agentic lore search "auth flow"              # natural language
agentic lore search --scope src/api/         # scoped
agentic lore search --status binding         # only binding
agentic lore search --tag retries            # tag filter
```

Until `agentic lore search` ships, grep directly:

```bash
rg -l "auth" .agent/lore/
rg -e "status: binding" .agent/lore/ | wc -l
```

The `lore-reader` skill returns cited lore entries in a structured, linkable format. Point your agent at it:

> "Run `lore-reader` with query 'auth flow' and scope `src/api/`."

## Reading patterns

A productive tour follows this order:

1. **Platform manifest** — know the profile, stacks, workspace, integrations.
2. **Constitution** — `.agent/constitution.md` — the project's law.
3. **README + CONTRIBUTING** — the public face of the project.
4. **Top-level structure** — `tree -L 2 -I node_modules`.
5. **Per-module conventions** — read `AGENTS.md` and the workspace-specific pointer file (`CLAUDE.md`, `copilot-instructions.md`).
6. **Lore** — `agentic lore search` for the subsystem you care about.
7. **Recent history** — `git log --oneline --since="30 days ago"`.
8. **Open issues / PRs** — what's in flight.

Resist the urge to read all source. Source tells you *what*; lore and specs tell you *why*.

## Safety guarantees

- `explorer` does not run any skill that mutates files.
- `can_commit_code: false` — the profile signals that commits are not the goal.
- The agent runtime will still let you commit if you insist — profiles are ergonomic, not runtime permissions (see [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §2). If you need to enforce read-only, use branch protection.

## Exiting the tour

When you're ready to contribute:

```bash
morpheus invoke --profile <builder|verifier|author|steward> --resume
```

The manifest updates; no files are re-rendered unless you pass `--answers-file` with changed stacks or modules.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Agent suggests writing code | You forgot to set the profile. | `morpheus invoke --profile explorer --resume`. |
| `lore-reader` returns nothing | Project has no `.agent/lore/` yet. | The project is young; rely on constitution + README. |
| Tour feels endless | No prioritization. | Start from the feature you actually care about; expand outward. |

## Related docs

- [`lore-reader` skill](../../modules/core/skills/lore-reader.md)
- [`lore-curator` skill](../../modules/core/skills/lore-curator.md)
- [Constitution authoring](../for-stewards/constitution-authoring.md)
