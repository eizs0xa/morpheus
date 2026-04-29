# Getting started

> Three paths into Morpheus: **new project**, **brownfield overlay**, and **learning-only**. Pick the one that matches your situation and follow it end to end.

## Prerequisites

All three paths share the same prerequisites.

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20 LTS or newer | Powers the `morpheus` / `agentic` CLI. |
| pnpm | 9+ | Package manager the CLI expects. |
| Python | 3.10+ | Hosts the `copier` template engine. |
| copier | 9+ | `pipx install copier` (preferred) or `pip install copier`. See note below. |
| git | 2.39+ | Required for brownfield mode detection. |

Verify with:

```bash
node --version && pnpm --version && python3 --version && (copier --version || python3 -m copier --version) && git --version
```

> **macOS note — `copier` after `pip install`:** `pip install copier` may place the binary in
> `~/Library/Python/<version>/bin`, which macOS does not add to `$PATH` automatically. The CLI can
> fall back to `python3 -m copier`; add the bin directory only if you want the `copier` command itself:
> ```bash
> echo 'export PATH="$PATH:$(python3 -m site --user-base)/bin"' >> ~/.zshrc && source ~/.zshrc
> ```

Install the CLI from a local checkout (distribution is clone-the-repo for v0.1.0 per [ADR-004](decisions/ADR-004-open-questions-v0.1.md)):

```bash
git clone https://github.com/<org>/morpheus.git
cd morpheus/cli
pnpm install && pnpm build
# First-time pnpm users: set up the global bin directory, then open a new terminal
# (or run: source ~/.zshrc) before proceeding.
pnpm setup
pnpm link --global
morpheus --version     # prints the platform version
# agentic --version also works — both names resolve to the same binary
```

---

## Path 1 — New project (greenfield)

You are starting from an empty directory.

### 1. Create and enter an empty directory

```bash
mkdir my-service && cd my-service
```

### 2. Run init

```bash
morpheus invoke
```

The CLI runs a five-step interview:

1. **Hardware** — detected and displayed (no prompt).
2. **Profile** — pick one of `builder | verifier | author | explorer | steward`.
3. **Project type** — the detector suggests one of seven types; confirm or pick another.
4. **PM preflight** — if you chose `pm-jira`, the CLI checks for credentials in env.
5. **Proceed** — confirm scaffolding.

### 3. Outcome

After a `builder` run with `stack-node + stack-react + pm-jira + git-github + workspace-microsoft`, you get:

```
.
├── .agent/
│   ├── platform-manifest.json
│   ├── constitution.md
│   ├── feature-template/
│   └── schemas/
├── .github/
│   ├── CODEOWNERS
│   ├── pull_request_template.md
│   └── workflows/
│       ├── agent-pr-gate.yml
│       ├── agent-pr-gate-node.yml
│       ├── agent-pr-gate-react.yml
│       ├── jira-branch-check.yml
│       └── jira-smart-commits.yml
├── AGENTS.md
├── CLAUDE.md
├── copilot-instructions.md
└── platform-manifest.json
```

Next: read [for-engineers/new-project-walkthrough.md](for-engineers/new-project-walkthrough.md) for a complete transcript and first commit.

---

## Path 2 — Brownfield overlay

You have an existing repo — `.git/` exists, source code exists, maybe `.github/workflows/*` already exists. You want Morpheus to **add** scaffolding without touching your code.

### Preconditions

- The repo has `.git/` (run `git rev-parse --git-dir` to confirm).
- The repo has no `platform-manifest.json` yet (if it does, use `morpheus invoke --resume`).
- You have permission to commit to a new branch.

### 1. Check out a clean branch

```bash
git checkout -b chore/morpheus-overlay
```

### 2. Run init in overlay mode

Mode is auto-detected. No flag needed.

```bash
morpheus invoke
```

### 3. What it touches vs preserves

| Touched | Preserved |
|---------|-----------|
| Creates `.agent/` with manifest, constitution, feature templates. | All source code (`backend/`, `frontend/`, `app/`, `src/`, etc.). |
| Adds `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md` (pointer files). | Existing `AGENTS.md` is backed up to `AGENTS.md.pre-morpheus.bak` first. |
| Adds **new** workflow files under `.github/workflows/`. | Existing workflow files — never modified. |
| Appends to `.github/CODEOWNERS` if platform entries are missing. | Existing CODEOWNERS rules — never reordered or deleted. |
| Writes `platform-manifest.json`. | Project config files (`package.json`, `pyproject.toml`, `tsconfig.json`). |

The overlay template runs `scripts/preserve-existing.sh` before any write. Backups are deterministic (`.pre-morpheus.bak` suffix).
If an init run is interrupted after the preflight step, re-run `morpheus invoke`; the preflight is safe to replay.

### 4. Verify

```bash
morpheus validate   # should exit 0
morpheus doctor     # 0 or 1 acceptable
git status          # review what changed
git diff --stat
```

Next: read [for-engineers/brownfield-walkthrough.md](for-engineers/brownfield-walkthrough.md).

---

## Path 3 — Learning (read-only tour)

You want to understand a codebase — your own, a teammate's, an OSS project — without modifying anything.

### 1. Choose the explorer profile

```bash
morpheus invoke --profile explorer
```

The `explorer` profile scaffolds **nothing** beyond a minimal `.agent/platform-manifest.json`. It surfaces only the `lore-reader` skill. It cannot commit code (`can_commit_code: false` per [`modules/core/profiles.yaml`](../modules/core/profiles.yaml)).

### 2. Tour the codebase

Read [for-explorers/codebase-tour.md](for-explorers/codebase-tour.md) for the full walkthrough. The short version:

```bash
agentic lore search "auth flow"    # (future) find prior decisions touching auth
```

### 3. Outcome

You now have a `platform-manifest.json` that records your profile as `explorer`. You can switch to a writing profile later with:

```bash
morpheus invoke --profile builder --resume
```

`--resume` upgrades the profile in-place without re-scaffolding.

---

## Where to go next

- Engineers → [for-engineers/](for-engineers/)
- Verifiers → [for-verifiers/holdout-authoring.md](for-verifiers/holdout-authoring.md)
- Authors → [for-authors/prd-to-spec-walkthrough.md](for-authors/prd-to-spec-walkthrough.md)
- Stewards → [for-stewards/constitution-authoring.md](for-stewards/constitution-authoring.md)
- Eng managers → [for-eng-managers/rollout-guide.md](for-eng-managers/rollout-guide.md)
- Full CLI surface → [reference/cli-reference.md](reference/cli-reference.md)
