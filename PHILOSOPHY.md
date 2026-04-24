# Philosophy

## The mission

Morpheus exists to enable a **standardized way for agentic development to take place across the business** — one that can morph and evolve as the underlying technology does, while allowing any team to contribute back to it. Standardization is not a ceiling; it is the shared floor that lets every team move faster together than they could alone.

Equally, Morpheus is a **mechanism for collecting and organizing the institutional knowledge embedded in our code bases** — the patterns, decisions, domain rules, and hard-won context that today live only in individual repos and individual heads. By capturing that knowledge in a structured, machine-readable form (skills, specs, artifact chains, domain modules), Morpheus makes it available to agentic AI now and to whatever comes next — so the business compounds its own expertise instead of rediscovering it each quarter.

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
