# =============================================================================
# Morpheus Bootstrap — Windows (PowerShell 5.1+ / PowerShell 7+)
# =============================================================================
# One command to go from zero to running Morpheus on Windows, regardless of
# what is already installed:
#
#   irm https://raw.githubusercontent.com/<org>/morpheus/main/scripts/bootstrap.ps1 | iex
#
# Or, if you already have the repo:
#
#   .\scripts\bootstrap.ps1
#
# What it does:
#   1. Installs missing dependencies (git, Node ≥ 20, pnpm, Python 3,
#      copier) via winget (Windows 11/10) with a Scoop/Chocolatey fallback.
#   2. Clones the Morpheus platform (or updates it if already present).
#   3. Builds the CLI and links it as a global `morpheus` / `agentic` command.
#   4. Runs `morpheus invoke` in the directory where you called the script,
#      auto-detecting greenfield vs brownfield.
#
# Environment overrides (set before calling):
#   $env:MORPHEUS_REPO    — Git URL (default: GitHub main repo)
#   $env:MORPHEUS_DIR     — Platform install location (default: ~\.morpheus)
#   $env:MORPHEUS_BRANCH  — Branch to use (default: main)
#   $env:MORPHEUS_SKIP_INVOKE — Set to "1" to skip `morpheus invoke`
# =============================================================================

#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Configuration ─────────────────────────────────────────────────────────────
$MorpheusRepo   = if ($env:MORPHEUS_REPO)   { $env:MORPHEUS_REPO }   else { 'https://github.com/<org>/morpheus.git' }
$MorpheusDir    = if ($env:MORPHEUS_DIR)    { $env:MORPHEUS_DIR }    else { Join-Path $HOME '.morpheus' }
$MorpheusBranch = if ($env:MORPHEUS_BRANCH) { $env:MORPHEUS_BRANCH } else { 'main' }
$SkipInvoke     = ($env:MORPHEUS_SKIP_INVOKE -eq '1')
$MinNodeMajor   = 20
$UserCwd        = Get-Location | Select-Object -ExpandProperty Path

# ── Helpers ───────────────────────────────────────────────────────────────────
$TotalSteps = 5
$StepNum    = 0

function Show-Banner {
  Write-Host ""
  Write-Host "  +====================================================+" -ForegroundColor Cyan
  Write-Host "  |         Morpheus Bootstrap Installer               |" -ForegroundColor Cyan
  Write-Host "  |   The standard OS for agentic development          |" -ForegroundColor Cyan
  Write-Host "  +====================================================+" -ForegroundColor Cyan
  Write-Host ""
}

function Step([string]$Msg) {
  $Script:StepNum++
  Write-Host "`n[$Script:StepNum/$TotalSteps] $Msg" -ForegroundColor White
}

function Info([string]$Msg)  { Write-Host "   -> $Msg" -ForegroundColor DarkGray }
function Ok([string]$Msg)    { Write-Host "   + $Msg"  -ForegroundColor Green }
function Warn([string]$Msg)  { Write-Host "   ! $Msg"  -ForegroundColor Yellow }
function Fail([string]$Msg)  { Write-Host "`n   ERROR: $Msg`n" -ForegroundColor Red; exit 1 }

