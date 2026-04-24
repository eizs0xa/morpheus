/**
 * Shared helpers for Morpheus integration tests.
 *
 * Keep this file dependency-free (only node built-ins) so the runner can
 * be invoked without a prior `pnpm install` at the repo root.
 */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const PLATFORM_ROOT = path.resolve(here, '..');
export const CLI_ENTRY = path.join(PLATFORM_ROOT, 'cli', 'dist', 'index.js');
export const FIXTURES = path.join(PLATFORM_ROOT, 'tests', 'fixtures');

const tmpDirsToClean = [];

process.on('exit', () => {
  // Best-effort cleanup. We don't await here — process is exiting.
  for (const d of tmpDirsToClean) {
    try {
      fs.rm(d, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
});

/** Create a unique tmp dir that will be cleaned up on process exit. */
export async function makeTmp(prefix = 'morpheus-it-') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tmpDirsToClean.push(dir);
  return dir;
}

/** Recursively copy a directory. */
export async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isSymbolicLink()) {
      const target = await fs.readlink(s);
      await fs.symlink(target, d);
    } else {
      await fs.copyFile(s, d);
    }
  }
}

export async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function sha256(p) {
  const buf = await fs.readFile(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Check whether the `copier` binary is available on the host. */
export function hasCopier() {
  const r = spawnSync('copier', ['--version'], { stdio: 'ignore' });
  return r.status === 0;
}

/** Check whether the CLI has been built. */
export async function cliIsBuilt() {
  return fileExists(CLI_ENTRY);
}

/**
 * Run the Morpheus CLI. Returns { code, stdout, stderr }.
 *
 * `env` is merged on top of process.env. Tests always set
 * MORPHEUS_PLATFORM_ROOT explicitly so we don't rely on cwd traversal.
 *
 * Note on stdout capture: the CLI calls `process.exit(code)` inside
 * validate/doctor, which does not drain piped stdout on macOS. We route
 * child stdout/stderr to tmp files so we always read the full output.
 */
export async function runCli(args, opts = {}) {
  const outFile = path.join(os.tmpdir(), `morpheus-cli-out-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.log`);
  const errFile = `${outFile}.err`;
  const outFd = await fs.open(outFile, 'w');
  const errFd = await fs.open(errFile, 'w');

  try {
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
        cwd: opts.cwd ?? process.cwd(),
        env: {
          ...process.env,
          MORPHEUS_PLATFORM_ROOT: PLATFORM_ROOT,
          ...(opts.env ?? {}),
        },
        stdio: ['ignore', outFd.fd, errFd.fd],
      });
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
      }, opts.timeoutMs ?? 60000);
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ code: code ?? 1 });
      });
      child.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ code: 1, error: String(err) });
      });
    });
    await outFd.close();
    await errFd.close();
    const stdout = await fs.readFile(outFile, 'utf-8');
    const stderr = await fs.readFile(errFile, 'utf-8');
    return { code: result.code, stdout, stderr: stderr + (result.error ? `\n${result.error}` : '') };
  } finally {
    try {
      await fs.unlink(outFile);
    } catch {
      /* ignore */
    }
    try {
      await fs.unlink(errFile);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Minimal assertion helpers. Each emits a one-line PASS: or FAIL: record so
 * the runner can tally them.
 */
export class TestContext {
  constructor(name) {
    this.name = name;
    this.failed = 0;
    this.passed = 0;
    this.skipped = 0;
  }

  pass(label) {
    this.passed += 1;
    process.stdout.write(`PASS: ${this.name} :: ${label}\n`);
  }

  fail(label, detail = '') {
    this.failed += 1;
    const extra = detail ? `\n       ${detail}` : '';
    process.stdout.write(`FAIL: ${this.name} :: ${label}${extra}\n`);
  }

  skip(label, reason = '') {
    this.skipped += 1;
    process.stdout.write(`SKIP: ${this.name} :: ${label}${reason ? ` — ${reason}` : ''}\n`);
  }

  assert(cond, label, detail = '') {
    if (cond) this.pass(label);
    else this.fail(label, detail);
    return cond;
  }

  async assertFileExists(p, label) {
    const ok = await fileExists(p);
    return this.assert(ok, label, ok ? '' : `missing: ${p}`);
  }

  async assertFileAbsent(p, label) {
    const ok = !(await fileExists(p));
    return this.assert(ok, label, ok ? '' : `should be absent: ${p}`);
  }

  /** Exit with the correct code based on tallies. */
  exit() {
    // Runner counts PASS/FAIL/SKIP lines; process exit code only decides
    // whether the FILE itself failed. File-level fail if anything failed.
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

/** Build the minimum env needed to drive `agentic init --non-interactive`. */
export function baseInitEnv(profile) {
  return {
    MORPHEUS_PROFILE: profile,
    MORPHEUS_PROJECT_NAME: 'itest-project',
    MORPHEUS_PROJECT_DESCRIPTION: 'integration-test project',
    MORPHEUS_PRIMARY_OWNER_EMAIL: 'it@example.com',
    MORPHEUS_WORKSPACE: 'workspace-microsoft',
    MORPHEUS_GIT: 'git-github',
    MORPHEUS_PM: 'none',
    MORPHEUS_STACKS: '',
    MORPHEUS_RELEASE_CADENCE: 'weekly',
  };
}
