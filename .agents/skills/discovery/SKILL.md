---
name: discovery
description: "Use when bootstrapping or refreshing project understanding. Produces initiative-level inventory, intent map, architecture map, and conflicts report without assuming a specific stack."
argument-hint: "<workspace-or-project-slug>"
inputs:
  - "workspace: VS Code workspace containing morpheus and product repos"
  - "project_config: project.config.json when present"
  - "target_repos: optional comma-separated repo folder names"
outputs:
  - "initiative/discovery/inventory.md"
  - "initiative/discovery/intent-map.md"
  - "initiative/discovery/architecture-map.md"
  - "initiative/conflicts-report.md"
  - "initiative/changelog.md update"
---

# discovery

## Purpose

Build the first reliable project map for a Morpheus workspace. Discovery is the broad read-only sweep that later skills consume. It should reduce repeated repo exploration, surface ambiguity early, and record conflicts rather than silently choosing a project rule.

Discovery is project-agnostic. It must not assume Flask, React, Okta, Azure, Jira, GitHub, or any fixed repo name. It discovers what exists in the current workspace and writes that down.

## When To Use

- First setup of Morpheus for an existing project.
- After a major repo restructure, repo rename, framework change, or auth/data architecture change.
- When agents are repeatedly missing project context.
- Before generating or amending the project constitution.

## Procedure

### Phase 1 - Workspace And Repo Inventory

Identify every workspace folder and classify each one.

For each repo, collect:

- repo name and path
- remote URL and active branch
- likely role, such as backend, frontend, data, infra, docs, shared library, or unknown
- primary languages and package managers
- framework markers from package/config files
- build, test, lint, and start commands if documented
- env examples and variable names, never values
- CI workflows and branch/PR requirements
- existing agent assets:
  - `agent.md`
  - `AGENTS.md`
  - `.github/copilot-instructions.md`
  - `.github/instructions/*.instructions.md`
  - `**/SKILL.md`

Write this to `initiative/discovery/inventory.md`.

### Phase 2 - Intent Map

Read existing human and agent guidance from every product repo. For each file, record:

- path
- scope or applyTo pattern when present
- one or two sentence intent summary
- hard rules that use MUST, NEVER, REQUIRED, or equivalent language
- soft conventions that use SHOULD, PREFER, or equivalent language
- lessons learned or changelog anchors
- whether the file appears project-specific or potentially reusable

Write this to `initiative/discovery/intent-map.md`.

### Phase 3 - Architecture Map

Build an architecture map from evidence, not assumptions. Select only the sections that apply to the workspace.

Possible sections:

1. Runtime and entry points.
   - Backend services, frontend apps, workers, CLIs, scheduled jobs, libraries, or docs-only repos.
2. Route, handler, or interface map.
   - For web services, map routes/controllers/handlers to services and data stores.
   - For frontend apps, map routes/pages/components to API clients or backend endpoints.
   - For data/worker repos, map jobs, pipelines, queues, inputs, outputs, and persistence.
3. Data and persistence surface.
   - DB schemas, migrations, object stores, search indexes, caches, queues, files, or external systems.
4. Auth and access-control surface.
   - Discover auth providers, middleware/decorators/guards, role checks, permission maps, token handling, and local auth modes from actual files.
   - Do not assume any path such as `app/services/okta_auth.py`; record whatever the project actually uses.
5. External integrations.
   - Jira, GitHub, third-party APIs, cloud services, MCP servers, email/chat, observability, deployment.
6. Test and release surface.
   - Unit, integration, E2E, security, quality gates, release workflows, deployment evidence.

Write this to `initiative/discovery/architecture-map.md`.

### Phase 4 - Conflict Detection

Compare findings across repos and docs. Record conflicts in `initiative/conflicts-report.md`.

Flag:

- naming drift for the same concept
- duplicate rules with different wording
- contradictions between repo-level instructions
- stale paths or missing referenced files
- unsafe or unclear local auth guidance
- undocumented env variables
- unclear ownership between repos
- unready skills that should remain in `incubator/`

Severity:

- `major` blocks reliable downstream output
- `minor` downstream can proceed if the risk is called out
- `info` cosmetic or cleanup only

### Phase 5 - Handoff

End each discovery artifact with a short handoff note:

- what was scanned
- what was not scanned
- unresolved conflicts
- recommended next skill, usually `index`

Update `initiative/changelog.md` or create it if missing.

## Output Quality Bar

Discovery is complete only when:

- all target repos are listed
- existing product-repo agent assets are listed
- no secret values are written
- stack-specific sections are evidence-based
- conflicts are surfaced explicitly
- downstream `index` and `constitution` can run without rescanning everything

## Stop Lines

- Do not modify product repos.
- Do not invent architecture.
- Do not paste full source files into discovery docs.
- Do not record secret values.
- Do not assume project-specific paths or frameworks.
