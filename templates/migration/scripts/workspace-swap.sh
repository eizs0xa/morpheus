#!/usr/bin/env bash
# workspace-swap.sh
#
# Morpheus migration — swap the single `workspace-*` module.
#
# Reference: Artifact A §8 "Google migration".
#
# Usage:
#   workspace-swap.sh --from FROM --to TO [--dry-run] [--repo DIR] [--modules-root DIR]
#
# FROM and TO must both be one of:
#   workspace-microsoft, workspace-google
# (and must differ).
#
# This script:
#   1. Reads .agent/platform-manifest.json and verifies FROM is installed.
#   2. Creates branch `morpheus/migration/workspace-swap-YYYY-MM-DD`.
#   3. Removes old workspace skill `notifier.md` from .agent/skills/.
#   4. Copies new workspace `skills/notifier.md` into .agent/skills/.
#   5. Rewrites `.agent/mcp-config.json` based on `--modules-root` templates.
#      Old config is backed up to `.agent/mcp-config.json.pre-swap.bak`.
#   6. Updates the manifest: replaces the FROM module key with TO, bumps
#      `last_updated_at`.
#   7. Appends a bullet to `.agent/MIGRATIONS.md`.
#   8. Stages + commits.
#
# Does NOT push. Prints a PR-ready summary.

set -euo pipefail

FROM=""
TO=""
DRY_RUN=0
REPO="$(pwd)"
MODULES_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) FROM="${2:?--from requires a value}"; shift 2 ;;
    --to)   TO="${2:?--to requires a value}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --repo) REPO="${2:?--repo requires a value}"; shift 2 ;;
    --modules-root) MODULES_ROOT="${2:?--modules-root requires a value}"; shift 2 ;;
    -h|--help) sed -n '1,40p' "$0"; exit 0 ;;
    *) echo "workspace-swap: unknown flag: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$FROM" || -z "$TO" ]]; then
  echo "workspace-swap: --from and --to are required" >&2
  exit 2
fi
if [[ "$FROM" == "$TO" ]]; then
  echo "workspace-swap: --from and --to must differ" >&2
  exit 2
fi

case "$FROM" in workspace-microsoft|workspace-google) ;; *)
  echo "workspace-swap: unsupported --from '$FROM'" >&2; exit 2 ;;
esac
case "$TO" in workspace-microsoft|workspace-google) ;; *)
  echo "workspace-swap: unsupported --to '$TO'" >&2; exit 2 ;;
esac

cd "$REPO"

# --- Resolve the platform modules root so we can pull new workspace assets. -
# Default: assume REPO was initialised via a checkout that sits alongside the
# morpheus monorepo at ../morpheus/, otherwise the operator passes --modules-root.
if [[ -z "$MODULES_ROOT" ]]; then
  for candidate in \
    "$REPO/../morpheus/modules" \
    "$REPO/../../morpheus/modules" \
    "/usr/local/share/morpheus/modules" \
    "$HOME/.morpheus/modules"
  do
    if [[ -d "$candidate" ]]; then
      MODULES_ROOT="$candidate"
      break
    fi
  done
fi
if [[ -z "$MODULES_ROOT" || ! -d "$MODULES_ROOT" ]]; then
  echo "workspace-swap: could not locate the Morpheus modules root." >&2
  echo "workspace-swap: pass --modules-root /path/to/morpheus/modules." >&2
  exit 2
fi

NEW_WS_DIR="$MODULES_ROOT/workspaces/$TO"
if [[ ! -d "$NEW_WS_DIR" ]]; then
  echo "workspace-swap: new workspace module not found at $NEW_WS_DIR" >&2
  exit 2
fi

# --- Git sanity --------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "workspace-swap: $REPO is not a git working tree" >&2
  exit 1
fi

MANIFEST=".agent/platform-manifest.json"
if [[ ! -f "$MANIFEST" ]]; then
  echo "workspace-swap: $MANIFEST not found; this repo is not Morpheus-managed" >&2
  exit 1
fi

# Verify FROM is currently installed.
if ! python3 -c "import json,sys;d=json.load(open('$MANIFEST'));sys.exit(0 if '$FROM' in (d.get('modules') or {}) else 1)"; then
  echo "workspace-swap: $FROM is not listed in $MANIFEST" >&2
  exit 1