function Test-Command([string]$Name) {
  $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Add-ToPath([string]$Dir) {
  if ($Dir -and (Test-Path $Dir) -and ($env:PATH -notlike "*$Dir*")) {
    $env:PATH = "$Dir;$env:PATH"
  }
}

# ── Package manager detection ─────────────────────────────────────────────────
function Get-PackageManager {
  if (Test-Command 'winget') { return 'winget' }
  if (Test-Command 'scoop')  { return 'scoop'  }
  if (Test-Command 'choco')  { return 'choco'  }
  return $null
}

function Install-WithWinget([string]$PackageId, [string]$Name) {
  Info "Installing $Name via winget..."
  winget install --id $PackageId --silent --accept-package-agreements --accept-source-agreements
  # Refresh PATH after install.
  $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('PATH', 'User')
}

function Install-WithScoop([string]$Package, [string]$Name) {
  Info "Installing $Name via Scoop..."
  scoop install $Package
}

function Install-WithChoco([string]$Package, [string]$Name) {
  Info "Installing $Name via Chocolatey..."
  choco install $Package -y
  $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('PATH', 'User')
}

# ── Dependency: git ───────────────────────────────────────────────────────────
function Ensure-Git {
  if (Test-Command 'git') { Ok "git: $(git --version)"; return }
  Info "git not found - installing..."
  $pm = Get-PackageManager
  switch ($pm) {
    'winget' { Install-WithWinget 'Git.Git' 'Git' }
    'scoop'  { Install-WithScoop  'git'     'Git' }
    'choco'  { Install-WithChoco  'git'     'Git' }
    default  { Fail "No package manager found (winget/scoop/choco). Install Git from https://git-scm.com then re-run." }
  }
  Add-ToPath "$env:ProgramFiles\Git\cmd"
  if (-not (Test-Command 'git')) { Fail "git installation failed." }
  Ok "git installed: $(git --version)"
}

# ── Dependency: Node.js ───────────────────────────────────────────────────────
function Ensure-Node {
  if (Test-Command 'node') {
    $ver = node -e "process.stdout.write(process.version.slice(1))"
    $major = [int]($ver.Split('.')[0])
    if ($major -ge $MinNodeMajor) { Ok "Node.js: v$ver"; return }
    Warn "Node.js v$ver found but v$MinNodeMajor+ required - upgrading..."
  } else {
    Info "Node.js not found - installing v22 LTS..."
  }
  $pm = Get-PackageManager
  switch ($pm) {
    'winget' { Install-WithWinget 'OpenJS.NodeJS.LTS' 'Node.js LTS' }
    'scoop'  { Install-WithScoop  'nodejs-lts'        'Node.js LTS' }
    'choco'  { Install-WithChoco  'nodejs-lts'        'Node.js LTS' }
    default  { Fail "No package manager found. Install Node.js v$MinNodeMajor+ from https://nodejs.org then re-run." }
  }
  $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('PATH', 'User')
  if (-not (Test-Command 'node')) { Fail "Node.js installation failed." }
  Ok "Node.js installed: $(node --version)"
}

# ── Dependency: pnpm ─────────────────────────────────────────────────────────
function Ensure-Pnpm {
  if (Test-Command 'pnpm') { Ok "pnpm: $(pnpm --version)"; return }
  Info "Installing pnpm..."
  npm install -g pnpm
  # Refresh PATH.
  $npmBin = (npm config get prefix) + '\bin' # Unix-style path from npm
  $npmBinWin = Join-Path (npm config get prefix) ''
  Add-ToPath $npmBinWin
  Add-ToPath "$env:APPDATA\npm"
  if (-not (Test-Command 'pnpm')) { Fail "pnpm installation failed. Run: npm install -g pnpm" }
  Ok "pnpm installed: $(pnpm --version)"
}

# ── Dependency: Python 3 ──────────────────────────────────────────────────────
function Ensure-Python {
  foreach ($cmd in @('python3', 'python', 'py')) {
    if (Test-Command $cmd) {
      $ver = & $cmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
      if ($ver -and ([int]($ver.Split('.')[0]) -ge 3)) {
        Ok "Python: $cmd $ver"; return
      }
    }
  }
  Info "Python 3 not found - installing..."
  $pm = Get-PackageManager
  switch ($pm) {
    'winget' { Install-WithWinget 'Python.Python.3.12' 'Python 3' }
    'scoop'  { Install-WithScoop  'python'             'Python 3' }
    'choco'  { Install-WithChoco  'python3'            'Python 3' }
    default  { Fail "No package manager found. Install Python 3 from https://python.org then re-run." }
  }
  $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('PATH', 'User')
  if (-not (Test-Command 'python3') -and -not (Test-Command 'python')) {
    Fail "Python installation failed."
  }
  Ok "Python installed"
}

# ── Dependency: copier ────────────────────────────────────────────────────────
function Ensure-Copier {
  if (Test-Command 'copier') { Ok "copier: ready"; return }
  # Try python -m copier
  $pyCmd = if (Test-Command 'python3') { 'python3' } elseif (Test-Command 'python') { 'python' } else { 'py' }
  $testCopier = & $pyCmd -m copier --version 2>$null
  if ($LASTEXITCODE -eq 0) { Ok "copier: ready (python -m copier)"; return }

  Info "Installing copier..."
  if (Test-Command 'pipx') {
    pipx install copier
  } else {
    & $pyCmd -m pip install --user copier
    # Add user Scripts to PATH.
    $userBase = & $pyCmd -m site --user-base 2>$null
    if ($userBase) {
      Add-ToPath (Join-Path $userBase 'Scripts')
    }
  }
  if (Test-Command 'copier') {
    Ok "copier installed"
  } else {
    Warn "copier not yet on PATH. Templates will fall back to 'python -m copier'."
    Warn "Restart your terminal to pick up the updated PATH."
  }
}

# ── Morpheus platform setup ───────────────────────────────────────────────────
function Test-IsMorpheusRoot([string]$Dir) {
  (Test-Path (Join-Path $Dir 'modules\core\module.yaml')) -and
  (Test-Path (Join-Path $Dir 'templates\new-project\copier.yml'))
}

function Setup-Platform {
  # Check if script lives inside an existing checkout.
  $ScriptDir = Split-Path -Parent $MyInvocation.PSCommandPath -ErrorAction SilentlyContinue
  $RepoRoot  = if ($ScriptDir) { Split-Path -Parent $ScriptDir } else { '' }

  if ($RepoRoot -and (Test-IsMorpheusRoot $RepoRoot)) {
    Info "Running from existing Morpheus checkout: $RepoRoot"
    $Script:MorpheusDir = $RepoRoot
    if (Test-Path (Join-Path $RepoRoot '.git')) {
      Info "Pulling latest changes..."
      try {
        git -C $Script:MorpheusDir pull --ff-only origin $MorpheusBranch 2>$null
      } catch {
        Warn "Could not pull latest (local changes or no network). Proceeding with current version."
      }
    }
    Ok "Platform ready"
    return
  }

  if (Test-IsMorpheusRoot $Script:MorpheusDir) {
    Info "Morpheus found at $($Script:MorpheusDir) - pulling latest..."
    try {
      git -C $Script:MorpheusDir pull --ff-only origin $MorpheusBranch 2>$null
    } catch {
      Warn "Could not pull latest. Proceeding with current version."
    }
    Ok "Morpheus platform up to date"
    return
  }

  Info "Cloning Morpheus platform to $($Script:MorpheusDir)..."
  git clone --branch $MorpheusBranch $MorpheusRepo $Script:MorpheusDir
  Ok "Morpheus cloned"
}

# ── Build CLI ─────────────────────────────────────────────────────────────────
function Build-Cli {
  $CliDir = Join-Path $Script:MorpheusDir 'cli'
  Info "Installing CLI dependencies..."
  Push-Location $CliDir
  try {
    pnpm install --frozen-lockfile 2>$null
    if ($LASTEXITCODE -ne 0) { pnpm install }
    Info "Compiling TypeScript..."
    pnpm build
    Info "Linking global binary..."
    pnpm setup 2>$null
    pnpm link --global
  } finally {
    Pop-Location
  }
  # Add pnpm global bin to PATH for this session.
  $pnpmBin = pnpm bin --global 2>$null
  if ($pnpmBin) { Add-ToPath $pnpmBin }
  $env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'User') + ';' + $env:PATH
}

