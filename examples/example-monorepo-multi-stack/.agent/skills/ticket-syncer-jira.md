---
name: ticket-syncer-jira
version: 0.1.0
tier: integration
description: Synchronize a unit of work between a local git worktree and a Jira ticket — read ticket, create branch, emit Smart Commit trailers, and drive status transitions through the artifact-chain lifecycle.
when_to_use: |
  - A feature has been decomposed into tasks and each task has (or needs) a Jira key.
  - An agent is about to start implementation and needs a correctly-named branch plus a ticket in the right status.
  - Commit messages must carry Jira Smart Commit trailers so merges automatically transition tickets.
  - A PR is merging and the ticket should advance (e.g. `In Review - Plan` -> `Ready for Release`).
  - Bulk-creating Jira stories from a completed PRD + spec + plan + tasks set under a parent Initiative or Epic.
when_not_to_use: |
  - No Jira project is configured for the project (check `platform-manifest.json` for `pm-jira`).
  - The task is a trivial one-line fix with no ticket — use a `hotfix/*` branch and skip this skill.
  - You are picking sprint priorities or doing capacity planning — this skill does not own sprint scope.
  - You are editing existing Jira tickets in bulk unrelated to the current artifact chain — out of scope.
  - You are creating Jira `fixVersion`s or Initiatives — those are manually pre-created by the team.
inputs:
  - jira_project_key: string (e.g. "PROJ"; from platform-manifest)
  - jira_site_url: string (e.g. "company.atlassian.net")
  - initiative_key: string | null (parent Initiative if any)
  - ticket_source: one of `existing_key | tasks_json | prd_spec_plan_bundle`
  - feature_slug: string (snake_case, matches feature folder)
outputs:
  - branch_name: string (e.g. `feature/PROJ-1234-short-slug`)
  - jira_keys_created_or_updated: string[]
  - smart_commit_trailer_template: string
  - transition_plan: object (maps lifecycle stage -> Jira status name, from `jira-transition-map.yaml`)
requires_profiles: [builder, author, steward]
---

# ticket-syncer-jira

## Purpose

Provide a single, predictable interface between the artifact chain
(`PRD -> spec -> plan -> tasks -> implementation -> review -> evaluation`) and Jira.
Every unit of work has exactly one Jira key. Every branch name carries that key.
Every commit that should move a ticket carries a Smart Commit trailer. Every
lifecycle transition is looked up from `jira-transition-map.yaml` — never
hardcoded in code or in agents.

The skill replaces ad-hoc "create a ticket, then create a branch, then commit
something, then maybe someone drags the card" manual work with a deterministic
flow that the CLI, CI, and agents all agree on.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| Jira project key | yes | Read from `platform-manifest.json` > `modules.pm-jira.prompts.jira_project_key`. Never prompt again. |
| Jira site URL | yes | Read from platform manifest. |
| Parent Initiative key | warn | If present, new Epics are linked to it. If absent, skip linkage and emit a warning (not a block — see preflight `initiative-check.ts`). |
| Ticket source | yes | One of: existing key; `tasks.json` for the current feature; a full PRD+spec+plan bundle (bulk mode). |
| Feature slug | yes | `snake_case`; must match the feature folder under `.agent/features/<slug>/`. |
| Default Jira assignee | warn | If the tasks declare owners, resolve by fuzzy match; otherwise leave unassigned. |

## Process

1. **Load configuration.**
   - Read `platform-manifest.json` and assert `modules.pm-jira` is present. Abort with a clear error if not — this skill is a no-op without the integration.
   - Load `templates/jira-transition-map.yaml` and parse it into a dict `{stage: status_name}`.
   - Load Jira credentials from the environment (never from source files). If missing, abort with a remediation hint (`agentic doctor` will also catch this).

2. **Pick a mode.**
   - **Mode A — single ticket.** Caller supplies an existing Jira key (`PROJ-1234`). Skip creation.
   - **Mode B — tasks.json.** For each task without a `jira_key`, create a Story. Link to the feature Epic (create the Epic on first task if needed).
   - **Mode C — bundle.** Given a PRD + spec + plan + tasks set, create an Epic under the Initiative (if any), then one Story per task.

