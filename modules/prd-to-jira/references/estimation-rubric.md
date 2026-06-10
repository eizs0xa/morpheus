# Story Point Estimation Rubric

This rubric is used by the `jira` and `sprint-sequencer` skills when proposing story points. The skill proposes a value; humans can adjust during refinement.

Use Fibonacci sizing:

| Points | Size | Typical shape |
|---:|---|---|
| 1 | Trivial | Config/docs-only change, rename, one small file, no meaningful test burden. |
| 2 | Small | Single service method, component, or script; limited tests; low integration risk. |
| 3 | Medium | One clear feature slice; a few files; happy-path and edge-case tests. |
| 5 | Standard | New route, component, workflow, or persistence touchpoint; several files; full validation needed. |
| 8 | Large | Multi-surface change, new external integration, schema/data change, or significant test burden. |
| 13 | X-Large | Likely spans more than one sprint or one implementation prompt; flag for split before upload. |

## Heuristics

Inputs per task:

- `file_count` - estimated files touched.
- `new_surface` - new API, component, schema, model, workflow, or integration.
- `cross_team` - crosses backend/frontend/data/QA/devops boundaries.
- `dependency_count` - number of blocking dependencies.
- `test_burden` - low, medium, high.
- `unknowns` - unresolved decisions or implementation ambiguity.

Scoring guide:

```text
score = 1
if file_count >= 3: score += 1
if file_count >= 6: score += 2
if new_surface: score += 1
if cross_team: score += 2
if dependency_count >= 2: score += 1
if test_burden == high: score += 2
if test_burden == medium: score += 1
if unknowns: score += 1

points = nearest_fibonacci(score)
```

If the proposed value is `13`, the skill must warn and recommend splitting the work before Jira upload.

## Rules

- Story points estimate implementation and validation complexity, not calendar time.
- Do not inflate points to account for team availability or sprint capacity.
- Do not lower points because an agent will implement the work.
- Keep point values stable when sprint sequencing compresses dates; compression changes schedule assumptions, not work size.
