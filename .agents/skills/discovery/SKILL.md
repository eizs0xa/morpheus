---
name: discovery
description: "Use when bootstrapping or refreshing project understanding. Produces initiative-level inventory, intent map, architecture map, and conflicts report."
---

# discovery

## Purpose

Build the first project-level understanding of the workspace without modifying product repositories.

## Inputs

- VS Code workspace containing `morpheus` and product repos.
- `project.config.json` when available.
- Existing product-repo agent files, instructions, docs, package manifests, tests, and CI workflows.

## Outputs

- `initiative/discovery/inventory.md`
- `initiative/discovery/intent-map.md`
- `initiative/discovery/architecture-map.md`
- `initiative/conflicts-report.md`
- `initiative/changelog.md` update

## Procedure

1. Identify workspace folders and product repo roles.
2. Inventory each repo: language, framework, package manager, test tooling, CI, entry points, env examples.
3. Read existing agent assets: `agent.md`, `AGENTS.md`, Copilot instructions, `.instructions.md`, and `SKILL.md` files.
4. Map cross-repo architecture at the level the project actually supports.
5. Record conflicts, stale references, duplicate rules, and naming drift.
6. Write initiative-level discovery artifacts.

## Stop Lines

- Do not edit product repos.
- Do not collect secrets.
- Do not invent project rules; record what exists.
