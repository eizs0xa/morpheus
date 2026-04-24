# `new-project` — Morpheus top-level template

Creates a fresh project scaffolded with the Morpheus platform: constitution,
skills, schemas, feature templates, workflows, MCP configs, and a platform
manifest — all tuned to the profile, workspace, git provider, PM tool, and
stacks chosen interactively.

## Prerequisites

- Python 3.10+
- [copier](https://copier.readthedocs.io) 9.0.0 or later

```bash
pipx install copier
# or: pip install --user copier
```

## Render a new project

```bash
copier copy templates/new-project /path/to/my-new-project
```

Copier will prompt for required values and for conditional values
(Jira keys only if `pm_tool=pm-jira`, node version only if stacks include
`stack-node` or `stack-react`, etc.).

## Render non-interactively with an answers file

```yaml
# answers.yml
project_name: acme-widgets
project_description: Widget backend + dashboard
profile: builder
primary_owner_email: ada@example.com
workspace: workspace-microsoft
git_provider: git-github
pm_tool: pm-jira
stacks: [stack-node, stack-react]
hardware_os: darwin
release_cadence: weekly
jira_project_key: ACME
jira_site_url: acme.atlassian.net
initiative_key: ACME-1
teams_webhook_url: ""
primary_channel_id: ""
node_version: "20"
package_manager_node: pnpm
```

```bash
copier copy --data-file answers.yml --defaults --trust templates/new-project /tmp/acme-widgets
```

`--trust` is required because the template runs a post-generation task
(`scripts/apply-profile.py`) to prune files that do not apply to the chosen
profile and selections.

## Profiles

| Profile   | Scaffolding          | Output |
|-----------|----------------------|--------|
| builder   | full                 | Everything (constitution, skills, schemas, workflows, CODEOWNERS, PR template, feature-template, stack workflows, MCP configs, Jira bits). |
| verifier  | partial              | As builder but `coding-agent-*.md` skills are removed. |
| author    | prd_templates_only   | Minimal author kit: CLAUDE/AGENTS/copilot/manifest/constitution/profiles + prd template + spec-author/notifier/ticket-syncer skills. No workflows, no CODEOWNERS, no coding agents. |
| explorer  | none                 | Read-only: CLAUDE.md, AGENTS.md, platform-manifest.json, lore-reader skill. |
| steward   | full                 | Same as builder (all skills enabled, full authority). |

## What gets rendered

```
<target>/
├── .agent/
│   ├── constitution.md
│   ├── profiles.yaml
│   ├── platform-manifest.json
│   ├── mcp-config.json              (merged workspace + jira if selected)
│   ├── jira-transition-map.yaml     (pm-jira only)
│   ├── skills/                      (selected per profile & stacks)
│   ├── schemas/                     (JSON Schemas from core)
│   ├── templates/feature-template/  (prd/spec/plan/tasks stubs)
│   └── hooks/                       (per-stack pre-commit hooks)
├── CLAUDE.md
├── AGENTS.md
├── .github/
│   ├── copilot-instructions.md
│   ├── CODEOWNERS
│   ├── pull_request_template.md
│   ├── instructions/                (per-stack instruction files)
│   └── workflows/                   (core + per-stack + optional jira)
└── .copier-answers.yml              (so the project can re-run `copier update`)
```

## How profile conditional rendering works

Copier renders the full template into the target directory. Immediately after
rendering, copier runs `scripts/apply-profile.py` as a post-generation task.
The script:

1. Stamps `.agent/platform-manifest.json` with the current ISO-8601 timestamp.
2. Picks the right workspace notifier skill (`notifier-microsoft.md` or
   `notifier-google.md`) and renames it to `notifier.md`.
3. Merges the workspace MCP config and the Jira MCP config (if
   `pm_tool=pm-jira`) into a single `.agent/mcp-config.json`.
4. Removes stack files for stacks not in the `stacks` selection.
5. Removes Jira files if `pm_tool != pm-jira`.
6. Applies the profile allow-list:
   - `builder` / `steward` → no pruning
   - `verifier` → removes `coding-agent-*.md` skills
   - `author` → keeps only the author kit
   - `explorer` → keeps only CLAUDE, AGENTS, manifest, lore-reader
7. Cleans up any empty directories left behind.

The script is idempotent; running it twice yields the same tree.

## Platform version

This template renders projects at **platform v0.1.0**. Modules are pinned at
`0.1.0` in the manifest.
