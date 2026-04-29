# Morpheus

> **The standard operating system for agentic software development.** One platform. Every team. Every repo. Every agent.

![status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange) ![version: 0.2.0-dev](https://img.shields.io/badge/version-0.2.0--dev-blue) ![governance: ADLC-aligned](https://img.shields.io/badge/governance-ADLC--aligned-green)

## Morpheus in one picture: the digital foreman

If you've never written a line of code, picture a **construction site**.

A great foreman doesn't swing the hammer. The foreman shows up before the crew, walks the site with a clipboard, and checks that the **foundation**, **plumbing**, and **electrical** are all up to code. If something's missing, they don't shrug — they call it out, hand you the right form, and make sure the inspector can sign off later.

**Morpheus is that foreman, for software built by AI agents.**

- You (or an AI) open a project and type one command.
- Morpheus walks the "site" (the codebase) with a checklist.
- It asks: *"Do you have a product spec? A ticket plan? A safety manual for the AI? A paper trail for what got built and why?"*
- If the answer is no, it helps you write one — using the same templates every team in the company uses.
- When the crew (a fleet of AI agents) starts work, every nail they drive is logged, every decision is traceable back to the original blueprint, and a human inspector can step in at the checkpoints that matter.

That's it. No mystery. A foreman, a clipboard, and a standard that everyone agrees on.

## What is Morpheus?

Morpheus is how an enterprise stops reinventing agentic development in every repo and starts compounding it. It scaffolds any project — greenfield or brownfield — with the **same shared foundation** every team needs but nobody wants to build from scratch:

- **Standardized git workflow** — conventional commits, branch-naming, PR gates, merge queues, release trains. One grammar across every repo, so portfolio rollups and automated CHANGELOGs *just work*.
- **Standardized Jira integration** — PRD → spec → plan → tasks → **stories**, auto-emitted and bidirectionally linked. Stop building team-specific dashboards.
- **Agent cost efficiency** — composition rules eliminate duplicated scaffolding; shared skills and templates collapse per-team reinvention; every project emits the same cost and ROI tags for enterprise rollup.
- **Institutional knowledge, captured** — every project emits the same artifact chain (PRD → spec → plan → tasks → implementation → review → evaluation) in the same shapes. What one team learns becomes queryable by every team and every agent.
- **Agent-led best practices, shipped** — five fixed profiles (`builder`, `verifier`, `author`, `explorer`, `steward`) surface the right skills, gates, and prompts for every role without a permissions matrix.
- **Governance built in, not bolted on** — four-tier risk classification, AI Service Intake, Agent Development Lifecycle gates, Kill Switch, and formal decommissioning are schema-enforced on day one. Security, compliance, and cost controls are embedded in the workflow, not review gates after the fact.
- **CoE Portal-ready** — every Morpheus repo pushes manifest + artifact-chain state to the enterprise Agent Registry automatically. Demand intake, registry, playbooks, and training flow *into* your repo; value cards flow *out*.

## Why teams adopt it

- **Day one**: a new project lands with the correct CODEOWNERS, PR template, branching rules, Jira hooks, kill-switch declaration, risk tier, cost tags, and training tier — in under a minute.
- **Day 30**: the CoE portal already shows your agent, its value card, its ADLC gate status, and its lineage back to the PRD — without you building a single dashboard.
- **Day 365**: when the model, the framework, or the governance model changes, you migrate with a versioned migration script and a 60-day deprecation window. No rewrites. No forks. No drift.

## From PRD to production, on autopilot — with humans at the wheel

Morpheus exists to make one specific thing **reliable and repeatable**: taking a detailed product requirements document (PRD) and turning it into working, reviewed, auditable software built by a fleet of AI agents — without losing the thread of *what* was built or *why*.

The end-to-end automation (back to the foreman analogy):

1. **Blueprint in.** A human hands Morpheus a PRD. Morpheus breaks it down into a spec, a design, a plan, and a concrete, agent-legible task list. Each task is small enough for one agent to pick up and finish.
2. **Permits filed.** Morpheus auto-emits **Jira stories** (bidirectionally linked to the spec) for tracking and **Confluence pages** (or your docs equivalent) for the human-readable record. Project managers and stakeholders see the work in the tools they already live in — nobody has to learn Morpheus to follow along.
3. **Crew dispatched.** A fleet of agents picks up the task list. Each agent knows the rules of *this* site, because Morpheus has already dropped a `.agent-rules` / `AGENTS.md` "house manual" in the repo: naming conventions, banned libraries, how to write tests, when to stop and ask.
4. **Every swing of the hammer, logged.** Every change ships through git with conventional commits, PRs tied to the originating Jira story, and a machine-readable artifact chain: PRD → spec → plan → task → commit → review → evaluation. The audit trail is a side effect of doing the work, not a second job.
5. **Human-in-the-loop checkpoints, where they matter.** Morpheus inserts HITL gates at the places a real foreman would: risk-tier review, first PR on a new module, irreversible actions (prod deploy, schema migration, kill-switch activation), and any decision outside the agent's declared scope. Everywhere else, the crew keeps swinging.
6. **Inspection-ready, always.** At any moment, a human can open the repo, the Jira board, the Confluence space, or the CoE portal and answer: *what was built, by which agent, from which requirement, reviewed by whom, and why?* That answer is never more than one click away, because the platform wrote it down as it went.

This is what "agentic development, standardized" actually buys you: not just faster agents — a **trustworthy paper trail** that scales to dozens of teams and hundreds of agents without a central team heroically stitching it together.

## Why not?

Walk away any time. Every rendered file is inspectable markdown / YAML / TypeScript. Morpheus is not a runtime — your code runs without it.

## Read next

- [PHILOSOPHY.md](PHILOSOPHY.md) — the motivation and the knowledge-graph roadmap.
- [CONSTITUTION.md](CONSTITUTION.md) — platform law: composition rules, five profiles, seven stop-lines, semver policy.
- [EXECUTION_PLAN.md](EXECUTION_PLAN.md) — the workstream-by-workstream build plan.
- [CONTRIBUTING.md](CONTRIBUTING.md) — module proposals, breaking-change policy.
- [CHANGELOG.md](CHANGELOG.md) — what shipped, what's next.

## Quick start

```bash
# Greenfield
morpheus invoke

# Brownfield overlay on an existing repo
cd my-existing-repo && morpheus invoke

# Keep Morpheus current (pull + rebuild + re-apply)
morpheus update

# Validate against platform law
morpheus doctor
```

> `agentic init` is a backward-compatible alias. Both `morpheus` and `agentic` resolve to the same binary.

See [docs/getting-started.md](docs/) for the full flow and [docs/for-engineers/](docs/for-engineers/) for role-based walkthroughs.

## Strategic alignment

Morpheus is the governed self-service substrate for the enterprise **AI/MLOps Strategic Roadmap**:

| Roadmap layer | Morpheus role |
|---|---|
| Foundation — Hub-and-Spoke, Intake, Agent Governance (ADLC) | Schema-enforced `governance` block, `integrations/governance-adlc`, kill-switch + decommission skills in core. |
| Visibility & Enablement — CoE Portal, AI Adoption Engineering | `integrations/coe-portal`, curated template library with training tiers, role-based docs per profile. |
| Accountability & Intelligence — ROI Framework, Agent Memory, Ontology | `value-card.schema.json`, `memory.schema.json` (five-layer), `ontology.schema.json`, domain ontologies with steward-approved change logs. |

## Status

Pre-alpha, building toward `v0.2.0`. Pilot-ready across the Phase 1–3 roadmap.

## License

[MIT](LICENSE)
