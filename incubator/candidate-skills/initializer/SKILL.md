---
name: initializer
version: 0.1.0
tier: core
description: Take a validated tasks.json and create N git worktrees, one per task, on correctly named branches ready for coding agents to start work.
when_to_use: |
  - `tasks.json` is validated and approved.
  - You are about to dispatch parallel coding agents and need isolated worktrees.
  - A feature branch already exists to host the task branches before integration.
  - You want deterministic branch names that downstream CI and PM integrations can parse.
when_not_to_use: |
  - `tasks.json` is not validated — run `decomposer` first.
  - You are on a single-track, single-agent workflow — a single feature branch may suffice.
  - The repo does not permit long-lived worktrees (space or policy constraint) — coordinate with the steward.
  - You are integrating merged work back into the feature branch — use `integrator`.
inputs:
  - tasks_json_path: string
  - issue_key_prefix: string (e.g. PROJ)
  - feature_branch: string (parent branch the worktrees will branch from)
  - worktree_root: string (absolute path where worktrees are materialised)
outputs:
  - worktree_paths: list of absolute paths (one per task)
  - init_report_md: string (summary report of what was created)
requires_profiles: [builder, steward]
---

# initializer

## Purpose

Materialise the task list as isolated git worktrees so parallel coding agents can work
independently without stomping on each other. Each task becomes one branch and one worktree.

The branch naming convention is deterministic so CI, PM integrations, and the integrator can
all parse it:

```
agent/{ISSUE_KEY}/{T###}-{slug}
```

Where `{ISSUE_KEY}` is the PM ticket key (e.g. `PROJ-1234`) or, if there is no PM integration,
the feature slug in upper-kebab form.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` | yes | Must be validated against `tasks.schema.json`. |
| Issue key prefix | yes | Uppercase; used as the middle segment of branch names. |
| Feature branch | yes | Must exist locally and remotely. Worktrees branch from here. |
| Worktree root | yes | Absolute path. Must have enough disk space. Must not be inside the repo's `.git/` directory. |

## Process

1. **Pre-flight.**
   - Confirm `git` ≥ 2.17 (worktree support).
   - Confirm the feature branch exists and is current. Fetch if needed.
   - Confirm `worktree_root` is writable and not already polluted with old worktrees.
   - Confirm `tasks.json` validates.
2. **Build the branch-name list.** For each task, form `agent/{ISSUE_KEY}/{T###}-{slug}`.
   Normalise the slug: lowercase, kebab-case, ASCII-only, trimmed to 40 chars max.
3. **Materialise worktrees sequentially.** For each task:
   - `git worktree add <worktree_root>/<T###>-<slug> -b <branch_name> <feature_branch>`
   - Inside the new worktree, write a short `.agent/task.json` file that mirrors the task's
     entry from `tasks.json`. This is the coding agent's contract for that worktree.
   - Optionally seed an environment file from the project template.
4. **Verify.** Each worktree must (a) exist, (b) be on the correct branch, (c) contain
   `.agent/task.json` that matches the task's entry.
5. **Handle failure.** If any step fails, do not roll back silently. Emit the failure, list
   the worktrees successfully created, and stop. The operator decides whether to clean up or
   continue.
6. **Emit the init report.** A short markdown summary listing each task, branch, worktree
   path, and any warnings.

## Outputs

- A `git worktree` per task at `<worktree_root>/<T###>-<slug>`.
- A branch per task: `agent/{ISSUE_KEY}/{T###}-{slug}` rooted at `feature_branch`.
- A `.agent/task.json` inside each worktree, mirroring the task's entry from `tasks.json`.
- `init_report.md` summarising the creation, including task counts and any skipped tasks.

## Acceptance

The initialisation is accepted only when all of the following pass:

- Every task in `tasks.json` has a matching worktree and branch, or a recorded skip with a
  reason.
- Every branch name matches `agent/{ISSUE_KEY}/{T###}-{slug}` exactly.
- No worktree sits inside another worktree.
- `.agent/task.json` in each worktree matches the source task entry byte-for-byte.
- The init report lists both successes and failures; it does not paper over errors.

## Common failure modes

- **Slug collisions.** Two tasks normalise to the same slug. Fail early and ask the decomposer
  to disambiguate; do not silently suffix.
- **Stale feature branch.** Worktrees branch from an out-of-date base and conflicts pile up
  later. Always fetch first.
- **Worktree pollution.** Re-running the initializer on top of old worktrees yields
  half-merged state. Require a clean `worktree_root` or a `--force-clean` flag.
- **Disk exhaustion.** Many worktrees of a large repo can saturate disk. Report
  `du`-equivalent projections before running.
- **Silent skip.** A task fails to materialise and the report omits it. Always list failures
  with a reason.
- **Branch-name drift.** Any skew from the canonical pattern breaks downstream automation.
  Validate the name against the pattern regex before calling `git worktree`.
