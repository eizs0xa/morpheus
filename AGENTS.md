# Morpheus Agent Guide

This is the Morpheus platform repo. It is repo-first and chat-orchestrated. Do not reintroduce CLI-centered setup flows.

## Repo Layout

| Path | What lives here |
|---|---|
| `modules/` | Optional Morpheus modules: core, integrations, stacks, workspaces, domains. |
| `templates/` | Shared templates used by modules. |
| `docs/` | Repo-first setup, module, and contributor documentation. |
| `examples/` | Example outputs and regression snapshots. |
| `tests/` | Module manifest and contributed-file validation. |

## Build And Test

```bash
npm test
```

## Rules Of Engagement

- Preserve product-repo agent assets. Morpheus discovers and references existing `agent.md`, `AGENTS.md`, Copilot instructions, and `SKILL.md` files; it does not overwrite them during setup.
- Keep setup chat-first. A user should paste one setup prompt into agent chat and answer concise questions there.
- Keep generated artifacts inspectable: workspace files, `project.config.json`, `.env.example`, `START_HERE.md`, discovery docs, governance docs, and feature docs.
- Do not ask users to paste secrets into chat.
- When adding a module, update [docs/reference/module-catalog.md](docs/reference/module-catalog.md) and [docs/reference/skill-catalog.md](docs/reference/skill-catalog.md).
- When moving, renaming, or deleting files, update all references in docs, module manifests, templates, tests, and workflows.

## What Agents Must Not Do

- Do not add CLI setup commands or CLI-only workflows.
- Do not stage or commit `.env` files or secrets.
- Do not overwrite product-repo `agent.md`, `AGENTS.md`, Copilot instructions, or existing `SKILL.md` files.
- Do not bypass GitHub branch, PR-title, or Jira-key checks.
