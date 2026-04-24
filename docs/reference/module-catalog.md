# Module catalog

> Every Morpheus module shipped today. One row per module. Keep this file in lockstep with [../../modules/](../../modules/) — CI should cross-check.

## At a glance

| Module | Version | Kind | Tier | Description |
|--------|---------|------|------|-------------|
| [core](../../modules/core/module.yaml) | 0.1.0 | core | core | Mandatory universal module. Artifact chain, core skills, templates, schemas. |
| [stack-node](../../modules/stacks/stack-node/module.yaml) | 0.1.0 | stack | stack | Node.js + TypeScript stack. Coding and tester skills, PR gate workflow, pre-commit hook, editor instructions. |
| [stack-python](../../modules/stacks/stack-python/module.yaml) | 0.1.0 | stack | stack | Python stack. Coding and tester skills, PR gate workflow, pre-commit hook, editor instructions. |
| [stack-react](../../modules/stacks/stack-react/module.yaml) | 0.1.0 | stack | stack | React + TS stack. Coding and tester skills, PR gate workflow, pre-commit hook, editor instructions. |
| [workspace-microsoft](../../modules/workspaces/workspace-microsoft/module.yaml) | 0.1.0 | workspace | workspace | Microsoft 365 workspace — Outlook, Teams, OneDrive MCP servers and a notifier skill posting to Teams. |
| [workspace-google](../../modules/workspaces/workspace-google/module.yaml) | 0.1.0 | workspace | workspace | Google Workspace — Gmail, Google Chat, Drive MCP servers and a notifier skill posting to Chat. |
| [pm-jira](../../modules/integrations/pm-jira/module.yaml) | 0.1.0 | integration | integration | Jira PM integration. MCP server config, ticket-syncer skill, branch/smart-commit enforcement, preflight initiative check. |
| [git-github](../../modules/integrations/git-github/module.yaml) | 0.1.0 | integration | integration | GitHub git-provider integration. PR-gate, merge-queue, release-train workflows; PR template; CODEOWNERS; branch-protection JSON. |
| [domain-healthcare](../../modules/domains/domain-healthcare/module.yaml) | 0.1.0 | domain (example) | domain | [EXAMPLE-ONLY] Illustrative domain module showing HIPAA-related constraints. Not production-ready. `status: example`. |

## By kind

### Core

- **core** — the one module every project inherits. Ships `spec-author`, `planner`, `decomposer`, `initializer`, `reviewer`, `integrator`, `fixer`, `evaluator`, `constitution-author`, `lore-reader`, `lore-curator`. Templates: `constitution.md.tmpl`, pointer-file templates, feature-template. Owns every schema under `modules/core/schemas/`.

### Stacks

Stack modules are additive and non-exclusive (0..N per project).

- **stack-node** — Node.js + TypeScript. Detection: `package.json` with `engines.node` or a `.nvmrc`. Skills: `coding-agent-node`, `tester-node`.
- **stack-python** — Python. Detection: `pyproject.toml`, `requirements.txt`, or `setup.py`. Skills: `coding-agent-python`, `tester-python`.
- **stack-react** — React + TS. Detection: `package.json` with `react` in dependencies. Skills: `coding-agent-react`, `tester-react`.

### Workspaces

Exactly one workspace per project (per [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §1.2). The two workspaces expose the same skill name (`notifier`) so project code references the skill abstractly and workspace swaps are transparent.

- **workspace-microsoft** — Outlook, Teams, OneDrive MCP servers. Notifier posts to a Teams channel. Prompt: `teams_webhook_url`.
- **workspace-google** — Gmail, Google Chat, Drive MCP servers. Notifier posts to a Chat space. Prompt: `chat_space_id`.

These are mutually `incompatible_with` each other. The composer rejects both at once.

### Integrations

- **pm-jira** — Jira integration. Contributes the `ticket-syncer-jira` skill, Jira MCP config, branch-naming enforcement workflow, Smart Commits workflow, transition-map template, and an `initiative-check` preflight (stub-gated in v0.1, see `cli/src/commands/_init/jira-preflight.ts`).
- **git-github** — GitHub integration. Contributes PR-gate, merge-queue, and release-train workflows, a PR template, CODEOWNERS template, and a `branch-protection.json` consumable by `gh api`.

PM cardinality is 0..1. Git cardinality is exactly 1. Both enforce exclusivity via `incompatible_with` against siblings (e.g. `pm-linear`, `git-gitlab`) that do not yet exist.

### Domains

Domain modules are 0..N. v0.1 ships one example-only module; production-ready domains are deferred per [ADR-004](../decisions/ADR-004-open-questions-v0.1.md).

- **domain-healthcare** (example) — illustrative HIPAA-adjacent constraints. No skills or templates contributed; exists as a shape reference. Status: `example`. Do not declare in a real project.

## Registering a new module

See [../for-platform-maintainers/adding-a-module.md](../for-platform-maintainers/adding-a-module.md). Update this file with a new row when shipping.

## Cross-checks

A script should verify every `module.yaml` found under `modules/` is represented in this file. Until the script ships, compare manually:

```bash
find modules -name module.yaml | sort
```

Expected output as of v0.1.0:

```
modules/core/module.yaml
modules/domains/domain-healthcare/module.yaml
modules/integrations/git-github/module.yaml
modules/integrations/pm-jira/module.yaml
modules/stacks/stack-node/module.yaml
modules/stacks/stack-python/module.yaml
modules/stacks/stack-react/module.yaml
modules/workspaces/workspace-google/module.yaml
modules/workspaces/workspace-microsoft/module.yaml
```

Nine modules → nine rows in the table above.

## Related docs

- [Skill catalog](skill-catalog.md)
- [CLI reference](cli-reference.md)
- [Schemas](schemas.md)
- [Adding a module](../for-platform-maintainers/adding-a-module.md)
