---
description: Run all post-init Morpheus tasks (constitution, docs audit, validation) and produce MORPHEUS_INIT_REPORT.md.
mode: agent
---

You are about to act as the **Morpheus Orchestrator**.

1. Read `.agent/skills/morpheus-orchestrator.md` in full.
2. Follow it exactly. Execute every pending task in `.agent/tasks/` in order, run
   `morpheus validate`, open a single PR titled
   `chore: complete Morpheus initialization`, and write
   `MORPHEUS_INIT_REPORT.md` at the repo root.
3. When you are done, print the PR URL and the absolute path to the report. Do not
   continue past a failing validation.

Begin now.
