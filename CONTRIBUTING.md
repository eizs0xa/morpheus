# Contributing to Morpheus

Thanks for your interest. Morpheus is governed by [CONSTITUTION.md](CONSTITUTION.md) — read it first. The philosophy lives in [PHILOSOPHY.md](PHILOSOPHY.md).

## Ways to contribute

1. **Propose a new module** (stack, domain, integration, workspace) — see [Module proposal process](#module-proposal-process).
2. **Fix a bug** — open a PR with a passing test.
3. **Improve docs** — PRs welcome; docs ship with the platform version.
4. **Propose a platform change** — for anything touching `modules/core/`, schemas, CLI composition rules, or the constitution, open an ADR under `docs/decisions/` before the PR.

## Module proposal process

1. **Open an issue** using the `module-request` template in `.github/ISSUE_TEMPLATE/`. Include:
   - Module name (e.g. `stack-go`, `domain-fintech`)
   - Kind (`stack | workspace | integration | domain`)
   - Problem it solves
   - Detection markers (for stacks)
   - Incompatibilities
   - A sketch of `contributes:` (skills, templates, workflows)
2. **Platform team triage.** The team responds with accept / request-changes / decline within a reasonable window. Declines include a rationale.
3. **On accept**, author the module under `modules/{kind-plural}/{module-name}/`:
   - `module.yaml` validating against `modules/core/schemas/module.schema.json`
   - Skills, templates, workflows, hooks per the module contract
   - Tests under `tests/` covering the module's detection and composition behavior
4. **Open a PR** referencing the issue. A CODEOWNER reviews.
5. **On merge**, the module ships in the next MINOR release.

Until a public contribution guide lands (tracked in ADR-004), domain modules are authored by the platform team.

## Breaking-change policy

Breaking changes follow [CONSTITUTION.md §5](CONSTITUTION.md). Minimum requirements:

- **1 prior MINOR release** that marks the affected surface deprecated (with log warnings where applicable).
- **60-day deprecation window** before the MAJOR release ships.
- **Automated migration script** under `templates/migration/` that upgrades existing projects.
- **CHANGELOG entry** describing change, migration path, and deprecation timeline.
- **ADR** under `docs/decisions/` justifying the break.

PRs introducing breaking changes without these MUST NOT be merged.

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short summary
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`. Keep the subject line ≤ 72 characters.

## Pull-request checklist

- [ ] PR description explains the "why"
- [ ] Tests added / updated
- [ ] Docs updated (if user-visible)
- [ ] Schema changes accompanied by example updates
- [ ] Breaking change? Migration script + ADR linked
- [ ] CHANGELOG entry under `[Unreleased]`
- [ ] CODEOWNER tagged

## Code of conduct

Be respectful. Assume good faith. Disagree on ideas, not people.