# ── Verify ────────────────────────────────────────────────────────────────────
function Verify-Cli {
  if (Test-Command 'morpheus') {
    $ver = morpheus --version 2>$null
    Ok "morpheus CLI ready ($ver)"
    return
  }
  $nodeEntry = Join-Path $Script:MorpheusDir 'cli\dist\index.js'
  if (Test-Path $nodeEntry) {
    Warn "morpheus not on PATH yet. Open a new terminal to use the 'morpheus' command."
    Warn "For now, this session will invoke via 'node $nodeEntry'."
    return
  }
  Fail "CLI verification failed. Check $($Script:MorpheusDir)\cli\dist\ and re-run."
}

# ── Invoke ────────────────────────────────────────────────────────────────────
function Invoke-Morpheus {
  if ($SkipInvoke) { Info "Skipping invocation (MORPHEUS_SKIP_INVOKE=1)."; return }

  Set-Location $UserCwd
  $env:MORPHEUS_PLATFORM_ROOT = $Script:MorpheusDir

  Write-Host ""
  Write-Host "  Running morpheus invoke in: $UserCwd" -ForegroundColor Cyan
  Write-Host ""

  $nodeEntry = Join-Path $Script:MorpheusDir 'cli\dist\index.js'
  if (Test-Command 'morpheus') {
    morpheus invoke
  } else {
    node $nodeEntry invoke
  }
}

# ── Main ──────────────────────────────────────────────────────────────────────
Show-Banner
Write-Host "  OS: Windows ($env:PROCESSOR_ARCHITECTURE)    Project: $UserCwd"

Step "Installing system dependencies"
Ensure-Git
Ensure-Node
Ensure-Pnpm
Ensure-Python
Ensure-Copier

Step "Setting up the Morpheus platform"
Setup-Platform

Step "Building the Morpheus CLI"
Build-Cli

Step "Verifying installation"
Verify-Cli

Step "Initialising your project"
Invoke-Morpheus

Write-Host ""
Write-Host "  Bootstrap complete." -ForegroundColor Green
Write-Host "  Next time, just run: morpheus invoke" -ForegroundColor DarkGray
Write-Host ""
