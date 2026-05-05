# Skill: story-emitter

> Shipped by `integrations/pm-jira`. Pattern extracted from SEEK's `generate-jira-stories` skill.

Emits Jira stories from the Morpheus artifact chain. When the chain advances past `tasks`, each task becomes a Jira story, linked to the parent initiative and tagged with the project's `agent_registry_id` and `risk_tier`. Each story includes a **structured agent prompt** (composed by `story-prompt-composer`) that a developer can copy-paste directly into any coding agent to start implementation without additional context-gathering.

## When to invoke

Triggered by the `artifact_chain.tasks.on_finalize` hook. Also callable manually: `agentic jira sync`.

## Procedure

1. Read `tasks.json` validated against `core/schemas/tasks.schema.json`.
2. Read `platform-manifest.json` for `governance.agent_registry_id`, `governance.risk_tier`, and the Jira `initiative_key`.
3. For each task:
   a. **Compose the agent prompt** — invoke `story-prompt-composer` with:
      - The task object from `tasks.json`.
      - Paths to the feature `spec.md` and `plan.md`.
      - Path to `.agent/constitution.md`.
      - The platform manifest.
      - `related_file_paths` resolved from the task's `touches` field (if present), otherwise leave empty and let the composer search.
      - `prior_art_examples` resolved from any `examples` field on the task.
      - `jira_key`: null at this point (assigned by Jira on creation; updated in step 4).
   b. **Compose the story body** — render `templates/jira-story.md.tmpl`, embedding the `agent_prompt` output from step 3a under the `## Agent Prompt` section.
   c. **Set governance fields** — populate `risk_tier_field` and `agent_registry_field` if configured in the manifest.
   d. **Add the Initiative link** if `initiative_key` is present.
   e. **Add dependency links** — `blocks`/`is-blocked-by` per the task's `depends_on`.
4. POST to Jira. Record the returned issue key back into `tasks.json` so the link is bidirectional.
5. **Backfill the Jira key into the agent prompt** — update the `## Agent Prompt` section in the Jira story description with the real `PROJ-NNNN` key (replace the `null` placeholder used during composition). This keeps the Smart Commit trailer in the prompt accurate.
6. Emit an `adlc.tasks.synced` event to `governance-adlc`.

## Invariants

- Idempotent: re-running MUST NOT create duplicate stories. Match on a task's stable `id` stored in a Jira property.
- The artifact chain, not Jira, is the source of truth for task content. Jira stories are a projection.
- The agent prompt is regenerated on every re-run if the spec, plan, or task has changed since the last emit.

## Why this matters

Cross-team automated tracking only works if every project emits the same story shape with the same governance fields. Embedding the structured agent prompt inside each story means any team member or agent can pick up any ticket and start work immediately — no Confluence hunting, no "ask the author for context", no onboarding lag.
