---
name: fixer
version: 0.1.0
tier: core
description: Diagnose a CI or test failure and propose a minimal patch. Optimised for short, targeted changes, not redesign.
when_to_use: |
  - CI failed on a PR and the root cause is plausibly a small, local fix.
  - A test is flaky and you need to confirm the failure mode before choosing to fix or quarantine.
  - A merge conflict is mechanical (non-semantic) and the resolution is obvious from the diff.
  - A linter/type-checker is blocking merge and the rule is well-known.
when_not_to_use: |
  - The failure points at a design problem — escalate to `planner` or `reviewer`.
  - The failure requires multi-file redesign — escalate to `spec-author` or `decomposer` for a new task.
  - The failure exposes a security issue — escalate to the steward and open a hotfix path.
  - The failure is in shared infra you do not own — route to the owning team.
inputs:
  - failing_run_url: string (CI run link)
  - pr_ref: string
  - logs: text (the failing job's logs or an excerpt)
  - repo_context: read-only access
outputs:
  - diagnosis_md: string
  - proposed_patch: unified diff
  - verification_steps: list of shell commands the author should run locally
requires_profiles: [builder, verifier]
---

# fixer

## Purpose

Produce the smallest useful patch to unblock a CI or test failure. The fixer is deliberately
narrow: it diagnoses a single failure, proposes a focused change, and lists the commands an
author can run to verify the fix locally. It does not redesign, refactor, or rewrite tests
that are not the immediate blocker.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| Failing run URL | yes | So the author can re-open the logs in context. |
| PR reference | yes | Identifies the branch and baseline to patch. |
| Logs | yes | Enough of the failing job's log to isolate the error. |
| Read-only repo access | yes | To inspect the files the error points at. |

## Process

1. **Reproduce the signal.** From the logs, extract the smallest excerpt that unambiguously
   identifies the failure: the first traceback, the first assertion, the first linter rule
   ID. Paste this in the diagnosis as evidence.
2. **Classify the failure.** One of: `test assertion`, `runtime exception`, `type error`,
   `lint rule`, `build error`, `merge conflict`, `flaky`. The class controls the fix pattern.
3. **Locate the code.** Resolve file and line from the log. Read the surrounding code, not
   just the failing line. If the failure cannot be localised, stop and escalate.
4. **Read the spec and the task.** Is the failing behaviour actually required? A failing
   test that asserts behaviour not in the spec is itself the bug. If the task is out of
   scope for this PR, escalate.
5. **Propose the minimal patch.** Prefer one-file, few-line changes. Do not reformat unrelated
   code. Do not rename anything. Do not change tests unless the test is itself the bug.
6. **Write verification steps.** Concrete shell commands: the exact unit test, the exact lint
   invocation, the exact type-check command. Include the expected output.
7. **Assess flakiness honestly.** If the failure is intermittent, do not "fix" it by
   loosening the assertion. Propose a quarantine (marker/skip with a linked ticket) instead.
8. **Hand off.** Output the diagnosis, the patch, and the verification steps. The author
   applies the patch, runs the verification, and re-pushes.

## Outputs

- `diagnosis.md`: the evidence excerpt, the class, the root cause in one or two sentences,
  and any links to prior lore about the same surface.
- `proposed_patch`: a unified diff (`git diff` or `patch -p1` format) applicable cleanly to
  the PR's tip.
- `verification_steps`: ordered list of shell commands with expected outcomes.

## Acceptance

The fix is accepted only when all of the following pass:

- The diagnosis cites a concrete log excerpt, not a paraphrase.
- The patch changes the minimum surface required to move CI green.
- Verification steps include at least one command that would have failed before the patch.
- If the failure was flaky, the output recommends quarantine rather than suppression.
- No test was edited to pass a failing assertion unless the test was the bug.
- No unrelated formatting or rename changes are included.

## Common failure modes

- **Suppression as fix.** Changing an `assertEqual` to a weaker match to make a test pass.
  This is never a fix; it is debt. Reject in review.
- **Drive-by refactor.** A one-line bug gets a fifty-line cleanup. Split the cleanup into a
  separate task.
- **Log paraphrase.** "Something about a NoneType." Paste the real excerpt.
- **Flaky denial.** Re-running CI until it passes. Quarantine with a linked ticket.
- **Wrong root cause.** Patching the symptom because the cause is further up the call stack.
  Walk the traceback before proposing changes.
- **Ignored lore.** A repeated failure that matches a known lore entry. Cite the lore; the
  fix may already exist.
