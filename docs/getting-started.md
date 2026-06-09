# Getting Started

Morpheus setup is orchestrated from the agent chat window. The output is a VS Code workspace containing `morpheus` and the project repositories as workspace folders.

## Copy Prompt

Paste this into the agent chat window to start setup:

```text
Set up Morpheus for this existing project using the repo-first companion model.

Intent:
- The setup output should be a VS Code workspace containing a sibling repo named `morpheus` plus the product repos.
- The repos may be placed in one local directory for relative paths, but frame the deliverable as the workspace, not as that local directory.
- Use the central repo `https://github.com/McKesson/morpheus.git` as the source.
- Use Option A: `main` contains reusable Morpheus modules, and this project should use a project branch named `project/<project-slug>`.
- Do not use a CLI setup wizard. Orchestrate setup from this chat.
- Ask me the setup questions in chat using concise prompts/options.
- Do not ask me to paste secrets, tokens, API keys, passwords, or private credentials into chat.
- Preserve existing product-repo agent assets such as `agent.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and existing `SKILL.md` files. Discover and reference them; do not overwrite them.

Setup goals:
1. Identify or create the VS Code workspace file and the sibling repo folders it references.
2. Clone or verify the `morpheus` companion repo as a workspace folder.
3. Clone or verify the product repos as workspace folders.
4. Create or checkout `project/<project-slug>` in `morpheus`.
5. Generate `<project-slug>.code-workspace` with `morpheus` and all product repos.
6. Generate `morpheus/project.config.json` from my answers and detected repo facts.
7. Generate `morpheus/.env.example` for enabled modules, especially Jira if selected.
8. Ensure `morpheus/.env` is gitignored and never printed.
9. Create `morpheus/.morpheus-local/README.md` and local staging folders.
10. Generate `morpheus/START_HERE.md` with setup status and the next recommended action.
11. Detect existing agent instructions and skills in product repos and summarize what was found.
12. Validate that the workspace JSON parses, config files exist, `.env` is ignored, and no product repo agent files were overwritten.

Recommended default modules:
- workspace-companion
- morpheus-initiation
- prd-to-jira
- contribution-incubator

Optional module:
- geodesic-audit, if the project may involve sensitive data or if I request audit/gap-report support.

Ask me only these baseline setup questions first:
1. Project name and short slug?
2. Product repo URLs or existing local folder names?
3. Which setup preset: DAAA standard, DAAA regulated, Discovery only, or Custom?
4. If Jira is enabled, what is the Jira project key and safe non-secret Jira server URL?
5. Should Morpheus run initiation after setup, or stop after workspace setup?

After I answer, proceed with setup. If you encounter a missing secret, generate `.env.example` and tell me which variable to fill locally, but do not ask for the value in chat. If any step is blocked by permissions or missing access, stop with a clear recovery step and leave setup resumable.
```

## Setup Presets

| Preset | Modules |
|---|---|
| DAAA standard | `workspace-companion`, `morpheus-initiation`, `prd-to-jira`, `contribution-incubator` |
| DAAA regulated | DAAA standard plus `geodesic-audit` |
| Discovery only | `workspace-companion`, `morpheus-initiation` |
| Custom | Agent presents module descriptions and lets the user choose |

## Expected Workspace

```text
<project-slug>.code-workspace
  folders:
    morpheus/
      project.config.json
      .env.example
      START_HERE.md
      .morpheus-local/
    <product-repo-1>/
    <product-repo-2>/
```

## Validation

After setup, the agent validates:

- workspace JSON parses
- `project.config.json` exists and is valid JSON
- `.env.example` exists for enabled modules
- `.env` is ignored
- `.morpheus-local/README.md` exists
- product repo agent assets were not overwritten
- project branch is correct
