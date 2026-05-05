#!/usr/bin/env bash
# =============================================================================
# Morpheus Bootstrap — macOS & Linux
# =============================================================================
# One command to go from zero to running Morpheus, regardless of what is
# already installed on the machine:
#
#   curl -fsSL https://raw.githubusercontent.com/<org>/morpheus/main/scripts/bootstrap.sh | bash
#
# Or, if you already have the repo:
#
#   ./scripts/bootstrap.sh
#
# What it does:
#   1. Installs missing system dependencies (git, Node ≥ 20, pnpm, Python 3,
#      copier).
#   2. Clones the Morpheus platform (or updates it if already present).
#   3. Builds the CLI and links it as a global `morpheus` / `agentic` binary.
#   4. Runs `morpheus invoke` in the directory where you called the script,
#      which auto-detects whether you are starting greenfield or brownfield.
#
# Environment overrides:
#   MORPHEUS_REPO    — Git URL to clone (default: GitHub main repo)
#   MORPHEUS_DIR     — Where to install the platform (default: ~/.morpheus)
#   MORPHEUS_BRANCH  — Branch to checkout after clone (default: main)
#   MORPHEUS_SKIP_INVOKE — Set to 1 to skip the final `morpheus invoke` step
# =============================================================================
set -euo pipefail
IFS=$'\n\t'

# ── Configuration ─────────────────────────────────────────────────────────────
MORPHEUS_REPO="${MORPHEUS_REPO:-https://github.com/<org>/morpheus.git}"
MORPHEUS_DIR="${MORPHEUS_DIR:-$HOME/.morpheus}"
MORPHEUS_BRANCH="${MORPHEUS_BRANCH:-main}"
MORPHEUS_SKIP_INVOKE="${MORPHEUS_SKIP_INVOKE:-0}"
MIN_NODE_MAJOR=20

# ── Terminal colours (safe-fallback if not a TTY) ─────────────────────────────
if [[ -t 1 ]]; then
  BOLD='\033[1m'; DIM='\033[2m'; GREEN='\033[0;32m'
  YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; RESET='\033[0m'
else
  BOLD=''; DIM=''; GREEN=''; YELLOW=''; RED=''; CYAN=''; RESET=''
fi

banner() {
  echo ""
  echo -e "${BOLD}${CYAN}"
  echo "  ╔══════════════════════════════════════════════════╗"
  echo "  ║           Morpheus Bootstrap Installer           ║"
  echo "  ║   The standard OS for agentic development        ║"
  echo "  ╚══════════════════════════════════════════════════╝"
  echo -e "${RESET}"
}

step()  { echo -e "\n${BOLD}[$1/$TOTAL_STEPS] $2${RESET}"; }
info()  { echo -e "  ${DIM}→${RESET} $*"; }
ok()    { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()  { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
die()   { echo -e "\n  ${RED}✗ ERROR:${RESET} $*\n" >&2; exit 1; }

require_cmd() { command -v "$1" &>/dev/null; }

TOTAL_STEPS=5
# Remember where the user ran the script from (their project directory).
USER_CWD="$(pwd -P)"

# ── OS Detection ──────────────────────────────────────────────────────────────
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "macos" ;;
    Linux)  echo "linux" ;;
    *)      die "Unsupported OS: $(uname -s). Use the Windows bootstrap (scripts/bootstrap.ps1) on Windows." ;;
  esac
}

OS=$(detect_os)
ARCH="$(uname -m)"

# ── Package manager helpers ───────────────────────────────────────────────────
install_brew() {
  if require_cmd brew; then return; fi
  info "Homebrew not found — installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for the rest of this session.
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -f /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
  ok "Homebrew installed"
}

linux_install() {
  # $1 = package name (same on apt/dnf/yum/pacman)
  if require_cmd apt-get;  then sudo apt-get install -y "$1"
  elif require_cmd dnf;    then sudo dnf install -y "$1"
  elif require_cmd yum;    then sudo yum install -y "$1"
  elif require_cmd pacman; then sudo pacman -S --noconfirm "$1"
  else die "No supported package manager (apt/dnf/yum/pacman). Install $1 manually then re-run."
  fi
}

# ── Dependency: git ───────────────────────────────────────────────────────────
ensure_git() {
  if require_cmd git; then
    ok "git: $(git --version | awk '{print $3}')"; return
  fi
  info "Installing git..."
  case "$OS" in
    macos) install_brew; brew install git ;;
    linux) linux_install git ;;
  esac
  require_cmd git || die "git installation failed."
  ok "git installed: $(git --version | awk '{print $3}')"
}

