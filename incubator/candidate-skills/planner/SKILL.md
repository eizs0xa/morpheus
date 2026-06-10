---
name: planner
version: 0.1.0
tier: core
description: Turn a spec.md into a plan.md with phased architecture, dependency graph, estimates, and risk register.
when_to_use: |
  - A spec.md is complete and has passed human review.
  - You need a technical plan with phases, dependencies, and estimates before decomposing into tasks.
  - Multiple agents or teammates will work in parallel and need a shared picture of the architecture and sequencing.
  - Stakeholders want to see risks, mitigations, and a phase-by-phase exit criteria list.
when_not_to_use: |
  - The spec is still in draft — run `spec-author` first.
  - You are generating PM tickets directly — that is `decomposer` followed by an integration skill.
  - You are making a standalone ADR — ADRs live in `docs/decisions/`, not in plan.md.
  - You are authoring the project constitution — use `constitution-author`.
inputs:
  - spec_md_path: string
  - repo_context: read-only access to project source tree
  - lore_index: optional reference handle for the lore-reader skill
outputs:
  - plan_md_path: string
requires_profiles: [builder, author, steward]
---

# planner

## Purpose

Produce a `plan.md` that tells a team of agents (or humans) how to build the feature described
in `spec.md`. The plan is technical, phased, and decision-aware. It is the last artifact before
the work is decomposed into machine-readable tasks.

The plan ties three things together:

1. The architecture intent (how the feature fits the system).
2. The execution shape (phases, parallelism, dependencies, estimates).
3. The risks and the decisions made to mitigate them.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `spec.md` | yes | Must contain a numbered requirements section and a decision log. |
| Read-only repo access | yes | Required to validate architecture claims against real code. |
| Lore index | warn | If present, cite prior decisions that constrain this plan. |

## Process

1. **Ingest the spec.** Parse requirements, acceptance criteria, non-functional constraints,
   and the decision log. Fail fast if a required section is missing or empty.
2. **Validate the integration surface.** Use a read-only search subagent to confirm that every
   module, table, route, or component mentioned in the spec actually exists at the cited path.
   Any miss goes into the risk register.
3. **Read lore.** Invoke `lore-reader` to surface prior decisions in this area of the codebase.
   Carry every binding lore entry into the References section with a short note on how it
   constrains this plan.
4. **Draft the architecture summary.** A short prose section plus at least one Mermaid
   architecture diagram. Call out new components, extended components, and boundaries.
5. **Model the phases.** Split the work into phases that each end at a demonstrable state.
   Typical shape: foundations → happy path → edge cases → hardening. Each phase has: inputs,
   deliverables, exit criteria, and which requirement IDs it satisfies.
6. **Build the dependency graph.** For each phase, list upstream dependencies (other phases,
   other features, schema migrations, infra). Render as a Mermaid graph.
7. **Estimate.** T-shirt per phase (`XS / S / M / L / XL`) plus a rough day range. Flag any XL
   phase as a risk and propose a split.
8. **Populate the risk register.** Table: `Risk | Likelihood | Impact | Mitigation | Owner
   role`. Pull likely risks from the spec's non-functional section and from the lore.
9. **Identify parallelisation.** Mark which phases can run concurrently, which cannot, and
   where the expected overlap hot-spots are (shared files, shared schemas).
10. **Self-review, then write.** Validate against acceptance before writing the file.

## Outputs

`plan.md` with these sections:

1. Summary (1 paragraph)
2. Architecture summary (prose + at least one Mermaid diagram)
3. Phases (per-phase subsections with inputs, deliverables, exit criteria, requirement IDs)
4. Dependency graph (Mermaid)
5. Estimates (table)
6. Parallelisation notes (which phases can overlap; known hot-spots)
7. Risks and mitigations (table)
8. References (including a **Lore citations** block: `[LORE-<id>] <summary> — <why it binds>`)

## Acceptance

The plan is accepted only when all of the following pass:

- Every requirement from `spec.md` is assigned to exactly one phase.
- Every phase has explicit, testable exit criteria.
- The dependency graph has no cycles.
- Each XL estimate is either split or has a written justification.
- Every binding lore entry surfaced by `lore-reader` appears in References with a one-line
  rationale.
- The architecture summary references real files or modules that exist in the repo (no
  invented paths).

## Common failure modes

- **Phase soup.** Phases that overlap ambiguously, so no one can tell when a phase is "done".
  Fix with sharp exit criteria.
- **Invented architecture.** Drawing diagrams that do not match the code. Validate every node
  against a real path via the search subagent.
- **Skipped lore.** Ignoring prior decisions because they are inconvenient. Lore is binding
  unless a new ADR supersedes it.
- **Optimistic estimates.** Everything is M. Force a distribution; if three phases are all M,
  they are probably hiding S and L work.
- **No parallelisation plan.** Multiple agents will conflict on shared files if you do not
  name the hot-spots. Write them down.
- **Risk register as theatre.** Generic "scope creep" risks with no mitigation. Tie each risk
  to a specific requirement or module.
