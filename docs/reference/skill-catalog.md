# Skill Catalog

Approved reusable Morpheus skills live in `.agents/skills/<skill-name>/SKILL.md`. Skills listed here are considered ready for setup-time use.

Skills preserved under `incubator/candidate-skills/` are not setup-ready. They are source material for future promotion after agnostic review and evidence.

## Workspace Setup

| Skill | Module | Description |
|---|---|---|
| [chat-setup](../../.agents/skills/chat-setup/SKILL.md) | `workspace-companion` | Orchestrate repo-first Morpheus setup from agent chat. |

## GitHub Workflow

| Skill | Module | Description |
|---|---|---|
| [agent-git-operator](../../.agents/skills/agent-git-operator/SKILL.md) | `git-github` | Standardize agent-run branch, commit, push, and PR prep. |
| [branch-naming](../../.agents/skills/branch-naming/SKILL.md) | `git-github` | Define Jira-linked branch naming policy. |
| [conventional-commits](../../.agents/skills/conventional-commits/SKILL.md) | `git-github` | Define commit and PR title grammar. |
| [jira-linked-branching](../../.agents/skills/jira-linked-branching/SKILL.md) | `git-github` | Enforce Jira-linked branch and PR naming. |
| [pull-request-workflow](../../.agents/skills/pull-request-workflow/SKILL.md) | `git-github` | Produce consistent GitHub PR titles and bodies. |

## Local Launch

| Skill | Module | Description |
|---|---|---|
| [local-launch](../../.agents/skills/local-launch/SKILL.md) | `local-launch` | Generate OS-aware local launch tasks and auth/env guidance. |

## Incubating Candidates

The following inherited skills were moved out of the approved skill catalog because they are not fully wired for the chat-first Morpheus setup model yet:

```text
incubator/candidate-skills/
```

They should be ported one at a time into approved `.agents/skills/` only after review.
