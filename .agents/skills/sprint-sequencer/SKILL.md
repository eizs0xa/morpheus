---
name: sprint-sequencer
description: "Use to sequence Jira-ready stories into sprints with prompt-run dependency modes, sprint windows, dates, and capacity constraints."
---

# sprint-sequencer

## Purpose

Enrich `features/<feature-slug>/jira/payload.json` with sprint assignment and date metadata.

## Inputs

- Jira payload from the `jira` skill.
- `modules/prd-to-jira/references/estimation-rubric.md`
- `modules/prd-to-jira/references/jira-field-reference.md`
- sprint names or IDs.
- sprint start/end dates.
- team capacity assumptions.
- dependency modes: `start_gate`, `parallel_contract`, `finish_gate`, `trace_only`.

## Output

- updated `features/<feature-slug>/jira/payload.json`
- sequencing report

## Rules

- Never create sprints.
- Never silently clamp dates to fit a sprint.
- Use prompt-run readiness, not only dependency links, to decide sequencing.
- If a story cannot finish inside a sprint, recommend next sprint unless the user explicitly approves compression.
- Keep story points unchanged when date compression is approved; the estimation rubric sizes work, not calendar duration.
