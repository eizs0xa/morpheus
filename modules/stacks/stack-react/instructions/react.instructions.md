---
applyTo: "**/*.{tsx,jsx,css}"
---

# React UI Coding Rules

These rules apply to React component, JSX, and CSS files in a Morpheus-scaffolded project.
They are enforced by `agent-pr-gate-react.yml` and `pre-commit-react.sh`. Shared
JS/TS rules still apply through the Node instructions file — these add UI-specific concerns.

## Components and hooks

- Function components only in new code. No class components.
- One component per file for exported components. Sibling subcomponents stay in the same file
  when private to the export.
- Props are always typed. Prefer discriminated unions for variants over boolean flag soup.
- Hooks follow the rules of hooks: call them at the top level, never inside conditionals or
  loops. Name custom hooks `useX`.

## State and data

- Server state goes through the project's data-fetching library (e.g. React Query). Do not
  roll ad hoc fetch + `useState` + `useEffect` combinations.
- Local UI state stays local. Do not add a new global store to solve a prop-drilling pain;
  lift state to the right container instead.
- Context values that hold objects or functions must be memoised with `useMemo` /
  `useCallback`. Unmemoised contexts rerender the whole tree.

## Rendering

- Keys in lists come from stable ids, never from array indices when the list reorders.
- Avoid inline object and function creation in hot render paths when a child is memoised.
- Do not mutate props or state. Produce new objects and arrays.
- Split components when JSX grows past one screen height.

## Accessibility

- Prefer semantic HTML: `button`, `a`, `label`, `nav`, `main`, `header`, `footer`. Reach for
  ARIA only when semantic HTML cannot express the intent.
- Every interactive element is keyboard-reachable and has an accessible name.
- Images carry `alt` text. Decorative images use `alt=""`.
- Focus is visible. Do not suppress the focus ring without a compliant replacement.
- Form inputs are associated with a label by `htmlFor` or wrapping.

## Styling

- Match the project's styling approach (CSS modules, Tailwind, styled-components, etc.). Do
  not introduce a new one inside a single file.
- Colours, spacing, and typography come from the project's tokens or theme. No raw hex values
  in components.
- Responsive rules live in the design system's breakpoints, not in ad hoc media queries.

## Errors and loading

- Every async surface has a declared loading and error state. No silent spinners that hide
  failed requests.
- Error boundaries wrap route-level components; do not scatter them at leaf components.

## Tests

- Component tests query by role and accessible name. `getByTestId` is a last resort and is
  explained by a comment.
- End-to-end tests hit a documented local or faked backend, never production.
- New interactive elements ship with at least one behaviour test that covers the user
  interaction.

## Tooling expectations

- `tsc --noEmit` must exit clean before commit.
- `eslint` (with `jsx-a11y` and React rules enabled) reports zero new findings.
- A format check (Prettier or the package's configured formatter) passes before push.
