# Jira Story Template

Use this reference when the `jira` skill renders story descriptions and acceptance criteria.

## Description Shape

```text
h3. Context
{one-paragraph task context from SDD tasks.md}

h3. Source Specs
* PRD: {prd_path}
* TDS: {tds_path}
* SDD spec: {sdd_spec_path}
* SDD design: {sdd_design_path}
* SDD tasks: {sdd_tasks_path}

h3. Scope
{bulleted scope items from the task}

h3. Out of Scope
{bulleted exclusions, only when explicitly stated}

h3. Dependencies
* Blocks: {work item IDs or "none"}
* Blocked by: {work item IDs or "none"}

h3. Prompt Sequencing
* Prompt-run prerequisites: {work item IDs or "none"}
* Dependency modes: {ID=mode}
* Sequencing note: {why the prompt can or cannot run before prerequisites complete}

h3. Open Questions Bypassed
{include only when change-management returns an explicit bypass payload}

h3. Notes
{implementation hints or design references}

h2. Agent Prompt
{copy-ready prompt rendered from agent-prompt-template.md}
```

## Acceptance Criteria Shape

Use EARS-style bullets when available, otherwise Given/When/Then.

```text
* WHEN {trigger} THE SYSTEM SHALL {expected}
* WHEN {trigger} THE SYSTEM SHALL {expected}

Definition of Done:
* Unit tests added or updated when applicable
* Integration or E2E checks documented when applicable
* Relevant local checks pass
* Evidence added under the feature artifacts folder when needed
```

## Rules

1. Never paste full local spec files into Jira; cite workspace paths.
2. Keep the description concise and let Morpheus artifacts hold detail.
3. Acceptance criteria must be testable.
4. Always include dependencies, even when empty.
5. Always include prompt sequencing.
6. Include `Open Questions Bypassed` only for explicit bypasses.
