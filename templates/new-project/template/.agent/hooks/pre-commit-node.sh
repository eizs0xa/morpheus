#!/usr/bin/env bash
set -euo pipefail

# pre-commit-node.sh
# Runs format check and lint on staged JS/TS files.

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -E '\.(ts|tsx|js|jsx|mjs|cjs)$' || true)

if [ -z "${STAGED_FILES}" ]; then
  echo "pre-commit-node: no staged JS/TS files; skipping."
  exit 0
fi

echo "pre-commit-node: checking formatting..."
if command -v pnpm >/dev/null 2>&1; then
  RUN="pnpm exec"
elif command -v npx >/dev/null 2>&1; then
  RUN="npx --no-install"
else
  echo "pre-commit-node: neither pnpm nor npx found on PATH." >&2
  exit 1
fi

# shellcheck disable=SC2086
echo "${STAGED_FILES}" | xargs ${RUN} prettier --check

echo "pre-commit-node: linting..."
# shellcheck disable=SC2086
echo "${STAGED_FILES}" | xargs ${RUN} eslint --max-warnings=0

echo "pre-commit-node: ok"
