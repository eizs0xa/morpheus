# Summary

<!-- One-paragraph description of what this PR does and why. -->

## Jira ticket

<!-- Link to the primary Jira ticket this PR delivers. Additional tickets can
     be listed as a bullet list. Use the full URL so it renders as a card. -->
- Primary: <https:///browse/EXAMPLE-NNNN>

## Risk level

<!-- Pick exactly one. Risk is evaluated on blast radius, data impact, and
     reversibility — not on code size. -->
- [ ] **L** — isolated change, trivial rollback
- [ ] **M** — touches shared code paths or a single service
- [ ] **H** — cross-service, data migration, or auth/security surface

## Constitution impact

<!-- Does this PR change `.agent/constitution.md` or any platform stop-line? -->
- [ ] None
- [ ] Minor (clarification, typo, formatting)
- [ ] Amendment required (ADR linked below)

ADR link (if amendment): <!-- docs/decisions/ADR-NNNN-*.md -->

## Artifacts updated

<!-- Check every artifact touched by this PR. -->
- [ ] PRD (`.agent/features/<slug>/prd.md`)
- [ ] Spec (`.agent/features/<slug>/spec.md`)
- [ ] Plan (`.agent/features/<slug>/plan.md`)
- [ ] Tasks (`.agent/features/<slug>/tasks.json`)
- [ ] Lore (`.agent/lore/**`)

## Test coverage delta

<!-- Paste the before/after coverage numbers, or a short note. -->
- Before: <!-- e.g. 82.4% -->
- After:  <!-- e.g. 83.1% -->
- Delta:  <!-- e.g. +0.7% -->

## Reviewer checklist

- [ ] Artifact chain is complete for any touched feature
- [ ] Branch name matches `<type>/<PROJECT>-<NNNN>-<slug>` (or `hotfix/*`)
- [ ] Smart Commit trailer present on at least one commit if Jira transitions are expected
- [ ] No secrets, credentials, or `.env` files committed
- [ ] CODEOWNERS approvals collected for every directory touched
- [ ] CHANGELOG updated if user-visible surface changed
