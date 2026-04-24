# Rollout guide

> Six-phase adoption plan for introducing Morpheus to an engineering org. One management checkpoint per phase. Designed to keep scope tight and proof-of-value early.

## Phase 0 — Platform readiness

**Objective:** Morpheus is installable and the platform team can dogfood it.

Exit criteria:

- [ ] `agentic --version` prints the target version in every maintainer's shell.
- [ ] `agentic init` + `agentic validate` pass on a scratch greenfield directory.
- [ ] The platform repo has CODEOWNERS covering every module.
- [ ] `CHANGELOG.md` has an entry for the target version.
- [ ] `docs/` coverage is ≥ 90% against the doc index (this file tree).

**Checkpoint (manager):** platform lead demos `agentic init` end-to-end in a 15-minute recording. If the demo requires manual workarounds, block Phase 1.

## Phase 1 — Friendly pilot (one team, one project)

**Objective:** one team scaffolds one real project and ships a feature through the artifact chain.

Duration: 2 weeks.

Entry criteria:

- A volunteer team with a net-new or low-risk project.
- A dedicated steward identified and trained (has read [constitution-authoring.md](../for-stewards/constitution-authoring.md)).

Exit criteria:

- [ ] `agentic init` ran successfully in the project.
- [ ] A project constitution exists at `.agent/constitution.md`.
- [ ] At least one feature went PRD → spec → plan → tasks → merge.
- [ ] `agentic validate` returns exit `0` in CI.
- [ ] The team documented 3–5 friction points. Platform team responded.

**Checkpoint (manager):** 30-minute retro with the pilot team. Capture: what accelerated, what got in the way, what they want next. Publish the retro summary to the engineering channel.

## Phase 2 — Second pilot (different shape)

**Objective:** cover a different project shape than Phase 1. If Phase 1 was a greenfield web app, Phase 2 is a brownfield service or a data-engineering project.

Duration: 2–3 weeks.

Exit criteria:

- [ ] Brownfield overlay applied without source modification.
- [ ] At least one rollback rehearsed successfully.
- [ ] Phase 1 friction points have proposed fixes in the platform (or explicit ADRs deferring them).
- [ ] Module gaps surfaced by Phase 2 have filed issues with the `module-request` label.

**Checkpoint (manager):** joint retro between Phase 1 and Phase 2 teams. Compare friction points. Decide: do we expand or iterate?

## Phase 3 — Expansion (3–5 teams)

**Objective:** prove the platform scales across teams with different stacks.

Duration: 6–8 weeks.

Entry criteria:

- At least one module or skill shipped that resolved a Phase 1/2 friction point.
- Rollout playbook drafted from Phases 1–2 (onboarding doc, FAQ).

Exit criteria:

- [ ] Each team has a named steward and a project constitution.
- [ ] Platform metrics dashboard up (see [measuring-impact.md](measuring-impact.md)).
- [ ] Escalation paths documented (see [escalation-paths.md](escalation-paths.md)).
- [ ] No team reports blocked on a missing module for > 5 business days.

**Checkpoint (manager):** monthly review of platform metrics. Adoption, freshness, velocity. If any metric is flat or declining, call a tactical retro before expanding further.

## Phase 4 — Org-wide opt-in

**Objective:** any team in the org can opt in with self-service docs. Platform team is on-call but not hand-holding.

Duration: ongoing.

Entry criteria:

- Self-service path clearly documented under `docs/getting-started.md` + engineer walkthroughs.
- A module-request issue template exists and is used.
- Steward ring has ≥ 5 people who can train a new steward.

Exit criteria (evergreen):

- [ ] New teams onboard without platform-team synchronous involvement.
- [ ] Module contributions come from non-platform teams.
- [ ] Platform team spends < 20% of its time on direct team support.

**Checkpoint (manager):** quarterly. If platform-team support time exceeds 20%, investigate: is docs rot to blame, or a genuine module gap?

## Phase 5 — Platform maturity

**Objective:** Morpheus is load-bearing. Breaking changes are rare, deliberate, and routed through ADRs.

Entry criteria:

- Platform has shipped a major (vX.0.0) with a migration script.
- The migration landed cleanly on ≥ 3 teams.

Evergreen duties:

- [ ] Release cadence formalized (was on-demand; may move to monthly).
- [ ] Breaking changes require a 60-day deprecation window (platform constitution §5).
- [ ] ADRs for every major decision.
- [ ] Lore curation norms are documented; stewards peer-review lore merges.

**Checkpoint (manager):** half-yearly platform health review. Read the last 6 months of ADRs, CHANGELOG, and escalations. Flag drift.

## Phase 6 — Steady state + evolution

**Objective:** platform evolves without fragmentation.

This isn't a phase with an exit — it's the posture after Phase 5.

Management practices:

- Stewards meet monthly as a guild. Share lore, surface gaps, unblock each other.
- Platform team has a lightweight roadmap published to all teams.
- Deprecations are announced in advance with migration scripts ready.
- Dead modules are deprecated, not quietly abandoned.

**Checkpoint (manager):** annual. Is the platform still serving teams, or serving itself?

## Anti-patterns to avoid

| Anti-pattern | Why it kills rollout |
|--------------|----------------------|
| Mandating adoption before Phase 2 exits. | You skip the feedback loop; friction compounds. |
| Skipping the steward role. | Constitutions don't author themselves; lore rots. |
| Treating profiles as permissions. | Violates the platform constitution's §2-3. |
| Building project-specific modules in a team's private repo. | Fragmentation. File a module-request instead. |
| "Lift and shift" old conventions into the constitution unchanged. | The constitution becomes a museum, not a tool. |

## Related docs

- [Measuring impact](measuring-impact.md)
- [Escalation paths](escalation-paths.md)
- [Platform constitution](../../CONSTITUTION.md)
- [ADR-004 — open questions resolved for v0.1](../decisions/ADR-004-open-questions-v0.1.md)
