# Morpheus

Morpheus is a repo-first companion system for agentic software development. It lives in the same VS Code workspace as product repositories and provides shared modules, skills, templates, governance artifacts, and promotion gates that agents can use from chat.

## Direction

Morpheus is no longer centered on a command-line setup flow. Setup is orchestrated from the agent chat window using a copyable prompt, with deterministic helper scripts and repository validation where useful.

The intended workspace output is:

```text
<project-slug>.code-workspace
  folders:
    morpheus/
    <product-repo-1>/
    <product-repo-2>/
```

The `morpheus/` workspace folder is the source of truth for generated discovery, governance, feature, and workflow artifacts. Product repositories keep their own source code and any existing agent assets.

## Current Modules

- `core` — universal schemas, templates, and governance for approved agent workflows.
- `workspace-companion` — chat-orchestrated workspace setup, project config, env examples, `START_HERE.md`, and local incubation.
- `git-github` — standardized branch, commit, PR, CODEOWNERS, branch protection, and Jira-linked GitHub checks.
- `local-launch` — OS-aware local launch tasks and local auth/env guidance for macOS and Windows.
- `pm-jira` — Jira integration assets.
- `stack-node`, `stack-python`, `stack-react` — optional stack guidance.
- `workspace-microsoft`, `workspace-google` — optional notification/collaboration adapters.
- `domain-healthcare` — example domain module.

Unready inherited skills are preserved under `incubator/candidate-skills/` until they are reviewed and promoted.

## Chat Setup Prompt

Use the prompt in [docs/getting-started.md](docs/getting-started.md) to set up Morpheus from the agent chat window. The agent asks baseline questions, creates or verifies the workspace folders, preserves existing product-repo agent assets, generates project config and environment examples, and validates the result.

## Local Testing

Run repository validation with:

```bash
npm test
```

This validates module manifests and contributed files. It does not build or run a CLI.

## Repository Layout

```text
modules/       Optional Morpheus modules and contributed skills/templates/workflows.
.agents/      Approved reusable Morpheus skills surfaced to VS Code and agents.
incubator/    Candidate skills/modules that are preserved but not setup-ready.
templates/     Shared project and overlay templates retained for module assets.
docs/          Repo-first setup and module documentation.
examples/      Example outputs and regression snapshots.
tests/         Module manifest and contributed-file validation.
```

Approved reusable skills live in `.agents/skills/<skill-name>/SKILL.md`. Module manifests declare which approved skills they contribute; the skill bodies do not live under `modules/*/skills`.

## Secrets

Morpheus never asks users to paste secrets into chat. Modules generate `.env.example` files, and users fill `.env` locally. `.env` files must remain ignored.
