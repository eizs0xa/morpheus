# Philosophy

## The metaphor: Morpheus is the digital foreman

Before the engineering language, here is the whole idea in one image a non-engineer can hold onto.

A construction foreman does not pour the concrete or run the wire. The foreman carries a clipboard, walks the site before the crew arrives, and makes sure the **foundation, plumbing, and electrical are up to code**. They hand out the right forms, they know where the inspector will look, and they keep a log so that months later anyone can answer the question: *who built this, from what plan, and why?*

Morpheus is that foreman — for codebases built by AI agents.

- The **site** is any repository, greenfield or brownfield.
- The **crew** is a fleet of AI agents (Copilot, Claude, Cursor, custom) doing the actual work.
- The **clipboard** is the artifact chain: PRD → spec → plan → tasks → implementation → review → evaluation.
- The **house rules** are the `.agent-rules` / `AGENTS.md` files, skill files, and schemas that Morpheus drops into every repo so that any agent entering the site knows how we build here.
- The **inspector** is the human reviewer at each HITL checkpoint, and the **permit office** is Jira + Confluence + the CoE portal — the systems of record that the foreman keeps up to date automatically.

Every design tenet below exists to make that foreman trustworthy: small, consistent, never in the way, and impossible to bypass on the parts that matter.

## The mission

Morpheus exists to enable a **standardized way for agentic development to take place across the business** — one that can morph and evolve as the underlying technology does, while allowing any team to contribute back to it. Standardization is not a ceiling; it is the shared floor that lets every team move faster together than they could alone.

Equally, Morpheus is a **mechanism for collecting and organizing the institutional knowledge embedded in our code bases** — the patterns, decisions, domain rules, and hard-won context that today live only in individual repos and individual heads. By capturing that knowledge in a structured, machine-readable form (skills, specs, artifact chains, domain modules), Morpheus makes it available to agentic AI now and to whatever comes next — so the business compounds its own expertise instead of rediscovering it each quarter.

## The operational goal: reliable E2E automation with HITL where it matters

The concrete thing Morpheus is trying to make *boring and repeatable* is the path from a detailed PRD to shipped, reviewed, auditable software built by a fleet of agents.

The canonical flow:

1. **PRD ingested.** A human-authored PRD is the only hand-written input required. Morpheus decomposes it into a spec, a design, a plan, and an agent-legible task list — each task sized for a single agent to complete in one attempt.
2. **Systems of record populated automatically.** Jira stories are emitted (with bidirectional links back to the spec and task IDs), Confluence (or equivalent) pages are generated for human-readable documentation, and the CoE portal receives the value card and ADLC gate state. Teams live in their existing tools; Morpheus just keeps them honest.
3. **Agent fleet dispatched against the task list.** Every agent reads the same `.agent-rules` / `AGENTS.md` on entry, so conventions, banned patterns, and review expectations are consistent across the crew.
4. **Git is the audit trail.** Conventional commits, PR-to-story linkage, and the standardized artifact chain mean the paper trail is produced as a side effect of doing the work — not reconstructed after the fact. Every commit traces back to a task, every task to a spec, every spec to a PRD requirement.
5. **HITL checkpoints are declared, not improvised.** Morpheus places human gates at the points where a real foreman would stop the crew: risk-tier approval, first implementation of a new module, irreversible operations (production deploys, destructive migrations, kill-switch activation), and any action outside the agent's declared scope. Elsewhere the crew proceeds without interruption.
6. **Inspection at any moment.** At any point in the lifecycle, a human can answer *what was built, by which agent, from which requirement, reviewed by whom, and why*, using only the systems of record that Morpheus has been updating all along.

This is the load-bearing promise of the platform. Everything downstream — modules, profiles, schemas, skills — exists to make this flow trustworthy at enterprise scale without a central team heroically stitching it together per repo.

## The problem

Every team adopting AI agents reinvents the same scaffolding: a `SKILL.md` format, a `AGENTS.md` pointer, a PRD→spec→tasks chain, a PR-gate workflow, a notifier integration, a branch-naming convention. Each team diverges. Each divergence freezes into a local dialect. Shared tooling becomes impossible. The ecosystem fragments.

