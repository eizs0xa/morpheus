# Skill: kill-switch

> Universal. Shipped by `core`. Every Morpheus project inherits this.

Maps to the enterprise **Agent Governance Operating Model — Kill Switch**. Every agent must have a declared, tested mechanism to be halted immediately without a deploy.

## When to invoke

- An agent is producing unsafe, non-compliant, or out-of-policy output.
- A cost anomaly has been detected by the ROI Measurement Framework.
- A governance steward has revoked authorization.
- An incident response requires immediate containment.

## Invariants

1. Every production project MUST set `governance.kill_switch` in `platform-manifest.json` (mechanism + owner + reference). The `doctor` command fails if it is missing on a project with `risk_tier >= 2`.
2. The kill-switch mechanism MUST be exercisable **without a code deploy**. Preferred mechanisms, in order: `feature_flag`, `env_var`, `api_disable`, `deploy_rollback`, `manual`.
3. The kill-switch MUST be exercised at least once in non-production as part of the Agent Development Lifecycle (ADLC) acceptance.
4. Triggering the kill-switch MUST emit a governance event (see `integrations/governance-adlc`) to the CoE Portal.

## Procedure (agent-executable)

1. Read `governance.kill_switch.mechanism` and `governance.kill_switch.reference` from `platform-manifest.json`.
2. Confirm the on-call owner (`governance.kill_switch.owner`) has authorized containment. Record the authorization.
3. Execute the containment according to mechanism:
   - `feature_flag` → flip the referenced flag to `off`.
   - `env_var` → set the referenced variable to the documented disabled value and restart targets.
   - `api_disable` → call the documented admin disable endpoint.
   - `deploy_rollback` → redeploy the last known-good release from the release train.
   - `manual` → follow the referenced runbook.
4. Verify traffic to the agent is zero within 5 minutes. If not, escalate.
5. Post a containment event to the governance-adlc integration with `agent_registry_id`, reason, timestamp, and operator.
6. Open a Jira incident linked to the project's initiative.

## Stop-lines

- **Never** bypass the owner authorization step unless in a declared enterprise incident.
- **Never** remove the kill-switch block from the manifest as a "fix" for a doctor failure.

## Acceptance for ADLC

- The kill-switch has been exercised end-to-end in a non-production environment.
- The post-exercise governance event appears in the CoE Portal Agent Registry entry.
