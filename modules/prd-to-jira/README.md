# PRD To Jira

This module is the feature workflow from Morpheus 2.

It turns a validated PRD into technical design, implementation specs, Jira-ready work, sprint sequencing, and test planning.

## Skill Sequence

1. `prd` - validates and registers a human-authored PRD.
2. `technical-design` - creates the TDS from PRD plus project context.
3. `implementation-specs` - creates SDD spec/design/tasks packages.
4. `change-management` - handles open questions, top-down impact, and changelogs.
5. `jira` - creates or updates the Jira payload.
6. `jira-enhancement` - handles mid-development Jira changes.
7. `sprint-sequencer` - assigns Jira stories to sprints and dates when needed.
8. `test-plan` - creates test planning and validation artifacts.

## Outputs

- `features/<feature-slug>/PRD.md`
- `features/<feature-slug>/TDS.md`
- `features/<feature-slug>/SDD/`
- `features/<feature-slug>/jira/`
- `features/<feature-slug>/test-plan.md`
- `features/<feature-slug>/changelog.md`

## Notes

Jira connection details belong in `.env.example` and local `.env`, not in the skill text. Board IDs, custom fields, and project keys should be parameters or discovered configuration.