# Morpheus integration tests

This directory contains end-to-end tests that exercise the full Morpheus CLI
against tmpdir copies of the fixtures under `fixtures/`. Tests are:

- **Hermetic** — every run creates its own tmpdir; nothing is written to the
  platform repo at test time.
- **Self-skipping** — if `copier` or the built CLI is missing, the test file
  prints `SKIP: …` lines and exits 2 instead of failing the suite.
- **Parallel-safe** — each test file is spawned in its own node subprocess.

## Running

```
# from the morpheus/ root
cd cli && pnpm build && cd ..
pnpm test:integration
```

## Layout

```
tests/
├── run.mjs                        # file-level runner
├── helpers.mjs                    # shared helpers (CLI runner, tmp, hashes…)
├── fixtures/
│   ├── empty-project/             # pristine empty dir (.gitkeep)
│   ├── brownfield-node/           # node+ts project; overlay target
│   ├── brownfield-python/         # python project; overlay target
│   └── seek-snapshot/             # sparse SEEK metadata snapshot (< 20 files)
└── integration/
    ├── init-new-project.test.mjs         # all 5 profiles on empty fixture
    ├── init-brownfield.test.mjs          # overlay on each brownfield fixture
    ├── update-migration.test.mjs         # forward-looking update/doctor
    ├── validate-doctor.test.mjs          # validate + doctor JSON contracts
    └── composition-enforcement.test.mjs  # composition rule enforcement
```

## Exit conventions (per test file)

- `0` — all asserts passed
- `1` — at least one assert failed
- `2` — the file itself chose to skip (missing prereq)

Individual asserts emit `PASS: …`, `FAIL: …`, or `SKIP: …` on stdout so the
runner can tally them.
