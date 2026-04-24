# Skill: story-emitter

> Shipped by `integrations/pm-jira`. Pattern extracted from SEEK's `generate-jira-stories` skill.

Emits Jira stories from the Morpheus artifact chain. When the chain advances past `tasks`, each task becomes a Jira story, linked to the parent initiative and tagged with the project's `agent_registry_id` and `risk_tier`.

## When to invoke

Triggered by the `artifact_chain.tasks.on_finalize` hook. Also callable manually: `agentic jira sync`.

## Procedure

1. Read `tasks.json` validated against `core/schemas/tasks.schema.json`.
2. Read `platform-manifest.json` for `governance.agent_registry_id`, `governance.risk_tier`, and the Jira `initiative_key`.
3. For each task:
   - Compose a story matching `templates/jira-story.md.tmpl`.
   - Populate the custom fields `risk_tier_field` and `agent_registry_field` if configured.
   - Add the Initiative link if present.
   - Add `blocks`/`is-blocked-by` links per the task's `depends_on`.
4. POST to Jira. Record the returned issue key back into `tasks.json` so the link is bidirectional.
5. Emit an `adlc.tasks.synced` event to `governance-adlc`.

## Invariants

- Idempotent: re-running MUST NOT create duplicate stories. Match on a task's stable `id` stored in a Jira property.
- The artifact chain, not Jira, is the source of truth for task content. Jira stories are a projection.

## Why this matters

Cross-team automated tracking only works if every project emits the same story shape with the same governance fields. This skill is what lets the CoE Portal roll up in-flight work across the enterprise without each team building a custom dashboard.
