# Skill: conventional-commits

> Shipped by `integrations/git-github`. Universal across all stacks.

Every commit and PR title in a Morpheus-scaffolded project conforms to [Conventional Commits](https://www.conventionalcommits.org/). This is non-negotiable because the artifact chain's `evaluation` and `release-train` workflows parse commit types to compute CHANGELOGs and semver bumps automatically.

## Format

```
<type>(<scope>): <subject>

[optional body, wrapped at 100 cols]

[optional footers: BREAKING CHANGE, Refs, Co-authored-by]
```

## Allowed types

| Type | Semver effect | Use for |
|---|---|---|
| `feat`     | MINOR | User-visible new capability |
| `fix`      | PATCH | Bug fix |
| `perf`     | PATCH | Performance improvement |
| `refactor` | none  | Internal restructuring, no behavior change |
| `docs`     | none  | Documentation only |
| `test`     | none  | Adding or fixing tests |
| `chore`    | none  | Tooling, deps, infra |
| `style`    | none  | Formatting only |
| `build`    | none  | Build system |
| `ci`       | none  | CI config |

A footer of `BREAKING CHANGE: <summary>` forces a MAJOR bump regardless of type.

## Rules

1. Subject ≤ 72 characters. No trailing period.
2. Scope is optional, lowercase, kebab-case.
3. Subject is imperative ("add", "fix"), not past tense.
4. PR title MUST match the same pattern — `commitlint.config.cjs.tmpl` is shipped by this module.

## Enforcement

1. Local: `commitlint` on the `commit-msg` hook (optional, opt-in per dev).
2. CI: `workflows/commit-lint.yml` validates every commit in a PR and the PR title.
3. Release: `release-train.yml` reads commit types to compute the next semver bump and draft the CHANGELOG.

## Why this is enforced

Uniform commit grammar is what makes **automated tracking** possible across every repo in the enterprise: portfolio rollups, CHANGELOGs, release notes, ROI attribution of a feature to a cost center. A single team opting out breaks the rollup.
