---
name: tester-python
version: 0.1.0
tier: stack
description: Design, extend, and verify automated tests for a Python codebase using the project's chosen test runner and coverage tool.
when_to_use: |
  - A task requires new or updated tests in a Python package.
  - A code change landed without adequate test coverage and needs to be shored up.
  - A holdout suite or acceptance set must be authored before implementation begins.
  - Flaky or slow tests need diagnosis and repair.
when_not_to_use: |
  - You are writing production code — use `coding-agent-python`.
  - You are writing JS/TS or React tests — use the matching stack tester skill.
  - You are authoring the spec's Gherkin acceptance scenarios — that is `spec-author`.
  - You are evaluating rollout risk — use `evaluator` from core.
inputs:
  - tasks_path: string (the tester's assigned tasks)
  - spec_path: string (source of acceptance criteria)
  - coverage_targets: object (per-package minimum coverage thresholds)
outputs:
  - added_tests: string[] (test files created or extended)
  - coverage_report_path: string (path or URL to the run artefact)
  - risk_note: string (gaps still present after this pass)
requires_profiles: [builder, verifier, steward]
---

# tester-python

## Purpose

Own the test surface for Python code. The skill turns spec acceptance criteria and task
descriptions into fast, deterministic, and traceable tests. It does not write shipping code,
but it reads shipping code fully and fails loudly when behaviour and spec disagree.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` test entries | yes | Each entry names the files under test and the acceptance scenarios to cover. |
| `spec.md` | yes | Acceptance scenarios are authoritative. Quote the scenario ID in the test name. |
| Existing test suite | yes | Read to learn fixtures, factories, and naming conventions. |
| Coverage thresholds | warn | Default to 80% lines / 70% branches if the project does not declare otherwise. |

## Process

1. **Classify the work.** Decide per task whether unit, integration, contract, or end-to-end
   tests are needed. Record the classification in the task summary.
2. **Locate the runner.** Read `pyproject.toml` or `pytest.ini` / `tox.ini` to learn the
   default command, the coverage plugin, and the markers in use.
3. **Write failing tests first on bug-fix tasks.** Add a test that reproduces the bug, confirm
   it fails for the right reason, then hand off to `coding-agent-python`.
4. **Name tests after scenarios.** Test function names carry the spec scenario ID so the
   traceability chain stays intact.
5. **Prefer fixtures over mocks.** Use pytest fixtures and `tmp_path` for filesystem, and
   in-memory fakes for I/O. Mock only at true integration boundaries.
6. **Keep tests deterministic.** No real clocks, real networks, or real databases unless the
   test is marked integration and runs in that job. Freeze time with a helper, not global
   monkey-patching.
7. **Parametrize, do not copy-paste.** Use `@pytest.mark.parametrize` for table-driven cases.
8. **Measure.** Run with coverage and compare against thresholds. Attach the report path.
9. **Triage flakes.** If a pre-existing test is flaky, fix it inside this task or open a new
   task; never silently retry.

## Outputs

- New or extended test files within the task's scope.
- A coverage report referenced by path or CI URL.
- A risk note listing uncovered branches, skipped scenarios, and environmental gaps.

## Acceptance

The test pass is accepted only when all of the following pass:

- Every new acceptance scenario from the spec has at least one matching test with the scenario
  ID embedded in the test name.
- The coverage tool reports no regression against the declared thresholds.
- All new tests pass three consecutive runs without retries.
- No test depends on unrelated tests running first.
- Fixtures live in `conftest.py` when reused; module-local fixtures stay in the module.
- The test command defined in `pyproject.toml` or the project's standard invocation exits zero.

## Common failure modes

- **Happy-path bias.** Only covering the success case. Fix: enumerate failure branches from
  the spec's unwanted-behaviour clauses.
- **Mocking the world.** Faking every collaborator, then asserting on the fakes rather than
  outcomes. Fix: prefer real implementations of pure modules; fake only I/O.
- **Assertion on log strings.** Fragile assertions on log output. Fix: log lines are not a
  contract unless the spec declares them to be.
- **Untraceable test names.** Names that do not reference spec IDs. Fix: rename.
- **Coverage chasing.** Adding tests that execute code without asserting behaviour. Fix: each
  test must fail if the behaviour it names regresses.
- **Flake tolerance.** Marking a flaky test `skip` or `xfail` to unblock CI. Fix: diagnose,
  fix, or open a new task.
