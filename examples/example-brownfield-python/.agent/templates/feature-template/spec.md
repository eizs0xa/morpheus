# Spec: <feature name>

**Feature slug:** <feature_slug>
**Source PRD:** <relative path to PRD>
**Author:** <named human>
**Date:** <YYYY-MM-DD>
**Status:** Draft | In review | Approved

---

## 1. Summary

One to three sentences, plain English. What this feature does and why it matters.

## 2. Context and goals

- **Goals:** <bullet>
- **Non-goals:** <bullet>
- **Links:** PRD, relevant lore, related features

## 3. Requirements (EARS)

Number each requirement `R-<n>`. Each traces back to a PRD requirement number.

### R-1
The system shall <behaviour>.
- PRD Req: <#>
- Acceptance: see §5 scenarios <…>

### R-2
When <trigger>, the system shall <behaviour>.
- PRD Req: <#>
- Acceptance: <…>

### R-3
If <condition>, then the system shall <response>.
- PRD Req: <#>
- Acceptance: <…>

## 4. Non-functional requirements

- **Performance:** <target>
- **Availability:** <target>
- **Security:** <authn/authz, input validation, data handling>
- **Accessibility:** <WCAG level or other standard>
- **Observability:** <logs, metrics, traces>
- **Compliance:** <regulation, if any>

## 5. Acceptance criteria (Gherkin)

```gherkin
Scenario: <name>
  Given <precondition>
  When <action>
  Then <observable outcome>
```

```gherkin
Scenario: <name>
  Given <precondition>
  When <action>
  Then <observable outcome>
```

## 6. Out of scope

- <bullet — lifted from the PRD>

## 7. Assumptions

- <bullet>

## 8. Open questions

- <question — owner and target answer date>

## 9. Decision log

| Decision | Options considered | Chosen | Rationale | Trade-offs |
|---|---|---|---|---|
| <decision> | <opts> | <chosen> | <why> | <tradeoffs> |

## 10. Traceability matrix

| PRD Req # | PRD requirement | Priority | Spec R-# | Acceptance scenarios | Notes |
|---|---|---|---|---|---|
| 1 | <text> | Must | R-1 | Scenario A, B | — |

## 11. References

- PRD: <path>
- Project constitution: [`.agent/constitution.md`](../../.agent/constitution.md)
- Related specs: <paths>
- Lore citations:
  - `[LORE-<id>] <title> — <one-line takeaway>` (<source path>)
- Key source files:
  - <path>

---

*Generated from the Morpheus `feature-template/spec.md.tmpl` template.*
