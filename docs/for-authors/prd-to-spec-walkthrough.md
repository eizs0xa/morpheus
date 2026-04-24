# PRD to spec walkthrough

> The `author` profile workflow: take a PRD into a structured `spec.md` ready for `builder` hand-off.

## Where `author` sits in the spine

The artifact chain is:

```
PRD → spec → plan → tasks → implementation → review → evaluation
```

`author` owns the **PRD → spec** step. Downstream profiles consume the spec:

- `builder` runs `planner` → `decomposer` → coding skills.
- `verifier` reads spec acceptance criteria to author tests and holdouts.
- `steward` reviews the spec against the project constitution.

## When to use the `author` profile

- You are writing specs, PRDs, or design docs full-time.
- You do not plan to commit code (`can_commit_code: false` in [`../../modules/core/profiles.yaml`](../../modules/core/profiles.yaml)).
- You want the scaffolding limited to PRD/spec templates — no coding-agent skills surfaced.

If you need to both author and code, use `builder` or `steward` instead. Author is the narrow, text-focused profile.

## Preconditions

- Morpheus is initialized in the repo (`platform-manifest.json` exists).
- You have a PRD — draft or polished — as a Markdown file.
- The PRD has a Jira key (or equivalent PM ticket) associated with it.

## The workflow

### 1. Init as author

If the repo was scaffolded for a different profile, resume with the author profile:

```bash
agentic init --profile author --resume
```

Or, on a fresh repo:

```bash
agentic init --profile author
```

Author-profile scaffolding includes only:

- `.agent/platform-manifest.json`
- `.agent/feature-template/prd.md.tmpl`
- `.agent/feature-template/spec.md.tmpl`
- The workspace MCP config.
- Pointer files (`AGENTS.md`, etc.).

Per `profiles.yaml`, `author` gets `spec-author` and `decomposer-read` (read-only). No coding-agent or tester skills surface.

### 2. Create a feature folder

```bash
agentic feature new --intent=prd PROJ-1234        # planned; for v0.1.0, do it manually:
mkdir -p .agent/features/coupon-engine
cp .agent/feature-template/prd.md.tmpl .agent/features/coupon-engine/prd.md
cp .agent/feature-template/spec.md.tmpl .agent/features/coupon-engine/spec.md
```

`coupon-engine` is the feature slug. Use the same slug downstream for tasks, branches, and holdouts.

### 3. Fill the PRD

Open `.agent/features/coupon-engine/prd.md` and write:

- **Problem** — what user pain this solves.
- **Outcomes** — measurable business outcomes (not feature counts).
- **Users** — primary personas.
- **Constraints** — regulatory, technical, organizational.
- **Success metrics** — how you'll know it worked.
- **Non-goals** — what this PRD explicitly does not cover.
- **Links** — Jira key, design files, research docs.

The PRD template ships with these sections pre-wired. Don't add new top-level sections without a steward conversation.

### 4. Invoke `spec-author`

The `spec-author` skill converts PRD → spec. See [`../../modules/core/skills/spec-author.md`](../../modules/core/skills/spec-author.md) for the full contract.

Inputs it expects:

- `prd_path`: `.agent/features/coupon-engine/prd.md`
- `feature_slug`: `coupon-engine`
- `repo_context`: read-only access to the project tree

Output:

- `spec_md_path`: `.agent/features/coupon-engine/spec.md`

Invoke via your agent runtime (Claude, Copilot, Cursor, etc.) by asking:

> "Run the `spec-author` skill on `.agent/features/coupon-engine/prd.md` with feature slug `coupon-engine`."

### 5. Review the spec

The spec should contain:

- **Purpose** — one paragraph restating the problem.
- **Requirements** — numbered, EARS-style. Example: `REQ-001: When a user applies a percentage coupon, the system SHALL ensure the resulting price is not below the product floor.`
- **Acceptance criteria** — bulleted, verifiable. Each criterion maps back to a REQ.
- **Out of scope** — explicit, referenced against the PRD's non-goals.
- **Open questions** — items the author could not resolve; blockers for hand-off.

Run a pass against the spec yourself:

- Every REQ has a unique ID.
- Every acceptance criterion cites a REQ.
- No open questions are blockers for the hand-off. If there are blockers, resolve them now.

### 6. Review with the steward

Post the spec for steward review. The steward checks:

- Alignment with the project [constitution](../../CONSTITUTION.md) and lore.
- No scope creep beyond the PRD.
- No requirements that violate stop-lines or composition rules.

When the steward approves, the spec is frozen for this iteration.

### 7. Hand off to `builder`

The hand-off is the spec file path plus the feature slug. Post a message to the team's notifier channel:

> "`spec-author` complete for `coupon-engine`. Spec at `.agent/features/coupon-engine/spec.md`. Ready for `planner`."

A `builder` picks it up and runs `planner` → `decomposer` → implementation. See [../for-engineers/new-project-walkthrough.md](../for-engineers/new-project-walkthrough.md) for the builder side.

### 8. Stay available

Author doesn't disappear after hand-off:

- `planner` may ask clarifying questions — answer them and update the spec.
- `reviewer` may flag a spec gap during PR review — amend the spec, not the PR.
- `evaluator` may find the spec didn't capture a real-world scenario — update the spec for the next iteration.

Every update bumps the spec's internal revision number. Keep the history in the file itself (`## Revisions` table at the bottom).

## Templates

| Template | Path |
|----------|------|
| PRD | `modules/core/templates/feature-template/prd.md.tmpl` |
| Spec | `modules/core/templates/feature-template/spec.md.tmpl` |
| Plan | `modules/core/templates/feature-template/plan.md.tmpl` |
| Tasks | `modules/core/templates/feature-template/tasks.json.tmpl` |

Author only fills PRD and spec. Plan and tasks are builder territory.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `spec-author` produces generic requirements | PRD lacks concrete constraints. | Sharpen the PRD first; re-run. |
| Spec contradicts lore | Author didn't consult `lore-reader`. | Run `lore-reader` with the feature slug as query; revise. |
| Steward rejects the spec at hand-off | Scope crept beyond PRD. | Cut the extra requirements; open a follow-up PRD. |
| Builder's questions keep coming back to author | Acceptance criteria are vague. | Make each criterion a unit-test-sized assertion. |

## Related docs

- [`spec-author` skill](../../modules/core/skills/spec-author.md)
- [`planner` skill](../../modules/core/skills/planner.md)
- [`decomposer` skill](../../modules/core/skills/decomposer.md)
- [Skill catalog](../reference/skill-catalog.md)
