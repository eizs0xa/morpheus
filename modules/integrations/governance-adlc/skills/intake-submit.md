# Skill: intake-submit

> Shipped by `integrations/governance-adlc`.

Submits an AI Service Intake record to the CoE Portal on spec finalization. This is the single entry point for all AI service requests (downstream of existing business approval).

## When to invoke

Triggered by the `artifact_chain.spec.on_finalize` hook when the first spec for a project is approved.

## Procedure

1. Ensure `governance.risk_tier` has been set by `risk-score`.
2. Build the intake record from the PRD + spec + manifest:
   - agent name, description, owner, cost_center
   - risk_tier, review_track
   - kill_switch block
   - platforms, primary_models, expected_monthly_usd, value_hypothesis
   - links to the PRD and spec in the artifact chain
3. POST to the CoE Portal intake endpoint (via `integrations/coe-portal`).
4. Record the returned `intake_record_id` in `platform-manifest.json`.
5. Block the artifact chain from advancing to `plan` until the intake record is approved and an `agent_registry_id` is assigned.

## SLA

Matches the enterprise AI Service Intake SLAs:

| Review track | SLA |
|---|---|
| accelerated | 2 business days |
| standard    | 5 business days |
| enhanced    | 10 business days |
| board       | next scheduled board |

Template-based requests (`templates/*/template.yaml` with matching `intake_defaults`) qualify for accelerated processing automatically.
