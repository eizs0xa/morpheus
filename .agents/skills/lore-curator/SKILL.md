---
name: lore-curator
version: 0.1.0
tier: core
description: Steward-only skill. Reviews and merges draft lore entries submitted by the evaluator, promoting observations into binding or advisory lore.
when_to_use: |
  - A draft lore entry has been opened as a PR by the `evaluator` skill.
  - Multiple draft entries need to be reconciled with existing lore (e.g. a new binding supersedes an old one).
  - The steward is auditing the lore store for stale or contradictory entries.
  - A binding entry needs to be downgraded to advisory or deprecated.
when_not_to_use: |
  - You are a builder, verifier, author, or explorer — only the steward can modify the lore.
  - You are authoring a new entry from scratch without a draft — run `evaluator` first so the evidence chain is intact.
  - You are writing user-facing documentation — that is not lore.
  - You are making a design decision that deserves an ADR — open an ADR and link it from the lore, do not substitute.
inputs:
  - draft_pr_ref: string (PR number or local branch of the draft entry)
  - lore_store_path: string (the lore folder)
  - existing_lore_index: read-only handle
outputs:
  - merge_decision: one of [merge, request_changes, reject]
  - curator_notes_md: string
requires_profiles: [steward]
---

# lore-curator

## Purpose

Gatekeep the lore. Every new lore entry starts as an `evaluator`-authored draft; the curator
decides whether it merges as `binding`, merges as `advisory`, is sent back for revisions, or
is rejected. The curator also handles reconciliation when a new entry contradicts or
supersedes an existing one.

This is a steward-only skill. The lore is intentionally small, and its smallness is a
feature. Only the steward can expand it.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| Draft PR reference | yes | The PR opened by `evaluator` or a hand-authored successor. |
| Lore store path | yes | The canonical lore folder for this project. |
| Existing lore index | yes | Used to detect duplicates, supersedes, and contradictions. |

## Process

1. **Triage.** Open the draft. Confirm it has the required frontmatter: `lore_id`,
   `feature_slug`, `merged_at`, `merge_commit`, `status`, `scope`. Missing frontmatter ⇒
   request changes.
2. **Check the evidence chain.** Every binding entry must reference a merge commit and at
   least one concrete file path or module. Request changes if either is missing.
3. **Check for duplicates.** Search the lore index for entries with overlapping `scope` and
   similar claims. If a duplicate exists, either consolidate or mark one as `deprecated`
   with a link to the replacement.
4. **Resolve contradictions.** If the draft contradicts an existing binding entry, do not
   merge silently. Require an ADR that captures the change of direction; link both the old
   and new entries from it.
5. **Decide the status.** Binding if the draft names a rule future work must follow;
   advisory if it names a pattern or observation. Err on the side of advisory; binding lore
   is expensive.
6. **Edit for clarity.** Rewrite for brevity. One-paragraph summary, bulleted Binding list,
   bulleted Advisory list, References list. No prose sprawl.
7. **Merge.** Use the project's merge style. Record the merge in a curator-notes block at
   the top of the lore entry: curator name, merge date, decision rationale.
8. **Announce.** Post a short summary to the team's chosen channel (delegated to the
   workspace notifier skill) so future reviewers know the lore has shifted.
9. **Prune if needed.** Review adjacent entries; mark any that are now superseded.

## Outputs

- `merge_decision`: `merge | request_changes | reject`.
- `curator_notes.md`: a short markdown block written into the merged entry (or attached to
  the PR when not merging) that captures the curator's reasoning.

## Acceptance

The curation is accepted only when all of the following pass:

- The merged entry has complete frontmatter and an evidence chain.
- No two active entries make contradictory claims over the same scope.
- Every downgrade, supersede, or deprecate is reflected in both the old and new entry.
- The merge includes a curator-notes block naming the curator and the rationale.
- An ADR exists when the merge represents a change of direction.
- The lore index remains human-readable; excessive bloat triggers a pruning pass.

## Common failure modes

- **Lore bloat.** Merging every draft as binding. The lore becomes unreadable and the
  signal drops. Default to advisory; promote deliberately.
- **Silent contradiction.** Merging a new binding entry that quietly overrides an old one.
  Require an ADR and explicit supersede markers.
- **Ghost entries.** Merging entries with no `scope` or no file references. Future
  `lore-reader` searches will miss them.
- **Curator absentee.** Auto-merging drafts without review. The curator is a human or a
  steward-profile agent; the lore is not a dumping ground.
- **Cascade denial.** Merging a supersede without marking the prior entry `deprecated`.
  Leaves two binding entries in force.
- **Drive-by pruning.** Deleting old lore rather than deprecating it. Deprecation preserves
  history; deletion loses it.
