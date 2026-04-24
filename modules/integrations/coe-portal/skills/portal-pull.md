# Skill: portal-pull

> Shipped by `integrations/coe-portal`.

Pulls canonical playbooks, standards, and approved template updates from the CoE Portal into the project. Runs on `agentic init`, on `agentic doctor --refresh`, and on a scheduled weekly workflow.

## What is pulled

- **Playbooks & Standards**: delivery, engineering, MLOps, ADLC — written to `docs/reference/coe/` as immutable read-only snapshots tagged with the portal version.
- **Approved template updates**: new versions of `templates/*/template.yaml` that the team has opted into.
- **Enablement resources**: role-based learning-path links written to `docs/for-<profile>/coe-training.md`.

## Procedure

1. GET `${coe_portal_base_url}/api/playbooks?since=<last_pull>`.
2. For each returned artifact, write to the mapped path with a header block recording `source_version`, `pulled_at`, and `portal_sha`.
3. Compute a diff summary. If any playbook changed in a way that materially affects existing gates, write it to `docs/reference/coe/CHANGES.md` and open a Jira task tagged `coe-update`.
4. Commit on the branch `coe/sync-<yyyy-mm-dd>` and open a PR.

## Invariants

- Pulled content is never edited in place. Customization lives under `docs/reference/local/` and layers on top.
- The pull MUST be idempotent and reproducible from the recorded `portal_sha`.
