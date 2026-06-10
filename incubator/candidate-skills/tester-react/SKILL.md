---
name: tester-react
version: 0.1.0
tier: stack
description: Design, extend, and verify automated tests for a React + TypeScript UI using the project's chosen component and end-to-end test runners.
when_to_use: |
  - A task requires new or updated component, hook, or end-to-end tests in a React package.
  - A UI change landed without adequate coverage and needs to be shored up.
  - A holdout acceptance set must be authored before implementation begins.
  - Flaky component or end-to-end tests need diagnosis and repair.
when_not_to_use: |
  - You are writing production UI code — use `coding-agent-react`.
  - You are writing Node-only or Python tests — use the matching stack tester skill.
  - You are authoring the spec's Gherkin acceptance scenarios — that is `spec-author`.
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

# tester-react

## Purpose

Own the test surface for React + TypeScript UI. The skill turns spec acceptance criteria into
fast, deterministic, and accessible tests at the right level (component, hook, or end-to-end).
It does not write shipping code, but it reads shipping code fully and fails loudly when
behaviour and spec disagree.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` test entries | yes | Each entry names the files under test and the acceptance scenarios to cover. |
| `spec.md` | yes | Acceptance scenarios are authoritative. Quote the scenario ID in the test name. |
| Existing test suite | yes | Read to learn render helpers, providers, and testing patterns. |
| Coverage thresholds | warn | Default to 80% lines / 70% branches if the project does not declare otherwise. |

## Process

1. **Pick the level.** Decide per acceptance scenario whether a hook test, a component test,
   or an end-to-end test is the cheapest credible check. Record the classification.
2. **Locate the runners.** Read `package.json` scripts and any config for the component runner
   (vitest / jest) and the end-to-end runner (playwright / cypress). Reuse existing render
   helpers and providers.
3. **Assert on behaviour, not markup.** Query by role and accessible name. Do not assert on
   class names or deeply nested test ids unless the component has no better handle.
4. **Name tests after scenarios.** Test titles carry the spec scenario ID so the traceability
   chain stays intact.
5. **Fakes at the boundary.** Fake network, clock, and storage; do not fake React internals.
   Use the project's MSW or equivalent request-level fakes when available.
6. **Cover unhappy paths.** Every branch the spec calls out (error toast, loading skeleton,
   empty state) has its own test.
7. **Write the end-to-end tests last.** Component tests cover most branches cheaply; the
   end-to-end suite proves the routes wire up and the happy flow holds.
8. **Measure.** Run with coverage and compare against thresholds. Attach the report path.
9. **Triage flakes.** Fix or open a new task; never silently retry.

## Outputs

- New or extended test files within the task's scope.
- A coverage report referenced by path or CI URL.
- A risk note listing uncovered branches, skipped scenarios, and known flakes.

## Acceptance

The test pass is accepted only when all of the following pass:

- Every new acceptance scenario has at least one matching test with the scenario ID in the
  test title.
- Queries use accessible roles and names where possible; `getByTestId` only as a last resort.
- The coverage tool reports no regression against the declared thresholds.
- All new tests pass three consecutive runs without retries.
- End-to-end tests do not hit production services; they hit a documented local or fake stack.
- The test command defined in `package.json` exits zero.

## Common failure modes

- **Markup-coupled tests.** Asserting on class names or tag structure. Fix: query by role and
  name; the spec cares about user-observable behaviour.
- **Fake React.** Mocking hooks or the scheduler to make a test pass. Fix: revisit the
  production code; the need to fake React usually means the component has a design smell.
- **One giant test.** A single test that exercises ten scenarios. Fix: split.
- **Missing a11y coverage.** No keyboard or screen-reader assertion for new interactive
  elements. Fix: add a role-based query and a keyboard interaction.
- **Flake tolerance.** `retry=3` on a browser test that is actually racing state. Fix: wait on
  the observable state, not on arbitrary timeouts.
- **Snapshot sprawl.** Huge snapshots nobody reads. Fix: focused assertions on the meaningful
  surface.
