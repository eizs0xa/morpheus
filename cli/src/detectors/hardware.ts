/**
 * Hardware detection — Artifact B §3.
 *
 * Returns the minimal set of facts needed to populate
 * `platform-manifest.json:detected_hardware`: os family, cpu arch, and shell.
 */
export interface Hardware {
  os: 'darwin' | 'linux' | 'win32';
  arch: string;
  shell: string;
}

const SUPPORTED_OS = new Set(['darwin', 'linux', 'win32'] as const);

function detectShell(): string {
  const fromEnv = process.env.SHELL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.platform === 'win32') {
    return process.env.COMSPEC ?? 'powershell';
  }
  return 'bash';
}

export function detectHardware(): Hardware {
  const platform = process.platform;
  const os = SUPPORTED_OS.has(platform as 'darwin' | 'linux' | 'win32')
    ? (platform as 'darwin' | 'linux' | 'win32')
    // Non-standard platforms fall back to 'linux' semantics; callers may override.
    : 'linux';
  return {
    os,
    arch: process.arch,
    shell: detectShell(),
  };
}
