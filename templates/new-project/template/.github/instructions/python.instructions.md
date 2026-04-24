---
applyTo: "**/*.py"
---

# Python Coding Rules

These rules apply to every Python file produced in a Morpheus-scaffolded project. They are
enforced by `agent-pr-gate-python.yml` and `pre-commit-python.sh`. The static-analysis rule
codes below use the same shorthands the community has standardised on; adapt to whichever
analyser the project has enabled.

## Target: zero new static-analysis findings on every PR

## Quick checks before writing code

| Rule | Check |
|------|-------|
| Duplicate literals | A string or numeric value used two or more times must become a named constant. |
| Cognitive complexity | If a function's cognitive complexity exceeds 15, extract `_parse_*` / `_validate_*` / `_build_*` helpers. |
| Broad exception | Do not catch bare `Exception`. Catch the narrowest type that models the failure. |
| Generic raise | Do not `raise Exception(...)`. Raise `ValueError`, `TypeError`, `RuntimeError`, or a project-specific exception. |
| Module singletons | Guard lazy module-level singletons with `threading.Lock` and a double-checked init. |
| Magic numbers | Any literal number other than `0`, `1`, `-1` that carries meaning must be a named constant. |
| Duplicate branches | Two `if` / `elif` branches with identical bodies must be merged. |

## Cognitive complexity — target 15

- Extract `_parse_*`, `_validate_*`, `_build_*` helpers.
- Use early returns to flatten nested `if` chains.
- Do not funnel all complexity into one helper — analysers count per function.
- Keep routes and entry points thin; push logic into services.
- Use `yield from` for streaming rather than buffering large collections.

## Exception types by operation

| Operation | Preferred exception |
|-----------|--------------------|
| Database (pyodbc / psycopg / sqlalchemy) | Driver-specific error (`pyodbc.Error`, `psycopg.Error`, `sqlalchemy.exc.SQLAlchemyError`) |
| JSON parsing | `json.JSONDecodeError` |
| HTTP requests | `requests.RequestException` / `httpx.HTTPError` |
| File I/O | `OSError` |
| Validation | `ValueError` |
| Type misuse | `TypeError` |
| Unreachable state | `RuntimeError` |

## Thread-safe singletons

```python
import threading

_service: MyService | None = None
_service_lock = threading.Lock()

def get_service() -> MyService:
    global _service
    if _service is None:
        with _service_lock:
            if _service is None:
                _service = MyService()
    return _service
```

## SQL and dynamic queries

- Always bind values with parameter markers (`?`, `%s`, or driver-specific equivalents). Never
  f-string user input into SQL.
- Even for parameterized queries, analysers flag dynamic SQL. Generate any in-clause
  placeholder list from a validated integer count, not from user input.
- Qualify tables with their schema explicitly.

## Sensitive data in logs

- Never log tokens, JWTs, SAS URLs, connection strings, Key Vault URIs, or blob URLs that
  carry a `?sig=` query.
- Log only: `type(exc).__name__`, HTTP status codes, artifact IDs, durations, and user IDs.

## Typing

- Annotate every new function's parameters and return type.
- Prefer built-in generics (`list[str]`, `dict[str, int]`) for Python 3.10+.
- Prefer `collections.abc` protocols over concrete types when the function accepts any
  iterable or mapping.
- Avoid `Any`. When unavoidable, narrow with `isinstance` and document the reason.

## Tooling expectations

- The configured formatter (black or the project's equivalent) must report no diff before
  commit.
- The configured linter (ruff or flake8) must report zero new findings.
- The configured test runner must exit zero with coverage at or above the declared threshold.

## After fixing a static-analysis issue

Append a dated bullet to the project's lessons log: `- YYYY-MM: <title> — problem, fix,
where`. Future authors should learn from this fix without re-reading the original ticket.
