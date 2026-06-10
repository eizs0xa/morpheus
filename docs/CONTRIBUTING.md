# Contributing

Morpheus grows from real use.

## Contribution Path

```text
local/ -> incubator/ -> approved .agents/skills or module README
```

## Before Promoting A Skill

A candidate skill needs:

- evidence from real usage
- project-specific assumptions removed
- clear inputs and outputs
- secret-handling guidance
- a README or changelog note explaining why it belongs in Morpheus

## Before Adding A Module

A module should describe a coherent workflow and link to approved skills. Do not add module categories or abstractions until actual project use requires them.

## Validation

This repo intentionally has no formal test harness right now. Validate changes by checking:

- the workspace structure is simple
- approved skills are in `.agents/skills/`
- unready skills are in `incubator/candidate-skills/`
- root contains only `README.md`, `.gitignore`, and `LICENSE` plus system folders
- no secrets are committed