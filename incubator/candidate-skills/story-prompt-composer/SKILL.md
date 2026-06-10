---
name: story-prompt-composer
version: 0.1.0
tier: integration
description: >
  Composes a structured, copy-paste-ready agent prompt for a single Jira story
  or task. The prompt follows a 10-part format that gives any coding agent
  (Copilot, Cursor, Claude Code, Cline, etc.) everything it needs to pick up
  and complete the story autonomously without additional context-gathering.
when_to_use: |
  - A Jira story has been created or is about to be created and needs an
    embedded agent prompt so a developer can paste it directly into their
    agent's chat window to start implementation.
  - A task in tasks.json needs a companion prompt for agent pickup.
  - You want to generate or regenerate prompts for a batch of stories after
    a spec or plan change.
when_not_to_use: |
  - The story is for human manual work only (QA sign-off, legal review, etc.)
    and will never be handed to an agent.
  - The task is a trivial one-line hotfix — use a direct instruction instead.
  - The spec or plan is not yet finalized — prompts written against a draft
    will be stale by the time the story is picked up.
inputs:
  - task: object (single task entry from tasks.json)
  - spec_md_path: string (path to the feature spec.md)
  - plan_md_path: string (path to the feature plan.md)
  - constitution_path: string (path to .agent/constitution.md)
  - platform_manifest: object (from platform-manifest.json)
  - jira_key: string | null (e.g. "PROJ-1234"; null if not yet created)
  - related_file_paths: string[] (files the agent will most likely touch)
  - prior_art_examples: string[] (optional — real code snippets or file paths that demonstrate the pattern to follow)
outputs:
  - agent_prompt: string (the full 10-part structured prompt, ready to embed in the Jira story description and copy-paste into an agent)
requires_profiles: [builder, author, steward]
---

# story-prompt-composer

## Purpose

Produce a single, self-contained agent prompt for one story. The prompt is
designed to be:

1. **Embedded** in the Jira story description under an `## Agent Prompt` section.
2. **Copy-pasted** directly into a coding agent's chat window.
3. **Complete** — the agent should not need to ask clarifying questions or
   hunt for context files after receiving it.

The format follows a strict 10-part structure (based on Anthropic's Claude
prompting best practices) that maximises agent success rate on first attempt.

---

## The 10-part prompt structure

Each generated prompt MUST contain all ten parts in order. Parts that have no
content for a given story MUST still appear with a `(none)` placeholder so the
agent knows the section was considered, not forgotten.

### Part 1 — Task context

Who the agent is and what project this belongs to.

```
You are a {profile} agent working on {project_name} ({stack} stack).
Your goal is to implement the story described below completely and correctly,
following the project's constitution and coding conventions.
```

Populate from: `platform_manifest.profile`, `platform_manifest.project_name`,
detected stacks from `platform_manifest.modules`.

---

### Part 2 — Tone / code style context

How the agent should write code and communicate.

Pull from the constitution's "coding conventions" section if present. Fall back
to stack defaults (e.g. for `stack-node`: TypeScript strict mode, ESLint, no
`any`; for `stack-python`: type hints required, ruff/black, no bare `except`).

---

### Part 3 — Background data, documents, and images

Reference material the agent must read before acting. Always include:

- Spec: `<spec>{path-to-spec.md}</spec>`
- Plan: `<plan>{path-to-plan.md}</plan>`
- Constitution: `<constitution>{path-to-constitution.md}</constitution>`
- Related files: list each `<file>{path}</file>`
- Any images or diagrams if referenced in the spec.

---

### Part 4 — Detailed task description & rules

The full task description plus binding constraints. Include:

- Task title and description verbatim from `tasks.json`.
- Acceptance criteria verbatim from the spec (the requirement IDs this task satisfies).
- Hard rules:
  - Never bypass the constitution.
  - Never edit `platform-manifest.json` by hand.
  - Follow the project's branch naming convention (`<type>/<JIRA-KEY>-<slug>`).
  - Every code change must have a corresponding test.
  - Commit messages must carry the Jira Smart Commit trailer: `Jira: {jira_key} #in_progress`.

---

### Part 5 — Examples

Real code patterns from the same codebase that demonstrate the expected style.
Pull from `prior_art_examples` if supplied, otherwise use a read-only search to
find a nearby analogous function/component/test and include a short snippet.

If no prior art exists: `(none — this is a greenfield component; follow stack defaults)`.

---

### Part 6 — Conversation history

`(none — fresh agent pickup)`

This is always `(none)` for a story-level prompt. Thread-level continuation
is handled by the agent's own context window.

