# Morpheus Platform Constitution

> This is platform law. It governs how modules compose, how the platform evolves, and what the platform will never do. Project-level constitutions live elsewhere; this one governs the platform itself.

## 1. Composition rules

Every Morpheus-scaffolded project MUST satisfy all six rules. The CLI enforces them. A project that violates any rule is invalid.

1. **`core` is mandatory.** Every project includes `modules/core` at a pinned version.
2. **Exactly one `workspace`.** A project has exactly one workspace module (`workspace-microsoft` XOR `workspace-google`). Never zero, never two.
3. **Exactly one `git` provider.** A project declares exactly one git provider integration (e.g. `git-github`).
4. **0..1 `pm` integration.** A project has zero or one project-management integration (e.g. `pm-jira`).
5. **0..N `stacks`.** A project has any number of stack modules (`stack-node`, `stack-python`, `stack-react`, ...), including zero.
6. **0..N `domains`.** A project has any number of domain modules (`domain-healthcare`, `domain-payments`, ...), including zero.

## 2. Profiles

There are **exactly five** profiles. No sixth. Ever.

1. `builder` — writes and ships code.
2. `verifier` — writes tests, holdouts, acceptance criteria.
3. `author` — writes specs, PRDs, design docs.
4. `explorer` — reads, maps, and documents codebases without modifying them.
5. `steward` — owns project constitution, conventions, and lore.

**Profiles are ergonomic, not runtime permissions.** They control default scaffolding, surfaced skills, and prompt wording. They do not grant or deny access to files, commands, or modules.

## 3. Universal gates

Gates (CI checks, PR-gate workflows, acceptance checks) are **universal**. The same gates apply to every profile. There are **no per-profile gates**. A verifier's PR runs the same checks as a builder's PR.

## 4. Versioning

Morpheus and every module follow **Semantic Versioning 2.0.0**.

- **MAJOR (`X.0.0`)**: a breaking change. A breaking change MUST ship with a migration script and a deprecation runway (see §5). Breaking changes include: removing a module, renaming a skill, changing a schema in a non-backward-compatible way, removing a CLI flag, or changing the meaning of a manifest field.
- **MINOR (`0.X.0`)**: new modules, new skills, new CLI commands, new templates — all backward compatible. An existing project can upgrade MINOR without edits.
- **PATCH (`0.0.X`)**: bug fixes, documentation corrections, internal refactors. No user-visible surface changes.

Modules version independently. The platform version is a release of the monorepo as a whole, pinned in each scaffolded `platform-manifest.json`.

## 5. Breaking-change policy

A breaking change requires **all** of:

1. A prior MINOR release marking the affected surface as deprecated (with log warnings where applicable).
2. A minimum **60-day** deprecation window before the MAJOR ships.
3. An automated migration script under `templates/migration/` that upgrades existing projects.
4. A CHANGELOG entry describing the change, the migration path, and the deprecation timeline.

## 6. Stop-lines

The platform will never do any of the following. These are not subject to negotiation between majors.

1. **No sixth profile.**
2. **No per-profile constitutions or gates.**
3. **Profiles are ergonomic, NOT runtime permissions.**
4. **Max 5 init questions.**
5. **No profile × stack × project-type matrices.**
6. **No Jira validation expansion beyond initiative existence.**
7. **No project-type branching inside `constitution-author`.**

## 7. Module contract

Every module ships a `module.yaml` that declares:

- `name`, `version` (semver), `kind` (`core | stack | workspace | integration | domain`)
- `requires` — other modules and minimum versions
- `incompatible_with` — modules it cannot coexist with
- `contributes` — skills, templates, schemas, workflows, hooks
- `detection` — markers used by the CLI to auto-detect applicability (where relevant)

Every `module.yaml` MUST validate against `modules/core/schemas/module.schema.json`.

## 8. Artifact chain

Every project inherits the same artifact spine:

```
PRD → spec → plan → tasks → implementation → review → evaluation
```

Skills, templates, and workflows attach to this spine. The spine does not branch by profile, stack, or project type.

## 9. Governance

- The CLI enforces composition rules (§1) and schema validation (§7) at `init`, `validate`, and `doctor` time.
- Platform changes require a PR with CODEOWNER approval.
- Breaking changes additionally require an ADR under `docs/decisions/`.
- The stop-lines (§6) can only be changed by unanimous approval of the listed platform maintainers, recorded in an ADR.

## 10. Amendments

This constitution may be amended only via:

1. A PR modifying this file.
2. A corresponding ADR in `docs/decisions/`.
3. A CHANGELOG entry at the next release.

Amendments that alter §6 (Stop-lines) are MAJOR changes by definition.
