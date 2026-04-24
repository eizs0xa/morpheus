---
name: coding-agent-python
version: 0.1.0
tier: stack
description: Implement production-grade Python code aligned with the project's stack conventions, lint rules, and the platform constitution.
when_to_use: |
  - A task list or spec has been produced for a Python codebase.
  - You need to add or modify application, service, or library code in a Python package.
  - Changes must pass formatting, lint, typecheck, tests, and the PR gate for stack-python.
when_not_to_use: |
  - The target is a JavaScript, TypeScript, or React codebase — use the matching stack skill.
  - You are writing tests only — use `tester-python`.
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

# coding-agent-python

## Purpose

Write and edit Python code for a single task from a decomposed task list. The skill is narrow
on purpose: it takes one task, reads the spec and plan, understands the existing conventions
in the target package, and produces a change set that formats, lints, type-checks, and passes
the test runner configured for the stack.

The skill honours the artifact chain by never inventing requirements. If the task is
ambiguous, the skill stops and asks.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` entry | yes | Single task object with `id`, `files`, `depends_on`, `acceptance`. |
| `spec.md` | yes | Resolves ambiguities in the task text. |
| `plan.md` | warn | Read when the task references an architectural decision. |
| Existing source tree | yes | Read-only by default; writes are restricted to the task's `files` list. |

## Process

1. **Orient.** Open the task entry. List the files to be touched. Read `pyproject.toml` and
   any `requirements*.txt` to learn the Python version, the package manager, the test runner,
   and the lint tooling.
2. **Read neighbours.** Open the module under edit, the modules it imports, and the tests that
   exercise it. Read them fully, not just the nearest function.
3. **Confirm the edit plan.** List target files, new public symbols, and tests to update.
   Wait for approval unless the task was pre-approved.
4. **Write code in small passes.**
   - Match existing style (naming, import order, docstring style, typing style).
   - Prefer pure functions for business logic; isolate I/O at the edges.
   - Keep cognitive complexity low; extract `_parse_*`, `_build_*`, `_validate_*` helpers.
   - Do not widen the public API beyond what the task requires.
5. **Type everything.** Every new function has type hints on parameters and return value.
   Prefer `pathlib.Path`, `typing.Protocol`, and `collections.abc` over `os.path` and legacy
   `typing.List`/`typing.Dict` when the project targets Python 3.10+.
6. **Errors are specific.** Catch the narrowest exception that models the failure. Raise
   `ValueError`, `TypeError`, or `RuntimeError` rather than bare `Exception`. Never `except:`.
7. **Secrets and logs.** Do not log tokens, connection strings, or signed URLs. Log identifier
   and status only. Read secrets through the workspace's declared helper, not from source.
8. **Run local checks.** Run the formatter, linter, typechecker, and tests for the touched
   package. Fix every new finding.
9. **Self-review** against the acceptance list before reporting done.

## Outputs

- A change set limited to the task's declared file list.
- A short test-surface note listing tests touched and the coverage delta.
- A one-line summary suitable for a PR body: what changed, why, and how it was verified.

## Acceptance

The change is accepted only when all of the following pass:

- The configured formatter reports no diff on the touched files.
- The configured linter reports zero new findings.
- The typechecker (if configured) reports zero new findings.
- The test runner reports zero new failures and zero regressions.
- Every new public function has a docstring naming its purpose, inputs, and raises.
- No file outside the task's declared `files` list is modified.
- The diff contains no commented-out code, no `print` debug statements, and no unused imports.

## Common failure modes

- **Broad exception handlers.** `except Exception` hides real bugs. Fix: catch the specific
  exception type and re-raise or translate deliberately.
- **Magic numbers and strings.** Literals repeated across a module become stale. Fix: extract
  a named constant with a comment explaining the value.
- **Growing a single function past the complexity budget.** One function becomes an octopus.
  Fix: split into `_parse_*`, `_validate_*`, `_build_*` helpers and use early returns.
- **Silent SQL string interpolation.** Never f-string values into SQL. Always parameterize.
- **Module-level singletons without locking.** Lazy init that races. Fix: guard with
  `threading.Lock` and a double-checked pattern.
- **Config drift.** Bumping pins or editing `pyproject.toml` to fix one task. Fix: such
  changes require a dedicated task.
