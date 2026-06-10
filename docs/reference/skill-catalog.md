# Skill Catalog

Approved reusable Morpheus skills live in `.agents/skills/<skill-name>/SKILL.md`. Skills are grouped by the module that contributes them, but the skill bodies are not duplicated under module folders.

Setup and workflow orchestration happen from agent chat.

## Core

| Skill | Description |
|---|---|
| [constitution-author](../../.agents/skills/constitution-author/SKILL.md) | Author project-level constitutions. |
| [decomposer](../../.agents/skills/decomposer/SKILL.md) | Break plans into task and overlap artifacts. |
| [evaluator](../../.agents/skills/evaluator/SKILL.md) | Evaluate merged work and capture lessons. |
| [fixer](../../.agents/skills/fixer/SKILL.md) | Diagnose and repair focused failures. |
| [initializer](../../.agents/skills/initializer/SKILL.md) | Initialize worktrees or task execution surfaces. |
| [integrator](../../.agents/skills/integrator/SKILL.md) | Integrate task work safely. |
| [lore-curator](../../.agents/skills/lore-curator/SKILL.md) | Curate project lore. |
| [lore-reader](../../.agents/skills/lore-reader/SKILL.md) | Read project lore. |
| [planner](../../.agents/skills/planner/SKILL.md) | Build technical plans from specs. |
| [reviewer](../../.agents/skills/reviewer/SKILL.md) | Review changes against project law and artifacts. |
| [spec-author](../../.agents/skills/spec-author/SKILL.md) | Turn requirements into structured specs. |

## Workspace Companion

| Skill | Description |
|---|---|
| [chat-setup](../../.agents/skills/chat-setup/SKILL.md) | Orchestrate repo-first Morpheus setup from agent chat. |

## GitHub

| Skill | Description |
|---|---|
| [agent-git-operator](../../.agents/skills/agent-git-operator/SKILL.md) | Standardize agent-run branch, commit, push, and PR prep. |
| [branch-naming](../../.agents/skills/branch-naming/SKILL.md) | Define branch naming policy. |
| [conventional-commits](../../.agents/skills/conventional-commits/SKILL.md) | Define commit and PR title grammar. |
| [jira-linked-branching](../../.agents/skills/jira-linked-branching/SKILL.md) | Enforce Jira-linked branch and PR naming. |
| [pull-request-workflow](../../.agents/skills/pull-request-workflow/SKILL.md) | Produce consistent GitHub PR titles and bodies. |

## Local Launch

| Skill | Description |
|---|---|
| [local-launch](../../.agents/skills/local-launch/SKILL.md) | Generate OS-aware local launch tasks and auth/env guidance. |

## Jira

| Skill | Description |
|---|---|
| [ticket-syncer-jira](../../.agents/skills/ticket-syncer-jira/SKILL.md) | Synchronize work with Jira tickets. |

## Stack Skills

| Module | Skills |
|---|---|
| [stack-node](../../modules/stacks/stack-node/module.yaml) | `coding-agent-node`, `tester-node` |
| [stack-python](../../modules/stacks/stack-python/module.yaml) | `coding-agent-python`, `tester-python` |
| [stack-react](../../modules/stacks/stack-react/module.yaml) | `coding-agent-react`, `tester-react` |
