---
name: prd
description: "Use to validate and register a human-authored PRD into a feature folder."
---

# prd

## Purpose

Validate that a PRD is ready for technical design and register it as the feature source of truth.

## Inputs

- human-authored PRD
- `initiative/constitution.md`
- `initiative/repo-index.md`
- `features/<feature-slug>/`

## Output

- `features/<feature-slug>/PRD.md`
- feature README status update
- feature changelog update

## Gate

Fail if required sections are missing, core requirements are not actionable, or the PRD conflicts with project stop lines.
