#!/usr/bin/env bash
# preserve-existing.sh
#
# Morpheus brownfield overlay — pre-render backup helper.
#
# Runs BEFORE `copier copy` to back up any existing files the overlay would
# otherwise write on top of. Refuses to run if a `.agent/platform-manifest.json`
# already exists (that indicates the project is already managed — use
# `agentic update` instead).
#
# Usage:
#   scripts/preserve-existing.sh [--target DIR] [--force]
#
# Flags:
#   --target DIR   Directory to back up (default: current dir).
#   --force        Re-run even if a previous `.morpheus-preflight.json` exists.
#
# Exit codes:
#   0  success
#   1  refused (already-managed project, or would clobber without --force)
#   2  bad usage
#
# Outputs:
#   * `<file>.pre-morpheus.bak` for every clobbered root pointer file.
#   * `.agent.pre-morpheus.bak-YYYYMMDDHHMMSS/` for any pre-existing .agent dir
#     that is NOT already Morpheus-managed.
#   * `.morpheus-preflight.json` describing what was backed up.

set -euo pipefail

TARGET="$(pwd)"
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="${2:?--target requires a value}"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      sed -n '1,30p' "$0"
      exit 0
      ;;
    *)
      echo "preserve-existing: unknown flag: $1" >&2
      exit 2
      ;;
  esac
done

cd "$TARGET"

PREFLIGHT=".morpheus-preflight.json"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

# --- Refusal: already-managed project ---------------------------------------
if [[ -f ".agent/platform-manifest.json" ]]; then
  echo "preserve-existing: this repo already has .agent/platform-manifest.json." >&2
  echo "preserve-existing: Morpheus is already installed. Run 'agentic update' instead of re-applying the overlay." >&2
  exit 1
fi

# --- Refusal: previous preflight (idempotency guard) ------------------------
if [[ -f "$PREFLIGHT" && "$FORCE" -ne 1 ]]; then
  echo "preserve-existing: $PREFLIGHT already exists (from a prior run)." >&2
  echo "preserve-existing: pass --force to re-run, or remove the preflight file if the previous overlay was aborted." >&2
  exit 1
fi

# --- Helper: back up a single file ------------------------------------------
backed_up_files=()
backup_file() {
  local src="$1"
  [[ -f "$src" ]] || return 0
  local dst="${src}.pre-morpheus.bak"
  if [[ -e "$dst" ]]; then
    if cmp -s "$src" "$dst"; then
      backed_up_files+=("$src -> $dst")
      echo "  backup already exists: $src -> $dst"
      return 0
    fi
    dst="${src}.pre-morpheus.bak.${TIMESTAMP}"
  fi
  cp -p "$src" "$dst"
  backed_up_files+=("$src -> $dst")
  echo "  backed up: $src -> $dst"
}

# --- Helper: back up a directory --------------------------------------------
backed_up_dirs=()
backup_dir() {
  local src="$1"
  [[ -d "$src" ]] || return 0
  local dst="${src%/}.pre-morpheus.bak-${TIMESTAMP}"
  cp -a "$src" "$dst"
  backed_up_dirs+=("$src -> $dst")
  echo "  backed up dir: $src -> $dst"
}

echo "preserve-existing: scanning $TARGET ..."

backup_file "CLAUDE.md"
backup_file "AGENTS.md"
backup_file ".github/copilot-instructions.md"
backup_file ".github/CODEOWNERS"
backup_file "platform-manifest.json"

# --- .agent/ — back up only if NOT already platform-managed -----------------
if [[ -d ".agent" ]]; then
  # The platform-manifest.json check above already handled the
  # "already managed" case. If we got here and `.agent/` exists but
  # `.agent/platform-manifest.json` does not, it's an unrelated directory —
  # back it up.
  backup_dir ".agent"
fi

# --- Emit preflight manifest -----------------------------------------------
{
  printf '{\n'
  printf '  "tool": "morpheus-preserve-existing",\n'
  printf '  "schema_version": "1",\n'
  printf '  "target": "%s",\n' "$TARGET"
  printf '  "timestamp": "%s",\n' "$TIMESTAMP"
  printf '  "backed_up_files": [\n'
  local_count=${#backed_up_files[@]}
  i=0
  if [[ $local_count -gt 0 ]]; then
    for entry in "${backed_up_files[@]}"; do
      i=$((i + 1))
      src="${entry%% -> *}"
      dst="${entry##* -> }"
      sep=","
      [[ $i -eq $local_count ]] && sep=""
      printf '    {"src": "%s", "dst": "%s"}%s\n' "$src" "$dst" "$sep"
    done
  fi
  printf '  ],\n'
  printf '  "backed_up_dirs": [\n'
  dir_count=${#backed_up_dirs[@]}
  j=0
  if [[ $dir_count -gt 0 ]]; then
    for entry in "${backed_up_dirs[@]}"; do
      j=$((j + 1))
      src="${entry%% -> *}"
      dst="${entry##* -> }"
      sep=","
      [[ $j -eq $dir_count ]] && sep=""
      printf '    {"src": "%s", "dst": "%s"}%s\n' "$src" "$dst" "$sep"
    done
  fi
  printf '  ]\n'
  printf '}\n'
} > "$PREFLIGHT"

echo "preserve-existing: wrote $PREFLIGHT"
echo "preserve-existing: done. Safe to run 'copier copy <overlay> .' next."
