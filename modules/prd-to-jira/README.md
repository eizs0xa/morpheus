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

This sequence preserves the Morpheus 2 flow:

```text
PRD -> TDS -> SDD -> Jira -> Sprint Sequencing -> Test Plan
```

## Outputs

- `features/<feature-slug>/PRD.md`
- `features/<feature-slug>/TDS.md`
- `features/<feature-slug>/SDD/`
- `features/<feature-slug>/jira/`
- `features/<feature-slug>/test-plan.md`
- `features/<feature-slug>/changelog.md`

## References

The workflow uses these shared references:

- [estimation-rubric.md](references/estimation-rubric.md) - story point sizing.
- [agent-prompt-template.md](references/agent-prompt-template.md) - copy-ready implementation prompt shape.
- [story-template.md](references/story-template.md) - Jira story description and acceptance criteria shape.
- [story-title-convention.md](references/story-title-convention.md) - Jira summary/title convention.
- [jira-field-reference.md](references/jira-field-reference.md) - environment/configuration names for Jira field mappings.

## Notes

Jira connection details belong in `.env.example` and local `.env`, not in the skill text. Board IDs, custom fields, and project keys should be parameters or discovered configuration.