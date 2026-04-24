# example-monorepo-multi-stack

A pre-rendered output of the Morpheus `new-project` template with three stacks.

## Config

| Knob          | Value                                      |
| ------------- | ------------------------------------------ |
| profile       | `builder`                                  |
| stacks        | `stack-node`, `stack-python`, `stack-react`|
| workspace     | `workspace-microsoft`                      |
| pm            | `pm-jira`                                  |
| git           | `git-github`                               |
| project_name  | `example-monorepo-multi-stack`             |

## Reproduce

```bash
rm -rf /tmp/example && mkdir -p /tmp/example && cd /tmp/example
MORPHEUS_PLATFORM_ROOT=/path/to/morpheus \
MORPHEUS_PROFILE=builder \
MORPHEUS_PROJECT_NAME=example-monorepo-multi-stack \
MORPHEUS_PROJECT_DESCRIPTION="Multi-stack monorepo" \
MORPHEUS_PRIMARY_OWNER_EMAIL=example@morpheus.dev \
MORPHEUS_WORKSPACE=workspace-microsoft \
MORPHEUS_GIT=git-github \
MORPHEUS_PM=pm-jira \
MORPHEUS_JIRA_PROJECT_KEY=EXAMPLE \
MORPHEUS_STACKS=stack-node,stack-python,stack-react \
node /path/to/morpheus/cli/dist/index.js init --non-interactive
```

## What it demonstrates

- Multiple stacks composed together (note: per `apply-profile.py`, every
  stack contributes its own `.github/workflows/agent-pr-gate-<stack>.yml`,
  `.agent/skills/coding-agent-<stack>.md`, `.agent/skills/tester-<stack>.md`,
  `.github/instructions/<stack>.instructions.md`, and pre-commit hook)
- `.agent/skills/` contains the full builder skill set plus per-stack
  tester and coding-agent skills
- `.github/workflows/` contains the generic `agent-pr-gate.yml` **and** one
  per-stack variant
- Exercises the composition-ordering topological sort (`core` first, stacks
  next, workspace/pm/git after)
