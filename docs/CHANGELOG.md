# Changelog

## Unreleased

- Simplified Morpheus around Core, Initiative, Feature, Release, Modules, Incubator, and Local folders.
- Removed schema/profile/test scaffolding from the initial repo shape.
- Removed category module folders such as domains, integrations, stacks, and workspaces.
- Moved unready inherited skills into `incubator/candidate-skills/`.
- Promoted only the currently useful Morpheus 2 and chat-first workflow skills into `.agents/skills/`.
- Added `sprint-sequencer` back into the PRD-to-Jira workflow sequence.
- Ported Morpheus 2 Jira reference files into `modules/prd-to-jira/references/` and made them project-agnostic.
- Moved repository documentation out of the root folder into `docs/`.