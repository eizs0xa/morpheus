# Adding a module

> Checklist for proposing and shipping a new Morpheus module. Applies to any kind — `stack`, `workspace`, `integration`, or `domain`. Core is closed to additions short of a MAJOR.

## When to add a module

- A pattern appears in ≥ 3 real projects with only superficial variation.
- A concrete first-use project exists (not hypothetical).
- The work does not fit inside an existing module as an amendment.

If any of those are missing, file a `module-request` issue first and discuss before writing code. See [../for-eng-managers/escalation-paths.md](../for-eng-managers/escalation-paths.md#when-to-file-a-module-request).

## Pre-work

- [ ] `module-request` issue triaged and approved.
- [ ] Owner identified (CODEOWNERS entry will need updating).
- [ ] First-use project agreed to dogfood the module before MINOR release.
- [ ] Name reviewed against existing modules (no collisions across kinds).
- [ ] ADR opened if the module establishes a new pattern or crosses a prior decision.

## File layout

```
modules/<kind>/<module-name>/
├── module.yaml
├── skills/                 (optional)
│   └── <skill>.md
├── templates/              (optional)
│   └── <name>.tmpl
├── workflows/              (optional)
│   └── <name>.yml.tmpl
├── hooks/                  (optional)
│   └── <name>.sh
├── instructions/           (optional, stack-specific)
│   └── <stack>.instructions.md
└── schemas/                (optional, only if module owns a schema)
```

`<kind>` is one of `stacks`, `workspaces`, `integrations`, `domains`. Do **not** place anything under `modules/core/` without a platform MAJOR bump.

## `module.yaml` spec

Minimum fields:

```yaml
name: <module-name>
version: 0.1.0
kind: stack | workspace | integration | domain
description: One-sentence description. What it ships, in plain language.
requires:
  - name: core
    version_range: ">=0.1.0 <1.0.0"
incompatible_with: []
contributes:
  skills: []
  templates: []
  workflows: []
  hooks: []
  instructions: []
  schemas: []
prompts: []
detection:
  file_markers: []
```

Rules:

- Every non-core module `requires` `core` with a sensible range.
- `incompatible_with` is non-empty when the module is exclusive (one workspace, one git provider, one PM).
- `contributes.*` paths are relative to the module directory and must exist.
- `detection.file_markers` is used by `agentic init` to auto-propose this module when the CLI detects applicability.
- `prompts` lists any answers the module needs collected at init time (e.g. webhook URL).

Validate the file:

```bash
cd modules/<kind>/<module-name>
npx ajv validate -s ../../../modules/core/schemas/module.schema.json -d module.yaml
```

## Composition-rule impact

Before shipping, confirm the module obeys the composition rules in [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §1:

| Kind | Count per project | Impact of your addition |
|------|-------------------|-------------------------|
| `core` | Exactly 1 | Not adding core — skip. |
| `workspace` | Exactly 1 | Must list existing workspaces in `incompatible_with`. |
| `git` (integration) | Exactly 1 | Must list other git integrations in `incompatible_with`. |
| `pm` (integration) | 0 or 1 | Must list other PM integrations in `incompatible_with`. |
| `stack` | 0..N | No exclusivity required. |
| `domain` | 0..N | No exclusivity required. |

If your module breaks the cardinality (e.g. two workspaces coexist), that's a platform redesign, not a module addition.

## Skills in the module

If the module contributes skills:

1. Follow the skill spec in [../for-engineers/writing-a-custom-skill.md](../for-engineers/writing-a-custom-skill.md).
2. Name-uniqueness is scoped **per tier** — two workspaces may both expose `notifier`; two stacks may not both expose `coding-agent-node`.
3. Record skills in `contributes.skills` in `module.yaml`.
4. Add one row per skill to [../reference/skill-catalog.md](../reference/skill-catalog.md).

## Tests

For stack modules:

- Add a fixture project under `tests/fixtures/<module-name>/` that triggers the module's detection markers.
- Add a composer unit test that verifies `module-resolver` picks up the module when its markers are present.
- If the module ships a workflow template, add a render test verifying the template emits valid YAML.

For integration modules (git, pm):

- Add a composer test verifying exclusivity is enforced (e.g. `pm-jira` + `pm-linear` rejected).
- If the module ships a preflight check, add a unit test for each status path (`ok | warning | error`).

For workspace modules:

- Add a test verifying the skill name `notifier` is present and identical in filename to the sibling workspace (swap compatibility).

For domain modules:

- If the domain module is `status: example`, annotate in `module.yaml.description`.

Run:

```bash
pnpm --filter cli test
pnpm --filter platform test        # if applicable
```

## Docs

- [ ] Add a row to [../reference/module-catalog.md](../reference/module-catalog.md). One line per module.
- [ ] Add rows for each new skill to [../reference/skill-catalog.md](../reference/skill-catalog.md).
- [ ] If the module exposes CLI behavior (new flag, new env var), update [../reference/cli-reference.md](../reference/cli-reference.md).
- [ ] If the module owns a schema, update [../reference/schemas.md](../reference/schemas.md).
- [ ] If the module changes a walkthrough path, update the relevant walkthrough under [../for-engineers/](../for-engineers/).

## CHANGELOG

Add an entry under `## [Unreleased]` in the platform `CHANGELOG.md`:

```markdown
### Added
- `modules/<kind>/<module-name>` — <one-line description>. (#<PR-number>)
```

## CODEOWNERS

Add a line to the platform `CODEOWNERS`:

```
/modules/<kind>/<module-name>/   @<github-handle-of-owner>
```

## Shipping

1. Open a PR.
2. Address review.
3. Merge only after:
   - All tests pass.
   - Schema validation passes for `module.yaml`.
   - First-use project has been scaffolded with the module in a scratch branch.
   - CODEOWNERS includes the module owner.
4. The first MINOR release after merge ships the module.
5. Announce in the platform channel with a link to [../reference/module-catalog.md](../reference/module-catalog.md).

## After shipping

- Set a calendar reminder at +30 days to check adoption of the new module.
- Collect lore from the first-use project; promote to documentation as needed.
- If adoption is zero after 90 days, investigate — don't leave zombie modules.

## Related docs

- [Writing a custom skill](../for-engineers/writing-a-custom-skill.md)
- [Publishing a release](publishing-a-release.md)
- [Handling breaking changes](handling-breaking-changes.md)
- [Module catalog](../reference/module-catalog.md)
