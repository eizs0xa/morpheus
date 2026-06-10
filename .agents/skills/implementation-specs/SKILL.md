---
name: implementation-specs
description: "Use to create SDD implementation specs from an approved TDS."
---

# implementation-specs

## Purpose

Create agent-ready implementation packages from the TDS.

## Inputs

- `features/<feature-slug>/TDS.md`
- `features/<feature-slug>/PRD.md`
- `initiative/constitution.md`
- `initiative/repo-index.md`

## Output

```text
features/<feature-slug>/SDD/
  README.md
  <nn>-<spec-slug>/
    spec.md
    design.md
    tasks.md
```

Each `tasks.md` must include a copy-ready implementation prompt, acceptance criteria, and definition of done.
