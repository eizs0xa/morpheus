# Schemas

Morpheus schemas define repo-first contracts for modules and generated artifacts.

All schemas live under [`../../modules/core/schemas/`](../../modules/core/schemas/).

## Catalog

| Schema | Purpose |
|---|---|
| [platform-manifest.schema.json](../../modules/core/schemas/platform-manifest.schema.json) | Legacy/generated platform manifest contract. |
| [module.schema.json](../../modules/core/schemas/module.schema.json) | Validates `module.yaml` for every module. |
| [profile.schema.json](../../modules/core/schemas/profile.schema.json) | Legacy profile config contract retained for compatibility. |
| [tasks.schema.json](../../modules/core/schemas/tasks.schema.json) | Task artifact contract. |
| [overlap-map.schema.json](../../modules/core/schemas/overlap-map.schema.json) | Overlap artifact contract. |
| [amendment.schema.json](../../modules/core/schemas/amendment.schema.json) | Constitutional amendment contract. |
| [adr.schema.json](../../modules/core/schemas/adr.schema.json) | ADR contract. |

## Local Validation

Run repository validation with:

```bash
npm test
```

The current test runner checks module manifests and contributed-file paths without requiring a CLI runtime.

## Changing A Schema

- Additive optional fields are minor changes.
- Required fields, removed fields, and semantic changes require migration notes.
- Update impacted module docs and tests in the same change.
