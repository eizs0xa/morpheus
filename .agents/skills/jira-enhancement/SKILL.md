---
name: jira-enhancement
description: "Use when Jira stories already exist and feature scope or implementation reality changes."
---

# jira-enhancement

## Purpose

Handle mid-development Jira changes without losing traceability to PRD, TDS, SDD, and changelogs.

## Procedure

1. Run change-management first.
2. Decide whether the change is docs-only, Jira-only, or requires upstream artifact changes.
3. Prefer correction/replacement stories over silent in-place mutation when scope changes materially.
4. Log links, closure decisions, replacement rationale, and affected prompts.
5. Use `modules/prd-to-jira/references/story-template.md` and `agent-prompt-template.md` when regenerating story descriptions or prompts.
