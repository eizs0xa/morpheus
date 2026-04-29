# New-project walkthrough

> Step-by-step scaffold of a greenfield repo with the `builder` profile, Node + React stacks, Jira PM, and the Microsoft workspace. Includes a sample terminal transcript.

## When to use this flow

- The directory is empty (no `.git/`, no source).
- You have write access and intend to commit code.
- You know your primary stacks up front, or you want the detector to pick defaults.

## Prerequisites

See [getting-started.md](../getting-started.md#prerequisites). Plus:

- A Jira site URL and a project key (e.g. `PROJ`) if you want `pm-jira` wired.
- Environment variables for Jira credentials if you want the preflight to pass beyond the stub:

  ```bash
  export JIRA_EMAIL="you@company.atlassian.net"
  export JIRA_API_TOKEN="…"
  export MORPHEUS_JIRA_PROJECT_KEY="PROJ"
  export MORPHEUS_JIRA_SITE_URL="https://company.atlassian.net"
  ```

## Step 1 — Create the directory

```bash
mkdir my-service && cd my-service
```

## Step 2 — Run `morpheus invoke`

Interactive:

```bash
morpheus invoke
```

Non-interactive (scriptable, CI-friendly):

```bash
morpheus invoke \
  --non-interactive \
  --profile builder \
  --answers-file answers.yml
```

Example `answers.yml`:

```yaml
project_name: my-service
project_description: Customer-facing widget service
profile: builder
primary_owner_email: owner@company.atlassian.net
workspace: workspace-microsoft
git: git-github
pm: pm-jira
stacks:
  - stack-node
  - stack-react
jira_project_key: PROJ
jira_site_url: https://company.atlassian.net
release_cadence: weekly
node_version: "20"
package_manager_node: pnpm
```

## Step 3 — Sample transcript

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Morpheus agentic platform · init
  /Users/you/my-service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/5] Detecting project mode and stack
  · mode: new
  · hardware: darwin/arm64 (zsh)
  · project type: new-empty

[2/5] Resolving answers
  · profile: builder
  · workspace: workspace-microsoft
  · git: git-github
  · pm: pm-jira
  · stacks: stack-node, stack-react

[3/5] Composing modules
  · install order: core → stack-node → stack-react → workspace-microsoft → pm-jira → git-github
  ⚠ jira preflight (stubbed): warning. Full Jira preflight is stubbed until
    the module-to-CLI import path is finalized.

[4/5] Rendering new-project template
  ✓ templates rendered

[5/5] Writing platform manifest
  ✓ platform-manifest.json written (profile=builder)

Next steps:
  1. git init && git add -A && git commit -m "chore: morpheus init"
  2. Open .agent/constitution.md and fill the steward-authored sections.
  3. Connect the Jira MCP server using .agent/mcp-config.json.
  4. Run `agentic validate` to confirm a clean install.

✓ Morpheus init complete.
```

## Step 4 — Inspect the tree

```bash
tree -L 3 -a -I '.git'
```

Expected output (abbreviated):

```
.
├── .agent/
│   ├── constitution.md
│   ├── feature-template/
│   │   ├── plan.md.tmpl
│   │   ├── prd.md.tmpl
│   │   ├── spec.md.tmpl
│   │   └── tasks.json.tmpl
│   ├── mcp-config.json
│   ├── platform-manifest.json
│   └── schemas/
├── .github/
│   ├── CODEOWNERS
│   ├── pull_request_template.md
│   └── workflows/
│       ├── agent-pr-gate.yml
│       ├── agent-pr-gate-node.yml
│       ├── agent-pr-gate-react.yml
│       ├── jira-branch-check.yml
│       ├── jira-smart-commits.yml
│       └── merge-queue.yml
├── AGENTS.md
├── CLAUDE.md
├── copilot-instructions.md
└── platform-manifest.json
```

## Step 5 — Initial commit

```bash
git init
git add -A
git commit -m "chore: morpheus init"
```

## Step 6 — Validate

```bash
agentic validate
```

Expected: exit code `0`. If you see warnings, re-read the report — most are surfaced from missing optional env vars (e.g. Jira creds).

## Step 7 — First feature

Use the artifact chain starting from the `author` or `builder` flow:

```bash
agentic feature new --intent=prd PROJ-123    # (planned)
```

Until `agentic feature new` ships, create `.agent/features/<slug>/` manually from `.agent/feature-template/`.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `E_TEMPLATE: copier not found` | copier not installed or not on `PATH`. | `pipx install copier`, then re-run `morpheus invoke`. |
| `E_COMPOSE: exactly one workspace required` | Passed both `workspace-microsoft` and `workspace-google`. | Choose one. Composition rule §1.2. |
| `jira preflight (stubbed): warning` | Expected for v0.1.0 — the preflight is a stub. | Safe to proceed; track the stub in `cli/src/commands/_init/jira-preflight.ts`. |
| `agentic validate` exits `2` after init | A rendered file is missing from the template. | Open an issue with the manifest and the missing path. |

## Related docs

- [Brownfield walkthrough](brownfield-walkthrough.md)
- [Updating the platform](updating-the-platform.md)
- [CLI reference](../reference/cli-reference.md)
- [Module catalog](../reference/module-catalog.md)
