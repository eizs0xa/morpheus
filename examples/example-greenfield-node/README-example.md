# example-greenfield-node

A pre-rendered output of the Morpheus `new-project` template.

## Config

| Knob          | Value                |
| ------------- | -------------------- |
| profile       | `builder`            |
| stacks        | `stack-node`         |
| workspace     | `workspace-microsoft`|
| pm            | `pm-jira`            |
| git           | `git-github`         |
| project_name  | `example-greenfield-node` |

## Reproduce

From the morpheus repo root:

```bash
rm -rf /tmp/example && mkdir -p /tmp/example && cd /tmp/example
MORPHEUS_PLATFORM_ROOT=/path/to/morpheus \
MORPHEUS_PROFILE=builder \
MORPHEUS_PROJECT_NAME=example-greenfield-node \
MORPHEUS_PROJECT_DESCRIPTION="Example greenfield node" \
MORPHEUS_PRIMARY_OWNER_EMAIL=example@morpheus.dev \
MORPHEUS_WORKSPACE=workspace-microsoft \
MORPHEUS_GIT=git-github \
MORPHEUS_PM=pm-jira \
MORPHEUS_JIRA_PROJECT_KEY=EXAMPLE \
MORPHEUS_STACKS=stack-node \
node /path/to/morpheus/cli/dist/index.js init --non-interactive
```

Equivalent direct `copier` invocation:

```bash
copier copy /path/to/morpheus/templates/new-project /tmp/example \
  -d project_name=example-greenfield-node \
  -d profile=builder \
  -d primary_owner_email=example@morpheus.dev \
  -d workspace=workspace-microsoft \
  -d git_provider=git-github \
  -d pm_tool=pm-jira \
  -d stacks=stack-node
```

## What it demonstrates

- Greenfield scaffold with a single stack
- Microsoft workspace notifier (`.agent/skills/notifier.md` normalized to the Microsoft variant)
- Jira MCP server wiring (`.agent/mcp-config.json` + jira workflows)
- Full builder scaffolding (`.github/workflows/agent-pr-gate*.yml`, merge-queue, release-train)
