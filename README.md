# Morpheus

Morpheus is a workspace companion for agentic development. It gives teams a simple, shared place to keep approved skills, project context, feature artifacts, release documentation, and reusable workflow knowledge.

Morpheus should grow from real project use. A workflow becomes part of Morpheus only after a team has used it, learned from it, and made it general enough for others.

## Start Here

If you are setting up Morpheus for a project, start with [WORKSPACE_SETUP.md](WORKSPACE_SETUP.md). It contains the copy/paste prompt to give the agent and the exact workspace setup expectations.

After setup, open the Morpheus workspace and read these in order:

1. `START_HERE.md` when present in an initialized project workspace.
2. `WORKSPACE_SETUP.md` if you need to understand or rerun setup.
3. `initiative/README.md` for project-level context.
4. `initiative/constitution.md` for project rules.
5. `features/README.md` for active feature work.
6. `releases/README.md` for release planning and change management.

## Folder Model

```text
morpheus/
  core/         approved shared standards, setup guidance, templates, governance
  initiative/   project-level context, discovery, constitution, decisions, docs
  features/     feature/epic-level PRD, TDS, SDD, Jira, tests, evidence
  releases/     release planning, notes, readiness, deployment, change management
  modules/      simple module descriptions and skill-sequence maps
  .agents/      approved skills surfaced to VS Code and agents
  incubator/    candidate skills/modules not yet approved
  local/        ignored local experiments and evidence
```

## Approved Skills

Approved skills live in:

```text
.agents/skills/<skill-name>/SKILL.md
```

Only setup-ready skills belong there. Skills that are useful but not yet fully wired live in:

```text
incubator/candidate-skills/<skill-name>/SKILL.md
```

## Current Approved Skill Areas

- Workspace setup from agent chat.
- GitHub branch, commit, and PR standardization.
- Jira-linked branch and PR naming.
- OS-aware local launch setup.
- Morpheus initiation sequence.
- PRD-to-Jira workflow sequence.

## What Morpheus Is Not

- Not a CLI-first tool.
- Not a pile of speculative modules.
- Not a replacement for product repositories.
- Not a place for secrets.
- Not a place to overwrite project-specific agent rules.

Morpheus is a shared operating layer that should remain understandable when a new teammate opens the workspace.