---
name: agent-git-operator
version: 0.1.0
tier: integration
description: Standardize agent-run Git branch, commit, push, and PR preparation across repositories using Jira-linked branch names and Conventional Commits.
when_to_use: |
  - An agent needs to create a branch, commit code, push changes, or prepare a PR.
  - The repo requires branch names and PR titles to carry a Jira issue key.
  - A user asks the agent to "commit this", "open a PR", "make a branch", or "finish the git work".
when_not_to_use: |
  - The working tree contains unrelated user changes that cannot be separated safely.
  - The user has not supplied or approved the Jira issue key for the work.
  - The change includes secrets, generated credentials, or unreviewed local env files.
inputs:
  - jira_issue_key: string
  - change_summary: string
  - target_branch: string (default: main)
outputs:
  - standardized branch name
  - conventional commit message
  - pushed branch and PR draft instructions
---

# agent-git-operator

## Purpose

Make Git work look and feel the same across every Morpheus-enabled repo. The agent owns the mechanics: branch naming, status checks, staging, commit message shape, push, and PR preparation. Humans still approve scope, secrets handling, and the final PR.

## Required naming contract

Every feature/fix branch starts with the work item key:

```text
<JIRA-KEY>-<short-kebab-summary>
```

Examples:

```text
FOCAL-123-add-launch-script
DAAA-10212-repair-sprint-sequencing
```

If the repo uses a different PM adapter, replace `JIRA-KEY` with that adapter's work item key format. The active regex should be recorded in the project's Morpheus config and enforced by `jira-linked-pr-check.yml`.

## Procedure

1. Read the current Git state with `git status --short`.
2. Identify unrelated user changes. Do not stage or modify them.
3. Confirm or infer the work item key. If missing, ask once.
4. Create a branch named `<KEY>-<short-kebab-summary>`.
5. Make or verify the requested code/document changes.
6. Run the relevant tests or validation commands for the touched repo.
7. Stage only files that belong to the requested work.
8. Commit with Conventional Commits plus a work item footer:

```text
<type>(<scope>): <imperative summary>

Refs: <KEY>
```

9. Push the branch.
10. Prepare the PR title:

```text
<KEY> <type>(<scope>): <imperative summary>
```

11. Prepare the PR body with summary, validation, risk, and linked artifacts.

## Stop lines

- Never commit `.env`, tokens, credentials, local secret stores, or unreviewed generated files.
- Never bypass branch protection or force-push the default branch.
- Never stage unrelated user changes.
- Never invent a Jira key. Ask or stop.
- Never open a PR whose title lacks the work item key when the repo enforces Jira-linked PR names.
