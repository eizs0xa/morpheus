# seek-snapshot fixture

**Not a clone.** This directory holds a *sparse snapshot* of the SEEK repo's
metadata files (AGENTS.md, .github/copilot-instructions.md, package.json stub,
pyproject.toml stub) so integration tests can exercise the brownfield overlay
against a SEEK-shaped repo without pulling in any source code.

Files in this directory:

- `AGENTS.md` — verbatim from `SEEK/AGENTS.md`
- `.github/copilot-instructions.md` — verbatim from `SEEK/.github/copilot-instructions.md`
- `package.json` — SEEK frontend metadata (stub, trimmed)
- `pyproject.toml` — SEEK backend metadata (stub, trimmed)

Any file under `src/`, `app/`, `backend/`, `frontend/`, `lib/`, `node_modules/`,
etc. is intentionally absent. If a test run ever writes source code here, the
test framework should fail loudly.

Do not treat this as a general-purpose SEEK mirror. It exists solely to drive
`init-brownfield.test.mjs`.
