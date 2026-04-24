# Morpheus

> An Agentic Development Platform — compose skills, agents, and workflows into AI-native projects without fragmentation.

![status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange) ![version: 0.1.0-dev](https://img.shields.io/badge/version-0.1.0--dev-blue)

Morpheus is a monorepo platform that scaffolds AI-agent-ready projects — greenfield or brownfield — using a composable module system (core + stacks + workspace + integrations + domains) and five ergonomic profiles (`builder`, `verifier`, `author`, `explorer`, `steward`).

## Why

Read [PHILOSOPHY.md](PHILOSOPHY.md) for the motivation, and [CONSTITUTION.md](CONSTITUTION.md) for the law that governs composition, versioning, and evolution.

## Table of contents

- [Philosophy](PHILOSOPHY.md) — why this exists
- [Constitution](CONSTITUTION.md) — platform law (composition, profiles, stop-lines, versioning)
- [Contributing](CONTRIBUTING.md) — module proposals, breaking-change policy
- [Changelog](CHANGELOG.md)
- [Docs](docs/) — role-based walkthroughs + reference

## Quick start

> _Placeholder — `agentic` CLI ships in WS-10/WS-11. Once available:_

```bash
# Greenfield
agentic init

# Brownfield overlay
cd my-existing-repo && agentic init
```

See [docs/getting-started.md](docs/) (coming soon) for the full flow.

## Status

Pre-alpha. Building toward `v0.1.0`. See [EXECUTION_PLAN.md](EXECUTION_PLAN.md) for the workstream-by-workstream plan.

## License

[MIT](LICENSE)
