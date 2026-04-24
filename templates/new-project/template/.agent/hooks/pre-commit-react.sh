#!/usr/bin/env bash
set -euo pipefail

# pre-commit-react.sh
# Runs format check and lint on staged React component and style files.

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -E '\.(tsx|jsx|css|scss)$' || true)

if [ -z "${STAGED_FILES}" ]; then
  echo "pre-commit-react: no staged React/CSS files; skipping."
  exit 0
fi

if command -v pnpm >/dev/null 2>&1; then
  RUN="pnpm exec"
elif command -v npx >/dev/null 2>&1; then
  RUN="npx --no-install"
else
  echo "pre-commit-react: neither pnpm nor npx found on PATH." >&2
  exit 1
fi

echo "pre-commit-react: checking formatting..."
# shellcheck disable=SC2086
echo "${STAGED_FILES}" | xargs ${RUN} prettier --check

LINT_FILES=$(echo "${STAGED_FILES}" | grep -E '\.(tsx|jsx)$' || true)
if [ -n "${LINT_FILES}" ]; then
  echo "pre-commit-react: linting JSX/TSX..."
  # shellcheck disable=SC2086
  echo "${LINT_FILES}" | xargs ${RUN} eslint --max-warnings=0
fi

echo "pre-commit-react: ok"
