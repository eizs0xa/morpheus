---
name: chat-setup
version: 0.1.0
tier: integration
description: Orchestrate repo-first Morpheus setup from agent chat by asking baseline questions, creating a workspace file, preserving existing agent assets, and generating project config.
when_to_use: |
  - A user wants to set up Morpheus for an existing project from the agent chat window.
  - A workspace should contain Morpheus plus one or more product repositories.
  - Existing product repos may already have AGENTS, agent.md, instructions, or SKILL.md files.
when_not_to_use: |
  - The user wants a script-only setup flow with no agent orchestration.
  - The user wants to paste secrets into chat.
inputs:
  - project_name: string
  - project_slug: string
  - product_repos: list
  - setup_preset: string
outputs:
  - <project-slug>.code-workspace
  - morpheus/project.config.json
  - morpheus/.env.example
  - morpheus/START_HERE.md
  - morpheus/.morpheus-local/README.md
---

# chat-setup

## Copy prompt

```text
Set up Morpheus for this existing project using the repo-first companion model.

Ask me the five baseline setup questions in chat. Do not ask for secrets. Create a VS Code workspace containing the `morpheus` companion repo and all product repos as workspace folders. Preserve existing product-repo agent assets and summarize what you found. Generate project config, .env.example, START_HERE.md, and .morpheus-local. Validate setup before finishing.
```

## Baseline questions

1. Project name and short slug?
2. Product repo URLs or existing local folder names?
3. Setup preset: `DAAA standard`, `DAAA regulated`, `Discovery only`, or `Custom`?
4. If Jira is enabled, what is the Jira project key and safe non-secret Jira server URL?
5. Should Morpheus run initiation after setup, or stop after workspace setup?

## Procedure

1. Resolve the workspace output: `<project-slug>.code-workspace` containing `morpheus` and the product repos as folders.
2. Clone or verify `morpheus` from the central repo and each product repo from the supplied URLs or local paths.
3. Create or reuse `project/<project-slug>` inside `morpheus`.
4. Generate the workspace file using relative paths.
5. Generate `project.config.json` from user answers and detected repo facts.
6. Generate `.env.example`; never create or print real secret values.
7. Ensure `.env` and local-only staging content are ignored.
8. Create `.morpheus-local/README.md` plus staging folders.
9. Detect `agent.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and `**/SKILL.md` in product repos.
10. Generate `START_HERE.md` with setup status, detected assets, and next action.
11. Validate workspace JSON, config JSON, ignored env files, and preservation of product repo agent assets.

## Stop lines

- Do not overwrite product repo agent files.
- Do not ask for secrets in chat.
- Do not frame the setup output as a local folder; frame it as the workspace.
- Do not proceed past a clone/auth failure without a clear recovery step.
