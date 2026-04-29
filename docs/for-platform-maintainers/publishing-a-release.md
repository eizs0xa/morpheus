# Publishing a release

> The on-demand release workflow for Morpheus v0.1.x. Covers CHANGELOG discipline, tag semantics, and the doc-sync responsibility.

## Cadence

Per [ADR-004](../decisions/ADR-004-open-questions-v0.1.md), v0.1 ships **on-demand**. Roughly: release when a coherent slice is ready. Target no longer than 4–6 weeks between releases during the friendly pilot phase. Do not release:

- With unmerged work marked `[Unreleased]` that you didn't intend to ship.
- With open P0/P1 bugs on the release branch.
- Without a migration script, when a breaking change is included (see [handling-breaking-changes.md](handling-breaking-changes.md)).

After Phase 5 (see [../for-eng-managers/rollout-guide.md](../for-eng-managers/rollout-guide.md)), cadence may formalize to monthly. Don't formalize earlier — learning outpaces planning in the pilot phase.

## Release checklist

### 1. Scope freeze

- [ ] Create a `release/YYYY.WW` branch off `main` (branching model per [ADR-003](../decisions/ADR-003-branching-model.md)).
- [ ] Announce scope freeze in the platform channel. No new feature PRs merge to the release branch; only fixes.

### 2. Version decision

- [ ] Read the list of changes under `CHANGELOG.md` `## [Unreleased]`.
- [ ] Decide the bump per semver:
  - Any **breaking change** → MAJOR.
  - Any **new module / skill / CLI command / template** without breakage → MINOR.
  - Only **fixes / docs / internal refactors** → PATCH.
- [ ] If unclear, err toward the higher bump. Overstating is safer than silent churn.

### 3. Update CHANGELOG

- [ ] Rename `## [Unreleased]` to `## [vX.Y.Z] — YYYY-MM-DD`.
- [ ] Add a new empty `## [Unreleased]` heading at the top.
- [ ] Re-check each bullet:
  - Does it name a user-visible change?
  - Does it link to the PR that shipped it?
  - Is the category right (Added / Changed / Fixed / Removed / Deprecated / Security)?
- [ ] If the release includes a migration script, add a bullet under `Changed` linking to the script path.

### 4. Update docs

- [ ] [../reference/module-catalog.md](../reference/module-catalog.md) — every module version bumped.
- [ ] [../reference/skill-catalog.md](../reference/skill-catalog.md) — every new skill listed.
- [ ] [../reference/cli-reference.md](../reference/cli-reference.md) — every new flag, env var, exit code.
- [ ] [../reference/schemas.md](../reference/schemas.md) — every new or changed schema.
- [ ] Walkthroughs under [../for-engineers/](../for-engineers/) — transcripts updated if CLI output changed.

### 5. Version bump in code

Bump the platform version string. Locations:

- `cli/package.json` → `version` field.
- `cli/src/index.ts` → the `.version('x.y.z')` call.
- `cli/src/commands/init.ts` → the `PLATFORM_VERSION` constant.
- Any `module.yaml` files that shipped changes this release — bump their `version`.
- Root `README.md` quick-start version references.

Commit:

```bash
git commit -m "chore(release): bump to vX.Y.Z"
```

### 6. Sanity checks

Run locally from the release branch:

```bash
cd cli && pnpm install && pnpm build && pnpm test
cd ..
pnpm --filter cli test:integration      # if integration suite is wired
```

Then dogfood:

```bash
# Against an empty scratch dir:
mkdir /tmp/morpheus-release-check && cd /tmp/morpheus-release-check
morpheus invoke --non-interactive --profile builder
agentic validate
agentic doctor
```

All three must pass (doctor exit 0 or 1 acceptable).

### 7. Tag

```bash
git tag -a vX.Y.Z -m "Morpheus vX.Y.Z"
git push origin vX.Y.Z
```

### 8. Merge release branch back to main

```bash
git checkout main
git pull
git merge --no-ff release/YYYY.WW
git push origin main
```

Avoid squash-merge for release branches — preserving the merge commit makes the release history readable.

### 9. Announce

Publish in the platform channel:

- Version and date.
- Three highlights.
- Link to the CHANGELOG entry.
- Link to the migration script if any.
- Explicit call-out if the release includes breaking changes.

### 10. Post-release

- [ ] Check in with pilot teams within 72 hours.
- [ ] Track adoption metrics ([measuring-impact.md](../for-eng-managers/measuring-impact.md) § Freshness).
- [ ] Open follow-up issues for anything caught during dogfood that didn't block the release.

## Release workflow file

When the workflow lands (`.github/workflows/release.yml`), it will:

1. Trigger on a tag push matching `v*.*.*`.
2. Run the full test suite.
3. Build the CLI.
4. Upload artifacts (tarball of `cli/dist/` and, later, an npm publish).
5. Draft a GitHub release with the CHANGELOG entry.

Until the workflow lands, the steps above are manual. Follow them literally.

## Versioning reminders

- Module versions are independent from the platform version, but v0.1.x pins them lockstep. This will change at v0.2.
- A MAJOR platform bump may ship with several MINOR module bumps underneath.
- Never re-use a version tag. If a release is botched, bump PATCH and release again.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Users see `[Unreleased]` in a shipped release | Forgot to rename the heading in CHANGELOG. | Cut a PATCH release with the rename. |
| Tag exists but workflow didn't run | Workflow file not yet on `main` or tag trigger mis-configured. | Fix workflow; re-release with PATCH bump. |
| `agentic --version` prints old version after install | Forgot to bump `cli/package.json` or `PLATFORM_VERSION`. | Bump and PATCH-release. |
| Docs still reference the previous version | Missed doc update. | PATCH release with doc-only diff. |

## Related docs

- [Adding a module](adding-a-module.md)
- [Handling breaking changes](handling-breaking-changes.md)
- [ADR-003 — Branching model](../decisions/ADR-003-branching-model.md)
- [Updating the platform](../for-engineers/updating-the-platform.md)
