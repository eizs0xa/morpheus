#!/usr/bin/env bash
# add-stack.sh — stub migration.
#
# Purpose: establish the pattern for future migrations that add a new stack
# module to an already-initialised Morpheus project. Not functional in v0.1.0.
#
# Usage (once implemented):
#   add-stack.sh --stack stack-python [--dry-run] [--repo DIR] [--modules-root DIR]
#
# Planned steps:
#   1. Read .agent/platform-manifest.json; refuse if stack already installed.
#   2. Resolve the new stack module under MODULES_ROOT/stacks/<stack>.
#   3. Create branch morpheus/migration/add-stack-<name>-YYYY-MM-DD.
#   4. Copy stack skills into .agent/skills/ (respecting profile filter).
#   5. Copy stack instructions into .github/instructions/.
#   6. Copy stack workflow templates into .github/workflows/ (morpheus-* prefix).
#   7. Apply any stack-declared hooks (e.g. pre-commit-<name>.sh).
#   8. Update the manifest: add the stack module at its pinned version.
#   9. Append a bullet to .agent/MIGRATIONS.md.
#  10. Stage + commit. Do NOT push.

set -euo pipefail

STACK=""
DRY_RUN=0
REPO="$(pwd)"
MODULES_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack) STACK="${2:?--stack requires a value}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --repo) REPO="${2:?--repo requires a value}"; shift 2 ;;
    --modules-root) MODULES_ROOT="${2:?--modules-root requires a value}"; shift 2 ;;
    -h|--help) sed -n '1,25p' "$0"; exit 0 ;;
    *) echo "add-stack: unknown flag: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$STACK" ]]; then
  echo "add-stack: --stack is required" >&2
  exit 2
fi

echo "add-stack: stub — not implemented in v0.1.0."
echo "add-stack: would add '${STACK}' to ${REPO}"
# TODO: implement the diff application step:
#   - copy <modules_root>/stacks/<stack>/skills/*.md into .agent/skills/
#   - copy <modules_root>/stacks/<stack>/instructions/*.md into .github/instructions/
#   - copy <modules_root>/stacks/<stack>/workflows/*.yml.tmpl into .github/workflows/ (prefix morpheus-)
#   - wire hooks if .husky/ or pre-commit config is present
#   - update .agent/platform-manifest.json modules map
#   - commit on branch morpheus/migration/add-stack-${STACK}-<date>
exit 0