---

### Part 7 — Immediate task description / request

A direct, imperative instruction. Keep it to 1–3 sentences.

```
Implement story {jira_key}: {task_title}.
Make all listed acceptance criteria pass.
Open a PR titled "feat({jira_key}): {short-slug}" when done.
```

---

### Part 8 — Think step by step / take a deep breath

A chain-of-thought trigger. Use this exact phrasing:

```
Before writing any code, think step by step:
1. Which files will you touch and why?
2. What tests do you need to write or update?
3. Are there any risks or unknowns? List them before proceeding.
```

---

### Part 9 — Output formatting

What the agent must produce when it is done.

```
When you finish:
1. All acceptance criteria are met and tests pass locally.
2. A PR is open with a description that references {jira_key} and
   lists which acceptance criteria each commit satisfies.
3. tasks.json has been updated: the task's `status` is `complete` and
   `jira_key` is set to "{jira_key}".
4. No unrelated files have been modified.
```

---

### Part 10 — Prefilled response

The opening line the agent should write as its first output. This anchors the
agent's reasoning before it starts generating code.

```
I'll start by reading the spec and the constitution, then outline my
implementation plan before writing any code.
```

---

## Procedure

1. **Load inputs.** Read `tasks.json`, the spec, the plan, the constitution,
   and `platform-manifest.json`. If any are missing, fail fast with a clear
   error pointing to the missing file.

2. **Resolve stack defaults.** Identify the stacks in the manifest and load
   their default tone/style rules for Part 2.

3. **Find prior art.** For each file in `related_file_paths`, do a read-only
   search for an analogous function, component, or test in the same module.
   Pick the best single example for Part 5. Do not fabricate examples.

4. **Compose the prompt.** Fill in all ten parts using the templates above.
   Substitute every `{variable}` with its resolved value. Do not leave any
   `{variable}` token in the output — if a value is unknown, write `UNKNOWN`
   and add a `⚠ review before use` note.

5. **Validate completeness.** Check that:
   - All ten parts are present.
   - No `{variable}` tokens remain.
   - Acceptance criteria are quoted verbatim from the spec (not paraphrased).
   - The Jira key and Smart Commit trailer are correct.

6. **Return `agent_prompt`.** The caller (`story-emitter`) embeds this string
   under `## Agent Prompt` in the Jira story description.

---

## Example output (abbreviated)

```markdown
## Agent Prompt

> Copy and paste the block below directly into your coding agent's chat window
> to start this story.

---

**[1] Task context**
You are a builder agent working on acme-payments (stack-node + stack-react).
Your goal is to implement the story described below completely and correctly,
following the project constitution and coding conventions.

**[2] Code style**
TypeScript strict mode. ESLint with the project's .eslintrc. No `any`. Tests
with Vitest. Prefer `const` over `let`. Exports are named, never default.

**[3] Background**
<spec>.agent/features/payment-retry/spec.md</spec>
<plan>.agent/features/payment-retry/plan.md</plan>
<constitution>.agent/constitution.md</constitution>
<file>src/payments/processor.ts</file>
<file>src/payments/processor.test.ts</file>

**[4] Task description & rules**
PROJ-42 — Add exponential-backoff retry to PaymentProcessor.charge()
Acceptance criteria (from spec §3.2):
- AC-1: On a transient 5xx response, retry up to 3 times with jitter.
- AC-2: On a 4xx response, do not retry; throw PaymentDeclinedError.
- AC-3: Log each retry attempt with the attempt number and delay.
Rules: follow constitution §4. No bare catch blocks. Every branch covered
by a test. Commit trailer: `Jira: PROJ-42 #in_progress`.

**[5] Prior art**
// From src/notifications/sender.ts — existing retry pattern:
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> { ... }

**[6] Conversation history**
(none — fresh agent pickup)

**[7] Immediate request**
Implement PROJ-42: add exponential-backoff retry to PaymentProcessor.charge().
Make all acceptance criteria in §3.2 pass.
Open a PR titled "feat(PROJ-42): payment-processor-retry" when done.

**[8] Think step by step**
Before writing any code, think step by step:
1. Which files will you touch and why?
2. What tests do you need to write or update?
3. Are there any risks or unknowns? List them before proceeding.

**[9] Output**
When done: all ACs pass, PR open referencing PROJ-42, tasks.json updated
(status: complete, jira_key: PROJ-42), no unrelated files modified.

**[10] Start here**
I'll start by reading the spec and the constitution, then outline my
implementation plan before writing any code.
```
