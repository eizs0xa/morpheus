# @morpheus/cli

The Morpheus agentic development platform CLI. Ships the `agentic` binary
used to scaffold new projects, overlay existing ones, and validate the
resulting project tree.

> Status: **WS-10 scaffolding.** `init`, `validate`, and `doctor` commands
> are wired up as stubs and will be replaced by WS-11 / WS-12.

## Prerequisites

- **Node** ≥ 20
- **pnpm** ≥ 9 (falls back to `npm` if unavailable)
- **[copier](https://copier.readthedocs.io/)** (`pipx install copier` preferred,
  `pip install copier` works too) — only needed when you actually render
  templates. Detection, validation, and resolver logic run without it.

## Install & build

```bash
cd cli
pnpm install
pnpm build
```

## Usage

```bash
# after a build
node dist/index.js --help
node dist/index.js init

# or, after `pnpm link --global`
agentic init
```

Global flags:

- `--non-interactive` — no prompts; answers come from flags / env.
- `--profile <name>` — pre-select one of `builder | verifier | author | explorer | steward`.
- `--verbose` — extra logging.

## Test

```bash
pnpm test
```

Vitest runs every suite in `cli/tests/`. Detectors, composers, and the
manifest round-trip are covered.

## Layout

```
cli/
├── src/
│   ├── index.ts                 # commander entrypoint
│   ├── commands/                # init / validate / doctor / add / remove
│   ├── composers/               # module-resolver, file-renderer
│   ├── detectors/               # hardware, project-type, stack
│   ├── prompts/                 # 5-question init flow
│   └── util/                    # errors, manifest
└── tests/                       # vitest
```

## Integration with the monorepo

This package is designed to live in the Morpheus monorepo root. It does
not yet require a `pnpm-workspace.yaml`; `pnpm install` from inside `cli/`
sets up a local `node_modules` with no cross-package hoisting. Once the
monorepo adds a workspace file, `@morpheus/cli` is ready to be picked up
without further changes.

## Contracts

TypeScript types mirror the JSON schemas under
`../modules/core/schemas/` — notably `platform-manifest.schema.json`,
`module.schema.json`, and `profile.schema.json`. Schema changes must be
reflected here as part of the same PR.
