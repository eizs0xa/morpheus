---
applyTo: "**"
---

# Morpheus Repository Instructions

This repo is the source for repo-first, chat-orchestrated Morpheus modules and templates. It is not a CLI product.

## Layout

- `modules/` — Morpheus modules and their contributed skills, workflows, templates, schemas, hooks, and instructions.
- `docs/` — repo-first setup, module, skill, and contributor docs.
- `tests/` — module manifest and contributed-file validation.
- `examples/` — optional examples if present.

## Test

```bash
npm test
```

## Rules

1. Do not add CLI setup flows or CLI-only documentation.
2. Preserve product-repo agent assets during setup; discover and reference them instead of overwriting.
3. Never commit `.env` files or secrets.
4. New modules must update `docs/reference/module-catalog.md`.
5. New skills must update `docs/reference/skill-catalog.md`.
6. Run `npm test` after module manifest or contribution changes.
