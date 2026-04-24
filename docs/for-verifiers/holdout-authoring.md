# Holdout authoring

> A holdout test is an out-of-sample check an agent has not seen, run **after** a feature merges. This page tells you what to write, where to put it, and what the `evaluator` skill expects to find.

## Why holdouts exist

Agents optimize against the tests they can see during development. A holdout suite proves the change generalizes — it runs once, after merge, against scenarios the coding agent was not shown.

Holdouts feed the `evaluator` skill. Evaluator runs them, authors a draft lore entry summarizing what it learned, and opens a PR for the steward (`lore-curator`) to merge. Without holdouts, evaluator has nothing to evaluate.

## What makes a good holdout

A good holdout test:

1. **Was not visible during implementation.** The coding agent must not have read it or a near-duplicate.
2. **Exercises the acceptance criteria from the spec**, phrased differently from the in-suite tests.
3. **Is deterministic.** Flakes make evaluator reports useless.
4. **Is fast enough to run on every merge.** Target < 2 minutes per feature.
5. **Names the feature slug it belongs to** so evaluator can group results.

What a holdout is **not**:

- Not a replacement for CI — CI runs on PRs, holdouts run post-merge.
- Not a performance benchmark — benchmarks have their own home.
- Not a smoke test — smoke tests run pre-deploy; holdouts run post-merge and are tied to specific features.

## Where holdouts live

```
<project-root>/
└── .agent/
    └── holdout/
        ├── README.md              (steward-authored, explains the suite)
        ├── <feature-slug-1>/
        │   ├── test_<case>.py    (stack-specific test file)
        │   └── fixtures/
        ├── <feature-slug-2>/
        │   └── holdout.test.ts
        └── shared/
            └── fixtures/
```

Rules for the layout:

- One subdirectory per feature slug. Slug matches `.agent/features/<slug>/`.
- Stack-appropriate test file naming — `tester-python`, `tester-node`, and `tester-react` skills all understand this layout.
- Fixtures that apply to multiple features live under `shared/`.
- `README.md` at the root of `holdout/` names the owner, the cadence, and the skip policy.

## Writing a holdout — generic pattern

1. Read the feature's `spec.md` acceptance criteria.
2. For each criterion, paraphrase it as a test scenario the in-suite tests do **not** already cover.
3. Author the test in the feature's target stack.
4. Mark it with a holdout tag so CI doesn't run it accidentally:
   - Python: `@pytest.mark.holdout`
   - Node/Vitest: `describe.skip` with a custom runner filter, or a separate config.
   - React/Cypress: a dedicated spec folder excluded from the default glob.
5. Commit with subject `test(holdout): <feature-slug> <short description>`.

## What the `evaluator` skill expects

When evaluator runs, it reads:

| Input | Source |
|-------|--------|
| `feature_slug` | caller |
| `merge_commit` | caller |
| `holdout_suite_ref` | test target ID — e.g. `.agent/holdout/<slug>/` or `pytest -m holdout -k <slug>` |
| `spec_md_path` | `.agent/features/<slug>/spec.md` |

Evaluator outputs:

- `evaluation_report_md` — pass/fail per test, summary, and a one-paragraph interpretation.
- `draft_lore_entry_md` — a Markdown doc the `lore-curator` reviews.

See [`../../modules/core/skills/evaluator.md`](../../modules/core/skills/evaluator.md) for the full contract.

## Acceptance checklist

Before merging a PR that adds a holdout:

- [ ] The holdout lives under `.agent/holdout/<feature-slug>/`.
- [ ] The test is tagged so it does not run in the default CI job.
- [ ] A locally-run `pytest -m holdout` (or stack equivalent) passes.
- [ ] The holdout references at least one acceptance criterion from the spec.
- [ ] The feature slug in the path matches `.agent/features/<slug>/`.

## Example: Python holdout

```python
# .agent/holdout/coupon-engine/test_discount_matrix.py
"""
Holdout for feature `coupon-engine`.

Acceptance criterion exercised (from spec.md §3.2):
    "A percentage-off coupon must never discount below the floor price."

The in-suite tests check integer percentages 5/10/20. This holdout probes
fractional percentages and edge floor values the agent did not see.
"""
import pytest

from coupon_engine import apply

pytestmark = pytest.mark.holdout


@pytest.mark.parametrize(
    "price,pct,floor,expected",
    [
        (100.00, 12.5, 90.00, 90.00),
        (100.00, 7.75, 95.00, 95.00),
        (49.99, 22.5, 40.00, 40.00),
    ],
)
def test_floor_price_is_respected(price, pct, floor, expected):
    assert apply(price, pct_off=pct, floor=floor) == expected
```

## Example: Node/Vitest holdout

```ts
// .agent/holdout/rate-limiter/holdout.test.ts
import { describe, it, expect } from 'vitest';
import { limit } from '../../../src/rate-limiter';

describe('rate-limiter holdout', () => {
  it('applies burst credits correctly under concurrent requests', async () => {
    const r = limit({ capacity: 10, refillPerSec: 2 });
    const outcomes = await Promise.all(
      Array.from({ length: 20 }, () => r.check('user-1')),
    );
    const allowed = outcomes.filter((o) => o.allowed).length;
    expect(allowed).toBe(10);
  });
});
```

Run it with a dedicated Vitest config:

```bash
vitest run --config vitest.holdout.config.ts
```

## Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Evaluator says "no holdouts found" | Path does not match `.agent/holdout/<slug>/`. | Rename the folder to the exact feature slug. |
| Holdout runs on every PR | Missing tag or wrong pytest marker. | Tag with `@pytest.mark.holdout` or equivalent. |
| Holdout flakes | Relies on network or random seed. | Mock external calls; set explicit seeds. |
| Coverage dips after adding holdout | Holdout ran in the coverage job. | Exclude `.agent/holdout/` from coverage config. |

## Related docs

- [`evaluator` skill](../../modules/core/skills/evaluator.md)
- [`tester-python` skill](../../modules/stacks/stack-python/skills/tester-python.md)
- [`tester-node` skill](../../modules/stacks/stack-node/skills/tester-node.md)
- [`tester-react` skill](../../modules/stacks/stack-react/skills/tester-react.md)
