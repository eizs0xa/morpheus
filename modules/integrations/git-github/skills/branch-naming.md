# Skill: branch-naming

> Shipped by `integrations/git-github`. Universal across all stacks.

Every branch in a Morpheus-scaffolded project follows a standardized naming convention that encodes work-item linkage, enabling cross-team automation (Jira sync, status rollup, portfolio view).

## Default pattern

The default regex is:

```
^(feat|fix|chore|docs|refactor|test|style)/[a-z0-9][a-z0-9._-]*$
```

Teams using `pm-jira` should override to:

```
^[A-Z]+-[0-9]+(-[a-z0-9-]+)?$
```

so that every branch begins with the Jira issue key. The active pattern is stored in `platform-manifest.json` under `modules.git-github.config.branch_prefix_pattern`.

## Enforcement

1. Pre-push git hook (optional) rejects non-conforming names.
2. `workflows/branch-name-check.yml` CI gate rejects PRs from non-conforming branches.
3. `agentic doctor` warns on existing non-conforming branches during brownfield overlays.

## Reserved prefixes

- `coe/` — reserved for `coe-portal` automation.
- `release/` — reserved for `release-train` workflow.
- `revert-` — reserved for GitHub auto-revert PRs.

## Stop-lines

- **Never** commit directly to the default branch. All changes go through a branch + PR.
- **Never** bypass branch protection with `--force` on the default branch.
