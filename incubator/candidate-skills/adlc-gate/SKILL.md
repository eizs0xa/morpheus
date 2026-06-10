# Skill: adlc-gate

> Shipped by `integrations/governance-adlc`.

Enforces the Agent Development Lifecycle gates across the Morpheus artifact chain. Every stage transition in the chain must satisfy its ADLC acceptance before the chain may advance.

## Gate map

| Artifact chain stage | ADLC acceptance |
|---|---|
| PRD finalized      | value_hypothesis and cost_center declared |
| Spec finalized     | risk-score complete, intake submitted, kill-switch declared |
| Plan finalized     | agent_registry_id assigned by intake approval |
| Tasks finalized    | tasks schema validates, ownership assigned |
| Implementation     | PR-gate + conventional commits + branch naming pass |
| Review             | behavioral confidence tests pass at a threshold matching the risk tier |
| Evaluation         | value card emitted; governance event posted |

## Behavioral confidence thresholds by risk tier

| Risk tier | Required pass rate on behavioral test set |
|---|---|
| 1 | 80% |
| 2 | 90% |
| 3 | 95% |
| 4 | 98% + steward sign-off |

## Procedure

1. Read the current stage of the artifact chain.
2. Validate all acceptances for the current stage.
3. If any fail, block the transition and emit a `gate-failed` governance event with the specific failure.
4. On pass, emit a `gate-passed` event and allow the chain to advance.

## Invariants

- Lowering a behavioral threshold for a given risk tier requires an ADR.
- A failed gate cannot be silently retried more than three times without steward review.