# ── Dependency: Node.js ───────────────────────────────────────────────────────
ensure_node() {
  if require_cmd node; then
    local ver major
    ver="$(node -e "process.stdout.write(process.version.slice(1))")"
    major="${ver%%.*}"
    if [[ "$major" -ge "$MIN_NODE_MAJOR" ]]; then
      ok "Node.js: v$ver"; return
    fi
    warn "Node.js v$ver detected but v$MIN_NODE_MAJOR+ required — upgrading..."
  else
    info "Node.js not found — installing v$MIN_NODE_MAJOR LTS..."
  fi

  case "$OS" in
    macos)
      install_brew
      brew install node@22 2>/dev/null || brew install node
      # Ensure brew-managed node is first on PATH.
      local node_prefix
      node_prefix="$(brew --prefix node@22 2>/dev/null || brew --prefix node)"
      export PATH="${node_prefix}/bin:$PATH"
      ;;
    linux)
      # NodeSource setup — works on Debian/Ubuntu/RHEL/Fedora families.
      if require_cmd curl; then
        if require_cmd apt-get; then
          curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
          sudo apt-get install -y nodejs
        else
          curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
          sudo dnf install -y nodejs 2>/dev/null || sudo yum install -y nodejs
        fi
      else
        die "curl is required to install Node.js automatically. Install curl then re-run."
      fi
      ;;
  esac
  require_cmd node || die "Node.js installation failed. Install Node.js v$MIN_NODE_MAJOR+ from https://nodejs.org then re-run."
  ok "Node.js installed: $(node --version)"
}

# ── Dependency: pnpm ─────────────────────────────────────────────────────────
ensure_pnpm() {
  if require_cmd pnpm; then
    ok "pnpm: $(pnpm --version)"; return
  fi
  info "Installing pnpm..."
  npm install -g pnpm
  # pnpm may land in npm's global bin — ensure it's on PATH.
  local npm_bin
  npm_bin="$(npm config get prefix 2>/dev/null)/bin"
  if [[ -d "$npm_bin" && ":$PATH:" != *":$npm_bin:"* ]]; then
    export PATH="$npm_bin:$PATH"
  fi
  require_cmd pnpm || die "pnpm installation failed. Install manually: npm install -g pnpm"
  ok "pnpm installed: $(pnpm --version)"
}

# ── Dependency: Python 3 ──────────────────────────────────────────────────────
ensure_python() {
  for cmd in python3 python; do
    if require_cmd "$cmd"; then
      local ver
      ver="$("$cmd" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")"
      local major="${ver%%.*}"
      if [[ "$major" -ge 3 ]]; then
        ok "Python: $cmd $ver"; return
      fi
    fi
  done
  info "Python 3 not found — installing..."
  case "$OS" in
    macos) install_brew; brew install python3 ;;
    linux) linux_install python3; linux_install python3-pip 2>/dev/null || true ;;
  esac
  require_cmd python3 || die "Python 3 installation failed. Install Python 3.10+ from https://python.org then re-run."
  ok "Python installed: $(python3 --version 2>&1 | awk '{print $2}')"
}

# ── Dependency: copier ────────────────────────────────────────────────────────
ensure_copier() {
  if require_cmd copier || python3 -m copier --version &>/dev/null 2>&1; then
    ok "copier: ready"; return
  fi
  info "Installing copier..."
  if require_cmd pipx; then
    pipx install copier
  else
    python3 -m pip install --user copier
    local user_bin
    user_bin="$(python3 -m site --user-base 2>/dev/null)/bin"
    if [[ -d "$user_bin" && ":$PATH:" != *":$user_bin:"* ]]; then
      export PATH="$user_bin:$PATH"
    fi
  fi
  if ! require_cmd copier && ! python3 -m copier --version &>/dev/null 2>&1; then
    warn "copier binary not on PATH. Templates will fall back to 'python3 -m copier'."
    warn "To add it: echo 'export PATH=\"\$PATH:\$(python3 -m site --user-base)/bin\"' >> ~/.zshrc"
  else
    ok "copier installed"
  fi
}

# ── Morpheus platform setup ───────────────────────────────────────────────────
is_morpheus_root() {
  [[ -f "$1/modules/core/module.yaml" ]] && [[ -f "$1/templates/new-project/copier.yml" ]]
}

