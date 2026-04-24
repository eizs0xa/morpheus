/**
 * WS-11 integration tests for `agentic init`.
 *
 * We mock `renderTemplate` so tests don't depend on a host `copier` install.
 * When `copier` is missing on the host, the render-dependent tests still run
 * against the mock — the real binary is exercised only by the smoke test
 * documented in the workstream prompt.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';

import { readManifest, ensureValidatorLoaded } from '../../src/util/manifest.js';
import { ComposeError, ValidationError } from '../../src/util/errors.js';

// Mock the copier-backed renderer so every test path is hermetic.
vi.mock('../../src/composers/file-renderer.js', () => {
  return {
    renderTemplate: vi.fn(async (input: { targetPath: string }) => {
      // Simulate copier writing a couple of representative files. Tests that
      // care about real template output live in the smoke script.
      const targetPath = input.targetPath;
      const ghDir = path.join(targetPath, '.github', 'workflows');
      await fs.mkdir(ghDir, { recursive: true });
      await fs.writeFile(
        path.join(ghDir, 'morpheus-ci.yml'),
        'name: morpheus-ci\n',
        'utf-8',
      );
      const agentDir = path.join(targetPath, '.agent');
      await fs.mkdir(agentDir, { recursive: true });
      await fs.writeFile(
        path.join(agentDir, 'MANIFEST_STUB.md'),
        '# stub rendered by test\n',
        'utf-8',
      );
      return { filesWritten: [] };
    }),
  };
});

// Import *after* the mock so the command picks up the stub.
const { init } = await import('../../src/commands/init.js');

const tmpDirs: string[] = [];

async function makeTmp(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `ws11-${prefix}-`));
  tmpDirs.push(dir);
  return dir;
}

/** Minimal environment preparation for --non-interactive runs. */
function setEnv(vars: Record<string, string | undefined>): () => void {
  const prior: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prior[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(prior)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
}

const NON_INTERACTIVE_ENV: Record<string, string | undefined> = {
  MORPHEUS_PROFILE: undefined,
  MORPHEUS_STACKS: undefined,
  MORPHEUS_WORKSPACE: undefined,
  MORPHEUS_PM: undefined,
  MORPHEUS_GIT: undefined,
  MORPHEUS_PROJECT_NAME: undefined,
  MORPHEUS_PRIMARY_OWNER_EMAIL: undefined,
  MORPHEUS_JIRA_PROJECT_KEY: undefined,
  MORPHEUS_JIRA_SITE_URL: undefined,
};

let restoreEnv: (() => void) | null = null;

beforeEach(async () => {
  await ensureValidatorLoaded();
  // Start every test with a clean MORPHEUS_* slate so they don't leak.
  restoreEnv = setEnv(NON_INTERACTIVE_ENV);
});

afterEach(() => {
  if (restoreEnv !== null) {
    restoreEnv();
    restoreEnv = null;
  }
});

afterAll(async () => {
  for (const d of tmpDirs) await fs.rm(d, { recursive: true, force: true });
});

describe('agentic init — WS-11', () => {
  it('T1: new empty dir, builder, non-interactive with answersFile writes a valid manifest', async () => {
    const root = await makeTmp('new');
    const answersPath = path.join(root, 'answers.yml');
    await fs.writeFile(
      answersPath,
      YAML.stringify({
        profile: 'builder',
        stacks: ['stack-node', 'stack-react'],
        workspace: 'workspace-microsoft',
        pm: 'pm-jira',
        git: 'git-github',
        project_name: 't1-new',
        primary_owner_email: 't1@example.com',
        jira_project_key: 'T1',
        jira_site_url: 'example.atlassian.net',
      }),
      'utf-8',
    );

    await init({
      projectRoot: root,
      nonInteractive: true,
      answersFile: answersPath,
    });

    const manifest = await readManifest(root);
    expect(manifest).not.toBeNull();
    expect(manifest!.profile).toBe('builder');
    expect(manifest!.initialized_by).toBe('t1@example.com');
    expect(Object.keys(manifest!.modules)).toEqual(
      expect.arrayContaining([
        'core',
        'stack-node',
        'stack-react',
        'workspace-microsoft',
        'git-github',
        'pm-jira',
      ]),
    );
    // Mock renderer should have produced the workflow stub.
    const wf = await fs.readFile(
      path.join(root, '.github', 'workflows', 'morpheus-ci.yml'),
      'utf-8',
    );
    expect(wf).toContain('morpheus-ci');
  });

  it('T2: brownfield leaves existing files untouched and writes manifest', async () => {
    const fixtureRoot = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'templates',
      'brownfield-overlay',
      'tests',
      'fixture-existing-repo',
    );
    const root = await makeTmp('brownfield');

    // Copy fixture recursively into the tmp dir.
    await fs.cp(fixtureRoot, root, { recursive: true });
    // Mark as a git repo so mode-detect classifies as 'brownfield'.
    await fs.mkdir(path.join(root, '.git'), { recursive: true });

    const originalMain = await fs.readFile(path.join(root, 'src', 'main.py'), 'utf-8');
    const originalPkg = await fs.readFile(path.join(root, 'package.json'), 'utf-8');
    const originalClaude = await fs.readFile(path.join(root, 'CLAUDE.md'), 'utf-8');

    await init({
      projectRoot: root,
      profile: 'builder',
      nonInteractive: true,
    });

    // Existing source files must be untouched.
    expect(await fs.readFile(path.join(root, 'src', 'main.py'), 'utf-8')).toBe(
      originalMain,
    );
    expect(await fs.readFile(path.join(root, 'package.json'), 'utf-8')).toBe(
      originalPkg,
    );
    expect(await fs.readFile(path.join(root, 'CLAUDE.md'), 'utf-8')).toBe(
      originalClaude,
    );

    const manifest = await readManifest(root);
    expect(manifest).not.toBeNull();
    expect(manifest!.profile).toBe('builder');
  });

  it('T3: already-initialized refuses without --resume', async () => {
    const root = await makeTmp('already');
    // Pre-seed a valid manifest.
    const seeded = {
      platform_version: '0.1.0',
      profile: 'builder',
      detected_hardware: { os: 'darwin', arch: 'arm64', shell: 'zsh' },
      project_type: 'new-empty',
      modules: { core: '0.1.0' },
      initialized_by: 'seed@example.com',
      initialized_at: '2026-01-01T00:00:00Z',
      last_updated_at: '2026-01-01T00:00:00Z',
    };
    await fs.writeFile(
      path.join(root, 'platform-manifest.json'),
      JSON.stringify(seeded, null, 2),
      'utf-8',
    );
    // Mark as a git repo for completeness.
    await fs.mkdir(path.join(root, '.git'), { recursive: true });

    await expect(
      init({ projectRoot: root, nonInteractive: true, profile: 'builder' }),
    ).rejects.toMatchObject({
      code: 'E_VALIDATION',
      remediation: expect.stringMatching(/--resume/),
    });
  });

  it('T4: --resume upgrades profile and preserves initialized_at', async () => {
    const root = await makeTmp('resume');
    const seeded = {
      platform_version: '0.1.0',
      profile: 'builder',
      detected_hardware: { os: 'darwin', arch: 'arm64', shell: 'zsh' },
      project_type: 'new-empty',
      modules: { core: '0.1.0' },
      initialized_by: 'seed@example.com',
      initialized_at: '2024-07-04T00:00:00Z',
      last_updated_at: '2024-07-04T00:00:00Z',
    };
    await fs.writeFile(
      path.join(root, 'platform-manifest.json'),
      JSON.stringify(seeded, null, 2),
      'utf-8',
    );
    await fs.mkdir(path.join(root, '.git'), { recursive: true });

    await init({
      projectRoot: root,
      nonInteractive: true,
      resume: true,
      profile: 'steward',
    });

    const manifest = await readManifest(root);
    expect(manifest).not.toBeNull();
    expect(manifest!.profile).toBe('steward');
    expect(manifest!.initialized_at).toBe('2024-07-04T00:00:00Z');
    expect(manifest!.initialized_by).toBe('seed@example.com');
    expect(manifest!.last_updated_at).not.toBe('2024-07-04T00:00:00Z');
  });

  it('T5: ComposeError surfaces cleanly when git provider is missing', async () => {
    const root = await makeTmp('compose');
    // Clearing MORPHEUS_GIT and pointing at an empty string forces
    // resolveModules to fail with "exactly one git provider required".
    const answersPath = path.join(root, 'answers.yml');
    await fs.writeFile(
      answersPath,
      YAML.stringify({
        profile: 'builder',
        stacks: [],
        workspace: 'workspace-microsoft',
        pm: 'none',
        git: '',
        project_name: 't5',
        primary_owner_email: 't5@example.com',
      }),
      'utf-8',
    );

    await expect(
      init({
        projectRoot: root,
        nonInteractive: true,
        answersFile: answersPath,
      }),
    ).rejects.toBeInstanceOf(ComposeError);
  });

  it('validates profile strings passed via env', async () => {
    const root = await makeTmp('bad-profile');
    const restore = setEnv({ MORPHEUS_PROFILE: 'not-a-profile' });
    try {
      await expect(
        init({ projectRoot: root, nonInteractive: true }),
      ).rejects.toBeInstanceOf(ValidationError);
    } finally {
      restore();
    }
  });
});
