#!/usr/bin/env bash
# append-existing.sh
#
# Morpheus brownfield overlay — post-render merge helper.
#
# Runs AFTER `copier copy` has rendered the overlay. Reads
# `.morpheus-preflight.json` (written by preserve-existing.sh) and does the
# three merge jobs:
#
#   1. If a pre-existing CODEOWNERS was backed up, append the contents of
#      `.github/CODEOWNERS.morpheus-overlay` to it and delete the overlay file.
#      If no pre-existing CODEOWNERS existed, rename the overlay file to
#      `.github/CODEOWNERS`.
#
#   2. If CLAUDE.md.pre-morpheus.bak exists AND --existing-conventions-preserved=true,
#      append the backed-up content below the overlay-generated CLAUDE.md under
#      an `--- Original CLAUDE.md ---` separator. Same for AGENTS.md.
#
#   3. Stamp timestamps into platform-manifest.json (overlay shipped placeholders).
#
#   4. Write `.agent/BROWNFIELD_NOTES.md` summarising provenance.
#
# Flags:
#   --existing-conventions-preserved BOOL   (default: true)

set -euo pipefail

PRESERVE_CONVENTIONS="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --existing-conventions-preserved)
      PRESERVE_CONVENTIONS="${2:-true}"
      shift 2
      ;;
    -h|--help)
      sed -n '1,30p' "$0"
      exit 0
      ;;
    *)
      echo "append-existing: unknown flag: $1" >&2
      exit 2
      ;;
  esac
done

PREFLIGHT=".morpheus-preflight.json"

# ---------------------------------------------------------------------------
# 1. CODEOWNERS merge
# ---------------------------------------------------------------------------
OVERLAY_CO=".github/CODEOWNERS.morpheus-overlay"
EXISTING_CO=".github/CODEOWNERS"
BACKUP_CO=".github/CODEOWNERS.pre-morpheus.bak"

if [[ -f "$OVERLAY_CO" ]]; then
  if [[ -f "$BACKUP_CO" ]]; then
    # There was a pre-existing CODEOWNERS. Copier did not overwrite it
    # because the overlay file has the `.morpheus-overlay` suffix.
    # Append overlay content to the existing file.
    echo "" >> "$EXISTING_CO"
    cat "$OVERLAY_CO" >> "$EXISTING_CO"
    rm "$OVERLAY_CO"
    echo "append-existing: merged CODEOWNERS.morpheus-overlay into existing CODEOWNERS"
  else
    # No pre-existing CODEOWNERS. Promote the overlay file.
    mv "$OVERLAY_CO" "$EXISTING_CO"
    echo "append-existing: promoted CODEOWNERS.morpheus-overlay -> CODEOWNERS"
  fi
fi

# ---------------------------------------------------------------------------
# 2. CLAUDE.md / AGENTS.md merge (optional)
# ---------------------------------------------------------------------------
append_original_if_preserved() {
  local name="$1"
  local backup="${name}.pre-morpheus.bak"
  if [[ ! -f "$backup" ]]; then
    return 0
  fi
  # Normalise truthy values from copier, which may render Python's bool as "True".
  local preserve_lower
  preserve_lower="$(printf '%s' "$PRESERVE_CONVENTIONS" | tr '[:upper:]' '[:lower:]')"
  if [[ "$preserve_lower" != "true" && "$preserve_lower" != "1" && "$preserve_lower" != "yes" ]]; then
    echo "append-existing: ${name} backup found but --existing-conventions-preserved=${PRESERVE_CONVENTIONS}; leaving backup in place"
    return 0
  fi
  if [[ ! -f "$name" ]]; then
    echo "append-existing: warning: $name missing after render; skipping merge" >&2
    return 0
  fi
  {
    echo ""
    echo "---"
    echo "--- Original ${name} ---"
    echo "---"
    echo ""
    cat "$backup"
  } >> "$name"
  echo "append-existing: appended original ${name} below Morpheus section"
}

append_original_if_preserved "CLAUDE.md"
append_original_if_preserved "AGENTS.md"

# ---------------------------------------------------------------------------
# 3. Timestamp stamp
# ---------------------------------------------------------------------------
if [[ -f "platform-manifest.json" ]]; then
  NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # Portable in-place edit (macOS + Linux).
  tmp="$(mktemp)"
  sed "s/__MORPHEUS_INIT_TIMESTAMP__/${NOW_ISO}/g" platform-manifest.json > "$tmp"
  mv "$tmp" platform-manifest.json
  echo "append-existing: stamped platform-manifest.json timestamps"
fi

# ---------------------------------------------------------------------------
# 4. BROWNFIELD_NOTES.md
# ---------------------------------------------------------------------------
mkdir -p .agent
NOTES=".agent/BROWNFIELD_NOTES.md"
{
  echo "# Brownfield overlay provenance"
  echo ""
  echo "This repo was overlaid with the Morpheus platform on $(date -u +%Y-%m-%dT%H:%M:%SZ)."
  echo ""
  echo "## Files backed up"
  echo ""
  if [[ -f "$PREFLIGHT" ]]; then
    python3 - <<PY
import json, pathlib, sys
try:
    data = json.loads(pathlib.Path("${PREFLIGHT}").read_text())
except Exception as err:
    print(f"- (could not parse preflight: {err})")
    sys.exit(0)
files = data.get("backed_up_files") or []
dirs = data.get("backed_up_dirs") or []
if not files and not dirs:
    print("- (nothing; this repo had no conflicting files)")
for item in files:
    print(f"- file: \`{item['src']}\` -> \`{item['dst']}\`")
for item in dirs:
    print(f"- dir:  \`{item['src']}\` -> \`{item['dst']}\`")
PY
  else
    echo "- (no .morpheus-preflight.json was found; no pre-render scan recorded)"
  fi
  echo ""
  echo "## How to revert"
  echo ""
  echo "1. Remove the overlay-managed files: \`.agent/\`, \`platform-manifest.json\`,"
  echo "   \`.github/workflows/morpheus-*.yml\`, \`.github/CODEOWNERS.morpheus-overlay\`"
  echo "   (if still present), and the Morpheus-managed sections of \`CLAUDE.md\`,"
  echo "   \`AGENTS.md\`, \`.github/copilot-instructions.md\`, \`.github/CODEOWNERS\`."
  echo "2. Restore each \`*.pre-morpheus.bak\` to its original path."
  echo "3. Restore \`.agent.pre-morpheus.bak-*/\` to \`.agent/\` if it was a pre-existing"
  echo "   unrelated directory."
  echo ""
  echo "## Do not"
  echo ""
  echo "- Do not delete the \`.pre-morpheus.bak\` files without steward approval."
  echo "- Do not hand-edit \`.agent/\` or \`platform-manifest.json\` — use the CLI."
} > "$NOTES"
echo "append-existing: wrote $NOTES"

echo "append-existing: done."
