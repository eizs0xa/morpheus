---
name: tester-node
version: 0.1.0
tier: stack
description: Design, extend, and verify automated tests for a Node.js + TypeScript codebase using the project's chosen test runner.
when_to_use: |
  - A task requires new or updated tests in a Node + TypeScript package.
  - A code change landed without adequate test coverage and needs to be shored up.
  - A holdout suite or acceptance set must be authored before implementation begins.
  - Flaky or slow tests need diagnosis and repair.
when_not_to_use: |
  - You are writing production code — use `coding-agent-node`.
  - You are writing Python or React-specific tests — use the matching stack tester skill.
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

# tester-node

## Purpose

Own the test surface for Node + TypeScript code. The skill turns spec acceptance criteria and
task descriptions into fast, deterministic, and traceable tests. It does not write shipping
code, but it reads shipping code thoroughly and fails loudly when behaviour and spec disagree.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` test entries | yes | Each entry names the files under test and the acceptance scenarios to cover. |
| `spec.md` | yes | The acceptance scenarios are the authoritative source. Quote the scenario ID in the test name. |
| Existing test suite | yes | Read to learn helpers, factories, and naming conventions. |
| Coverage thresholds | warn | Default to 80% lines / 70% branches if the project does not declare otherwise. |

## Process

1. **Classify the work.** Decide per task whether the need is unit, integration, contract, or
   end-to-end. Record the classification in the task summary.
2. **Locate the test runner.** Read `package.json` scripts and any runner config to learn the
   default command, the coverage tool, and existing reporters.
3. **Write tests before fixes when possible.** For bug fix tasks, add a failing test first,
   confirm it fails for the right reason, then hand off to `coding-agent-node`.
4. **Name tests after scenarios.** Use the spec's acceptance-scenario IDs inside test titles
   so the traceability chain stays intact.
5. **Keep tests deterministic.** No real clocks, real networks, or real filesystems unless the
   test is explicitly an integration test. Use injected fakes, not globals.
6. **Assert on observable behaviour, not structure.** Avoid asserting on private internals or
   on logging strings unless the log line is a declared contract.
7. **Measure.** Run the suite with coverage and compare against thresholds. Attach the report
   path to the summary.
8. **Triage flakes.** If a pre-existing test is flaky, either fix it inside this task or open
   a new task; never silently retry.

## Outputs

- New or extended test files within the task's scope.
- A coverage report referenced by path or CI URL.
- A risk note that lists uncovered branches, skipped scenarios, and known environmental gaps.

## Acceptance

The test pass is accepted only when all of the following pass:

- Every new acceptance scenario from the spec has at least one matching test with the scenario
  ID embedded in the test title.
- The coverage tool reports no regression against the declared thresholds.
- All new tests pass three consecutive runs without retries.
- No test depends on unrelated tests running first (no order coupling).
- Fakes and fixtures are clearly named and live in a shared helper when reused.
- The test command defined in `package.json` exits zero.

## Common failure modes

- **Happy-path bias.** Only covering the success case. Fix: enumerate failure branches from
  the spec's unwanted-behaviour clauses.
- **Mocking the world.** Faking every collaborator, then asserting on the fakes rather than
  outcomes. Fix: prefer real implementations of pure modules; fake only I/O.
- **Snapshot sprawl.** Committing giant snapshots that nobody reads. Fix: prefer focused
  assertions; limit snapshots to stable serializable outputs.
- **Untraceable titles.** Test names that do not reference spec IDs. Fix: rename.
- **Coverage chasing.** Adding tests that hit code without asserting anything meaningful. Fix:
  each test must fail if the behaviour it names regresses.
- **Flake tolerance.** Marking a flaky test `skip` to unblock CI. Fix: diagnose, fix, or open a
  new task; never silently skip.
