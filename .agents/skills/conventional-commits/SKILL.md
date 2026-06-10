# Skill: conventional-commits

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
4. PR title should use the same conventional shape, prefixed by the Jira/work item key when required.

## Enforcement

1. Agents should write conventional commit messages by default.
2. Repositories may enforce this with GitHub Actions when the policy is installed.
3. Release notes can use commit types as one input, but release documentation lives under `releases/`.

## Why this is enforced

Uniform commit grammar is what makes **automated tracking** possible across every repo in the enterprise: portfolio rollups, CHANGELOGs, release notes, ROI attribution of a feature to a cost center. A single team opting out breaks the rollup.
