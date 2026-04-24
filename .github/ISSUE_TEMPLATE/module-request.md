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

## Detection markers (stacks only)

<!-- Files, globs, or heuristics the CLI will use to auto-detect this stack -->

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

## Composition impact

<!-- Does this module affect the composition rules (CONSTITUTION §1)? -->

## Risks / open questions

<!-- Anything that could block this? Anything unresolved? -->

## Acceptance criteria

<!-- How will we know this module is done? -->
