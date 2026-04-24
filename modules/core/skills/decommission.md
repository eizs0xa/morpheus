# Skill: decommission

> Universal. Shipped by `core`. Every Morpheus project inherits this.

Maps to the enterprise **Agent Governance Operating Model — formal agent decommissioning**. Every agent has a known end-of-life path.

## When to invoke

- The agent has been superseded by another registered agent.
- The value card (ROI Measurement Framework) shows sustained negative value and stewardship approves sunset.
- A governance review has revoked production authorization.
- The business capability has been retired.

## Invariants

1. The `governance.decommission.status` field progresses monotonically: `active → deprecated → sunset-scheduled → decommissioned`. Never backwards without a new intake record.
2. A planned sunset MUST set `governance.decommission.planned_date` at least 30 days in the future at the time of the transition to `sunset-scheduled`.
3. If `successor_agent_registry_id` is set, the successor MUST exist in the CoE Portal Agent Registry with status `active` before this agent transitions to `decommissioned`.
4. Decommissioning MUST NOT delete the repository or its artifact chain. Institutional knowledge is preserved — see `skills/lore-curator.md`.

## Procedure (agent-executable)

1. **Deprecate**: update `governance.decommission.status = "deprecated"` in `platform-manifest.json` and commit. Emit a deprecation event to governance-adlc.
2. **Plan sunset**: set `status = "sunset-scheduled"` with `planned_date`. Notify downstream consumers. Attach Jira epic.
3. **Execute kill-switch** on `planned_date` per `skills/kill-switch.md`. Verify zero traffic.
4. **Freeze**: tag a final release. Archive the repo's default branch to read-only.
5. **Finalize**: set `status = "decommissioned"`. Remove the agent from the Agent Registry as `decommissioned` (not deleted — the registry retains history).
6. **Preserve knowledge**: run `lore-curator` to emit the final `evaluation` artifact summarizing lessons learned, value delivered (from the value card), and successor pointers.

## Stop-lines

- **Never** decommission an agent referenced by another live project without successor transition.
- **Never** delete the artifact chain. The chain is the institutional knowledge trail.
