# Updating the platform

> When and how to bump a Morpheus-scaffolded project to a newer platform version. Covers `agentic update`, copier's three-way merge, and conflict resolution.

## When to update

- A new platform **minor** release ships with modules, skills, or workflows you want.
- A **patch** release fixes a bug affecting your workflows.
- A **major** release ships — coordinate with your steward and read the migration script under `templates/migration/` first.

Semver rules are spelled out in [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §4-5.

## How updates work

`agentic update` is a thin wrapper around `copier update` executed against the template that originally rendered your project. The manifest at `.agent/platform-manifest.json` or `platform-manifest.json` records:

- the platform version at last init/update,
- the template path (new-project vs brownfield-overlay),
- the answers used (`copier`'s `.copier-answers.yml`).

Copier performs a **three-way merge** between:

1. Files as they were at the last init/update version (the "ancestor"),
2. Files as the new template version would render them (the "theirs"),
3. Files as they are in your working tree today (the "ours").

Files you haven't touched update cleanly. Files you modified get merged; conflicts appear as standard `<<<<<<<` markers.

## The update flow

### 1. Check your current version

```bash
cat .agent/platform-manifest.json | jq .platform_version
# or, at the repo root if that's where your manifest lives:
cat platform-manifest.json | jq .platform_version
```

### 2. Pull the latest platform

v0.1.0 distribution is clone-the-repo ([ADR-004](../decisions/ADR-004-open-questions-v0.1.md)):

```bash
cd <path-to-morpheus-checkout>
git fetch origin
git checkout v0.2.0                 # or the target tag
cd cli && pnpm install && pnpm build
```

### 3. Dry-run the update

```bash
cd <your-project>
agentic update --dry-run     # (planned flag; until then: copier update --pretend)
```

Review the list of files copier intends to change. If anything surprises you, stop and investigate — do not bulldoze through a surprise update.

### 4. Apply

```bash
agentic update
```

Copier prompts interactively on conflicts. Answer `m` to merge, `o` to keep yours, `t` to accept theirs, `s` to skip.

### 5. Validate

```bash
agentic validate
agentic doctor
```

Both must exit `0` or `1`. If `2`, fix reported errors before committing.

### 6. Commit

```bash
git add -A
git commit -m "chore(morpheus): update to v0.2.0"
```

Include the version bump in the subject line so release notes can track adoption.

## Resolving merge conflicts

Copier emits git-style conflict markers. Open the file, find the markers, decide:

```text
<<<<<<< current
// your local edit
=======
# new from Morpheus v0.2.0
>>>>>>> new
```

Decision framework:

| Situation | Choose |
|-----------|--------|
| You customized a template and the platform version changed nearby. | Merge manually — keep your customization, adopt the platform's structural change. |
| Platform renamed/moved a file. | Accept theirs; verify nothing outside the template references the old path. |
| You deleted a platform file on purpose. | Keep it deleted. Record the reason in an ADR. |
| You can't tell what the platform intended. | Stop, open an issue, ask the maintainer. Don't guess. |

## Rollback

`agentic update` is a git operation on your repo. If something went wrong:

```bash
git reset --hard HEAD~1      # if you already committed
# or:
git restore --staged --worktree .   # if uncommitted
```

The platform manifest is rolled back along with everything else — there is no external state.

## Frequently

### Q: Can I skip a minor version?

Yes, in most cases. Copier runs the three-way merge regardless of the size of the jump. For major → major, read the migration script under `templates/migration/` first.

### Q: Do I need to update modules individually?

No. v0.1.0 ships module versions pinned to the platform version. Module-level versioning lives in each `module.yaml` but the CLI applies updates in lockstep.

### Q: What if my answers changed (e.g. swapped workspace)?

Use `agentic init --resume --profile <name>` with an updated `--answers-file`. Workspace swaps specifically follow the migration guide under `templates/migration/` (e.g. `workspace-swap.sh`).

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `copier update` complains about missing `.copier-answers.yml` | Project predates copier or manifest was hand-edited. | Restore `.copier-answers.yml` from the originating init, or re-init with `--resume`. |
| Conflict markers end up committed | Skipped conflict resolution. | `git diff --check` pre-commit; fix and re-commit. |
| Platform workflows fail after update | New workflow requires a secret that wasn't set. | Read the release notes; add the secret; re-run. |

## Related docs

- [Handling breaking changes](../for-platform-maintainers/handling-breaking-changes.md) — the author-side view.
- [CLI reference — `agentic update`](../reference/cli-reference.md#agentic-update)
- [ADR-002 — Copier vs cookiecutter](../decisions/ADR-002-copier-vs-cookiecutter.md)
