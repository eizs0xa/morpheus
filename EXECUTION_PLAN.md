# Morpheus — Agentic Development Platform: Execution Plan

> **Source blueprints**
> - Artifact A: *Agentic Development Platform — Repo Build Plan* (Claude artifact `11e71995`)
> - Artifact B: *Init Flow Refinement: User Profile, Hardware, and Project Detection* (Claude artifact `d6293df2`)
>
> **Reference codebase for patterns (read-only):** `../SEEK/`
> SEEK is the empirical proof that skills / agents / instructions / artifact-chain (PRD→TDS→SDD→Jira) works. We are extracting its patterns into a reusable platform. **Do not import SEEK code — extract patterns, rewrite clean.**

---

## 0. Outcome definition

At end of plan:
- `morpheus/` is a monorepo platform with a working `agentic` CLI (`init`, `validate` minimum)
- A greenfield `test-fullstack` project can be scaffolded in <60s with 5 profile-based install variants
- A brownfield overlay can be applied to SEEK itself without breakage as the acceptance test
- All modules validate against their `module.yaml` schema
- Platform is versioned `v0.1.0` and ready for the Phase 1 friendly pilot

---

## 1. Architectural north star (locked — do not debate during build)

From Artifact A §2 + §4:

```
morpheus/
├── cli/                      # Node/TS CLI (Artifact A §5, Artifact B §11)
├── modules/
│   ├── core/                 # Mandatory. Skills, schemas, templates, workflows.
│   ├── stacks/               # 0..N per project (stack-node, stack-python, stack-react, ...)
│   ├── workspaces/           # Exactly 1 (workspace-microsoft | workspace-google)
│   ├── integrations/         # 0..1 PM + 1 git provider (pm-jira, git-github, ...)
│   └── domains/              # 0..N (domain-healthcare, domain-payments, ...)
├── templates/                # new-project, brownfield-overlay, migration
├── docs/                     # Versioned with the platform
├── examples/
├── tests/                    # Integration tests against fixture projects
└── .github/
```

**Composition rules (enforced by CLI):**
1. `core` mandatory
2. Exactly one `workspace`
3. Exactly one `git` provider
4. 0..1 `pm` integration
5. 0..N `stacks`
6. 0..N `domains`

**Profiles (Artifact B §4) — exactly 5, no sixth:**
`builder | verifier | author | explorer | steward`

---

## 2. Parallelization strategy

Work is split into **workstreams**. Each workstream:
- Has a clearly scoped deliverable
- Declares its dependencies on other workstreams
- Is designed to be executed by a single subagent in one pass
- Has explicit acceptance criteria (machine-checkable where possible)

**Dependency layers** (anything in the same layer runs in parallel):

```
Layer 0: Scaffolding           → WS-01
Layer 1: Schemas + Core        → WS-02, WS-03               (parallel)
Layer 2: Modules               → WS-04, WS-05, WS-06, WS-07 (parallel, depend on Layer 1)
Layer 3: Templates             → WS-08, WS-09               (parallel, depend on Layer 2)
Layer 4: CLI                   → WS-10, WS-11, WS-12        (parallel, depend on Layers 1-3)
Layer 5: Docs + Tests          → WS-13, WS-14               (parallel, depend on Layer 4)
Layer 6: Acceptance            → WS-15                      (depends on all)
```

---

## 3. Workstreams

Each workstream below is formatted as a **ready-to-paste agent prompt**. Dispatch via `runSubagent` with the prompt inside a "Task" block and the workspace root set to `morpheus/`.

> **Convention for every workstream:** agent MUST read `morpheus/EXECUTION_PLAN.md` (this file) and `morpheus/CONSTITUTION.md` (created in WS-01) first. Agent MUST NOT edit files outside its declared `writes` scope.

---

### WS-01 — Repo scaffolding + platform constitution
**Layer:** 0  **Depends on:** none  **Writes:** `/` (root files only)

