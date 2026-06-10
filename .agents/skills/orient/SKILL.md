---
name: orient
description: "Use to create a new feature folder under features before PRD, TDS, SDD, Jira, and test planning begin."
---

# orient

## Purpose

Create the clean feature landing zone. Orient creates containers, not content.

## Output

```text
features/<feature-slug>/
  README.md
  PRD.md
  TDS.md
  changelog.md
  SDD/
  jira/
  test-plan.md
  artifacts/
```

## Procedure

1. Confirm feature slug.
2. Check for collisions.
3. Create placeholders with clear next steps.
4. Link back to `initiative/constitution.md` and `initiative/repo-index.md`.
