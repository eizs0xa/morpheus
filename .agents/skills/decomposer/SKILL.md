---
name: decomposer
version: 0.1.0
tier: core
description: Turn plan.md into a machine-readable tasks.json plus an overlap-map.json that describes file/resource contention between tasks.
when_to_use: |
  - plan.md is complete and approved.
  - You are about to dispatch parallel coding agents and need discrete, self-contained tasks.
  - The PM integration needs a structured payload to create tickets.
  - You need an overlap map so the integrator can merge safely.
when_not_to_use: |
  - plan.md is incomplete or still in draft — run `planner` first.
  - You are asked to upload tickets to a PM tool — use the appropriate integration skill with this skill's output as input.
  - You are implementing a task — use a stack-specific coding skill.
  - You are authoring the project constitution — use `constitution-author`.
inputs:
  - plan_md_path: string
  - feature_slug: string
  - issue_key_prefix: string (e.g. PROJ, used to name worktrees and branches)
outputs:
  - tasks_json_path: string (validates against tasks.schema.json)
  - overlap_map_json_path: string (validates against overlap-map.schema.json)
requires_profiles: [builder, steward]
---

# decomposer

## Purpose

Split a plan into discrete, agent-ready tasks. Each task is:

- **Small enough** to be implemented by a single coding agent in a single pass.
- **Self-contained enough** to be reviewed and merged independently.
- **Traceable** back to a requirement and a phase in the plan.
- **Disjoint enough** from other tasks to run in parallel, or, where overlap is unavoidable,
  honest about the overlap so the integrator can sequence merges.

The output also includes an `overlap-map.json` that records which tasks touch the same files,
tables, or resources. This map is the integrator's primary input.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `plan.md` | yes | Must contain phases with exit criteria and explicit requirement IDs. |
| Feature slug | yes | `snake_case`, taken from the spec folder. |
| Issue key prefix | yes | Used to name branches and worktrees later (e.g. `PROJ`). |
| Read-only repo access | yes | Required to populate `files_touched` honestly. |

## Process

1. **Parse the plan.** Extract phases, dependency graph, and estimates. Fail fast on a
   missing phase or dependency.
2. **Expand each phase into tasks.** Aim for tasks ≤ 1 day of focused work. A phase with five
   requirements usually yields three to seven tasks. Split ruthlessly when a task grows.
3. **Populate per-task metadata.** For each task, record: `id` (e.g. `T001`), `title`, `slug`
   (kebab-case), `phase`, `requirement_ids`, `layer` (`backend | frontend | shared | infra`),
   `estimate` (hours range), `depends_on` (list of task IDs), `acceptance` (bulleted tests
   or observable outcomes), `files_touched` (list of concrete paths, as of now).
4. **Build the overlap map.** For every file or shared resource touched by two or more tasks,
   record an entry: `resource | task_ids | overlap_type (append-only | mutating | schema)`.
   The integrator uses this to choose merge order.
5. **Add dev test checklist per task.** Bullet list of tests the implementing agent must run
   and pass before handing off to review. Pull from the plan's non-functional and from the
   stack's coding skill.
6. **Validate the graph.** No cycles. No task with zero requirement IDs. No task that touches
   files that do not exist in the repo (unless the task is explicitly a creation task, in
   which case the files are marked `new: true`).
7. **Write both artifacts** and report: task count, estimated total effort, number of overlap
   rows, critical path, parallelism factor.

## Outputs

`tasks.json` (array of task objects) — schema: `tasks.schema.json`.

Each task object, minimum shape:

```json
{
  "id": "T001",
  "title": "…",
  "slug": "kebab-case-slug",
  "phase": "foundations",
  "requirement_ids": ["R-1"],
  "layer": "backend",
  "estimate_hours": [2, 4],
  "depends_on": [],
  "acceptance": ["…"],
  "files_touched": [{"path": "src/…", "new": false}],
  "dev_test_checklist": ["…"]
}
```

`overlap-map.json` — schema: `overlap-map.schema.json`.

Each row shape:

```json
{
  "resource": "src/services/user.py",
  "task_ids": ["T003", "T007"],
  "overlap_type": "mutating"
}
```

## Acceptance

The decomposition is accepted only when all of the following pass:

- `tasks.json` validates against `tasks.schema.json`.
- `overlap-map.json` validates against `overlap-map.schema.json`.
- Every requirement from the spec appears in at least one task's `requirement_ids`.
- Every task has at least one acceptance bullet and at least one dev-test bullet.
- The dependency graph has no cycles.
- No task's estimate exceeds 8 hours; anything larger is split.
- Files flagged `new: false` all exist in the repo.

## Common failure modes

- **Epic task.** One task that "sets up the backend" and hides 20 hours of work. Split until
  each task fits a single PR.
- **Overlap denial.** Two tasks both edit the same router file and pretend they don't. The
  overlap map is there to be honest about contention; use it.
- **Requirement drift.** Inventing tasks that are not tied to any requirement. Every task
  needs a requirement ID.
- **Phantom files.** `files_touched` lists paths that don't exist and aren't marked `new`.
  Fix by grepping the repo before writing the field.
- **Test-free tasks.** A task with no `dev_test_checklist` entries is not ready to dispatch.
- **Hidden shared state.** Two tasks mutate the same DB table but the overlap is recorded
  only for a file. Record schema overlaps with `overlap_type: "schema"`.
