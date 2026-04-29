# Escalation paths

> Who owns what. When to ask whom. When to file a module-request. Aimed at engineering managers routing questions correctly.

## Ownership map

| Surface | Owner | How to reach |
|---------|-------|--------------|
| Platform CLI, schemas, core skills | Platform team | `#morpheus-platform` channel, or open an issue. |
| A specific project's constitution | That project's steward | Git blame on `.agent/constitution.md`; CODEOWNERS on the repo. |
| A specific project's lore | That project's steward (via `lore-curator`) | Same as constitution. |
| A module (stack/workspace/integration) | Module CODEOWNER | See `modules/<kind>/<name>/` CODEOWNERS in the platform repo. |
| A domain module | Domain sponsor (platform team until v0.2) | Platform team for v0.1.0 per [ADR-004](../decisions/ADR-004-open-questions-v0.1.md). |
| A rendered project file (e.g. `.github/workflows/...`) | That project's team | Open an issue in the project repo. |
| Project templates (`templates/new-project/`, `templates/brownfield-overlay/`) | Platform team | Platform channel or issue. |

## Decision tree: who do I ask?

1. **Is the problem in the platform CLI, a platform template, or a core skill?**
   → Platform team. Open an issue with reproduction steps.
2. **Is the problem in a module's skill / workflow / template?**
   → That module's CODEOWNER. Same platform repo.
3. **Is the problem project-specific (constitution, lore, rendered workflow)?**
   → That project's steward.
4. **Is the problem that the platform doesn't have a module you need?**
   → Open a `module-request` issue (template in the platform repo under `.github/ISSUE_TEMPLATE/`).
5. **Is the problem that a breaking change landed and migration broke?**
   → Platform team, urgent. The migration script under `templates/migration/` is the contract.

## Response expectations

| Severity | Example | Target response time |
|----------|---------|----------------------|
| Blocking a pilot team | `morpheus invoke` crashes mid-scaffold. | Same business day. |
| Blocking a non-pilot team | `agentic validate` exits 2 after an update. | 2 business days. |
| Functional gap / module request | "We need a `stack-go`." | Triage in 5 business days; decision or deferral in 10. |
| Doc rot | Walkthrough references a flag that was renamed. | Next weekly sync. |
| Lore curation conflict | Two lore entries contradict. | Stewards' guild monthly meeting. |

## When to file a module-request

File a `module-request` issue when:

- You need functionality that cleanly maps to a new `stack`, `workspace`, `integration`, or `domain`.
- You have a concrete first-use project in mind (not hypothetical).
- You can describe at least two skills the module should contribute.

Do **not** file a module-request for:

- One-off convenience scripts — those belong in the project's `.agent/local/` folder.
- Re-skinning an existing module — propose an amendment to that module instead.
- Workflow changes to a specific project — open a PR on that project.
- Things that should be **project lore**, not platform-level constructs.

## The module-request template

The platform repo ships a `module-request` issue template that prompts for:

- Proposed module name and kind.
- Concrete use-case and first-use project.
- Dependencies on existing modules.
- Potential incompatibilities.
- At least two proposed skills, with purpose lines.
- Owner (who will maintain it).
- A sign-off from your team's steward.

Issues missing these fields get reshaped by the platform team before triage.

## Escalating inside your own org

Morpheus is org-agnostic, but every rollout needs intra-org routing. Typical structure:

1. **Project steward** — first stop for project-specific questions.
2. **Stewards' guild** — monthly meeting, peer-to-peer help.
3. **Platform team** — cross-cutting platform questions.
4. **Eng leadership sponsor** — unblocks funding, prioritization, hiring.

Document the specific names and channels in your own `docs/` supplement or wiki; this page is the generic template.

## The "stop-lines" escape hatch

The platform has seven stop-lines (things it will never do), listed in [`../../CONSTITUTION.md`](../../CONSTITUTION.md) §6. If someone proposes crossing one:

1. Route the proposal to the platform maintainers listed in `CODEOWNERS`.
2. Require an ADR under `docs/decisions/` with explicit tradeoffs.
3. A stop-line change is a MAJOR version bump by definition (per platform constitution §10).
4. If the answer is "no," record that too — in an ADR marked `status: rejected`.

Stop-lines resist social pressure. That is their purpose.

## Common routing mistakes

| Mistake | Correct routing |
|---------|-----------------|
| Filing a CLI bug as a project issue. | Platform repo issue. |
| Asking the steward to fix a workflow template bug. | Platform team — templates are platform-owned. |
| Filing a module-request for a one-off script. | Keep it in-project under `.agent/local/`. |
| Assuming the steward can bypass composition rules. | Composition rules are enforced by the CLI — platform team owns composition semantics. |
| Bypassing CODEOWNERS review on a module change. | Always route through CODEOWNERS; stewards are not platform maintainers. |

## Related docs

- [Rollout guide](rollout-guide.md)
- [Measuring impact](measuring-impact.md)
- [Adding a module](../for-platform-maintainers/adding-a-module.md)
- [Handling breaking changes](../for-platform-maintainers/handling-breaking-changes.md)
