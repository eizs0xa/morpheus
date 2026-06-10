# Adding A Module

Morpheus modules are repo-first assets. They declare ownership of skills, workflows, templates, schemas, hooks, and instructions that agents can install or reference from chat-orchestrated setup.

## Required Files

```text
modules/<category>/<module-name>/
  module.yaml
  workflows/     # optional
  templates/     # optional
  schemas/       # optional
  hooks/         # optional
  instructions/  # optional

.agents/skills/<skill-name>/
  SKILL.md       # approved reusable skill body, when the module contributes a skill
```

## Manifest

`module.yaml` must declare:

- `name`
- `version`
- `description`
- `requires`
- `incompatible_with`
- `contributes`

Contributed workflows, templates, schemas, hooks, and instructions usually live relative to the module folder. Approved reusable skill bodies live under `.agents/skills/<skill-name>/SKILL.md` and are referenced from `module.yaml`.

## Review Checklist

- Module name is descriptive and optional unless it is core infrastructure.
- Project-specific values are config, env variables, or examples; not hardcoded behavior.
- Secrets are documented in `.env.example` only.
- New skills include clear trigger descriptions and stop lines.
- Skill bodies are not duplicated under module-local `skills/` folders.
- [module-catalog.md](../reference/module-catalog.md) is updated.
- [skill-catalog.md](../reference/skill-catalog.md) is updated when skills are added.
- `npm test` passes.