3. **Preflight.**
   - Call `preflight/initiative-check.ts`. If it returns `status: warning`, surface the remediation options to the user and continue on approval. Do **not** block on missing initiatives (see platform stop-line §6.6).
   - Verify the `fixVersion` exists if one was requested. This skill never creates fixVersions.

4. **Create or update tickets.**
   - Epics: summary = feature title; parent-link = initiative (if supplied).
   - Stories: summary = short, action-oriented; description rendered from a template; acceptance criteria copied verbatim from `spec.md`; story points estimated from task complexity.
   - Record every created key back into `tasks.json` under the matching task, then persist.
   - Wire `blocks` / `is blocked by` links from task dependency markers.

5. **Create or check the branch.**
   - Branch name convention: `<type>/<PROJECT>-<NNNN>-<short-slug>` where `type` is `feature | fix | chore | spike`.
   - `hotfix/*` is the only branch pattern allowed without a Jira key (used for emergency, no-ticket pushes).
   - The `jira-branch-check.yml` workflow enforces this at PR time.
   - If the branch already exists and points at the wrong ticket, abort with guidance — do not silently rename.

6. **Emit the Smart Commit trailer template.**
   - Format: `Jira: <KEY> #<transition-key>`.
   - `<transition-key>` is a key from `jira-transition-map.yaml`, not a literal Jira status name. A renderer replaces the key with the configured status at commit time.
   - Example: `Jira: PROJ-1234 #in_review_plan`.

7. **Drive lifecycle transitions.**
   - On `spec` complete -> transition `in_review_spec`.
   - On `plan` complete -> `in_review_plan`.
   - On `tasks` complete -> `in_review_tasks`.
   - On PR opened for implementation -> `in_progress` (back-transition if needed).
   - On release cut -> `ready_for_release`.
   - On release deployed -> `done`.
   - The `jira-smart-commits.yml` workflow parses trailers on merge and posts a confirmation comment listing every transition that will fire.

8. **Report.**
   - Print a summary table: `task -> jira_key -> branch_name -> next_transition`.
   - Include a one-line conventional-commit summary the user can paste into standup.
   - Log any unresolved assignees, skipped dependencies, or missing custom fields.

## Outputs

- `branch_name`: the exact branch the caller should `git checkout -b` into.
- `jira_keys_created_or_updated`: list of ticket keys, in creation order.
- `smart_commit_trailer_template`: string the implementing agent embeds in every commit message.
- `transition_plan`: structured preview of every lifecycle stage -> Jira status, derived from `jira-transition-map.yaml`.

## Acceptance

- Every created ticket has a non-null summary, description, and acceptance criteria; nothing is silently truncated from `spec.md`.
- Every task in `tasks.json` ends the run with a `jira_key` field or an explicit `jira_key: null` plus a reason.
- Every branch name matches `^(?:feature|fix|chore|spike)/<PROJECT>-\d+-[a-z0-9-]+$` or `^hotfix/.+$`.
- The Smart Commit trailer template resolves to a real status name when rendered against `jira-transition-map.yaml`.
- Preflight warnings (e.g. no Initiative) are surfaced to the user but never block the run.
- No Jira credentials, site URLs hardcoded into source files, or fixVersion names appear in the generated artifacts beyond `platform-manifest.json` and environment variables.

## Common failure modes

- **Wrong project key in branch.** Agent reads a stale manifest. Re-read `platform-manifest.json` before every run.
- **Silent Epic duplication.** Two parallel agents each create a "Feature X" Epic. Mitigate by querying existing Epics by exact summary + initiative before creating.
- **Smart Commit trailer drift.** Agents write `Jira: PROJ-1234 in review` instead of `#in_review_plan`. Always emit the trailer from the configured template; do not free-text.
- **Status-map drift.** Team renames "In Review - Plan" in Jira without updating `jira-transition-map.yaml`. `agentic doctor` must flag unknown status names.
- **Initiative-link panic.** Team has no Initiative. This is a warning, never an error. Do not refuse to create tickets.
- **Credential leak.** Never commit `.env`. The skill asserts `JIRA_API_TOKEN` is present in env and redacts it in all log output.
