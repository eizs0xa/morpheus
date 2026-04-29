# Brownfield walkthrough

> Overlay Morpheus onto an existing repository without touching your source code. Backups are automatic, existing conventions are preserved, and the overlay is reversible.

## When to use this flow

- `.git/` exists and the repo has shipping code.
- You want the `.agent/` spine, pointer files, and platform workflows — nothing else.
- You do **not** want the CLI to modify your existing workflows, source directories, or config files.

## Non-destructive contract

The brownfield template operates under these rules, enforced by `templates/brownfield-overlay/scripts/preserve-existing.sh`:

1. **Never overwrite source directories.** `backend/`, `frontend/`, `app/`, `src/`, and similar trees are untouched.
2. **Back up before overwriting pointer files.** Any existing `AGENTS.md`, `CLAUDE.md`, or `copilot-instructions.md` is copied to `<name>.pre-morpheus.bak` before the new pointer is written.
3. **Append, never rewrite, to `.github/CODEOWNERS`.** Platform-owned entries are added at the end.
4. **Never modify existing `.github/workflows/*.yml`.** Only NEW workflow files are added.
5. **Stop on ambiguity.** If the script can't decide, it exits non-zero and prints the offending path.

## Preconditions checklist

- [ ] `.git/` exists: `git rev-parse --git-dir` returns `.git`.
- [ ] No `platform-manifest.json` at the root or under `.agent/`.
- [ ] Clean working tree (`git status` shows no uncommitted changes).
- [ ] You're on a feature branch, not `main`.

```bash
git checkout -b chore/morpheus-overlay
git status   # should be clean
```

## Step 1 — Run init

```bash
morpheus invoke
```

Mode detection auto-routes to brownfield when:

- `.git/` exists, AND
- no `platform-manifest.json` is found at the root or under `.agent/`.

See `cli/src/commands/_init/mode-detect.ts` for the exact logic.

## Step 2 — Sample transcript

```text
[1/5] Detecting project mode and stack
  · mode: brownfield
  · hardware: darwin/arm64 (zsh)
  · project type: fullstack-web
  · detected stacks: stack-node, stack-python

[2/5] Resolving answers
  · profile: builder
  · workspace: workspace-microsoft
  · git: git-github
  · pm: pm-jira
  · stacks: stack-node, stack-python

[3/5] Composing modules
  · install order: core → stack-node → stack-python → workspace-microsoft → pm-jira → git-github

[4/5] Rendering brownfield overlay
  · running preserve-existing.sh
  ✓ backed up existing AGENTS.md -> AGENTS.md.pre-morpheus.bak
  ✓ backed up existing copilot-instructions.md -> copilot-instructions.md.pre-morpheus.bak
  ✓ templates rendered
  · append-existing.sh executed by copier _tasks (skipping re-run)

[5/5] Writing platform manifest
  ✓ platform-manifest.json written (profile=builder)
  ✓ post-init tasks written → .agent/tasks/01-author-constitution.md
  · docs audit task written → .agent/tasks/02-audit-docs.md

✓ Morpheus scaffolding is in place.

Next step — one action:

  Type /morpheus in your agent prompt window and press send.
```

## Step 3 — What changed

Inspect:

```bash
git status --short
git diff --stat HEAD
```

Expected new files (exact set depends on profile and modules):

```
A  .agent/constitution.md
A  .agent/feature-template/plan.md.tmpl
A  .agent/feature-template/prd.md.tmpl
A  .agent/feature-template/spec.md.tmpl
A  .agent/feature-template/tasks.json.tmpl
A  .agent/mcp-config.json
A  .agent/platform-manifest.json
A  .agent/schemas/
A  .github/workflows/agent-pr-gate.yml
A  .github/workflows/jira-branch-check.yml
A  AGENTS.md.pre-morpheus.bak      (if one existed)
M  AGENTS.md                        (new pointer content)
M  .github/CODEOWNERS               (appended only)
A  platform-manifest.json
```

Expected **unchanged** (verify explicitly):

```bash
git diff HEAD -- backend/ frontend/ src/ app/ tests/ package.json tsconfig.json pyproject.toml
# → no output
```

## Step 4 — Validate

```bash
morpheus validate
morpheus doctor
```

Both should exit `0` or `1`. Exit `2` means the overlay left the repo in an inconsistent state; open an issue and attach the full `validate --json` output.

## Step 5 — Hand off to your agent (`/morpheus`)

This is the **single action** you take after a successful overlay. The CLI tells
you exactly what to type:

```
Type /morpheus in your agent prompt window and press send.
```

What happens next:

1. Your agent loads `.github/prompts/morpheus.prompt.md`, which points it at
   `.agent/skills/morpheus-orchestrator.md`.
2. The orchestrator skill drives every pending task in `.agent/tasks/` in numeric
   order:
   - `01-author-constitution.md` — interviews the steward, fills `.agent/constitution.md`.
   - `02-audit-docs.md` — restructures pre-existing docs into `docs/<role>/` (only
     present when existing docs were detected).
   - `99-finalize-report.md` — runs `morpheus validate`, opens **one** PR titled
     `chore: complete Morpheus initialization`, and writes
     `MORPHEUS_INIT_REPORT.md` at the repo root.
3. The report shows **what changed, why, and how the new system works relative
   to the old**. You read the report, review the PR, merge.

If the orchestrator halts (validation failure, missing skill, conflicting work)
it prints the reason. Resolve and re-issue `/morpheus` — completed tasks have
`status: done` in their front-matter and will be skipped.

## Step 6 — Commit and PR (manual fallback)

If you prefer to drive the post-init steps by hand instead of running
`/morpheus`, review the overlay in small chunks:

```bash
git add .agent/
git commit -m "chore(morpheus): add .agent/ spine"

git add AGENTS.md CLAUDE.md copilot-instructions.md *.pre-morpheus.bak
git commit -m "chore(morpheus): pointer files (backups preserved)"

git add .github/
git commit -m "chore(morpheus): add platform workflows"

git add platform-manifest.json
git commit -m "chore(morpheus): record platform manifest"
```

## Step 7 — Open a PR (manual fallback)

```bash
git push -u origin chore/morpheus-overlay
gh pr create --draft --title "chore: morpheus overlay" \
  --body "Adds the Morpheus .agent/ spine. No source code modified."
```

## Rolling back

Brownfield overlays are reversible. Since only new files were added and pointer files were backed up:

```bash
# Undo the whole overlay on the branch:
git reset --hard HEAD~<N>     # where N is the number of overlay commits

# Or restore a specific pointer file from its backup:
mv AGENTS.md.pre-morpheus.bak AGENTS.md
```

If you already merged and need to remove Morpheus, write a revert PR that deletes `.agent/`, `platform-manifest.json`, and the platform workflows — restore pointer files from their `.pre-morpheus.bak` twins.

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `E_TEMPLATE: Brownfield preserve step failed` | Repo already has `.agent/platform-manifest.json`. | Run `morpheus invoke --resume` instead. |
| Existing workflow appears modified | It isn't — look again; the diff is whitespace or line-ending. | Check `git diff --ignore-all-space`. |
| `append-existing.sh` ran twice | Copier `_tasks` invoked it and the CLI tried to re-run. | v0.1.0 CLI already guards against this — ensure you're on latest. |

## Related docs

- [New-project walkthrough](new-project-walkthrough.md)
- [Updating the platform](updating-the-platform.md)
- [Escalation paths](../for-eng-managers/escalation-paths.md)
