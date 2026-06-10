# Skill: branch-naming

Every branch in a Morpheus-scaffolded project follows a standardized naming convention that encodes work-item linkage, enabling cross-team automation (Jira sync, status rollup, portfolio view).

## Default pattern

The default regex requires a Jira issue key:

```
^([A-Z]+-[0-9]+)(-[a-z0-9-]+)?$
```

Examples:

```text
FOCAL-123-add-launch-script
DAAA-10212-repair-sprint-plan
```

Every agent-created branch begins with the Jira issue key so GitHub Actions, reviewers, and release automation can trace code back to the work item. If a project uses a different work item system, configure the equivalent work item key regex in the project config.

## Enforcement

1. Agent Git skills ask for a Jira key before creating a branch when one is not known.
2. Repository GitHub Actions should reject PRs from non-conforming branches when that policy is installed.
3. PR titles should carry the same work item key as the branch.

## Reserved prefixes

- `release/` — reserved for `release-train` workflow.
- `revert-` — reserved for GitHub auto-revert PRs.

## Stop-lines

- **Never** commit directly to the default branch. All changes go through a branch + PR.
- **Never** bypass branch protection with `--force` on the default branch.
