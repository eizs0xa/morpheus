---
name: spec-author
version: 0.1.0
tier: core
description: Turn a PRD into a structured spec.md that a planner and downstream agents can consume.
when_to_use: |
  - A PRD exists and the team is ready to design the feature.
  - You need a bridge document between "what and why" (PRD) and "how" (plan.md).
  - Downstream skills (planner, decomposer) need a stable, numbered requirements surface.
  - Requirements must be written in EARS-style, traceable form.
when_not_to_use: |
  - No PRD exists — author one first (PRD is out of scope for this skill).
  - You are writing implementation code — use a stack-specific coding skill.
  - You are generating PM tickets — that is the decomposer + integration layer.
  - You are authoring the project constitution — use `constitution-author`.
inputs:
  - prd_path: string (path to PRD markdown or PDF)
  - feature_slug: string (snake_case short name)
  - repo_context: read-only access to project source tree
outputs:
  - spec_md_path: string (written to the feature folder)
  - integration_surface_note: string (internal, attached to final summary)
requires_profiles: [author, builder, steward]
---

# spec-author

## Purpose

Produce a production-grade `spec.md` for a new feature by combining a supplied PRD with
read-only research across the target project. The output is the single source of truth the
planner consumes, and the only place where PRD requirements are normalised into numbered,
testable form.

The skill honours the artifact chain:

```
PRD → spec (this skill) → plan → tasks → implementation → review → evaluation
```

Every PRD Must-Have / Should-Have requirement must appear in the spec's traceability matrix.
Nothing is silently dropped, invented, or reworded into weaker language.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| PRD file path | yes | Markdown preferred; PDF accepted. If multiple candidates exist, ask the user to confirm. |
| Feature slug | yes | `snake_case`, short (e.g. `document_ingest`). Propose one; require approval if there is any ambiguity. |
| Target release window | warn | Pull from PRD if present; otherwise ask once. |
| Out-of-scope callouts | warn | Copy verbatim from PRD "Out of Scope". |

## Process

1. **Load context.** Read the PRD, the project's constitution, and any sibling feature specs.
   Use a read-only search subagent to map the integration surface: existing routes, services,
   modules, components, tables, and tests that the feature will touch.
2. **Confirmation gate.** Print a short block showing the PRD path, proposed slug, target
   output file, and collision check. Wait for approval unless the user pre-approved.
3. **Outline.** Draft section headings in fixed numbered order (see Outputs). Show the one-line
   stub for each section and confirm before filling.
4. **Draft requirements in EARS form.**
   - Ubiquitous: *The system shall …*
   - Event-driven: *When <trigger>, the system shall …*
   - State-driven: *While <state>, the system shall …*
   - Unwanted: *If <condition>, then the system shall …*
   - Optional: *Where <feature included>, the system shall …*
   Number each `R-<n>`. Each requirement traces to a PRD requirement number.
5. **Author the non-functional section.** Performance, availability, security, accessibility,
   observability, and compliance constraints. Pull values from the PRD; do not invent.
6. **Author acceptance criteria.** For each PRD Must-Have, at least one Gherkin scenario.
7. **Author the traceability matrix.** Table columns: `PRD Req # | PRD Requirement | Priority |
   Spec R-# | Acceptance Scenarios | Notes`. Every Must/Should row is populated.
8. **Author the decision log.** For every non-obvious choice, record a row: `Decision | Options
   Considered | Chosen | Rationale | Trade-offs`. This content flows into plan.md and later
   into PM tickets.
9. **Self-review.** Validate against the acceptance list below. Do not write the file until
   every item passes.
10. **Write the spec file** to the feature folder and report: absolute path, section count,
    requirement count, any PRD items parked in Open Questions.

## Outputs

`spec.md` with these sections, in this order:

1. Summary (1–3 sentences, plain English)
2. Context and goals (why now, linked PRD)
3. Requirements (EARS, numbered)
4. Non-functional requirements
5. Acceptance criteria (Gherkin)
6. Out of scope
7. Assumptions
8. Open questions
9. Decision log
10. Traceability matrix
11. References (PRD, constitution, neighbouring specs, source files)

Also produced:

- **Integration surface note** (internal only, attached to the final summary) that lists the
  modules, services, tables, components, and tests the feature will touch.

## Acceptance

The spec is accepted only when all of the following pass:

- Every PRD Must-Have and Should-Have is represented by at least one EARS requirement.
- Every requirement has at least one acceptance scenario.
- No requirement hides an undocumented design decision — put those in the decision log.
- Traceability matrix has no empty PRD Req # cells and no orphaned Spec R-# cells.
- The file validates against the feature-template structure shipped with core.
- Section numbering matches the contract so downstream skills can reference sections by index.

## Common failure modes

- **PRD paraphrase drift.** Rewording a Must-Have until it is weaker than the PRD. Quote the
  PRD verbatim in the traceability matrix; rephrase only in the EARS line.
- **Silent PRD disagreement.** Surface conflicts between PRD and code reality in Open
  Questions. Never quietly "fix" the PRD inside the spec.
- **Speculative requirements.** Only design what the PRD asks for. Future ideas go under Out
  of Scope or Open Questions.
- **Backend-only spec for a full-stack feature.** If the feature has UI, the non-functional
  and acceptance sections MUST cover frontend behavior.
- **Missing decision log.** Every non-trivial choice (library, sync vs async, table shape)
  gets a row. Reviewers and the planner depend on this.
- **Copy-paste from a neighbour spec without research.** The integration-surface note must
  be based on actual search results in the target repo, not pattern mimicry.
