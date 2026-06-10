# Skill: registry-sync

> Shipped by `integrations/coe-portal`.

Pushes the project's current state to the enterprise **Agent Registry** surfaced by the CoE Portal. Runs on every merge to the default branch and on every artifact-chain evaluation event.

## What is synced

From `platform-manifest.json`:

- `agent_registry_id` (key)
- profile, project_type, modules + versions
- `governance.risk_tier`, `review_track`, `decommission.status`
- `governance.kill_switch` (mechanism + owner, not the reference value)
- `cost_tags` (platforms, primary_models, expected_monthly_usd, value_hypothesis, value_confidence)

From the artifact chain:

- Latest PRD, spec, plan, tasks, review, evaluation pointers (URLs, not content)
- Latest value card (from `schemas/value-card.schema.json`)

## Procedure

1. Read `platform-manifest.json` and the artifact chain head.
2. Compose an Agent Registry card matching `templates/agent-registry-card.md.tmpl`.
3. PUT to `${coe_portal_base_url}/api/registry/${agent_registry_id}`.
4. On success, record a `registry-synced` governance event.
5. On failure, fail the CI job and open a Jira incident linked to the project.

## Invariants

- Secrets MUST NOT be synced. Kill-switch `reference` values (e.g. flag names) are OK; tokens are not.
- A registry record MUST NOT be created client-side. It is only created by the intake approval flow; this skill only updates existing records.
