# CLI reference

> Every `morpheus` / `agentic` command, flag, exit code, and environment variable. Derived from [`../../cli/src/index.ts`](../../cli/src/index.ts) and [`../../cli/src/commands/`](../../cli/src/commands/).

## Invocation

The CLI ships as two binary names from the same entrypoint:

```text
morpheus [global-options] <command> [command-options]   # preferred
agentic  [global-options] <command> [command-options]   # backward-compatible alias
```

Help text reflects whichever name was used. All commands and flags are identical.

## Global options

| Option | Default | Description |
|--------|---------|-------------|
| `--non-interactive` | `false` | Run without interactive prompts. Required for CI and scripted use. |
| `--profile <name>` | (none) | Pre-select a profile. One of `builder \| verifier \| author \| explorer \| steward`. |
| `--verbose` | `false` | Verbose logging. |
| `--version` | — | Prints the CLI version and exits. |
| `-h`, `--help` | — | Prints help and exits. |

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success. |
| `1` | Warnings, or a typed `AgenticError` (see error codes below), or unknown command / bad flag. |
| `2` | Validation / doctor errors (manifest mismatches, missing contributed files). |

Commands that compute a report (`validate`, `doctor`) emit a stable code:
- `0` = clean
- `1` = warnings only
- `2` = errors present

## Commands

### `morpheus invoke` (alias: `agentic init`)

Scaffold a new Morpheus project or overlay the platform onto an existing repository. Auto-detects mode:

- **new** — no `.git/` present → renders `templates/new-project/`.
- **brownfield** — `.git/` present, no manifest → renders `templates/brownfield-overlay/` (non-destructive).
- **initialized** — manifest present → refuses unless `--resume` is passed.

Command-local options:

| Option | Default | Description |
|--------|---------|-------------|
| `--resume` | `false` | Re-run init against an already-initialized project. Updates the profile and manifest without re-rendering source. |
| `--answers-file <path>` | (none) | YAML answers file for non-interactive runs. Precedence is explained below. |

**Interactive flow (Artifact B §2):**

1. Hardware — detected and displayed (no prompt).
2. Profile — pick one of five.
3. Project type — confirm detected type or pick another of seven.
4. PM preflight — if `pm-jira` is chosen, warn if credentials missing.
5. Proceed — final confirmation.

**Examples:**

```bash
# Interactive
morpheus invoke

# Scripted
morpheus invoke --non-interactive --profile builder --answers-file answers.yml

# Switch profile on an existing project
morpheus invoke --profile steward --resume

# Backward-compatible alias
agentic init
```

**Post-init flow (brownfield only):**

When `morpheus invoke` succeeds in brownfield mode it writes ordered task files
under `.agent/tasks/` and prints:

```
Type /morpheus in your agent prompt window and press send.
```

That single action triggers the **Morpheus Orchestrator** skill
(`.agent/skills/morpheus-orchestrator.md`) via
`.github/prompts/morpheus.prompt.md`. The orchestrator:

1. Executes every pending task in `.agent/tasks/` in numeric order.
2. Runs `morpheus validate` and refuses to continue past a failure.
3. Opens a single PR titled `chore: complete Morpheus initialization`.
4. Writes `MORPHEUS_INIT_REPORT.md` at the repo root summarising what changed,
   why, and how the new system works relative to the old.

The default tasks are `01-author-constitution.md`, `02-audit-docs.md` (only when
existing docs are detected), and `99-finalize-report.md`.

---

### `agentic validate`

Structural health check. Reads `platform-manifest.json` (root or `.agent/`), verifies every declared module exists at the declared version, verifies every contributed file was rendered, and verifies composition rules still hold. Also validates any `.agent/schemas/*.json` against draft-07.

Command-local options:

| Option | Default | Description |
|--------|---------|-------------|
| (none yet) | — | Run uses project-cwd auto-detection. |

Output: human-readable report by default; JSON when a future `--json` flag lands.

**Exit codes:**

- `0` — no issues.
- `1` — warnings (e.g. manifest pinned to older module version than on disk).
- `2` — errors (missing contributed file, unknown module, composition-rule violation).

**Examples:**

```bash
cd my-service
agentic validate
```

---

### `agentic doctor`

Everything `validate` does, plus deeper probes:

- Stale module versions relative to the platform checkout.
- Orphaned workflow files under `.github/workflows/` that match platform patterns but aren't declared by any installed module.
- Missing CODEOWNERS entries for platform-owned paths.
- Best-effort Jira credentials reachability (skippable with `--skip-external`).
- Constitution file presence at `.agent/constitution.md`.
- Basic git repo sanity (`.git/` exists, not in detached HEAD).

Command-local options:

| Option | Default | Description |
|--------|---------|-------------|
| `--skip-external` | `false` | Skip network probes (Jira). |

**Examples:**

```bash
agentic doctor
agentic doctor --skip-external
```

Exit codes mirror `validate`.

---

### `agentic add <module>`

**Status: NOT IMPLEMENTED** in v0.1. Invoking raises `E_NOT_IMPLEMENTED`. Reserved for a future MINOR.

```bash
agentic add stack-python
# → NOT_IMPLEMENTED — agentic add <module>
```

---

### `agentic remove <module>`

**Status: NOT IMPLEMENTED** in v0.1. Invoking raises `E_NOT_IMPLEMENTED`. Reserved for a future MINOR.

```bash
agentic remove stack-node
# → NOT_IMPLEMENTED — agentic remove <module>
```

---

### `morpheus update` (alias: `agentic update`)

Pull the latest Morpheus platform from GitHub, rebuild the CLI, and re-apply the overlay on the current project.

Three sequential steps:

