/**
 * Unit tests for `update` command.
 *
 * All external side-effects (git, pnpm, init) are mocked so tests are
 * hermetic and don't require a network or a real Morpheus checkout.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ValidationError } from '../../src/util/errors.js';

// ---- mocks (declared before dynamic import) --------------------------------

vi.mock('../../src/commands/_init/platform-root.js', () => ({
  resolvePlatformRoot: vi.fn(async () => '/fake/platform'),
}));

const mockExeca = vi.fn();
vi.mock('execa', () => ({
  execa: (...args: unknown[]) => mockExeca(...args),
}));

const mockInit = vi.fn(async () => undefined);
vi.mock('../../src/commands/init.js', () => ({
  init: (...args: unknown[]) => mockInit(...args),
}));

// Import after mocks
const { update } = await import('../../src/commands/update.js');

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default execa behaviour: succeed silently
  mockExeca.mockImplementation(async (cmd: string, args: string[]) => {
    // pnpm --version → return version string
    if (cmd === 'pnpm' && args[0] === '--version') return { stdout: '10.0.0' };
    // git -C <root> rev-parse --abbrev-ref HEAD
    if (cmd === 'git' && args.includes('rev-parse')) return { stdout: 'main' };
    // git -C <root> status --porcelain → clean
    if (cmd === 'git' && args.includes('--porcelain')) return { stdout: '' };
    // git -C <root> pull
    if (cmd === 'git' && args.includes('pull')) return { stdout: 'Already up to date.' };
    // pnpm install / build
    return { stdout: '', stderr: '' };
  });
});

describe('update command', () => {
  it('--skip-pull --skip-build --skip-overlay completes without calling git, pnpm, or init', async () => {
    await update({ skipPull: true, skipBuild: true, skipOverlay: true });

    expect(mockExeca).not.toHaveBeenCalled();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('full run calls git pull, pnpm install, pnpm build, and init --resume', async () => {
    await update({ projectRoot: os.tmpdir() });

    const execaCalls = mockExeca.mock.calls.map((c: unknown[]) => `${c[0]} ${(c[1] as string[]).join(' ')}`);

    expect(execaCalls.some((c: string) => c.includes('git') && c.includes('pull'))).toBe(true);
    expect(execaCalls.some((c: string) => c.includes('pnpm') && c.includes('install'))).toBe(true);
    expect(execaCalls.some((c: string) => c.includes('pnpm') && c.includes('build'))).toBe(true);
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ resume: true, nonInteractive: true }),
    );
  });

  it('throws ValidationError when platform root has uncommitted changes', async () => {
    mockExeca.mockImplementation(async (cmd: string, args: string[]) => {
      if (cmd === 'git' && args.includes('rev-parse')) return { stdout: 'main' };
      if (cmd === 'git' && args.includes('--porcelain')) return { stdout: ' M some-file.ts\n' };
      return { stdout: '' };
    });

    await expect(update({})).rejects.toMatchObject({
      code: 'E_VALIDATION',
      message: expect.stringContaining('uncommitted local changes'),
    });
  });

  it('throws ValidationError when git pull fails', async () => {
    mockExeca.mockImplementation(async (cmd: string, args: string[]) => {
      if (cmd === 'git' && args.includes('rev-parse')) return { stdout: 'main' };
      if (cmd === 'git' && args.includes('--porcelain')) return { stdout: '' };
      if (cmd === 'git' && args.includes('pull')) {
        const err = new Error('diverged') as Error & { stderr: string };
        err.stderr = 'fatal: not possible to fast-forward';
        throw err;
      }
      return { stdout: '' };
    });

    await expect(update({})).rejects.toMatchObject({
      code: 'E_VALIDATION',
      message: expect.stringContaining('git pull failed'),
    });
  });

  it('throws ValidationError when project is not yet initialized and skipOverlay is false', async () => {
    mockInit.mockRejectedValueOnce(
      new ValidationError('platform-manifest.json missing', 'Run morpheus invoke first.'),
    );

    await expect(update({ skipPull: true, skipBuild: true })).rejects.toMatchObject({
      code: 'E_VALIDATION',
      message: expect.stringContaining('not been initialized'),
    });
  });

  it('--skip-pull skips git calls but still rebuilds and re-overlays', async () => {
    await update({ skipPull: true, projectRoot: os.tmpdir() });

    const execaCalls = mockExeca.mock.calls.map((c: unknown[]) => `${c[0]} ${(c[1] as string[]).join(' ')}`);
    expect(execaCalls.some((c: string) => c.includes('git') && c.includes('pull'))).toBe(false);
    expect(execaCalls.some((c: string) => c.includes('pnpm') && c.includes('build'))).toBe(true);
    expect(mockInit).toHaveBeenCalled();
  });

  it('falls back to npm when pnpm is unavailable', async () => {
    mockExeca.mockImplementation(async (cmd: string, args: string[]) => {
      if (cmd === 'pnpm' && args[0] === '--version') throw new Error('not found');
      if (cmd === 'git' && args.includes('rev-parse')) return { stdout: 'main' };
      if (cmd === 'git' && args.includes('--porcelain')) return { stdout: '' };
      if (cmd === 'git' && args.includes('pull')) return { stdout: 'Already up to date.' };
      return { stdout: '' };
    });

    await update({ projectRoot: os.tmpdir() });

    const execaCalls = mockExeca.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(execaCalls).toContain('npm');
  });
});
