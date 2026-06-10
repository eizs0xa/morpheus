---
name: orient
description: "Use when starting a feature to create a clean feature folder. Do not run automatically during initiation."
argument-hint: "<feature-slug>"
inputs:
  - "feature_slug"
  - "initiative/constitution.md"
  - "initiative/repo-index.md"
outputs:
  - "features/<feature-slug>/"
---

# orient

## Purpose

Create the feature landing zone. Orient creates containers, not content.

This skill is part of the Morpheus 2 sequence, but it should not create a blank feature during initial setup. Run it only when a real feature or Jira Epic is ready to begin.

## When To Use

- A human has named a feature/epic.
- A PRD is ready to be registered soon.
- The project needs a clean folder for PRD/TDS/SDD/Jira/test artifacts.

## Procedure

### Step 1 - Validate Preconditions

Confirm:

- `initiative/constitution.md` exists.
- `initiative/repo-index.md` exists.
- feature slug is short, lowercase, and uses `snake_case` or `kebab-case` consistently with the project.
- no existing `features/<feature-slug>/` folder exists.

If any condition fails, stop and report the missing prerequisite.

### Step 2 - Create Folder

Create:

```text
features/<feature-slug>/
  README.md
  PRD.md
  TDS.md
  changelog.md
  SDD/
    README.md
  jira/
    README.md
  artifacts/
    README.md
  test-plan.md
```

### Step 3 - README Content

`features/<feature-slug>/README.md` should explain:

- feature name and status
- artifact chain
- next action
- links to PRD, TDS, SDD, Jira, test plan, changelog, artifacts

### Step 4 - Placeholder Content

Placeholders must be obvious and short. Do not invent feature requirements.

Use status markers such as:

```text
Status: pending - run the prd skill with a human-authored PRD.
```

### Step 5 - Report

Tell the user:

- feature folder path
- created files
- next recommended skill: `prd`

## Stop Lines

- Do not run during initial setup unless the user explicitly provides a real feature slug.
- Do not write PRD/TDS/SDD content.
- Do not migrate old docs unless explicitly asked.
- Do not create Jira payload content.
