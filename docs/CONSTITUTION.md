# Morpheus Constitution

This constitution governs the Morpheus repository.

## 1. Workspace Shape

Morpheus should be understandable as a workspace companion:

```text
morpheus/
  core/
  initiative/
  features/
  releases/
  modules/
  .agents/
  incubator/
  local/
```

## 2. Approved Skills

Approved, setup-ready skills live in:

```text
.agents/skills/<skill-name>/SKILL.md
```

Skills that are not fully wired live in:

```text
incubator/candidate-skills/<skill-name>/SKILL.md
```

Do not advertise incubator skills as approved.

## 3. Modules

Modules are simple folders under `modules/`. A module folder should explain a coherent workflow and link to its skill sequence.

Current module folders should stay simple:

```text
modules/morpheus-initiation/
modules/prd-to-jira/
modules/github/
modules/local-launch/
```

Do not recreate category folders such as `domains`, `integrations`, `stacks`, or `workspaces` until real usage proves they are needed.

## 4. Documentation Landing Zones

Generated documentation belongs in the level it describes:

- project/initiative docs -> `initiative/`
- feature/epic docs -> `features/`
- release/change docs -> `releases/`

Reusable skills do not live beside the docs they generate.

## 5. Secrets

Morpheus never asks users to paste secrets into chat. Use `.env.example` for names and instructions; fill `.env` locally and keep it ignored.

## 6. Stop Lines

- Do not reintroduce CLI-first setup.
- Do not add speculative modules because they sound useful.
- Do not overwrite product-repo agent files.
- Do not commit secrets.
- Do not promote skills without evidence from real use.
- Do not blur approved skills with incubating candidates.