# Writing A Skill

A Morpheus skill is an on-demand workflow instruction file contributed by a module. Skills should be specific, discoverable, and safe for agents to follow from chat.

Approved reusable skill bodies live in:

```text
.agents/skills/<skill-name>/SKILL.md
```

The contributing module references that path in `module.yaml`.

Unready or inherited skills live in:

```text
incubator/candidate-skills/<skill-name>/SKILL.md
```

Do not reference incubator skills from `module.yaml` until they are promoted.

## Shape

```markdown
---
name: example-skill
version: 0.1.0
tier: integration
description: Short action-oriented description with trigger words.
when_to_use: |
  - Use when...
when_not_to_use: |
  - Do not use when...
inputs:
  - input_name: description
outputs:
  - output_name: description
---

# example-skill

## Purpose

## Procedure

## Stop lines
```

## Rules

- Keep descriptions keyword-rich so agents can discover the skill.
- Keep project-specific names out of reusable skills.
- Put local/project-specific variants in `.morpheus-local/` first.
- Promote reusable candidates through an incubator PR with evidence.
- Never ask users to paste secrets into chat.
- Reference existing product-repo agent assets instead of overwriting them.
- Do not duplicate approved skill bodies under module-local `skills/` folders.
