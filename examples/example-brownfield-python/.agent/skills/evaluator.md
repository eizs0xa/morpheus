---
name: evaluator
version: 0.1.0
tier: core
description: After a feature merges, run the holdout test suite and author a draft lore entry capturing what was learned.
when_to_use: |
  - A feature branch has merged to the default branch and acceptance criteria passed.
  - A holdout (out-of-sample) test set exists for this domain and has not been exercised.
  - The team has agreed to capture learnings as lore for future work in this area.
  - A post-merge audit is part of the definition of done.
when_not_to_use: |
  - The feature has not merged yet — evaluator runs after the fact, not instead of CI.
  - There is no holdout suite — build one first (see verifier skills in the stack modules).
  - The learning is a design decision that deserves its own ADR — author an ADR instead.
  - You are writing end-user documentation — that is a separate skill.
inputs:
  - feature_slug: string
  - merge_commit: string
  - holdout_suite_ref: string (test target, e.g. pytest marker or test file path)
  - spec_md_path: string
outputs:
  - evaluation_report_md: string
  - draft_lore_entry_md: string (a PR candidate for the lore folder)
requires_profiles: [verifier, steward]
---

# evaluator

## Purpose

Close the loop on a merged feature. Run the holdout tests (tests written independently of the
implementing agent, held out from the train-time loop), capture any gaps between what the
spec promised and what the system now does, and produce a draft lore entry that records what
future work in this area should know.

The evaluator is a steward-friendly skill: its output is almost always a PR into the lore
store, which the `lore-curator` later reviews and merges.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| Feature slug | yes | Used for the lore entry title and path. |
| Merge commit | yes | The baseline for running holdout tests. |
| Holdout suite reference | yes | A runnable target (pytest marker, Jest project, etc.). |
| Spec path | yes | Needed to compare promises against observed behaviour. |

## Process

1. **Pin the baseline.** Check out the merge commit in a clean workspace. Record the commit
   SHA and timestamp in the report.
2. **Run the holdout suite.** Do not edit the tests. Record the full result summary: pass,
   fail, skip, time. If any test fails, capture the first-failure excerpt.
3. **Compare against the spec.** For each acceptance scenario in `spec.md`, confirm a
   corresponding holdout assertion exists. Gaps become notes in the report.
4. **Measure non-functional characteristics.** Where the spec sets targets (latency,
   throughput, accessibility score), record the observed value.
5. **Surface surprises.** Performance regressions, dependency changes, unexpected coverage
   shifts. Record them as observations, not claims of causation.
6. **Draft the lore entry.** Title, date, feature slug, merge commit, one-paragraph summary,
   and a bulleted `Binding` vs `Advisory` list. Binding items are decisions or constraints
   future work must respect; advisory items are observations that inform future work but
   do not bind it.
7. **Cross-link.** The draft lore entry references the spec, the plan, and at least one
   concrete file path that future readers should study.
8. **Hand off.** The draft lore entry is submitted as a PR into the lore folder for the
   `lore-curator` to review.

## Outputs

- `evaluation_report.md`: a markdown report with:
  - Baseline commit and timestamp.
  - Holdout results summary and any failing excerpts.
  - Spec vs observed table (acceptance scenario → status → evidence).
  - Non-functional measurements vs targets.
  - Observations and surprises.
- `draft_lore_entry.md`: a PR-ready file for the lore folder with frontmatter:

```yaml
---
lore_id: <slug>
feature_slug: <slug>
merged_at: <YYYY-MM-DD>
merge_commit: <sha>
status: advisory  # or binding — curator decides
scope:
  - <path or module>
---
```

## Acceptance

The evaluation is accepted only when all of the following pass:

- The holdout suite ran and the report lists counts and any failing excerpts.
- Every acceptance scenario in `spec.md` has a row in the spec-vs-observed table.
- Non-functional targets in the spec each have a measured value (or an explicit "not
  measurable today" note).
- The draft lore entry includes both Binding and Advisory sections, even if one is empty.
- The draft lore entry references at least one concrete file path.

## Common failure modes

- **Post-hoc test edits.** Changing holdout tests to match observed behaviour. Never. Record
  the gap; the team decides whether to extend the spec or fix the code.
- **Lore as diary.** Vague prose that does not bind future work. Force Binding vs Advisory
  categorisation.
- **Orphan lore.** A draft entry with no `scope` field and no file references. Future readers
  cannot find it; it is lost the moment it merges.
- **False-positive "pass".** Declaring success because the green bar was green, without
  checking that each spec acceptance scenario is actually covered by a holdout test.
- **Scope creep.** Writing an ADR in the lore entry. If it is a major decision, raise an ADR
  instead and link it from the lore entry.
- **Skipping the handoff.** Leaving the draft on disk instead of opening a PR. The lore is
  only valuable once the curator has seen it.
