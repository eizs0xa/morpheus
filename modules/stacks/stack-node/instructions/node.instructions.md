---
applyTo: "**/*.{ts,tsx,js,jsx,mjs,cjs}"
---

# Node + TypeScript Coding Rules

These rules apply to any JavaScript/TypeScript file in a Node.js package scaffolded by
Morpheus. They are enforced by `agent-pr-gate-node.yml` and the `pre-commit-node.sh` hook.

## Language and compiler

- TypeScript is the default. New files are `.ts` or `.tsx`, not `.js`, unless the package
  explicitly ships as JavaScript.
- `strict: true` is expected in `tsconfig.json`. Do not weaken it to unblock a task.
- Never use `any` in new code. Prefer `unknown` plus a narrowing guard. Document any legacy
  `any` you have to keep with a `// TODO:` and a ticket reference.
- Do not use non-null assertions (`value!`) to silence the compiler. Narrow explicitly.

## Module shape

- Use ES modules (`import` / `export`). Do not mix with `require` inside a package that is
  already ESM.
- Prefer named exports. Default exports are allowed only when the surrounding package already
  uses them and changing would widen the diff.
- Keep modules focused: one public entry point per concern. Move helpers to sibling files
  rather than growing a single module.

## Errors and async

- Every `async` function must handle every awaited promise. Do not leave floating promises.
- Throw `Error` subclasses with a meaningful `name` and `message`. Never throw strings.
- Do not swallow errors. When recovery is intentional, log `type(err).name` plus the handled
  decision, and surface the rest.
- Prefer early returns to deep nesting. Guard clauses over nested `if` trees.

## Complexity and duplication

- Functions should stay below roughly 50 lines and cognitive complexity 15. Extract helpers
  when either threshold is crossed.
- A string or numeric value used more than once is a constant. Name it and export it if it is
  referenced from another module.
- Two `if` or `case` branches that do the same thing must be merged.

## Logging and secrets

- Do not log tokens, connection strings, cookies, or signed URLs. Log identifiers, status
  codes, and durations only.
- Do not embed secrets in source or in tests. Read from env or from the secrets store the
  workspace module declared.

## Tests and fixtures

- A new public function without a test is not complete. Add the test in the same change.
- Fixtures live next to the tests that use them; shared fixtures move to a `__fixtures__`
  folder inside the package.
- Tests must not reach the network, real filesystem, or real clocks unless they are marked as
  integration tests and run in the integration job.

## Dependencies

- Pin direct dependencies in `package.json` using exact or caret ranges; do not mix styles in
  the same file.
- Prefer the standard library. Add a dependency only when the win is clear and note the
  rationale in the change.
- Do not bump lockfile versions as a side effect of another task. Dependency bumps are their
  own task.

## Tooling expectations

- `tsc --noEmit` must exit clean before commit.
- `eslint` runs on every staged `.ts`, `.tsx`, `.js`, `.jsx` file and must report zero new
  findings.
- A format check (Prettier or the package's configured formatter) must pass before push.
