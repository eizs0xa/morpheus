# Story Title Convention

Use a human-readable title that sorts well in Jira and identifies the feature, workstream, and task.

## Format

```text
{PREFIX}-{SHORT_EPIC}-{WORKSTREAM}-{TASK_NAME}
```

## Parts

| Part | Source | Example |
|---|---|---|
| `PREFIX` | User-provided feature or PRD code | `IK`, `AUTH`, `LAUNCH` |
| `SHORT_EPIC` | Cleaned SDD spec or epic title | `Artifact Review` |
| `WORKSTREAM` | Project-configured workstream/team code | `BE`, `FE`, `QA`, `DATA`, `DEVOPS` |
| `TASK_NAME` | Cleaned task title | `Extraction Service` |

## Rules

1. Target 100 characters or fewer.
2. Hard cap 120 characters unless Jira/project policy differs.
3. No trailing punctuation.
4. Use Title Case for human-readable parts.
5. Keep workstream/team code uppercase.
6. If a task clearly spans multiple workstreams, split it unless it is truly shared contract work.

## Examples

```text
IK-Artifact Review-BE-Extraction Service
AUTH-Login Flow-FE-Callback Handler
LAUNCH-Local Setup-DEVOPS-Env Template
```
