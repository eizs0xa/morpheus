---
name: Module request
about: Propose a new Morpheus module (stack, workspace, integration, or domain)
title: "[module] <kind>-<name>: <short description>"
labels: ["module-request"]
assignees: []
---

## Module identity

- **Name:** <!-- e.g. stack-go, domain-fintech, integration-linear -->
- **Kind:** <!-- stack | workspace | integration | domain -->
- **Proposed initial version:** 0.1.0

## Problem

<!-- What problem does this module solve? Who needs it? -->

## Scope

<!-- What's in, what's out. Keep it tight. -->

## Detection markers (optional)

<!-- Files, globs, or heuristics agents/scripts can use to identify when this module applies -->

## Incompatibilities

<!-- What modules can this NOT coexist with? -->

## `contributes:` sketch

```yaml
contributes:
  skills:
    - <skill-name>.md
  templates:
    - <template-name>.tmpl
  workflows:
    - <workflow-name>.yml.tmpl
  hooks:
    - <hook-name>.sh
```

## Setup impact

<!-- Does this module affect chat setup questions, generated files, env examples, or validation? -->

## Risks / open questions

<!-- Anything that could block this? Anything unresolved? -->

## Acceptance criteria

<!-- How will we know this module is done? -->
