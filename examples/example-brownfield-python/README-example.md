# example-brownfield-python

A pre-rendered output of the Morpheus `brownfield-overlay` template applied
on top of `tests/fixtures/brownfield-python/`.

## Config

| Knob          | Value                           |
| ------------- | ------------------------------- |
| profile       | `builder`                       |
| stacks        | `stack-python`                  |
| workspace     | `workspace-microsoft`           |
| pm            | `pm-jira`                       |
| git           | `git-github`                    |
| project_name  | `example-brownfield-python`     |

## Reproduce

```bash
# Start with a copy of the fixture
cp -R /path/to/morpheus/tests/fixtures/brownfield-python /tmp/example
cd /tmp/example

MORPHEUS_PLATFORM_ROOT=/path/to/morpheus \
MORPHEUS_PROFILE=builder \
MORPHEUS_PROJECT_NAME=example-brownfield-python \
MORPHEUS_PROJECT_DESCRIPTION="Brownfield python overlay" \
MORPHEUS_PRIMARY_OWNER_EMAIL=example@morpheus.dev \
MORPHEUS_WORKSPACE=workspace-microsoft \
MORPHEUS_GIT=git-github \
MORPHEUS_PM=pm-jira \
MORPHEUS_JIRA_PROJECT_KEY=EXAMPLE \
MORPHEUS_STACKS=stack-python \
node /path/to/morpheus/cli/dist/index.js init --non-interactive
```

## What it demonstrates

- Brownfield overlay onto a pre-existing Python project
- Pre-existing files (`pyproject.toml`, `src/app/__init__.py`,
  `tests/test_x.py`, `.github/workflows/existing-ci.yml`) are **byte-identical**
  to the fixture — the overlay never rewrote them
- `.agent/platform-manifest.json` is added alongside the originals
- The Morpheus-contributed workflows land in `.github/workflows/` next to
  `existing-ci.yml` without collision (they use `agent-pr-gate*.yml` names)
- The overlay's `.copier-answers.yml` records what was applied so future
  `agentic update` runs can diff against it
