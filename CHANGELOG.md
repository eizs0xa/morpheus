# Changelog

## Unreleased

### Changed

- Reoriented Morpheus around repo-first, chat-orchestrated setup.
- Removed the original command-line setup package and bootstrap flow.
- Added `workspace-companion` for agent-chat setup prompts and workspace artifacts.
- Enhanced `git-github` with agent Git operation, PR workflow, and Jira-linked branch/PR naming skills.
- Added `local-launch` for OS-aware local launch tasks and auth/env guidance.
- Replaced command-line integration tests with module manifest and contributed-file validation.
- Moved inherited/unwired skills into `incubator/candidate-skills/` so only setup-ready skills are approved in `.agents/skills/`.
