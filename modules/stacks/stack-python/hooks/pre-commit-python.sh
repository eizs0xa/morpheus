#!/usr/bin/env bash
set -euo pipefail

# pre-commit-python.sh
# Runs black and ruff on staged Python files.

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.py$' || true)

if [ -z "${STAGED_FILES}" ]; then
  echo "pre-commit-python: no staged Python files; skipping."
  exit 0
fi

if ! command -v black >/dev/null 2>&1; then
  echo "pre-commit-python: 'black' not found on PATH." >&2
  exit 1
fi

if ! command -v ruff >/dev/null 2>&1; then
  echo "pre-commit-python: 'ruff' not found on PATH." >&2
  exit 1
fi

echo "pre-commit-python: running black --check..."
# shellcheck disable=SC2086
echo "${STAGED_FILES}" | xargs black --check

echo "pre-commit-python: running ruff check..."
# shellcheck disable=SC2086
echo "${STAGED_FILES}" | xargs ruff check

echo "pre-commit-python: ok"
