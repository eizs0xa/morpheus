---
name: pull-request-workflow
version: 0.1.0
tier: integration
description: Create consistent GitHub pull requests with Jira-linked titles, standard summaries, validation evidence, risks, and artifact links.
when_to_use: |
  - A branch is ready for PR creation or update.
  - A user asks for a PR, draft PR, PR body, or review-ready summary.
  - GitHub Actions require a Jira issue key in the PR title.
when_not_to_use: |
  - The branch has not been pushed.
  - Required local validation has not run or failures are unexplained.
  - The PR would include unrelated work.
inputs:
  - jira_issue_key: string
  - branch_name: string
  - base_branch: string
outputs:
  - PR title
  - PR body
  - preflight checklist
---

# pull-request-workflow

## Purpose

Standardize PR creation so reviewers see the same structure in every repo and GitHub Actions can enforce consistent work item linkage.

## PR title

Use:

```text
<KEY> <type>(<scope>): <imperative summary>
```

Example:

```text
FOCAL-123 feat(local-launch): add OS-aware launch tasks
```

## PR body

Use this shape:

```markdown
## Summary
- <what changed>
- <why it changed>

## Linked Work
- Jira: <KEY>
- Morpheus artifacts: <paths, if applicable>

## Validation
- [ ] <command or manual check>

## Risk
- <deployment, auth, data, compatibility, or rollback notes>

## Reviewer Notes
- <anything reviewers should inspect first>
```

## Procedure

1. Confirm branch name contains the work item key.
2. Confirm PR title contains the same key.
3. Confirm branch is pushed and tracks origin.
4. Summarize changed files from `git diff --stat`.
5. Include test output or explain why a check was not run.
6. Include Morpheus artifact paths when the PR is generated from PRD/TDS/SDD/Jira work.
7. Open a draft PR when validation is incomplete; mark ready only after checks pass.

## Common failure modes

- PR title lacks Jira key and gets blocked by GitHub Actions.
- PR body lists no validation, forcing reviewers to guess.
- Branch contains unrelated generated files.
- PR links to external systems but not local Morpheus artifacts.
