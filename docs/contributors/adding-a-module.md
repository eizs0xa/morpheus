# Adding A Module

Morpheus modules are repo-first assets. They contribute skills, workflows, templates, schemas, hooks, and instructions that agents can install or reference from chat-orchestrated setup.

## Required Files

```text
modules/<category>/<module-name>/
  module.yaml
  skills/        # optional
  workflows/     # optional
  templates/     # optional
  schemas/       # optional
  hooks/         # optional
  instructions/  # optional
```

## Manifest

`module.yaml` must declare:

- `name`
- `version`
- `description`
- `requires`
- `incompatible_with`
- `contributes`

Every contributed file must exist relative to the module folder.

## Review Checklist

- Module name is descriptive and optional unless it is core infrastructure.
- Project-specific values are config, env variables, or examples; not hardcoded behavior.
- Secrets are documented in `.env.example` only.
- New skills include clear trigger descriptions and stop lines.
- [module-catalog.md](../reference/module-catalog.md) is updated.
- [skill-catalog.md](../reference/skill-catalog.md) is updated when skills are added.
- `npm test` passes.
