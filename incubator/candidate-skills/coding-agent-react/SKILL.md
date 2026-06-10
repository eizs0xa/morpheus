---
name: coding-agent-react
version: 0.1.0
tier: stack
description: Implement production-grade React + TypeScript UI code aligned with the project's design system, state conventions, and platform constitution.
when_to_use: |
  - A task list or spec has been produced for a React codebase.
  - You need to add or modify components, hooks, routes, or client-side state.
  - Changes must pass lint, typecheck, unit tests, and the PR gate for stack-react.
when_not_to_use: |
  - The target is server-only Node code — use `coding-agent-node`.
  - The target is Python — use `coding-agent-python`.
  - You are writing tests only — use `tester-react`.
  - You are writing specs, plans, or tickets — use the core artifact-chain skills.
inputs:
  - tasks_path: string (path to tasks.json produced by the decomposer)
  - spec_path: string (path to the spec.md the task set traces back to)
  - repo_context: read/write access scoped to declared files in the task
outputs:
  - changed_files: string[] (list of files written or modified)
  - test_surface_note: string (component and hook tests the implementation relies on)
requires_profiles: [builder, steward]
---

# coding-agent-react

## Purpose

Write and edit React + TypeScript UI code for a single task from a decomposed task list. The
skill takes one task, reads the spec and plan, learns the project's component conventions,
state library, and routing, and produces a change set that compiles, lints, and passes the
configured component tests.

The skill honours the artifact chain by never inventing requirements. If the task is
ambiguous, the skill stops and asks.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| `tasks.json` entry | yes | Single task object with `id`, `files`, `depends_on`, `acceptance`. |
| `spec.md` | yes | Resolves ambiguities and drives acceptance. |
| `plan.md` | warn | Read when the task references routing, state, or design decisions. |
| Existing component tree | yes | Read-only by default; writes restricted to the task's `files` list. |

## Process

1. **Orient.** Open the task entry. List files to be touched. Read `package.json` for the
   React version, bundler, test runner, and UI/state libraries.
2. **Learn the design system.** Open the nearest shared components, the global styles or
   theme file, and the routing entry. Match the conventions you find — do not introduce a new
   styling approach mid-repo.
3. **Confirm the edit plan.** List target files, new components or hooks, and tests to add or
   update. Wait for approval unless the task was pre-approved.
4. **Write components in small passes.**
   - Prefer function components and hooks. No class components in new code.
   - Keep components focused: one purpose per file. Extract subcomponents when the JSX tree
     exceeds a reasonable screen.
   - Type every prop. Prefer discriminated unions for variant props; avoid boolean soup.
   - Separate data fetching from rendering. Put queries and mutations in hooks.
5. **Respect accessibility.** Use semantic HTML (`button`, `label`, `nav`) before ARIA roles.
   Every interactive element is reachable by keyboard and has an accessible name.
6. **State discipline.** Use the project's declared state library for server state
   (e.g. React Query) and local state for ephemeral UI. Do not add a new global store.
7. **Avoid layout shift.** Reserve space for async content. Skeletons over spinners when the
   design provides them.
8. **Run local checks.** Run lint, typecheck, and the component tests for the touched files.
   Fix every new warning.
9. **Self-review** against the acceptance list before reporting done.

## Outputs

- A change set limited to the task's declared file list.
- A short test-surface note listing tests touched and coverage delta.
- A one-line summary suitable for a PR body: what changed, why, and how it was verified.

## Acceptance

The change is accepted only when all of the following pass:

- `tsc --noEmit` (or the project's equivalent) exits clean for the touched package.
- The configured lint step reports zero new findings (including jsx-a11y).
- The configured test runner reports zero new failures and zero regressions.
- Every new interactive element is reachable by keyboard and has an accessible name.
- No `any` in new component props or hook return types.
- No inline `style` with hard-coded colour values — use the project's theme or tokens.
- No file outside the task's declared `files` list is modified.

## Common failure modes

- **Prop drilling past three levels.** Move the data to the correct container or to the state
  library; do not thread props through five components.
- **useEffect for data fetching.** Use the project's data-fetching library; `useEffect` is for
  subscriptions and imperative effects only.
- **Unmemoised context values.** Context consumers rerender on every provider render. Fix:
  memoise the value with `useMemo`.
- **Silent a11y regressions.** Removing a label or role "because it is ugly". Fix: keep the
  contract; restyle instead.
- **New styling approach in one file.** Mixing Tailwind into a CSS-modules codebase (or vice
  versa). Fix: match the repo; raise a decision before diverging.
- **Keys from index.** Using array indices as React keys in lists that reorder. Fix: use a
  stable id.
