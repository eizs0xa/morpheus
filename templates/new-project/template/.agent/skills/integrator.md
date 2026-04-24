---
name: integrator
version: 0.1.0
tier: core
description: Merge task PRs into the feature branch in a safe order derived from the dependency graph and the overlap map.
when_to_use: |
  - Multiple task PRs are approved and awaiting merge into the feature branch.
  - `overlap-map.json` exists and is current.
  - You need deterministic merge order to minimise rework and rebase conflicts.
  - Branch protection allows automated merging with a green CI.
when_not_to_use: |
  - Any task PR has failing CI or unresolved review blockers.
  - `overlap-map.json` is missing or out of date — regenerate with `decomposer`.
  - You are merging the feature branch to the default branch — that is a release gate, handled elsewhere.
  - You are resolving a CI failure — use `fixer`.
inputs:
  - tasks_json_path: string
  - overlap_map_json_path: string
  - feature_branch: string
  - prs: list of PR references (one per ready task)
outputs:
  - merge_order: ordered list of PR references
  - merge_report_md: string
requires_profiles: [builder, steward]
---

# integrator

## Purpose

Merge a batch of task PRs into the feature branch in an order that is (a) consistent with the
task dependency graph and (b) aware of overlap so later PRs rebase onto the earlier ones
cleanly. The integrator does not approve code or resolve review findings; it only sequences
merges and handles the mechanical rebase/merge work.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` | yes | Provides the dependency graph. |
| `overlap-map.json` | yes | Provides the file/schema contention picture. |
| Feature branch | yes | The target. Must have branch protection enforcing CI + review. |
| List of PRs | yes | Each PR must be approved with a green build. |

## Process

1. **Validate inputs.** Parse both JSON files. Fail fast on schema mismatch or cycles.
2. **Compute the dependency DAG.** Topological-sort tasks using `depends_on`. Any task that
   depends on a non-merged task waits.
3. **Weigh by overlap.** For each pair of ready-to-merge tasks, count overlapping resources.
   Merge the higher-overlap task first so later PRs rebase onto its changes once, not twice.
   Break ties by smaller diff first.
4. **Verify each PR is mergeable.** Approved, CI green, no merge conflicts against the current
   feature branch. If a PR has conflicts, stop and hand off to the author (or to `fixer` if
   the conflicts are purely mechanical).
5. **Merge sequentially.** Use the project's merge style (squash / rebase / merge commit) as
   declared in the constitution. Do not switch styles mid-batch.
6. **Rebase followers.** After each merge, trigger a rebase (or instruct authors) for every
   remaining PR that touches an overlapping resource.
7. **Re-check CI.** After every merge, the feature branch must have green CI before the next
   merge. If red, stop and report.
8. **Emit the merge report.** Ordered list: PR reference, merge commit SHA, time to merge,
   overlaps rebased, any skips.

## Outputs

- `merge_order`: the computed order, as a list of PR references.
- `merge_report.md`: a short markdown log suitable for the feature's implementation notes.
- Side effect: the feature branch now contains all merged task PRs.

## Acceptance

The integration run is accepted only when all of the following pass:

- All merges respect the dependency graph (no child merged before parent).
- No overlapping-resource pair was merged out-of-order from the overlap weighting.
- Every merge left the feature branch with green CI.
- The merge report lists every PR and explains any skip.
- No merge commit lost review approvals (e.g. by force-updating a protected branch).

## Common failure modes

- **Cycle in tasks.json.** The dependency graph has a loop. Stop and return to `decomposer`.
- **Rebase cascade.** Merging high-overlap PRs in the wrong order forces everyone to rebase
  twice. Fix by computing the overlap weighting before sequencing.
- **Style drift.** Switching between squash and rebase mid-batch. Lock the style for the
  whole batch; follow the constitution.
- **Approval loss.** A force-push to a protected branch silently voids approvals. Never
  force-update; rebase locally and push a new head.
- **Silent skip.** A PR that fails to merge is omitted from the report. Always log failures.
- **CI debt.** Merging a PR while CI is still running on the previous one. Always wait.
- **Overlap blindness.** Ignoring the overlap map and merging by timestamp. Expect conflicts.
