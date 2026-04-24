---
name: reviewer
version: 0.1.0
tier: core
description: Review a pull request against the project constitution, the originating spec, prior lore, and stack-specific standards. Produce an actionable review, not a rubber stamp.
when_to_use: |
  - A coding agent or human has opened a PR against a task branch or the feature branch.
  - You need a consistent review independent of the author.
  - You want the review to enforce the constitution and cite lore where relevant.
  - CI has passed but a human-quality review is still required before merge.
when_not_to_use: |
  - You are the author of the PR — a self-review is not a review.
  - The PR has not finished CI — re-run after CI completes.
  - You are triaging a CI failure — use `fixer`.
  - You are merging task PRs into the feature branch — use `integrator`.
inputs:
  - pr_ref: string (repo + number, or branch + base)
  - constitution_path: string (project constitution)
  - spec_md_path: string (the spec that drove this PR)
  - lore_index: handle for lore-reader
outputs:
  - review_comments: list of structured comments (file, line, severity, message, citation)
  - review_verdict: one of [approve, request_changes, comment]
  - review_summary_md: string
requires_profiles: [builder, verifier, steward]
---

# reviewer

## Purpose

Review a pull request the way a careful senior engineer would: read the diff, read the spec,
read the constitution, search the lore, and produce comments that are specific, cited, and
actionable. The review verdict is one of `approve`, `request_changes`, or `comment`; there is
no fourth option, and "LGTM" without evidence is not an approval.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| PR reference | yes | Either `{owner}/{repo}#{number}` or `{branch}..{base}` for local review. |
| Project constitution | yes | The binding rules for this codebase. |
| Spec file | yes | The spec that drove the PR. Pulled from the linked task. |
| Lore index | warn | If present, search for binding prior decisions in the area touched by the diff. |

## Process

1. **Read the diff first.** Get a shape — how many files, which areas, what the PR claims to
   do. If the diff is > 400 changed lines, flag it immediately and ask for a split.
2. **Load the constitution.** Identify any non-negotiables that apply to the areas the diff
   touches: security gates, testing thresholds, boundary rules.
3. **Load the spec.** Every changed requirement should trace back to a spec requirement ID.
   If the PR introduces behaviour not in the spec, that is a review blocker.
4. **Search the lore.** Use `lore-reader` against each file path in the diff. Pull any
   binding entries and attach them to the review as citations.
5. **Run the per-file pass.** For each changed file: check structure, naming, error handling,
   tests, observability. Compare against the applicable stack skill and instructions.
6. **Run the cross-cutting pass.** Security (authn, authz, input validation, secrets,
   injection surfaces). Performance (N+1, sync-in-async, unbounded queries). Accessibility
   (if the diff touches UI). Data compliance (schema migrations, PII handling).
7. **Check the tests.** Do the new tests actually exercise the new behaviour? Are failure
   modes covered, not just the happy path? Do test names describe behaviour?
8. **Compose comments.** Each comment has: file, line (if applicable), severity
   (`blocker | major | minor | nit`), message, and at least one citation (constitution clause,
   spec requirement ID, lore entry, or stack instruction). Comments without citations are
   opinions; opinions without citations are noise.
9. **Render the summary.** A top-of-PR comment with the verdict, a bulleted list of
   blockers and majors, and a link to each citation.
10. **Emit the verdict.** `approve` requires zero blockers and zero unresolved majors.
    Otherwise `request_changes`. If there are only nits and comments, `comment`.

## Outputs

- `review_comments`: array of objects `{file, line?, severity, message, citation[]}`.
- `review_verdict`: one of `approve | request_changes | comment`.
- `review_summary.md`: top-of-PR comment suitable for pasting into the PM/review tool.

## Acceptance

The review is accepted only when all of the following pass:

- Every blocker or major comment cites at least one source (constitution, spec, lore, or
  instruction file).
- The verdict is `approve` only if there are no outstanding blockers or majors.
- The review summary includes the spec requirement IDs covered by the diff.
- Every file in the diff has been opened at least once (no "drive-by" reviews).
- The review surfaces at least one positive observation when `approve` — reviews are not
  purely adversarial.

## Common failure modes

- **Rubber stamp.** "LGTM" on a 600-line PR. Use the size trigger and request a split.
- **Opinion without citation.** "I would have done X." Either cite why or drop the comment.
- **Spec blindness.** Reviewing only the diff without checking the spec. Undocumented
  behaviour is the most common smuggled change.
- **Lore amnesia.** Missing a binding prior decision because the lore was not searched.
  Always run `lore-reader` against the changed paths.
- **Test theatre.** Approving because "there are tests" without reading what the tests
  actually assert.
- **Scope creep.** A PR that goes beyond the task it claims to implement. Flag and ask for a
  new task, do not approve "while we're in here" changes.
- **Security gap.** Missing authn/authz, secret leaks, injection risks. The reviewer owns the
  last defence here; treat every security comment as a blocker until proven otherwise.
