# Morpheus Initiation

This module is the project-level onboarding sequence from Morpheus 2, made project-agnostic.

It creates the project understanding that every later workflow depends on.

## Skill Sequence

1. `chat-setup` - creates or verifies the workspace and project config.
2. `discovery` - scans product repos and records structure, intent, architecture, and conflicts.
3. `index` - creates the project navigation map.
4. `constitution` - creates or updates project-level rules.
5. `orient` - creates the first feature folder when feature work begins.

## Outputs

- `START_HERE.md`
- `WORKSPACE_SETUP.md`
- `project.config.json`
- `initiative/discovery/`
- `initiative/repo-index.md`
- `initiative/constitution.md`
- `initiative/conflicts-report.md`
- `features/<feature-slug>/` when `orient` runs

## Notes

This module should stay small and practical. If a step is not needed for a real project, it should not be added here.