At the same time, agentic practice is genuinely evolving — month over month. A platform that freezes patterns too early is dead on arrival. A platform that never stabilizes patterns is just a wiki.

## The thesis

**Modularity without fragmentation.** A small, opinionated core that every project inherits, plus composable modules (stacks, workspaces, integrations, domains) that can be added, versioned, and swapped independently. Evolution happens at the module layer; the core stays stable.

**The artifact chain is the spine.** PRD → spec → plan → tasks → implementation → review → evaluation. This is the single backbone every skill, template, and workflow hangs off. It is the one thing we refuse to fragment. Every profile uses it. Every stack flows through it. Every integration (Jira, GitHub, Slack) connects to it.

**Profiles are ergonomics, not permissions.** A `verifier` and a `builder` see the same artifact chain; they just get different default scaffolding, skill surfacing, and prompts. There is no RBAC, no matrix of profile × stack × project-type. Five profiles. Forever.

**Composition is law, not convention.** The CLI enforces composition rules (exactly one workspace, exactly one git provider, 0..1 PM, 0..N stacks). Schemas validate every module. A breaking change to the core requires a migration script. The law is small enough to fit on one page ([CONSTITUTION.md](CONSTITUTION.md)) and firm enough to prevent drift.

## Design tenets

1. **Small core, large periphery.** Core ships skills for the artifact chain, schemas, base templates, and shared workflows. Everything else is a module.
2. **Extraction over invention.** Patterns are extracted from real, working projects (SEEK being the empirical proof). We do not design agentic workflows in the abstract.
3. **Write once, compose forever.** A skill like `notifier` has identical invocation whether the workspace is Microsoft or Google. Swapping workspaces is a module change, not a rewrite.
4. **Versioning is honest.** Semver means what it says. Breaking changes ship with migration scripts and a deprecation runway. No silent churn.
5. **Stop-lines are sacred.** A short list of things the platform will never do ([CONSTITUTION.md §Stop-lines](CONSTITUTION.md)). They exist to prevent scope creep from eroding the design.
6. **Documentation is versioned with the platform.** Docs live in `docs/`, move with the tag, and are written per-profile so readers land in the right place.

## What Morpheus is not

- Not a framework you import at runtime. It scaffolds projects; your code runs without it.
- Not a replacement for your agent runtime (Claude, Copilot, Cursor, etc.) — it configures them.
- Not a lock-in. Every rendered file is inspectable markdown / YAML / TypeScript. Walk away any time.
- Not an RBAC system. Profiles shape ergonomics; they do not grant or deny access.

## What evolution looks like

- Modules evolve independently with their own semver.
- New stacks, domains, and integrations are contributed as modules, not core changes.
- The core itself changes rarely and deliberately. A v2 core would ship with an automated migration and a 60-day deprecation of v1.
- The stop-lines are not up for negotiation between majors.

## On the roadmap: the knowledge graph

A natural extension of Morpheus — once enough teams adopt the shared artifact chain and skill format — is a **cross-team knowledge aggregation layer**. Because every Morpheus project emits the same structured artifacts (PRDs, specs, tasks, domain modules, skills, evaluations) in the same shapes, those artifacts can be harvested into a business-wide index.

Envisioned capabilities:

- **Institutional knowledge aggregation.** Pull skills, domain modules, and spec artifacts from every team's repos into a single searchable, agent-queryable corpus. What one team learns, every team (and every agent) can use.
- **Cross-project progress tracking.** With PRD→spec→tasks chains standardized, roll up status across initiatives without each team building its own dashboard. Leadership gets a real portfolio view; teams keep their own tools.
- **Consolidation signals.** Surface overlap — teams building near-duplicate skills, domains, or services — so the business can spot opportunities to consolidate effort, share a module, or fund a shared capability instead of N divergent ones.
- **Evolution feedback loop.** The same aggregate view tells the Morpheus core team which modules are used, which are drifting, and which patterns are ready to be promoted from "one team's module" to "shared module."

This is explicitly future work, not v0.1. It is called out here because it is the reason the standardization discipline matters: the shared artifact chain is what makes a business-wide knowledge graph *possible at all*. Every decision in the core today should preserve that option.
