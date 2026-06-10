# Agent Prompt Template

Use this template when rendering the copy-ready prompt inside a Jira story. The prompt should be usable from VS Code with the Morpheus workspace open.

## Rules

1. Keep the prompt compact and easy to copy.
2. Use workspace-relative paths only.
3. Do not include external links inside the implementation prompt.
4. Include local Morpheus artifacts the agent must read first.
5. Include prompt sequencing instructions.
6. Include acceptance criteria and definition of done.
7. Unknown values must be written as `UNKNOWN - review before use`.
8. Do not ask the implementing agent to open Jira; the story key can appear as plain text for context.
9. Carry Morpheus operating discipline: assumptions first, simplest scoped change, surgical edits, explicit verification.

## Prompt Structure

```text
Open the project workspace before running this prompt.

Role: You are a senior {language_or_stack} engineer working in `{repo_path}`.

Objective: {one imperative sentence describing the story outcome}

Context:
- Feature: {feature_name}
- Story: {work_item_key_or_placeholder} - {story_summary}
- Team/workstream: {team_code_or_workstream}
- Read first:
  - `features/{feature_slug}/PRD.md`
  - `features/{feature_slug}/TDS.md`
  - `{sdd_spec_path}`
  - `{sdd_design_path}`
  - `{sdd_tasks_path}`
  - `initiative/constitution.md`
  - `initiative/repo-index.md`

Prompt sequencing:
- {state prerequisite prompts/stories or say none}
- {explain parallel_contract, finish_gate, or trace_only dependencies when present}

Task:
{short task paragraph or bullets from SDD tasks.md}

Relevant files:
{workspace-relative paths, or `none listed`}

Acceptance criteria:
{testable bullets}

Definition of Done:
{layer-specific checks and evidence required}

Working rules:
- Keep the change scoped to this story and listed files unless the specs require otherwise.
- Follow existing repo instructions and Morpheus initiative rules.
- Reuse existing helpers and patterns before adding new abstractions.
- If multiple interpretations would change behavior or scope, stop and ask.
- Do not add speculative features, adapters, or configurability.
- Do not commit, push, or open a PR unless asked.
- Do not add secrets, `.env` files, or external links.

Before coding:
- State assumptions and success checks.
- Read the listed files.
- Inspect nearby patterns.
- Name planned edits and tests.
- Call out blockers or spec conflicts.

When finished:
- Summarize changes.
- List checks run.
- Note risks or follow-ups.
```

## Prompt Sequencing Modes

| Mode | Meaning |
|---|---|
| `start_gate` | Do not run this prompt until the prerequisite prompt/story is complete. |
| `parallel_contract` | Can run in parallel because the shared contract is documented and stable. |
| `finish_gate` | Preparatory work may start, but final integration/validation waits for the prerequisite. |
| `trace_only` | Useful context; does not gate prompt execution. |
