---
name: jira-linked-branching
version: 0.1.0
tier: integration
description: Enforce Jira-linked branch and PR naming so GitHub Actions, reviewers, and release automation can trace every change to a work item.
when_to_use: |
  - A repo's GitHub Actions block PRs whose title or branch does not contain a Jira key.
  - A user asks how to name a branch or PR.
  - A team wants consistent branch names across repositories.
when_not_to_use: |
  - The project does not use Jira or a compatible work item key format.
  - The change is a GitHub-generated revert or dependency bot PR exempted by policy.
inputs:
  - "jira_project_key: string"
  - "jira_issue_key: string"
outputs:
  - branch name
  - PR title prefix
---

# jira-linked-branching

## Contract

Every human or agent-created branch and PR title must include the Jira issue key.

Branch:

```text
<PROJECT>-<NUMBER>-<short-kebab-summary>
```

PR title:

```text
<PROJECT>-<NUMBER> <type>(<scope>): <imperative summary>
```

## Exceptions

Allowed exceptions should be narrow and explicit:

- GitHub auto-revert branches beginning with `revert-`.
- Dependabot branches when dependency automation owns the PR.
- Release automation branches beginning with `release/`.

## Enforcement

- `branch-name-check.yml` validates the branch name.
- `jira-linked-pr-check.yml` validates branch and PR title linkage.
- `commit-lint.yml` validates Conventional Commit grammar.

## Agent behavior

If a user asks for a branch, commit, or PR and no Jira key is known, the agent asks once:

```text
Which Jira issue key should this branch and PR use?
```

If the user does not have a key yet, the agent stops before Git work and recommends creating or selecting one.
