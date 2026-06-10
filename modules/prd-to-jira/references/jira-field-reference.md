# Jira Field Reference

This file documents the Jira fields the `jira`, `jira-enhancement`, and `sprint-sequencer` skills may need. Keep project-specific IDs in `.env` or project config, not in reusable skill text.

## Required Connection Values

```text
JIRA_SERVER
JIRA_EMAIL
JIRA_API_TOKEN
JIRA_PROJECT_KEY
```

`JIRA_API_TOKEN` is a secret. Never paste it into chat and never commit it.

## Common Field Variables

```text
JIRA_FIELD_STORY_POINTS
JIRA_FIELD_ACCEPTANCE_CRITERIA
JIRA_FIELD_FUNCTIONAL_TEAM
JIRA_FIELD_SPRINT
JIRA_FIELD_START_DATE
JIRA_FIELD_DUE_DATE
JIRA_FIELD_PARENT_LINK
```

## Optional Defaults

```text
JIRA_BOARD_ID
JIRA_DEFAULT_PARENT_KEY
JIRA_DEFAULT_FIX_VERSION
JIRA_DEFAULT_FUNCTIONAL_TEAM
```

## Rules

1. Field IDs are adapter/project configuration.
2. Skills should read field IDs from environment or project config.
3. Skills should fail with a clear missing-variable message instead of guessing.
4. Do not create fixVersions unless the project explicitly allows it.
5. New issues should stay in the default backlog/to-do state unless the project explicitly configures transitions.
6. Link dependencies with the project-approved link type, usually `Blocks`.

## Discovery Notes

When onboarding a project, discover and record:

- Jira project key.
- board ID or board name.
- issue types used by the team.
- required custom fields.
- allowed functional team/workstream values.
- sprint field behavior.
- parent/initiative/epic relationship model.
- allowed transitions and closure statuses.
