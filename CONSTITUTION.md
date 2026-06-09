# Morpheus Platform Constitution

This document governs the Morpheus platform repo. Project-level constitutions are generated or maintained in adopting Morpheus companion workspaces.

## 1. Platform Purpose

Morpheus provides reusable modules, skills, templates, and governance practices for agentic development. It is repo-first and chat-orchestrated: agents guide setup from chat and write inspectable files into a workspace.

## 2. Workspace Model

Every adopting project should produce a VS Code workspace with `morpheus` plus product repos as workspace folders:

```text
<project-slug>.code-workspace
  folders:
    morpheus/
    <product-repo-1>/
    <product-repo-2>/
```

The `morpheus/` workspace folder is the source of truth for discovery, governance, feature artifacts, installed skills, local incubation, and promotion packages. Product repositories keep their source code and existing agent assets.

## 3. Setup Model

Setup is orchestrated from agent chat. A user pastes a setup prompt, answers concise questions, and the agent creates or updates the workspace artifacts. Deterministic helper scripts are allowed for validation, generation, scans, and repeatable checks, but user-facing setup must not require a CLI wizard.

## 4. Module Contract

Every module ships a `module.yaml` declaring:

- `name`, `version`, and `description`
- `requires`
- `incompatible_with`
- `contributes` for skills, workflows, templates, schemas, hooks, and instructions
- optional prompts and detection markers

Modules should be descriptive and optional where possible. Core should stay small.

## 5. Initial Module Families

- `core` — universal schemas, templates, and core skills.
- `workspace-companion` — chat setup, project config, env examples, workspace files, local incubation.
- `morpheus-initiation` — discovery, index, constitution, orient.
- `prd-to-jira` — PRD, TDS, SDD, change management, Jira payloads, sprint sequencing.
- `git-github` — standardized branch, commit, PR, and GitHub Actions practices.
- `local-launch` — OS-aware local launch and auth/env setup.
- `geodesic-audit` — optional local audit, gap report, PII/PHI scrub, and attestation integration.

Some families may not exist yet. New modules should be introduced through the contribution and promotion process.

## 6. Preservation Rules

Morpheus must preserve product-repo agent assets during setup:

- `agent.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- existing `SKILL.md` files

Setup may discover, summarize, and reference these files. It must not overwrite or promote them automatically.

## 7. Secrets

Morpheus never asks users to paste secrets into chat. Modules may generate `.env.example`; users fill `.env` locally. `.env` and local secret files must remain ignored.

## 8. Promotion

New reusable skills and modules flow through local incubation before promotion:

```text
.morpheus-local experiment -> contribution package -> incubator -> module-owner review -> promoted module
```

Promotion requires evidence, agnostic review, security review, and module-owner approval.

## 9. GitHub And Work Item Linkage

GitHub modules should standardize branch, commit, and PR behavior across repos. When a project uses Jira, branch names and PR titles should include the Jira issue key so GitHub Actions and reviewers can trace changes to work items.

## 10. Local Launch

Local launch modules should make testing easy across macOS and Windows without weakening production auth. Auth bypass or mock auth must be local-only, explicit, and never committed with secrets.

## 11. Versioning

Morpheus modules follow semantic versioning. Breaking changes to module surfaces, schemas, generated file paths, or promotion gates require migration notes and changelog entries.

## 12. Stop Lines

- Do not reintroduce CLI-centered setup as the primary user workflow.
- Do not collect secrets in chat.
- Do not overwrite product-repo agent assets during setup.
- Do not make project-specific assumptions core behavior.
- Do not promote local skills without evidence and agnostic review.
- Do not bypass GitHub branch, PR-title, or work-item linkage gates.
