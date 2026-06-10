---
name: change-management
description: "Use to manage top-down documentation impact, open questions, changelogs, and release/feature change history."
---

# change-management

## Purpose

Keep documentation changes traceable when project scope, feature scope, implementation decisions, or release plans change.

## Applies To

- `initiative/constitution.md`
- `initiative/discovery/*`
- `features/<feature>/PRD.md`
- `features/<feature>/TDS.md`
- `features/<feature>/SDD/**`
- `releases/<release>/**`

## Procedure

1. Identify the highest impacted level: initiative, feature, Jira, or release.
2. Update that level first.
3. Cascade lower-level docs only when needed.
4. Record file-level and feature/release-level changelog entries.
5. Stop before Jira or release changes if open questions remain unresolved.
