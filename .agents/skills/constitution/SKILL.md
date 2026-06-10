---
name: constitution
description: "Use after discovery and index to create or amend initiative/constitution.md from actual project evidence and unresolved conflicts."
inputs:
  - "initiative/repo-index.md"
  - "initiative/discovery/*"
  - "initiative/conflicts-report.md"
  - "product repo agent assets"
outputs:
  - "initiative/constitution.md"
---

# constitution

## Purpose

Create project law from actual project evidence. The constitution names the rules agents and humans must not violate while working in the workspace.

The constitution should be shorter than the discovery docs. It states rules and points to sources; it does not become a second copy of every repo instruction file.

## When To Use

- After discovery and index during project setup.
- When major project rules change.
- When conflicts are resolved and need to be recorded.
- Before running PRD-to-Jira work for the first time.

## Authoring Principles

- One rule per bullet.
- Use MUST or NEVER only for true stop lines.
- Prefer SHOULD or PREFER for conventions.
- Cite a source for each meaningful rule.
- Keep project-specific rules in the project constitution, not Morpheus Core.
- Surface unresolved conflicts rather than choosing silently.
- Do not add process steps that the project will not actually follow.

## Required Sections

### 1. Preamble And Scope

Explain what the constitution governs and what it does not govern.

### 2. Operating Discipline

Carry these rules forward when they match project expectations:

- state assumptions before editing
- choose the simplest scoped solution
- touch only work traceable to the task/artifact
- verify with explicit checks
- stop when ambiguity changes scope, behavior, security, or release impact

### 3. Workspace And Repo Ownership

List product repos, roles, owners if known, and which repo-owned agent files remain authoritative.

### 4. Stop Lines

Project-specific non-negotiables. Examples:

- no secrets in source
- no bypassing production auth
- no direct pushes to protected branches
- no schema/data change without migration evidence
- no feature implementation without PRD/TDS/SDD when the PRD-to-Jira workflow is in use

Only include rules supported by project evidence or explicit human decision.

### 5. Artifact Chain

State the project artifact chain. For the current Morpheus model this is usually:

```text
initiative discovery -> initiative constitution -> feature PRD -> feature TDS -> feature SDD -> Jira payload -> sprint sequencing -> test plan -> release docs
```

Make clear that `orient` creates feature folders only when a feature begins; initiation should not create a blank first feature automatically.

### 6. Implementation Standards

Reference repo-owned instruction files for:

- code style
- tests
- security
- local launch
- branch/commit/PR expectations
- release expectations

Do not copy large instruction files into the constitution.

### 7. Change Management

State how changes flow through initiative, feature, Jira, and release artifacts.

### 8. Unresolved Conflicts

Embed or link all major/minor unresolved conflicts from `initiative/conflicts-report.md`.

### 9. Changelog

Add a short entry every time the constitution is created or materially changed.

## Output Quality Bar

- Rules are testable or reviewable.
- External paths exist.
- No secret values are included.
- No unsupported stack assumptions are present.
- Unresolved conflicts are visible.

## Stop Lines

- Do not invent rules.
- Do not weaken repo-owned security or compliance rules.
- Do not hide conflicts.
- Do not create per-agent or persona-specific constitutions.
