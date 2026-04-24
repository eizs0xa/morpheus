# domain-healthcare (EXAMPLE-ONLY)

> **This is a stub.** It exists to show the shape of a Morpheus domain module.
> It is **not installed by default**, contributes nothing, and is **not
> production-ready**. Do not rely on it for any real HIPAA or PHI workflow.

## Purpose

Demonstrate the file layout and `module.yaml` schema for a domain module that
would carry healthcare-specific constraints.

A real `domain-healthcare` module would add rules around:

- **PHI detection** — `applyTo` instructions scoped to code paths touching
  patient identifiers, diagnoses, or medical records, enforcing redaction in
  logs and non-prod environments.
- **Audit logging** — required audit trail for every read/write of PHI, with
  a reviewer skill that fails PRs missing the audit hook.
- **Encryption-at-rest checks** — schema and review skill verifying that any
  new data store holding PHI declares encryption config.
- **Access-control review** — required steward or security-reviewer sign-off
  on changes to authorization code in PHI paths.
- **Constitution addendum** — clauses pinning HIPAA-relevant stop-lines
  (e.g. no PHI in commit messages, no PHI in issue trackers).

## Why it's empty

The stub's `contributes:` arrays are all empty because:

1. A real implementation requires legal and compliance review we cannot do
   in an example.
2. The module exists primarily as a reference for contributors building their
   own domain modules.

## Building a real domain module

If you're building a production domain module — healthcare, payments,
government, or otherwise — start with:

- [`modules/domains/README.md`](../README.md) — contributor guide, required
  files, review process, stop-line.
- [`modules/core/schemas/module.schema.json`](../../core/schemas/module.schema.json)
  — manifest schema your `module.yaml` must validate against.
- [`CONSTITUTION.md`](../../../CONSTITUTION.md) §6 — steward review
  requirements for new domain modules.

Then replace this stub (or create a new sibling directory) with real
`instructions/`, `skills/`, and a `constitution-addendum.md.tmpl` vetted by
your compliance team and approved by a steward.
