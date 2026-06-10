---
name: index
description: "Use after discovery to create initiative/repo-index.md, a concise navigation map for agents and humans entering the workspace cold."
inputs:
  - "initiative/discovery/inventory.md"
  - "initiative/discovery/intent-map.md"
  - "initiative/discovery/architecture-map.md"
  - "initiative/conflicts-report.md"
outputs:
  - "initiative/repo-index.md"
---

# index

## Purpose

The repo index is the workspace table of contents. It answers where to look before an agent starts implementation, documentation, Jira, release, or review work.

The index points to source-of-truth locations; it does not restate every rule. Rules belong in `initiative/constitution.md` or repo-owned instruction files.

## When To Use

- After `discovery` completes.
- After adding/removing repos from the workspace.
- After a major restructuring that changes where things live.
- When agents keep searching for the same files repeatedly.

## Procedure

### Step 1 - Validate Inputs

Refuse to run if these are missing:

- `initiative/discovery/inventory.md`
- `initiative/discovery/intent-map.md`
- `initiative/discovery/architecture-map.md`

If `initiative/conflicts-report.md` is missing, create an empty one or note that no conflicts have been recorded yet.

### Step 2 - Write Project At A Glance

Create five to ten bullets covering:

- project/initiative name
- workspace folders and repo roles
- primary languages/frameworks discovered
- default branches or active setup branches
- current setup status
- key workflow modules in use
- where local env/config lives
- whether unresolved conflicts exist

### Step 3 - Build Where-To-Look Table

Create a table for common questions:

| Question | Go to | Notes |
|---|---|---|
| Where are product repo agent rules? | discovered paths | preserve product ownership |
| Where is project law? | `initiative/constitution.md` | generated from evidence |
| Where are feature docs? | `features/<feature-slug>/` | PRD/TDS/SDD/Jira/test plan |
| Where are release docs? | `releases/<release>/` | release notes/readiness/change management |
| Where are local experiments? | `local/` | ignored except README |
| Where are candidate skills? | `incubator/candidate-skills/` | not approved yet |

Add project-specific rows based on discovery, such as auth, API routes, UI routes, data models, tests, deployment, observability, docs, and local launch.

### Step 4 - Stable Anchors

List stable anchors by repo and file:

- repo instruction files
- architecture docs
- testing docs
- security docs
- generated Morpheus docs
- active feature docs
- release docs

Use heading names when available.

### Step 5 - Glossary And Drift

Create a concise glossary of cross-repo terms and naming drift. Link each drift item to `initiative/conflicts-report.md` when needed.

### Step 6 - Out Of Scope

State what the index does not contain:

- full requirements
- detailed implementation tasks
- release decisions
- secret values
- copied source code

## Output Quality Bar

- Keep it short enough to read at session start.
- Prefer tables and links over prose.
- Do not duplicate the constitution.
- Do not include secret values.
- Do not hide unresolved conflicts.
