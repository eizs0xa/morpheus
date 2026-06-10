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

## Output

- `features/<feature-slug>/jira/payload.json`

## Rules

- Never ask for Jira tokens in chat.
- Never hardcode Jira board IDs or field IDs in the skill body.
- Use `.env.example` for variable names and local `.env` for values.
