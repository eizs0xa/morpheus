# Module Catalog

Every Morpheus module currently shipped in this repo.

## At A Glance

| Module | Version | Kind | Description |
|---|---:|---|---|
| [core](../../modules/core/module.yaml) | 0.1.0 | core | Universal schemas, templates, and governance for approved agent workflows. |
| [workspace-companion](../../modules/integrations/workspace-companion/module.yaml) | 0.1.0 | integration | Chat-orchestrated repo-first workspace setup. |
| [git-github](../../modules/integrations/git-github/module.yaml) | 0.1.0 | integration | Standardized branch, commit, PR, CODEOWNERS, branch protection, and Jira-linked GitHub checks. |
| [local-launch](../../modules/integrations/local-launch/module.yaml) | 0.1.0 | integration | OS-aware one-click local launch support for macOS and Windows. |
| [pm-jira](../../modules/integrations/pm-jira/module.yaml) | 0.1.0 | integration | Jira integration assets. |
| [coe-portal](../../modules/integrations/coe-portal/module.yaml) | 0.1.0 | integration | Optional CoE portal integration assets. |
| [governance-adlc](../../modules/integrations/governance-adlc/module.yaml) | 0.1.0 | integration | Optional ADLC governance assets. |
| [stack-node](../../modules/stacks/stack-node/module.yaml) | 0.1.0 | stack | Node.js and TypeScript guidance. |
| [stack-python](../../modules/stacks/stack-python/module.yaml) | 0.1.0 | stack | Python guidance. |
| [stack-react](../../modules/stacks/stack-react/module.yaml) | 0.1.0 | stack | React and TypeScript UI guidance. |
| [workspace-microsoft](../../modules/workspaces/workspace-microsoft/module.yaml) | 0.1.0 | workspace | Optional Microsoft 365 notifier/collaboration adapter. |
| [workspace-google](../../modules/workspaces/workspace-google/module.yaml) | 0.1.0 | workspace | Optional Google Workspace notifier/collaboration adapter. |
| [domain-healthcare](../../modules/domains/domain-healthcare/module.yaml) | 0.1.0 | domain | Example healthcare compliance domain module. |

## Recommended Starting Set

For DAAA-style adoption, start with:

```text
core
workspace-companion
git-github
pm-jira
local-launch
```

Add `local-launch` when teams need one-click local startup support. Add future `morpheus-initiation`, `prd-to-jira`, and `geodesic-audit` modules as they are promoted.

## Registering A New Module

1. Add `modules/<category>/<module>/module.yaml`.
2. Add contributed templates, workflows, schemas, hooks, and instructions under the module folder.
3. Add approved reusable skill bodies under `.agents/skills/<skill-name>/SKILL.md` and reference them from `module.yaml`.
4. Update this catalog.
5. Update [skill-catalog.md](skill-catalog.md) when the module contributes skills.
6. Run `npm test`.
