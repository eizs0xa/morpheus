# Schemas

> Every JSON Schema Morpheus ships. Draft-07. Each schema owns one contract at the core of the platform.

All schemas live under [`../../modules/core/schemas/`](../../modules/core/schemas/). Every schema has:

- `$schema`: `http://json-schema.org/draft-07/schema#`
- `$id`: canonical identifier under `https://morpheus.dev/schemas/`
- `title`, `description`, and an `examples` array with at least one passing sample.

## Catalog

| Schema | Purpose |
|--------|---------|
| [platform-manifest.schema.json](../../modules/core/schemas/platform-manifest.schema.json) | Validates `platform-manifest.json` — the file every Morpheus-scaffolded project carries at its root (or under `.agent/`). |
| [module.schema.json](../../modules/core/schemas/module.schema.json) | Validates `module.yaml` for every module across the platform. |
| [profile.schema.json](../../modules/core/schemas/profile.schema.json) | Validates `modules/core/profiles.yaml`. Enforces exactly five profiles. |
| [tasks.schema.json](../../modules/core/schemas/tasks.schema.json) | Validates `tasks.json` emitted by `decomposer`. Feeds `initializer`. |
| [overlap-map.schema.json](../../modules/core/schemas/overlap-map.schema.json) | Validates `overlap-map.json` — pairs of tasks that touch the same file, with a resolution strategy. |
| [amendment.schema.json](../../modules/core/schemas/amendment.schema.json) | Validates a constitutional amendment record (platform or project). |
| [adr.schema.json](../../modules/core/schemas/adr.schema.json) | Validates an ADR under `docs/decisions/`. |

## `platform-manifest.schema.json`

Top-level purpose: records profile, hardware, project type, installed modules with versions, and provenance timestamps. One per project.

**Example:**

```json
{
  "platform_version": "0.1.0",
  "profile": "builder",
  "detected_hardware": { "os": "darwin", "arch": "arm64", "shell": "zsh" },
  "project_type": "fullstack-web",
  "modules": {
    "core": "0.1.0",
    "stack-node": "0.1.0",
    "stack-react": "0.1.0",
    "workspace-microsoft": "0.1.0",
    "pm-jira": "0.1.0",
    "git-github": "0.1.0"
  },
  "initialized_by": "owner@example.com",
  "initialized_at": "2025-01-15T14:22:18.000Z",
  "last_updated_at": "2025-01-15T14:22:18.000Z"
}
```

## `module.schema.json`

Top-level purpose: validates any `module.yaml`. Declares identity, requires/incompatibilities, contributions (skills, templates, workflows, schemas, hooks, instructions), prompts, detection markers, migrations, and breaking changes.

**Example (abridged):**

```yaml
name: stack-node
version: 0.1.0
kind: stack
description: Node.js + TypeScript stack module.
requires:
  - name: core
    version_range: ">=0.1.0 <1.0.0"
incompatible_with: []
contributes:
  skills:
    - skills/coding-agent-node.md
    - skills/tester-node.md
  workflows:
    - workflows/agent-pr-gate-node.yml.tmpl
  hooks:
    - hooks/pre-commit-node.sh
  instructions:
    - instructions/node.instructions.md
prompts: []
detection:
  file_markers:
    - package.json
```

## `profile.schema.json`

Top-level purpose: validates `modules/core/profiles.yaml`. Enforces exactly five profile keys (stop-line §6.1). Each profile declares `modules`, `skills_enabled`, `scaffolding`, `can_commit_code`, and optional `extras`.

**Example:** see [`../../modules/core/profiles.yaml`](../../modules/core/profiles.yaml) — the file as shipped is the golden sample.

## `tasks.schema.json`

Top-level purpose: validates the ordered task list `decomposer` emits. Consumed by `initializer` to materialize worktrees.

**Example (abridged):**

```json
{
  "feature_slug": "coupon-engine",
  "issue_key_prefix": "PROJ",
  "tasks": [
    {
      "id": "T-001",
      "title": "Add coupon schema",
      "files": ["src/coupons/schema.ts"],
      "depends_on": [],
      "agent_role": "coding-agent-node"
    }
  ]
}
```

## `overlap-map.schema.json`

Top-level purpose: names pairs of tasks that touch overlapping files, with a resolution strategy. Consumed by `integrator` to pick merge order.

**Example (abridged):**

```json
{
  "feature_slug": "coupon-engine",
  "overlaps": [
    {
      "task_a": "T-001",
      "task_b": "T-002",
      "files": ["src/coupons/schema.ts"],
      "strategy": "serialize",
      "note": "T-002 extends the schema added in T-001"
    }
  ]
}
```

Valid strategies: `serialize`, `merge-coordinator`, `file-locks` (see schema for canonical list).

## `amendment.schema.json`

Top-level purpose: validates an amendment record proposing a change to a constitution (platform or project). Amendments are tracked structured records that pair with an ADR.

**Example (abridged):**

```json
{
  "id": "A-003",
  "target": "project",
  "target_path": ".agent/constitution.md",
  "clause": "§3.2",
  "status": "proposed",
  "proposed_by": "steward@example.com",
  "date": "2025-02-01",
  "ad_reference": "docs/decisions/ADR-007-coverage-floor.md",
  "summary": "Raise minimum coverage floor from 70% to 80%."
}
```

## `adr.schema.json`

Top-level purpose: validates an ADR under `docs/decisions/`. Captures context, decision, consequences, and status transitions.

**Example (abridged):**

```json
{
  "id": "ADR-007",
  "title": "Raise coverage floor",
  "status": "accepted",
  "date": "2025-02-01",
  "supersedes": null,
  "superseded_by": null,
  "context": "Production regressions traced to undertested seams.",
  "decision": "Minimum coverage is now 80%.",
  "consequences": [
    "Higher CI time on existing projects.",
    "Explicit remediation path via tester-* skills."
  ]
}
```

## Validating locally

Use the CLI or any draft-07 validator:

```bash
# With ajv-cli:
npx ajv validate -s modules/core/schemas/module.schema.json -d modules/stacks/stack-node/module.yaml

# With the agentic CLI (structural check covers schemas in .agent/):
agentic validate
```

## Changing a schema

Schema changes follow the platform versioning policy. In short:

- **Add optional field** — MINOR.
- **Add required field** — MAJOR + migration script.
- **Remove field** — MAJOR + deprecation runway + migration script.
- **Change semantics of an existing field** — MAJOR.

See [../for-platform-maintainers/handling-breaking-changes.md](../for-platform-maintainers/handling-breaking-changes.md).

## Related docs

- [Module catalog](module-catalog.md)
- [CLI reference — `agentic validate`](cli-reference.md#agentic-validate)
- [Platform constitution §7 — Module contract](../../CONSTITUTION.md)
