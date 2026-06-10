---
name: jira
description: "Use to produce Jira-ready payloads from feature PRD, TDS, and SDD artifacts."
---

# jira

## Purpose

Turn feature artifacts into Jira-ready Epics, Stories, prompts, acceptance criteria, estimates, and dependency metadata.

## Inputs

- `features/<feature-slug>/PRD.md`
- `features/<feature-slug>/TDS.md`
- `features/<feature-slug>/SDD/**`
- local `.env` values for Jira connection
- `modules/prd-to-jira/references/estimation-rubric.md`
- `modules/prd-to-jira/references/agent-prompt-template.md`
- `modules/prd-to-jira/references/story-template.md`
- `modules/prd-to-jira/references/story-title-convention.md`
- `modules/prd-to-jira/references/jira-field-reference.md`

## Output

- `features/<feature-slug>/jira/payload.json`

## Rules

- Never ask for Jira tokens in chat.
- Never hardcode Jira board IDs or field IDs in the skill body.
- Use `.env.example` for variable names and local `.env` for values.
- Use the PRD-to-Jira reference files for story titles, story bodies, agent prompts, estimates, and field mappings.
