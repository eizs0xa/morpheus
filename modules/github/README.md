# GitHub

This module standardizes GitHub branch, commit, and pull request behavior across project repos.

## Skill Sequence

1. `jira-linked-branching` - decides branch and PR title naming.
2. `branch-naming` - explains branch conventions.
3. `conventional-commits` - explains commit grammar.
4. `agent-git-operator` - guides agent-run Git work.
5. `pull-request-workflow` - produces consistent PR titles and bodies.

## Why It Exists

Teams should not have different branch and PR habits in each repo. GitHub Actions often block PRs if names do not include Jira keys; this module makes that convention explicit.