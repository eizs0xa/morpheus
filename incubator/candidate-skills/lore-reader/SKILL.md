---
name: lore-reader
version: 0.1.0
tier: core
description: Search and read the project's lore store. Returns cited lore entries in a structured, linkable format suitable for planners, reviewers, and coding agents.
when_to_use: |
  - A planner or coding agent is about to touch a file, module, or subsystem.
  - A reviewer needs to check if a proposed change conflicts with a prior decision.
  - A new teammate or agent is being onboarded into a subsystem.
  - An ADR is being drafted and needs to cite prior lore.
when_not_to_use: |
  - You are authoring a new lore entry — that happens in `evaluator` (draft) and `lore-curator` (merge).
  - You are modifying the lore — only `lore-curator` can.
  - You are looking for user-facing documentation — that lives under `docs/`, not lore.
  - You need real-time metrics — the lore is editorial, not a dashboard.
inputs:
  - query: string (natural language, file path, or module name)
  - scope_filter: optional list of paths/modules to constrain the search
  - status_filter: optional list [binding, advisory, deprecated]
outputs:
  - lore_matches: list of structured lore citations
requires_profiles: [builder, verifier, author, explorer, steward]
---

# lore-reader

## Purpose

Make the project's accumulated institutional knowledge queryable. Lore entries capture what
future work in this area should know: binding decisions, advisory observations, and
deprecated approaches. `lore-reader` returns matches in a consistent citation format so
every downstream skill can quote them without ambiguity.

`lore-reader` is read-only. It is available to every profile because every profile benefits
from context; only the steward (via `lore-curator`) can modify the lore itself.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| Query | yes | A natural-language question, a file path, or a module name. |
| Scope filter | no | Constrain to specific paths, modules, or feature slugs. |
| Status filter | no | Default includes `binding` and `advisory`; add `deprecated` explicitly to include superseded entries. |

## Process

1. **Index check.** If no lore index exists, return an empty result with a note. Do not
   fabricate entries.
2. **Classify the query.** Three cases: natural language, file path, module/feature slug.
   Each case uses a different matcher.
3. **Run the search.** Combine exact path/module matches with a text search over lore
   bodies. Weight binding entries higher than advisory entries.
4. **Apply filters.** Scope first, then status. Deprecated entries are excluded unless the
   caller explicitly asks for them.
5. **Rank results.** Prefer recent entries over old ones when other signals tie. Deduplicate
   entries that cite the same merge commit.
6. **Format each match.** The output citation shape is fixed (see Outputs). Callers depend
   on this shape.
7. **Attach a one-line summary** to each match so the caller can decide whether to open
   the full entry.
8. **Emit zero matches honestly.** If nothing matches, return an empty array with the
   queries that were tried. Never synthesise a plausible-sounding lore entry.

## Outputs

`lore_matches`: an ordered list, highest relevance first. Each item shape:

```json
{
  "lore_id": "string",
  "title": "string",
  "status": "binding | advisory | deprecated",
  "scope": ["string", "..."],
  "merged_at": "YYYY-MM-DD",
  "merge_commit": "sha",
  "summary_line": "one-sentence takeaway",
  "source_path": "path/to/lore/entry.md",
  "binding_note": "string — present only if status is binding"
}
```

When callers render the citation they should use:

```
[LORE-<lore_id>] <title> — <summary_line>
  status=<status>  merged=<merged_at>  source=<source_path>
```

## Acceptance

The search is accepted only when all of the following pass:

- Every returned match points to a real file in the lore store.
- Every `binding` match includes a non-empty `binding_note`.
- Deprecated entries are excluded unless the caller requested them.
- The result is deterministic for identical inputs (stable ordering on ties).
- An empty result set returns `[]`, not `null`, and names the queries tried.

## Common failure modes

- **Fabricated lore.** Returning invented entries when the store is empty. Never. Empty is
  a valid, useful answer.
- **Silent dedup.** Dropping relevant entries that happen to share a commit SHA. Collapse
  only when both entries point at the same file and carry the same claim.
- **Status confusion.** Treating advisory entries as binding. The `status` field is the
  contract; callers act on it.
- **Stale deprecated entries.** Returning deprecated entries by default drowns signal in
  noise. Exclude by default; include only on explicit request.
- **Path-only queries.** Matching just on path misses lore entries that describe a decision
  without naming the file. Combine path match with text match.
- **Citation drift.** Returning differently-shaped citations across calls. Keep the shape
  frozen; downstream skills parse it.
