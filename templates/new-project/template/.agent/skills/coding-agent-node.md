---
name: coding-agent-node
version: 0.1.0
tier: stack
description: Implement production-grade Node.js + TypeScript code aligned with the project's stack conventions and the platform constitution.
when_to_use: |
  - A task list or spec has been produced for a Node + TypeScript codebase.
  - You need to add or modify server, CLI, or library code in a package that declares TypeScript.
  - Changes must pass lint, typecheck, tests, and the PR gate workflow for stack-node.
when_not_to_use: |
  - The target code is React UI — use `coding-agent-react` for component and hook work.
  - The target code is Python — use `coding-agent-python`.
  - You are authoring tests only — use `tester-node`.
  - You are writing specs, plans, or tickets — use the core artifact-chain skills.
inputs:
  - tasks_path: string (path to tasks.json produced by the decomposer)
  - spec_path: string (path to the spec.md the task set traces back to)
  - repo_context: read/write access scoped to declared files in the task
outputs:
  - changed_files: string[] (list of files written or modified)
  - test_surface_note: string (unit/integration tests the implementation relies on)
requires_profiles: [builder, steward]
---

# coding-agent-node

## Purpose

Write and edit Node.js + TypeScript code for a single task from a decomposed task list. The
skill is narrow on purpose: it takes one task, reads the spec and plan, understands the
existing conventions in the target package, and produces a change set that compiles, lints,
and passes the test runner configured for the stack.

The skill honours the artifact chain by never inventing requirements. If the task description
is ambiguous, the skill stops and asks rather than guessing.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` entry | yes | Single task object with `id`, `files`, `depends_on`, `acceptance`. |
| `spec.md` | yes | Used to resolve any ambiguity in the task text. |
| `plan.md` | warn | Read when the task references an architectural decision. |
| Existing source tree | yes | Read-only by default; writes are restricted to the task's `files` list. |

## Process

1. **Orient.** Open the task entry. List the files the task will touch and confirm each exists
   or is being created. Read the nearest `package.json` to learn the package manager, the test
   runner, the TypeScript version, and any lint config.
2. **Read neighbours.** Open the files nearest to the change, any referenced types, and the
   test files that exercise the touched code. Do not skim — read the full module you are
   editing, end to end.
3. **Confirm the edit plan.** Print a short block listing the target files, the new public
   symbols (if any), and the test files that will be added or updated. Wait for approval
   unless the task was pre-approved.
4. **Write code in small passes.**
   - Match existing style (module format, import ordering, naming, error handling).
   - Prefer named exports; avoid default exports unless the surrounding code already uses them.
   - Keep functions small and typed. Favour pure functions for business logic.
   - Never widen the public API beyond what the task requires.
5. **Keep types honest.** No `any` unless the surrounding code already uses it and the task
   explicitly accepts it. Prefer `unknown` + narrowing. Make error channels explicit.
6. **Close the loop on tests.** For every new public function or branch, either add or update
   a test. Defer the full test sweep to `tester-node` when the task marks tests out of scope.
7. **Run local checks.** Run the package's lint, typecheck, and tests for the changed files.
   Fix every warning introduced by this change.
8. **Self-review.** Walk the acceptance list before reporting done. Do not report success if
   any acceptance item fails.

## Outputs

- A change set limited to the task's declared file list.
- A short test-surface note listing the tests touched and the coverage delta when available.
- A one-line summary suitable for a PR body: what changed, why, and how it was verified.

## Acceptance

The change is accepted only when all of the following pass:

- `tsc --noEmit` (or the project's equivalent) exits clean for the touched package.
- The configured lint step reports zero new findings.
- The configured test runner reports zero new failures and zero regressions.
- Every new public symbol has a JSDoc or TSDoc comment stating purpose and invariants.
- No file outside the task's declared `files` list is modified.
- The diff contains no commented-out code, no debug logs, and no unreferenced imports.

## Common failure modes

- **Silent widening of the public API.** Exporting helpers that should have stayed module
  local. Fix: revert the export, move the helper inside the module, or mark it `@internal`.
- **Ignoring existing style.** Switching between import styles (`import` vs `require`) inside
  one repo. Fix: read the neighbouring files and mirror them.
- **Type escape hatches.** Sprinkling `as any` or `!` to make the compiler happy. Fix: narrow
  with guards, adjust the type, or surface the ambiguity back to the spec author.
- **Unchecked promise chains.** Leaking unhandled rejections or forgetting `await` in an
  `async` function. Fix: enable `no-floating-promises` in lint and handle every branch.
- **Over-reaching edits.** Touching files beyond the task scope because "while I was there".
  Fix: stop, split the work into another task, and hand the excess back to the planner.
- **Config drift.** Bumping a dependency or editing `tsconfig.json` to fix one task. Fix:
  such changes require their own task and a constitution check.
