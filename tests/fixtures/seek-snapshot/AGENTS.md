# SEEK Copilot Agents

## Commit Agent

When the user says **"commit"**, **"commit this"**, **"save my work"**, or similar:

1. **Detect changes** — Run `git status` in both `mms-daaa-gov-rfp-web-backend/` and `mms-daaa-gov-rfp-web-frontend/` to see which repo has changes.
2. **Stage changes** — Run `git add -A` in the changed repo(s).
3. **Generate commit message** — Create a conventional commit message:
   - **Subject line**: Max 72 characters. Format: `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
   - Scope: brief area (e.g., `auth`, `leads`, `chat`, `cors`)
   - If both repos changed, commit each separately with its own message.
4. **Commit** — Run `git commit -m "..."` in the appropriate repo directory.
5. **Report** — Show the commit hash and summary.

### Rules
- Never push automatically — only commit locally.
- Never commit `.env` files or secrets.
- Keep subject under 72 chars; wrap body at 100 chars if needed.
- Branch: both repos should be on `DAAA-9999`.

## Launch Agent

When the user says **"start"**, **"launch"**, **"run the app"**:
- Run `./start-local.sh` from the SEEK directory.

When the user says **"restart"**, **"reboot"**:
- Run `./restart-local.sh` from the SEEK directory.

When the user says **"stop"**, **"shut down"**:
- Run `./stop-local.sh` from the SEEK directory.

---

## Backend Agent

When working on **any backend Python code** in `mms-daaa-gov-rfp-web-backend/`:

> **Always load and follow `mms-daaa-gov-rfp-web-backend/agents.md`** — it is the canonical reference for backend patterns, security rules, testing, architecture lessons, and SonarQube compliance.

### Key sections in `mms-daaa-gov-rfp-web-backend/agents.md`

| Section | What it covers |
|---------|---------------|
| Workflow Checklist | Pre/post code checklist (lint, test, coverage, lessons update) |
| Security Standards | SQL injection, secrets, OWASP Top 10, CodeQL rules |
| SonarQube Compliance | Zero-new-issues target, S3776/S1192/S5659/S1871 rules, lessons learned |
| Testing Standards | pytest patterns, fixtures, coverage thresholds |
| Database Standards | PK naming, triggers, idempotent migrations, schema qualification |
| Service Layer Patterns | Singleton services, error handling, logging |
| Route Patterns | Blueprint organization, flask-smorest, response helpers |
| Architecture Lessons Learned | Dated lessons from past fixes |

### SonarQube Rules (backend Python — `app/**/*.py`)

> Full reference: `mms-daaa-gov-rfp-web-backend/agents.md` § SonarQube Compliance  
> Quick-ref skill: `mms-daaa-gov-rfp-web-backend/.github/instructions/sonarqube.instructions.md`  
> SonarQube review prompt: `mms-daaa-gov-rfp-web-backend/.github/prompts/sonar-review.prompt.md`

**Target: zero new Sonar issues on every PR.**

| Rule | Requirement |
|------|-------------|
| S1192 | String/value used 2+ times → extract a named constant |
| S3776 | Cognitive complexity > 15 → extract `_parse_*` / `_build_*` helpers, use early returns |
| S5659 | Module-level singleton → guard with `threading.Lock()` + double-check locking |
| S2139 | `except Exception` → use specific type (`pyodbc.Error`, `json.JSONDecodeError`, etc.) |
| S112  | `raise Exception(...)` → use `ValueError` / `TypeError` / `RuntimeError` |
| S109  | Magic numbers → define a named constant (0, 1, -1 exempt) |
| S1871 | `if/elif` branches do same thing → merge predicates |

**After fixing a Sonar issue:** append a dated bullet to `agents.md` > SonarQube Lessons Learned.

### Backend Workflow

1. **Before writing code** — read the relevant section of `agents.md`; check for SQL injection risks, secrets in env/Key Vault, auth decorator presence
2. **After writing code** — `black .` → `ruff check .` → `flake8 .` → `pytest --cov=. --cov-report=term-missing`
3. **After any fix** — update `agents.md` Lessons Learned with a dated bullet