**Deliverables:**
- `README.md` — one-line pitch + link to PHILOSOPHY + quick-start (Artifact A §1)
- `PHILOSOPHY.md` — the "why" (paraphrase Artifact A intro + §12)
- `CONSTITUTION.md` — platform-level constitution (the platform's own law: semver, composition rules, stop-lines from Artifact B §9, do-lines §10)
- `CHANGELOG.md` — initialized at `[Unreleased]`
- `CONTRIBUTING.md` — module proposal process, breaking-change policy
- `CODEOWNERS` — placeholder `* @platform-team`
- `.gitignore`, `LICENSE` (MIT)
- Empty directory skeleton per §1 architectural map (add `.gitkeep` where empty)
- `.github/pull_request_template.md` + `.github/ISSUE_TEMPLATE/{module-request,bug-report}.md`
- `.github/workflows/ci.yml` — runs `pnpm -r test && pnpm -r lint` (stub OK)

**Acceptance:**
- `tree -L 2 morpheus/` matches Artifact A §3 top-level
- `CONSTITUTION.md` includes numbered composition rules and the 7 stop-lines verbatim from Artifact B §9

---

### WS-02 — JSON schemas (the contract layer)
**Layer:** 1  **Depends on:** WS-01  **Writes:** `modules/core/schemas/`

**Deliverables:** JSON Schema draft-07 files:
- `platform-manifest.schema.json` — records profile, hardware, project_type, modules+versions, initialized_at/by (Artifact B §10 example is the golden sample)
- `module.schema.json` — validates any `module.yaml` (Artifact A §4 spec)
- `profile.schema.json` — validates `modules/core/profiles.yaml` (Artifact B §5)
- `tasks.schema.json` — the agent worktree task list
- `overlap-map.schema.json`
- `amendment.schema.json`
- `adr.schema.json`

**Pattern source:** SEEK has no JSON schemas — design fresh. Reference Artifact A §4 `module.yaml` spec and Artifact B §10 manifest sample.

**Acceptance:**
- Every schema validates against draft-07 meta-schema
- Each schema has an `examples` block with at least one passing sample
- `cli/` later imports these as the single source of truth

---

### WS-03 — Core module skills (the artifact chain)
**Layer:** 1  **Depends on:** WS-01  **Writes:** `modules/core/skills/`, `modules/core/templates/`, `modules/core/module.yaml`

**Deliverables — skills (markdown with YAML frontmatter matching SEEK's SKILL.md pattern):**
- `spec-author.md` — PRD → spec.md
- `planner.md` — spec → plan.md
- `decomposer.md` — plan → tasks.json + overlap-map.json
- `initializer.md` — task list → N git worktrees
- `reviewer.md`, `integrator.md`, `fixer.md`, `evaluator.md`
- `constitution-author.md` — interview flow for authoring a project constitution
- `lore-reader.md`, `lore-curator.md`

**Templates (Jinja/copier style with `.tmpl`):**
- `constitution.md.tmpl`
- `CLAUDE.md.tmpl`, `AGENTS.md.tmpl`, `copilot-instructions.md.tmpl` (pointer files)
- `feature-template/{prd,spec,plan,tasks.json}.md.tmpl`

**Pattern extraction from SEEK (read-only):**
- `SEEK/.agents/skills/create_tech_design_spec/SKILL.md` — adapt structure for `spec-author`
- `SEEK/.agents/skills/create_spec_driven_dev_specs/SKILL.md` — adapt structure for `decomposer`
- `SEEK/AGENTS.md` — pattern for `AGENTS.md.tmpl`
- `SEEK/mms-daaa-gov-rfp-web-backend/agents.md` — pattern for a per-repo agent guide

**module.yaml:** `name: core, version: 0.1.0, requires: [], contributes: { skills, templates, schemas, workflows }`

**Acceptance:**
- Every skill file has YAML frontmatter with `name`, `description`, `tier`, `when_to_use`, `when_not_to_use` (SEEK pattern)
- `constitution.md.tmpl` has `{{ project_name }}`, `{{ primary_stacks }}`, `{{ profile }}` placeholders
- `module.yaml` validates against `module.schema.json` from WS-02

---

### WS-04 — Stack modules: `stack-node`, `stack-python`, `stack-react`
**Layer:** 2  **Depends on:** WS-02, WS-03  **Writes:** `modules/stacks/stack-{node,python,react}/`

**Per-stack deliverables:**
- `module.yaml` with detection markers (Artifact A §4)
- `skills/coding-agent-<stack>.md`, `skills/tester-<stack>.md`
- `workflows/agent-pr-gate-<stack>.yml.tmpl`
- `hooks/pre-commit-<stack>.sh`
- `instructions/<stack>.instructions.md` with `applyTo` glob (SEEK pattern from `SEEK/.github/instructions/sonarqube.instructions.md`)

**Pattern extraction from SEEK:**
- `SEEK/mms-daaa-gov-rfp-web-backend/agents.md` — Python patterns (pytest, black, ruff, SonarQube rules) → `stack-python`
- `SEEK/mms-daaa-gov-rfp-web-frontend/` — React/Vite/TS patterns → `stack-react`
- `SEEK/.github/instructions/sonarqube.instructions.md` — literal model for `instructions/*.instructions.md`

**Acceptance:**
- Each `module.yaml` declares `requires: [core >= 0.1.0]`
- Detection works: put `package.json` in fixture dir → detector matches `stack-node`
- Workflow templates render with a sample `platform-manifest.json` via envsubst

---

### WS-05 — Workspace modules: `workspace-microsoft`, `workspace-google`
**Layer:** 2  **Depends on:** WS-02, WS-03  **Writes:** `modules/workspaces/`

**Per-workspace deliverables:**
- `module.yaml` with `incompatible_with: [workspace-<other>]`
- `mcp-config.json.tmpl` — MCP server declarations (Outlook/Teams/OneDrive for MS; Gmail/Chat/Drive for Google)
- `skills/notifier-<workspace>.md` — one abstract notifier skill per workspace, callable identically

**Critical constraint (Artifact A §8):** skills in BOTH workspaces expose the SAME skill name `notifier` so a project's other skills reference `notifier` abstractly and workspace swap is transparent.

**Acceptance:**
- Both modules expose a skill named `notifier` (same filename: `skills/notifier.md`, content differs)
- `mcp-config.json.tmpl` is valid JSON after template variables are filled
- Composition test: CLI (stub OK here) refuses both workspaces simultaneously

---

### WS-06 — Integration modules: `pm-jira`, `git-github`
**Layer:** 2  **Depends on:** WS-02, WS-03  **Writes:** `modules/integrations/`

**`pm-jira/` deliverables:**
- `module.yaml`
- `mcp-config.json.tmpl` — Jira MCP server
- `skills/ticket-syncer-jira.md`
- `workflows/jira-branch-check.yml.tmpl` — enforces `{PROJECT_KEY}-NNNN` branch pattern
- `workflows/jira-smart-commits.yml.tmpl`
- `templates/jira-transition-map.yaml.tmpl`
- `preflight/initiative-check.ts` — Artifact B §7 logic (warning, not block)

**`git-github/` deliverables:**
- `workflows/agent-pr-gate.yml.tmpl`, `workflows/merge-queue.yml.tmpl`, `workflows/release-train.yml.tmpl`
- `templates/{pull_request_template.md,CODEOWNERS}.tmpl`
- `templates/branch-protection.json`

**Pattern extraction from SEEK:**
- `SEEK/.github/skills/generate-jira-stories/SKILL.md` — reference for ticket-syncer skill behavior

**Acceptance:**
- `jira-branch-check.yml` rejects a PR from branch `feature/no-key-here`
- `initiative-check.ts` returns `{status: 'warning', remediation: [...]}` when no initiative linked

---

### WS-07 — Profiles config + Optional domain scaffolding
**Layer:** 2  **Depends on:** WS-02, WS-03  **Writes:** `modules/core/profiles.yaml`, `modules/domains/README.md`

**Deliverables:**
- `modules/core/profiles.yaml` — verbatim structure from Artifact B §5 (builder/verifier/author/explorer/steward with `modules`, `skills_enabled`, `scaffolding`, `can_commit_code`, `extras`)
- `modules/domains/README.md` — how to contribute a domain module (template, no actual domains yet)
- Stub `modules/domains/domain-healthcare/module.yaml` as a proof-of-concept (marked `status: example`)

**Acceptance:**
- `profiles.yaml` validates against `profile.schema.json`
- Exactly 5 profile keys — no more, no less

---

### WS-08 — Top-level template: `new-project`
**Layer:** 3  **Depends on:** WS-04, WS-05, WS-06, WS-07  **Writes:** `templates/new-project/`

**Deliverables (copier-style):**
- `copier.yml` — variables: `project_name`, `profile`, `stacks[]`, `workspace`, `pm`, `git`, `jira_project_key?`
- `template/` — renders `.agent/`, `CLAUDE.md`, `AGENTS.md`, `copilot-instructions.md`, `.github/workflows/`, `.github/CODEOWNERS`, `.github/pull_request_template.md`, `platform-manifest.json`
- `template/.agent/feature-template/` (from core)
- Conditional rendering per profile (Artifact B §5 `scaffolding` field)

**Acceptance:**
- `copier copy templates/new-project /tmp/test-greenfield` with `profile=builder, stacks=[stack-node,stack-react]` produces a tree matching Artifact B §2 example output
- Same with `profile=author` produces ~6 files only (Artifact B §8)

---

### WS-09 — Top-level template: `brownfield-overlay`
**Layer:** 3  **Depends on:** WS-04, WS-05, WS-06, WS-07  **Writes:** `templates/brownfield-overlay/`

**Deliverables:**
- `copier.yml` with same variables as new-project PLUS `existing_conventions_preserved: bool`
- `template/` — ONLY overlays `.agent/` + pointer files + `.github/workflows/` additions (never overwrites existing workflows, appends to CODEOWNERS)
- `scripts/preserve-existing.sh` — backup-before-write helper
- `templates/migration/workspace-swap.sh` — migration script (Artifact A §8 Google migration)

**Acceptance:**
- Applied to a fixture copy of SEEK, existing `backend/` and `frontend/` directories untouched
- Pre-existing `AGENTS.md` gets backed up to `AGENTS.md.pre-morpheus.bak` before overwrite
- Existing `.github/workflows/*.yml` never modified; only NEW workflow files added

---

### WS-10 — CLI scaffolding + detectors
**Layer:** 4  **Depends on:** Layers 1-3  **Writes:** `cli/` (except `commands/init.ts`, `commands/validate.ts`)

**Deliverables:**
- `cli/package.json` (pnpm, TypeScript, `bin: { agentic: ./dist/index.js }`)
- `cli/src/index.ts` — commander entrypoint
- `cli/src/detectors/hardware.ts` — Artifact B §3 (os, arch, shell)
- `cli/src/detectors/project-type.ts` — Artifact B §6 heuristics, returns one of the 7 types
- `cli/src/detectors/stack.ts` — scans for module detection markers
- `cli/src/prompts/` — 5 questions, defaults applied (Artifact B §2)
- `cli/src/composers/module-resolver.ts` — given `profile + stacks + workspace + pm + git`, returns ordered module list respecting composition rules
- `cli/src/composers/file-renderer.ts` — wraps copier subprocess (Node shell + Python copier per Artifact A §11)
- `cli/tests/detectors.test.ts`, `cli/tests/composers.test.ts`

**Acceptance:**
- `project-type` returns `fullstack-web` for fixture with `package.json + react + express + prisma`
- `module-resolver` throws on `[workspace-microsoft, workspace-google]`
- Tests pass: `pnpm --filter cli test`

---

### WS-11 — CLI command: `agentic init`
**Layer:** 4  **Depends on:** WS-10  **Writes:** `cli/src/commands/init.ts`

**Deliverables:**
- Implements the 4-step interview from Artifact B §2
- Branches new-project vs brownfield based on `git rev-parse --git-dir` + `.agent/` existence
- Invokes `new-project` or `brownfield-overlay` copier template
- Writes `platform-manifest.json` (Artifact B §10 shape)
- Supports `--profile=<x>`, `--resume`, `--non-interactive` flags

**Acceptance:**
- Running `agentic init` in a fresh empty dir with stdin scripted to `builder, accept, proceed` produces a valid project
- Re-running `agentic init --profile=steward --resume` upgrades profile in manifest without data loss

---

### WS-12 — CLI command: `agentic validate` + `agentic doctor`
**Layer:** 4  **Depends on:** WS-10  **Writes:** `cli/src/commands/{validate,doctor}.ts`

**Deliverables:**
- `validate` — reads `platform-manifest.json`, checks every declared module exists at the declared version, every file it contributes is present, and composition rules still hold
- `doctor` — includes `validate` plus: stale module versions, orphaned workflows, missing CODEOWNERS entries, Jira credentials reachable
- Exit codes: `0 ok | 1 warnings | 2 errors`

**Acceptance:**
- Manually corrupting a generated project (e.g. delete a skill file) → `validate` exits 2 with a clear diagnosis
- Clean project → `validate` exits 0

---

### WS-13 — Docs site
**Layer:** 5  **Depends on:** Layers 1-4  **Writes:** `docs/`

**Deliverables per Artifact A §3:**
- `docs/README.md` (TOC)
- `docs/getting-started.md`
- `docs/for-engineers/{new-project-walkthrough,brownfield-walkthrough,updating-the-platform,writing-a-custom-skill}.md`
- `docs/for-verifiers/holdout-authoring.md`
- `docs/for-authors/prd-to-spec-walkthrough.md`
- `docs/for-explorers/codebase-tour.md`
- `docs/for-stewards/constitution-authoring.md`
- `docs/for-eng-managers/{rollout-guide,measuring-impact,escalation-paths}.md`
- `docs/for-platform-maintainers/{adding-a-module,publishing-a-release,handling-breaking-changes}.md`
- `docs/reference/{module-catalog,skill-catalog,cli-reference,schemas}.md`
- `docs/decisions/ADR-00{1,2,3}-*.md` (copier vs cookiecutter, monorepo vs multirepo, branching model)

**Pattern extraction from SEEK:** the `SEEK/docs/` folder structure is a good reference for tone and depth.

**Acceptance:**
- Every link resolves (run a markdown link checker)
- Every profile (Artifact B §4) has a corresponding first-run doc

---

### WS-14 — Integration tests + fixtures
**Layer:** 5  **Depends on:** Layers 1-4  **Writes:** `tests/`, `examples/`

**Deliverables:**
- `tests/integration/init-new-project.test.ts` — for each profile, run init non-interactively against a scratch tmpdir, assert expected files present/absent
- `tests/integration/init-brownfield.test.ts` — overlay on a snapshot of SEEK copied into `tests/fixtures/seek-snapshot/` (sparse copy, no full clone)
- `tests/integration/update-migration.test.ts` — init with v0.1, simulate bump to v0.2 (hand-authored fake), run update, assert manifest updates
- `examples/example-greenfield-node/`, `examples/example-brownfield-python/`, `examples/example-monorepo-multi-stack/` — real rendered outputs committed as reference

**Acceptance:**
- `pnpm test:integration` passes
- At least one test exists per profile

---

### WS-15 — Acceptance: dogfood against SEEK + tag v0.1.0
**Layer:** 6  **Depends on:** all  **Writes:** `CHANGELOG.md`, `.github/workflows/release.yml`

**Deliverables:**
- Apply brownfield overlay to a local clone of SEEK in a scratch dir; verify existing backend/frontend code untouched, new `.agent/` + pointer files appear, CI still runs
- `release.yml` — tag-driven release workflow
- `CHANGELOG.md` v0.1.0 entry summarizing all modules + profiles + commands shipped
- Git tag `v0.1.0`

**Acceptance:**
- `SEEK-dogfood.report.md` (kept locally, NOT committed) lists every file added, every file modified, every file preserved
- `agentic validate` in the dogfooded copy exits 0
- `agentic doctor` in the dogfooded copy exits 0 or 1 (warnings OK, errors NOT OK)

---

## 4. Dispatch guide — how to spawn parallel agents

For each **Layer**, dispatch every workstream in the layer **in parallel** via `runSubagent`. Wait for the full layer to complete before advancing.

Use this prompt template per workstream:

```
You are implementing workstream {WS-NN} of the Morpheus Agentic Platform.

Required reading (in order):
1. morpheus/EXECUTION_PLAN.md
2. morpheus/CONSTITUTION.md
3. The two source artifacts (already summarized in EXECUTION_PLAN.md §1-2)
4. Any SEEK files listed under "Pattern extraction" for your workstream — READ ONLY

Your workstream: {paste the full workstream section here}

Constraints:
- Do NOT write outside your declared `writes` scope.
- Do NOT modify SEEK — it is a read-only reference repo.
- Before writing code, list every file you plan to create with a one-line purpose. Proceed once you have the list.
- After writing, run the acceptance checks and report pass/fail for each.
- If blocked by a missing dependency (another workstream not done), STOP and report rather than improvising.

Return a final summary: files created, acceptance results, any deviations from the plan.
```

---

## 5. Stop-lines (copied from Artifact B §9 — keep these sacred)

1. No sixth profile
2. No per-profile constitutions or gates
3. Profiles are ergonomic, NOT runtime permissions
4. Max 5 init questions
5. No profile × stack × project-type matrices
6. No Jira validation expansion beyond initiative existence
7. No project-type branching inside `constitution-author`

---

## 6. Open questions to resolve before Layer 4

Block Layer 4 on answers to these (Artifact A §11):

1. CLI language stack confirmed: **Node+TS shell, Python copier subprocess** — proceed unless overridden
2. Distribution: **clone-the-repo for v0.1.0**, defer packaging
3. Docs hosting: **in-repo Markdown for v0.1.0**, defer static site generator
4. Lore storage: **flat files + ripgrep until 500 entries** — do not build embeddings yet
5. Platform release cadence: **on-demand** for first 6 months
6. Domain-module authorship: **platform team only** until contribution guide is written

Record answers in `docs/decisions/ADR-004-open-questions-v0.1.md`.

---

## 7. Ready-to-execute sequence (for the orchestrator)

```
[Layer 0]  dispatch(WS-01) → wait
[Layer 1]  dispatch(WS-02, WS-03) → wait
[Layer 2]  dispatch(WS-04, WS-05, WS-06, WS-07) → wait
[Layer 3]  dispatch(WS-08, WS-09) → wait
[Layer 4]  dispatch(WS-10) → wait ; dispatch(WS-11, WS-12) → wait
[Layer 5]  dispatch(WS-13, WS-14) → wait
[Layer 6]  dispatch(WS-15) → done → tag v0.1.0
```

Total critical path: **7 sequential layers, 15 workstreams, max 4-way parallelism at Layer 2.**