| Step | What it does | Skip flag |
|---|---|---|
| 1/3 Pull | `git pull --ff-only origin <branch>` on the Morpheus platform root | `--skip-pull` |
| 2/3 Build | `pnpm install && pnpm build` in `platform-root/cli/` (falls back to `npm`) | `--skip-build` |
| 3/3 Overlay | `invoke --resume` on the current project to apply new module contributions, template changes, and schema updates | `--skip-overlay` |

Guards:
- Refuses to pull if the platform repo has uncommitted local changes.
- Throws a clear error if the target project hasn't been initialized yet (`morpheus invoke` first).

**Examples:**

```bash
# Full update
morpheus update

# CI: skip the pull (checkout is managed externally)
morpheus update --skip-pull

# Only pull + build, don't touch the project overlay
morpheus update --skip-overlay
```

---

### Planned commands (tracked, not shipped)

| Command | Intent |
|---------|--------|
| `morpheus feature new --intent=prd <KEY>` | Create a feature folder from the core template. |
| `morpheus tour` | Walk an agent through the codebase in explorer mode. |
| `morpheus lore search <query>` | Flat-file + ripgrep lore search (per [ADR-004](../decisions/ADR-004-open-questions-v0.1.md)). |

## Error codes

Emitted by the typed error hierarchy in [`../../cli/src/util/errors.ts`](../../cli/src/util/errors.ts).

| Code | Class | Meaning |
|------|-------|---------|
| `E_COMPOSE` | ComposeError | Composition rules violated (e.g. both workspaces selected). |
| `E_VALIDATION` | ValidationError | Input validation failed (bad answer, bad flag, user aborted). |
| `E_TEMPLATE` | TemplateError | Copier render failed or brownfield preserve step failed. |
| `E_MANIFEST` | ManifestError | `platform-manifest.json` read/write or shape error. |
| `E_DETECTION` | DetectionError | Hardware / project-type / stack detection failed. |
| `E_NOT_IMPLEMENTED` | NotImplementedError | Command placeholder. |

Every error carries a human-readable remediation string rendered on stderr in yellow.

## Environment variables

### `MORPHEUS_*` variables

| Variable | Purpose |
|----------|---------|
| `MORPHEUS_PROFILE` | Overrides the profile when no `--profile` flag is passed. |
| `MORPHEUS_PROJECT_NAME` | Seeds `project_name` for non-interactive init. |
| `MORPHEUS_PROJECT_DESCRIPTION` | Seeds `project_description`. |
| `MORPHEUS_PRIMARY_OWNER_EMAIL` | Seeds `primary_owner_email`. |
| `MORPHEUS_STACKS` | Comma-separated stack modules. |
| `MORPHEUS_WORKSPACE` | Workspace module (`workspace-microsoft` / `workspace-google`). |
| `MORPHEUS_PM` | PM integration (`pm-jira` or `none`). |
| `MORPHEUS_GIT` | Git integration (`git-github`). |
| `MORPHEUS_DOMAINS` | Comma-separated domain modules. |
| `MORPHEUS_JIRA_PROJECT_KEY` | Jira project key (e.g. `PROJ`). |
| `MORPHEUS_JIRA_SITE_URL` | Jira site URL. |
| `MORPHEUS_JIRA_INITIATIVE_KEY` | Optional initiative key for preflight. |
| `MORPHEUS_RELEASE_CADENCE` | Release cadence token (default `weekly`). |
| `MORPHEUS_NODE_VERSION` | Node major version (default `20`). |
| `MORPHEUS_PYTHON_VERSION` | Python version (default `3.12`). |
| `MORPHEUS_PACKAGE_MANAGER_NODE` | `pnpm` / `npm` / `yarn`. |
| `MORPHEUS_PACKAGE_MANAGER_PYTHON` | `pip` / `uv` / `poetry`. |
| `MORPHEUS_TEAMS_WEBHOOK_URL` | Teams webhook for notifier (MS workspace). |
| `MORPHEUS_PRIMARY_CHANNEL_ID` | Primary channel ID. |
| `MORPHEUS_PRIMARY_CHANNEL_NAME` | Primary channel name. |
| `MORPHEUS_CHAT_SPACE_ID` | Chat space ID (Google workspace). |
| `MORPHEUS_PLATFORM_ROOT` | Override for the platform-root resolution. Useful in CI. |

### Credential variables

| Variable | Purpose |
|----------|---------|
| `JIRA_EMAIL` | Jira API email. Used by the preflight check. |
| `JIRA_API_TOKEN` | Jira API token. Required for non-stub preflight. |

### Answer precedence

Highest wins:

1. `InitOptions` explicit flags (e.g. `--profile`).
2. YAML answers file (`--answers-file <path>`).
3. `MORPHEUS_*` environment variables.
4. Detected / default values.

## Answers file format

Used with `morpheus invoke --non-interactive --answers-file <path>`. YAML mapping at top level:

```yaml
project_name: my-service
project_description: Customer-facing widget service
profile: builder
primary_owner_email: owner@example.com
workspace: workspace-microsoft
git: git-github
pm: pm-jira
stacks:
  - stack-node
  - stack-react
domains: []
jira_project_key: PROJ
jira_site_url: https://company.atlassian.net
initiative_key: PROJ-1
release_cadence: weekly
node_version: "20"
package_manager_node: pnpm
python_version: "3.12"
package_manager_python: pip
teams_webhook_url: ""
primary_channel_id: ""
primary_channel_name: general
chat_space_id: ""
```

Keys are parsed loosely — numbers and booleans are stringified where a string is expected.

## Related docs

- [Module catalog](module-catalog.md)
- [Skill catalog](skill-catalog.md)
- [Schemas](schemas.md)
- [Getting started](../getting-started.md)
