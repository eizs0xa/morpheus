---
applyTo: "**"
---

# Morpheus Repository Instructions

This repo is the start of the simplified Morpheus workspace companion. Keep it small, readable, and grounded in real use.

## Layout

- `.agents/skills/` — approved setup-ready skills.
- `core/` — shared setup/governance/template guidance.
- `initiative/` — project-level documentation landing zone.
- `features/` — feature/epic-level documentation landing zone.
- `releases/` — release and change-management landing zone.
- `modules/` — README-only workflow maps.
- `incubator/` — useful but unapproved candidate skills/modules.
- `local/` — ignored local experiments.
- `docs/` — repository-level documentation.

## Rules

1. Do not add CLI-first setup.
2. Do not add schemas, profiles, tests, or automation without real usage proving the need.
3. Keep approved skills in `.agents/skills/<skill>/SKILL.md`.
4. Keep unready skills in `incubator/candidate-skills/<skill>/SKILL.md`.
5. Keep module folders flat and README-only unless the user asks otherwise.
6. Do not recreate `domains`, `integrations`, `stacks`, or `workspaces` category folders.
7. Never commit secrets or `.env` files.
