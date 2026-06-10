# Morpheus Workspace Setup

Use this guide to set up Morpheus for an existing project workspace.

The setup output is a VS Code workspace containing:

```text
<project-slug>.code-workspace
  folders:
    morpheus/
    <product-repo-1>/
    <product-repo-2>/
```

Morpheus setup is orchestrated from the agent chat window. It is not a CLI-first setup.

## What You Need

- Access to the central Morpheus repo.
- Product repo URLs or existing local product repo folders.
- A safe non-secret Jira server URL and Jira project key if the project uses Jira.
- Do not paste secrets into chat. The agent should generate `.env.example`; you fill local `.env` yourself.

## Recommended Setup Prompt

Copy this prompt into the agent chat window:

```text
Set up Morpheus for this existing project using the repo-first companion model.

Intent:
- The setup output should be a VS Code workspace containing a sibling repo named `morpheus` plus the product repos.
- Use the central repo `https://github.com/mckesson/morpheus.git` as the Morpheus source.
- Ask me setup questions in chat using concise prompts/options.
- Do not use a CLI setup wizard.
- Do not ask me to paste secrets, tokens, API keys, passwords, or private credentials into chat.
- Preserve existing product-repo agent assets such as `agent.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and existing `SKILL.md` files. Discover and reference them; do not overwrite them.

Setup goals:
1. Identify or create the VS Code workspace file and the repo folders it references.
2. Clone or verify the `morpheus` companion repo as a workspace folder.
3. Clone or verify the product repos as workspace folders.
4. Generate `<project-slug>.code-workspace` with `morpheus` and all product repos.
5. Generate `morpheus/project.config.json` from my answers and detected repo facts.
6. Generate `morpheus/.env.example` for enabled workflows, especially Jira if selected.
7. Ensure `morpheus/.env` is gitignored and never printed.
8. Create `morpheus/local/README.md` and local staging folders if they are missing.
9. Generate `morpheus/START_HERE.md` with setup status and the next recommended action.
10. Detect existing agent instructions and skills in product repos and summarize what was found.
11. Validate that the workspace JSON parses, config files exist, `.env` is ignored, and no product repo agent files were overwritten.

Ask me only these baseline setup questions first:
1. Project name and short slug?
2. Product repo URLs or existing local folder names?
3. Setup preset: DAAA standard, Discovery only, or Custom?
4. If Jira is enabled, what is the Jira project key and safe non-secret Jira server URL?
5. Should Morpheus run initiation after setup, or stop after workspace setup?

Recommended default setup:
- Use Morpheus initiation for project discovery, index, constitution, and first feature orientation.
- Use PRD-to-Jira if this project will create Jira-ready feature work.
- Use GitHub workflow skills for branch, commit, and PR consistency.
- Use local-launch only if the project needs OS-aware local startup help.

After I answer, proceed with setup. If you encounter a missing secret, generate `.env.example` and tell me which variable to fill locally, but do not ask for the value in chat. If any step is blocked by permissions or missing access, stop with a clear recovery step and leave setup resumable.
```

## What The Agent Should Create

```text
morpheus/
  README.md
  START_HERE.md
  WORKSPACE_SETUP.md
  project.config.json
  .env.example
  core/
  initiative/
  features/
  releases/
  modules/
  .agents/
  incubator/
  local/
```

The project workspace file should sit beside the workspace folders and include `morpheus` plus the product repos.

## Setup Rules

- Preserve product-repo agent assets.
- Do not write secrets.
- Keep generated project-level docs under `initiative/`.
- Keep feature/epic docs under `features/`.
- Keep release docs under `releases/`.
- Keep approved shared skills under `.agents/skills/`.
- Keep experiments under `local/` first, then `incubator/` when ready for review.

## After Setup

1. Open `START_HERE.md`.
2. Review `project.config.json`.
3. Fill `.env` locally from `.env.example` if needed.
4. Run Morpheus initiation from agent chat when ready.
