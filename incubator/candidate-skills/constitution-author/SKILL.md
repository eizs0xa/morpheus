---
name: constitution-author
version: 0.1.0
tier: core
description: Interview the project steward to produce an initial project-level constitution.md from the platform template.
when_to_use: |
  - A new project (greenfield or brownfield overlay) has just been initialised and a `constitution.md` placeholder exists.
  - A new steward is taking over an existing project and wants to re-baseline the constitution.
  - A major change (new primary stack, new workspace, new compliance regime) requires a structured amendment.
  - The team wants to formalise conventions that have emerged organically.
when_not_to_use: |
  - The platform's own constitution is being amended — that is a platform-maintainer PR, not a project skill.
  - A one-off decision is being made — use an ADR, not a constitution change.
  - A file-format guide is needed — that is an instruction file, not a constitution clause.
  - The steward has not been identified — a constitution without an owner is a fiction.
inputs:
  - project_root: absolute path
  - platform_manifest_path: string (platform-manifest.json produced at init)
  - template_path: string (core template `constitution.md.tmpl`)
outputs:
  - constitution_md_path: string (written to project_root/.agent/constitution.md or equivalent)
  - interview_transcript_md: string (internal, attached to the final summary)
requires_profiles: [steward]
---

# constitution-author

## Purpose

Guide the steward through a structured, time-boxed (roughly 2–3 hours) interview that
produces the project's first `constitution.md`. The constitution is the project's law. It
names the owner, the non-negotiables, the boundaries, and the amendment process. Every
subsequent skill cites this file.

This is a steward-only skill. Builders, authors, explorers, and verifiers may read the
constitution, but only the steward authors or amends it.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| Project root | yes | The working directory for the project being initialised. |
| Platform manifest | yes | Source of truth for profile, stacks, workspace, PM, and git provider. |
| Template path | yes | `constitution.md.tmpl` shipped with core. |

## Process

1. **Pre-flight.** Read the platform manifest to pre-fill `project_name`, `primary_stacks`,
   `workspace`, `pm_tool`, `git_provider`, and `profile`. Confirm each with the steward.
2. **Identify the steward of record.** One named human (plus optional backups). If the
   steward is anonymous, stop; a constitution without an owner is a fiction.
3. **Interview block A — Purpose and scope.** Three to five sentences on what this project
   is and what it is explicitly not. Capture verbatim.
4. **Interview block B — Non-negotiables.** Walk each section of the template and ask: "Is
   there a rule here we never break?" Record every yes as a non-negotiable, every no as a
   preference (preferences go into stack instruction files, not the constitution).
5. **Interview block C — Architectural boundaries.** Module boundaries, allowed cross-talk,
   data ownership, third-party integrations. Draw a simple Mermaid diagram if the steward
   finds it useful.
6. **Interview block D — Coding and testing standards.** Point at the existing instruction
   files rather than restating them. The constitution says "we follow X"; X lives elsewhere.
7. **Interview block E — Security baseline.** The minimum security posture: authn/authz,
   secrets policy, logging posture, data-compliance regime. Reference regulations by name.
8. **Interview block F — Amendment process.** Who can propose an amendment, what the review
   path is, when an ADR is required, how the lore is updated.
9. **Render the template.** Fill placeholders from the manifest and the interview. Preserve
   stop-lines from the platform constitution; never weaken them at the project level.
10. **Read back.** Show the rendered file and ask the steward to confirm each section. Record
    their assent.
11. **Write and commit-as-draft.** Write the file. Open a PR. Do not self-merge. The
    steward's first act is to get reviewers to ratify the constitution.

## Outputs

- `constitution.md` written under the project's agent folder (typically
  `.agent/constitution.md`).
- `interview_transcript.md` (internal, attached to the final summary) capturing the
  answers block-by-block so later amendments know the original intent.

The rendered constitution MUST contain the sections: Purpose, Scope, Non-negotiables,
Architectural boundaries, Coding standards reference, Testing standards reference, Security
standards, Amendment process.

## Acceptance

The constitution is accepted only when all of the following pass:

- All six template placeholders (`project_name`, `primary_stacks`, `profile`, `workspace`,
  `pm_tool`, `git_provider`) are filled.
- The steward of record is named (not "the team").
- Every non-negotiable is a single, testable statement.
- Every reference to an external instruction file is a live path that exists.
- The amendment process names the quorum, the review path, and the ADR trigger.
- No platform stop-line is weakened. The project may be stricter; it may not be laxer.

## Common failure modes

- **Aspirational constitution.** Rules no one intends to follow. Force a sanity check: "If
  we broke this rule today, would it stop the PR?" If not, drop it or downgrade to a
  preference.
- **Shopping list.** A constitution that lists every preference. The constitution is for
  non-negotiables only; the rest belongs in instruction files.
- **Missing owner.** "The team" is not an owner. Name a person.
- **Silent stop-line erosion.** Wording that looks similar to a platform stop-line but is
  weaker. Require verbatim stop-lines.
- **Untestable clauses.** "We write high-quality code." Replace with a measurable standard
  (coverage threshold, lint rule set, review rule).
- **Drive-by author.** Someone other than the steward authors the file. The steward owns
  the content; others may review.