# Detect if the script itself lives inside a Morpheus checkout.
SCRIPT_SOURCE="${BASH_SOURCE[0]:-$0}"
if [[ "$SCRIPT_SOURCE" != /proc/* ]] && [[ -n "$SCRIPT_SOURCE" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" 2>/dev/null && pwd -P || echo "")"
  REPO_ROOT="$(cd "${SCRIPT_DIR}/.." 2>/dev/null && pwd -P || echo "")"
else
  # Piped from curl — no script path available.
  SCRIPT_DIR=""
  REPO_ROOT=""
fi

setup_platform() {
  if [[ -n "$REPO_ROOT" ]] && is_morpheus_root "$REPO_ROOT"; then
    info "Running from existing Morpheus checkout: $REPO_ROOT"
    MORPHEUS_DIR="$REPO_ROOT"
    if [[ -d "$MORPHEUS_DIR/.git" ]]; then
      info "Pulling latest changes..."
      git -C "$MORPHEUS_DIR" pull --ff-only origin "$MORPHEUS_BRANCH" 2>/dev/null \
        || warn "Could not pull latest (local changes or no network). Proceeding with current version."
    fi
  elif is_morpheus_root "$MORPHEUS_DIR"; then
    info "Morpheus found at $MORPHEUS_DIR — pulling latest..."
    git -C "$MORPHEUS_DIR" pull --ff-only origin "$MORPHEUS_BRANCH" 2>/dev/null \
      || warn "Could not pull latest. Proceeding with current version."
    ok "Morpheus platform up to date"
  else
    info "Cloning Morpheus platform to $MORPHEUS_DIR..."
    git clone --branch "$MORPHEUS_BRANCH" "$MORPHEUS_REPO" "$MORPHEUS_DIR"
    ok "Morpheus cloned"
  fi
}

build_cli() {
  local cli_dir="$MORPHEUS_DIR/cli"
  info "Installing CLI dependencies..."
  cd "$cli_dir"
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  info "Compiling TypeScript..."
  pnpm build
  info "Linking global binary..."
  pnpm setup 2>/dev/null || true
  pnpm link --global
  cd - >/dev/null

  # Ensure pnpm's global bin is on PATH for this session.
  local pnpm_bin
  pnpm_bin="$(pnpm bin --global 2>/dev/null || echo "")"
  if [[ -n "$pnpm_bin" && ":$PATH:" != *":$pnpm_bin:"* ]]; then
    export PATH="$pnpm_bin:$PATH"
  fi
}

verify_cli() {
  if require_cmd morpheus; then
    local ver
    ver="$(morpheus --version 2>/dev/null || echo "0.1.0")"
    ok "morpheus CLI is ready (${ver})"
    return 0
  fi
  # Try running directly via node as a fallback.
  if node "$MORPHEUS_DIR/cli/dist/index.js" --version &>/dev/null 2>&1; then
    warn "morpheus not on PATH yet — using direct node invocation for this session."
    warn "Open a new terminal (or run: source ~/.zshrc) to use the 'morpheus' command."
    return 0
  fi
  die "CLI verification failed. Check $MORPHEUS_DIR/cli/dist/ exists and re-run."
}

# ── Invoke morpheus in the user's project directory ───────────────────────────
invoke_morpheus() {
  if [[ "$MORPHEUS_SKIP_INVOKE" == "1" ]]; then
    info "Skipping invocation (MORPHEUS_SKIP_INVOKE=1)."
    return
  fi

  cd "$USER_CWD"
  export MORPHEUS_PLATFORM_ROOT="$MORPHEUS_DIR"

  echo ""
  echo -e "${BOLD}${CYAN}Running morpheus invoke in: ${USER_CWD}${RESET}"
  echo ""

  if require_cmd morpheus; then
    morpheus invoke
  else
    node "$MORPHEUS_DIR/cli/dist/index.js" invoke
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  banner
  echo -e "  OS: ${BOLD}$OS${RESET} (${ARCH})    Project: ${BOLD}${USER_CWD}${RESET}"

  step 1 "Installing system dependencies"
  ensure_git
  ensure_node
  ensure_pnpm
  ensure_python
  ensure_copier

  step 2 "Setting up the Morpheus platform"
  setup_platform

  step 3 "Building the Morpheus CLI"
  build_cli

  step 4 "Verifying installation"
  verify_cli

  step 5 "Initialising your project"
  invoke_morpheus

  echo ""
  echo -e "  ${GREEN}${BOLD}Bootstrap complete.${RESET}"
  echo -e "  ${DIM}Next time, just run: ${RESET}${BOLD}morpheus invoke${RESET}"
  echo ""
}

main "$@"