fi

TODAY="$(date -u +%Y-%m-%d)"
NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BRANCH="morpheus/migration/workspace-swap-${TODAY}"

# ---------- Planned actions --------------------------------------------------
planned() {
  echo "[plan] git checkout -b ${BRANCH}"
  echo "[plan] remove ${FROM} notifier skill (e.g. teams notifier)"
  echo "[plan] add ${TO} notifier skill (e.g. googlechat notifier) from ${NEW_WS_DIR}/skills/notifier.md"
  echo "[plan] rewrite .agent/mcp-config.json from ${NEW_WS_DIR}/mcp-config.json.tmpl"
  case "$FROM" in
    workspace-microsoft) echo "[plan] mcp: remove teams, outlook, onedrive entries" ;;
    workspace-google)    echo "[plan] mcp: remove googlechat, gmail, drive entries" ;;
  esac
  case "$TO" in
    workspace-microsoft) echo "[plan] mcp: add teams, outlook, onedrive entries" ;;
    workspace-google)    echo "[plan] mcp: add googlechat, gmail, drive entries" ;;
  esac
  echo "[plan] update $MANIFEST: remove key '${FROM}', add '${TO}' at 0.1.0, bump last_updated_at to ${NOW_ISO}"
  echo "[plan] append bullet to .agent/MIGRATIONS.md"
  echo "[plan] git add .agent && git commit -m 'chore(migration): swap ${FROM} -> ${TO}'"
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "workspace-swap: DRY RUN — no changes will be made."
  planned
  exit 0
fi

# ---------- Real run ---------------------------------------------------------
git checkout -b "$BRANCH"

# Remove old skill file.
OLD_SKILL=".agent/skills/notifier.md"
if [[ -f "$OLD_SKILL" ]]; then
  rm "$OLD_SKILL"
fi

# Copy new skill file.
cp "$NEW_WS_DIR/skills/notifier.md" ".agent/skills/notifier.md"

# MCP config swap.
mkdir -p .agent
if [[ -f ".agent/mcp-config.json" ]]; then
  cp ".agent/mcp-config.json" ".agent/mcp-config.json.pre-swap.bak"
fi
# Straight copy of the template — a follow-up CLI pass re-renders the
# prompt-dependent values. We preserve the template markers so the operator
# can see what still needs filling in.
cp "$NEW_WS_DIR/mcp-config.json.tmpl" ".agent/mcp-config.json"

# Manifest rewrite.
python3 - "$MANIFEST" "$FROM" "$TO" "$NOW_ISO" <<'PY'
import json, pathlib, sys
manifest_path, frm, to, now_iso = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
path = pathlib.Path(manifest_path)
data = json.loads(path.read_text())
modules = data.setdefault("modules", {})
version = modules.pop(frm, "0.1.0")
modules[to] = version
data["last_updated_at"] = now_iso
path.write_text(json.dumps(data, indent=2) + "\n")
PY

# Migration note.
NOTES=".agent/MIGRATIONS.md"
if [[ ! -f "$NOTES" ]]; then
  echo "# Migrations log" > "$NOTES"
  echo "" >> "$NOTES"
fi
printf -- "- %s: swapped %s -> %s (branch \`%s\`)\n" "$NOW_ISO" "$FROM" "$TO" "$BRANCH" >> "$NOTES"

# Commit.
git add .agent
git commit -m "chore(migration): swap ${FROM} -> ${TO}"

cat <<SUMMARY

workspace-swap: done.

  branch:   ${BRANCH}
  from:     ${FROM}
  to:       ${TO}
  manifest: $MANIFEST updated, last_updated_at=${NOW_ISO}
  skills:   .agent/skills/notifier.md replaced
  mcp:      .agent/mcp-config.json rewritten (old backed up to .agent/mcp-config.json.pre-swap.bak)
  log:      appended to .agent/MIGRATIONS.md

Next steps:
  git push --set-upstream origin ${BRANCH}
  # Then open a PR titled:
  #   chore(migration): swap ${FROM} -> ${TO}

SUMMARY
