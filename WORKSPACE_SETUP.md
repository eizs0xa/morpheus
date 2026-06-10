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
- Product repo URLs or existing local product repo folders as a comma-separated list.
- The branch to use for each product repo. The agent should show the top five most recently touched branches for each repo and allow a custom branch.
- Jira project key, Jira server URL, Jira user email, and Jira API token if you want the agent to create `.env` during setup. The Jira server URL is stored as `JIRA_SERVER` for compatibility with Jira tooling. If you do not want to provide those in chat, say `skip` and fill `.env` locally from `.env.example`.

## Recommended Setup Prompt

Copy this prompt into the agent chat window:

```text
Set up Morpheus for this existing project using the repo-first companion model.

Intent:
- The setup output should be a VS Code workspace containing a sibling repo named `morpheus` plus the product repos.
- Use the central repo `https://github.com/mckesson/morpheus.git` as the Morpheus source.
- Ask me setup questions in chat using concise prompts/options.
- Do not use a CLI setup wizard.
- Do not require secrets in chat. If I provide Jira values in chat, write them only to `morpheus/.env` and do not print the API token back to me.
- Preserve existing product-repo agent assets such as `agent.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and existing `SKILL.md` files. Discover and reference them; do not overwrite them.

Setup goals:
1. Identify or create the VS Code workspace file and the repo folders it references.
2. Clone or verify the `morpheus` companion repo as a workspace folder.
3. Clone or verify the product repos as workspace folders.
4. Generate `<project-slug>.code-workspace` with `morpheus` and all product repos.
5. For each product repo, show the top five most recently touched branches and ask me to choose one or enter a custom branch.
6. Check out the selected branch in each product repo.
7. Generate `morpheus/project.config.json` from my answers, selected branches, and detected repo facts.
8. Generate `morpheus/.env.example` for enabled workflows, especially Jira if selected.
9. If I provide Jira project key, server URL, user email, and API token in chat, create `morpheus/.env` with `JIRA_PROJECT_KEY`, `JIRA_SERVER`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`, and do not print the token.
10. Ensure `morpheus/.env` is gitignored.
11. Create `morpheus/local/README.md` and local staging folders if they are missing.
12. Generate `morpheus/START_HERE.md` with setup status and the next recommended action.
13. Detect existing agent instructions and skills in product repos and summarize what was found.
14. Validate that the workspace JSON parses, config files exist, `.env` is ignored, selected branches are checked out, and no product repo agent files were overwritten.

Ask me only these baseline setup questions first:
1. Project name and short slug?
2. Product repo URLs or existing local folder names as a comma-separated list?
3. For each repo, which branch should be used? Show me the top five most recently touched branches and let me choose or enter a custom branch.
4. Setup preset: DAAA standard, Discovery only, or Custom?
5. If Jira is enabled, provide Jira project key, Jira server URL, Jira user email, and Jira API token, or say `skip` to create `.env.example` only. Store the server URL as `JIRA_SERVER` in `.env`.
6. Should Morpheus run initiation after setup, or stop after workspace setup?

Recommended default setup:
- Use Morpheus initiation for project discovery, index, and constitution. Do not create a blank first feature during initiation.
- Use PRD-to-Jira if this project will create Jira-ready feature work.
- Use GitHub workflow skills for branch, commit, and PR consistency.
- Use local-launch only if the project needs OS-aware local startup help.

After I answer, proceed with setup. If I skip Jira secrets, generate `.env.example` and tell me which variables to fill locally. If I provide Jira values, create `.env` and do not echo the API token. If any step is blocked by permissions or missing access, stop with a clear recovery step and leave setup resumable.
```

## Setup Presets

- **DAAA standard** - Sets up Morpheus initiation, PRD-to-Jira workflow references, GitHub workflow guidance, and local launch guidance. Use this for most active project work.
- **Discovery only** - Sets up workspace structure and project understanding only. Use this when a team wants to inspect and document a project before adopting the PRD-to-Jira workflow.
- **Custom** - The agent explains available workflow areas and asks which to include. Use this when the project has unusual constraints.

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
