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
  - The user wants setup to modify product repositories without review.
inputs:
  - "project_name: string"
  - "project_slug: string"
  - "product_repos: comma-separated repo URLs or local folder names"
  - "repo_branches: branch choice per repo"
  - "setup_preset: string"
  - "jira_values: optional Jira project key, server URL, user email, API token"
outputs:
  - <project-slug>.code-workspace
  - morpheus/project.config.json
  - morpheus/.env.example
  - morpheus/.env when the user provides Jira values in chat
  - morpheus/START_HERE.md
  - morpheus/.morpheus-local/README.md
---

# chat-setup

## Copy prompt

```text
Set up Morpheus for this existing project using the repo-first companion model.

Ask me the baseline setup questions in chat. Create a VS Code workspace containing the `morpheus` companion repo and all product repos as workspace folders. Preserve existing product-repo agent assets and summarize what you found. Ask for product repos as a comma-separated list. For each repo, show the five most recently touched branches and let me choose or enter a custom branch. Explain setup module options before asking me to choose. If Jira is enabled and I provide project key, server URL, user email, and API token in chat, create `morpheus/.env`; otherwise create `.env.example` and tell me what to fill locally. Validate setup before finishing.
```

## Baseline questions

1. Project name and short slug?
2. Product repo URLs or existing local folder names as a comma-separated list?
3. For each repo, which branch should be used? Present the top five most recently touched branches plus a custom option.
4. Setup preset: `DAAA standard`, `Discovery only`, or `Custom`?
5. If Jira is enabled, provide Jira project key, Jira server URL, Jira user email, and Jira API token, or say `skip` to create `.env.example` only. Store the server URL as `JIRA_SERVER` in `.env`.
6. Should Morpheus run initiation after setup, or stop after workspace setup?

## Procedure

1. Resolve the workspace output: `<project-slug>.code-workspace` containing `morpheus` and the product repos as folders.
2. Clone or verify `morpheus` from the central repo and each product repo from the supplied comma-separated URLs or local paths.
3. For each product repo, fetch branch metadata when possible and present the five most recently touched branches, plus `custom`.
4. Check out the selected branch in each product repo. If checkout fails, stop with a recovery step.
5. Generate the workspace file using relative paths.
6. Generate `project.config.json` from user answers, selected branches, and detected repo facts.
7. Generate `.env.example` for Jira when Jira is enabled.
8. If the user supplied Jira project key, server URL, user email, and API token in chat, create `morpheus/.env` with `JIRA_PROJECT_KEY`, `JIRA_SERVER`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`. Do not echo the token back in the final response.
9. Ensure `.env` and local-only staging content are ignored.
10. Create `local/README.md` plus staging folders.
11. Detect `agent.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and `**/SKILL.md` in product repos.
12. Generate `START_HERE.md` with setup status, detected assets, selected branches, and next action.
13. Validate workspace JSON, config JSON, ignored env files, selected branches, and preservation of product repo agent assets.

## Stop lines

- Do not overwrite product repo agent files.
- Do not require secrets in chat; if the user elects to provide Jira values in chat, write them only to `.env` and do not print the token.
- Do not frame the setup output as a local folder; frame it as the workspace.
- Do not proceed past a clone/auth failure without a clear recovery step.
- Do not create a blank first feature during initiation.
