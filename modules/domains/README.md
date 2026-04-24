# Domain modules

Domain modules carry constraints tied to a specific business area — for example
healthcare (HIPAA/PHI), payments (PCI-DSS), or internal-tools (reduced rigor for
non-customer-facing code). They layer *on top of* core and stack modules to add
rules that only make sense for that domain.

This directory is a registry. Each subfolder is one domain module.

## What is a domain module?

A domain module contributes:

- **Instructions** with `applyTo:` globs that attach to domain-relevant code
  paths (e.g. anything touching patient records, card data, audit logs).
- **Skills** that encode domain workflows (e.g. PHI-scrubbing reviewer, PCI
  scope auditor) — optional.
- **Constitution addendum template** (`constitution-addendum.md.tmpl`) merged
  into the project constitution at `agentic init` — optional.
- **Schemas** for domain-specific artifacts (e.g. data-classification manifest)
  — optional.

Domain modules **never** ship runtime code. They ship rules, prompts, and
review skills that the agent and humans follow.

## When to create a domain module

Create a new domain module when:

1. The rules apply to a **business area**, not a **tech stack** or **workspace**.
   HIPAA is a domain concern; Python linting is a stack concern; VS Code settings
   are a workspace concern.
2. The rules are **additive** — they tighten core/stack behaviour, never loosen
   it. See the stop-line below.
3. More than one project in the same org would plausibly install this module.
   One-off project rules belong in that project's constitution, not in a shared
   module.

If in doubt: prefer adding rules to the project's constitution first. Promote
to a domain module only after two or more projects need the same rules.

## Required files

Every domain module directory must contain:

- `module.yaml` — manifest conforming to `modules/core/schemas/module.schema.json`.
- `README.md` — what this domain covers, what it adds, who reviewed it.

Optional (most domain modules have at least one):

- `instructions/*.instructions.md` — `applyTo`-scoped rules.
- `skills/*.md` — domain review or authoring skills.
- `templates/constitution-addendum.md.tmpl` — text merged into the project
  constitution when this module is installed.
- `schemas/*.schema.json` — artifact schemas the domain introduces.

List each contributed file in `module.yaml` under `contributes:`.

## Review process

Per CONSTITUTION §6 (steward duties): **every domain module requires STEWARD
approval before merge**. The steward verifies:

- Rules are additive (do not weaken core).
- `applyTo` scopes are tight enough to avoid false positives on unrelated code.
- The domain name is unambiguous and not already covered by another module.
- Constitution addendum (if any) does not conflict with core constitution clauses.

Ongoing changes to a merged domain module also require steward review.

## Stop-line: domain modules add constraints, never remove them

A domain module **MUST NOT**:

- Disable or soften a core rule.
- Override an `applyTo` from core or stack to make it less strict.
- Remove a required review step.
- Change `profiles.yaml` — profiles are core-owned.

A domain module **MAY**:

- Add stricter `applyTo` rules layered on top of core/stack.
- Require additional reviewers, artifacts, or audit steps.
- Introduce new stop-lines specific to the domain.

If a domain module needs to *relax* a core rule, that is a signal the core rule
is wrong — fix the core rule via the amendment process, not by overriding it
in a domain.

## Examples in this directory

- `domain-healthcare/` — **example stub only**. Illustrates the shape of a
  domain module. Not installed by default and not production-ready.
