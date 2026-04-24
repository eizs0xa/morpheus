import { describe, it, expect, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  readManifest,
  writeManifest,
  validateManifest,
  ensureValidatorLoaded,
  type PlatformManifest,
} from '../../src/util/manifest.js';
import { ManifestError } from '../../src/util/errors.js';

const VALID: PlatformManifest = {
  platform_version: '0.1.0',
  profile: 'builder',
  detected_hardware: { os: 'darwin', arch: 'arm64', shell: 'zsh' },
  project_type: 'fullstack-web',
  modules: {
    core: '0.1.0',
    'stack-node': '0.1.0',
    'workspace-microsoft': '0.1.0',
    'git-github': '0.1.0',
  },
  initialized_by: 'ada@example.com',
  initialized_at: '2026-04-23T12:00:00Z',
  last_updated_at: '2026-04-23T12:00:00Z',
};

const tmpDirs: string[] = [];

async function makeTmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ws10-manifest-'));
  tmpDirs.push(dir);
  return dir;
}

afterAll(async () => {
  for (const d of tmpDirs) await fs.rm(d, { recursive: true, force: true });
});

describe('manifest round-trip', () => {
  it('writes then reads a valid manifest', async () => {
    const dir = await makeTmp();
    await writeManifest(dir, VALID);
    const round = await readManifest(dir);
    expect(round).toEqual(VALID);
  });

  it('readManifest returns null when no manifest exists', async () => {
    const dir = await makeTmp();
    expect(await readManifest(dir)).toBeNull();
  });

  it('reports clear errors for an invalid manifest', async () => {
    const dir = await makeTmp();
    const corrupt = { ...VALID, profile: 'not-a-profile' };
    await fs.writeFile(path.join(dir, 'platform-manifest.json'), JSON.stringify(corrupt), 'utf-8');
    await expect(readManifest(dir)).rejects.toBeInstanceOf(ManifestError);
  });

  it('validateManifest flags a missing required field', async () => {
    await ensureValidatorLoaded();
    const missing = { ...VALID } as unknown as Record<string, unknown>;
    delete missing.profile;
    const result = validateManifest(missing);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/profile/);
  });

  it('refuses to write an invalid manifest', async () => {
    const dir = await makeTmp();
    const bad = { ...VALID, platform_version: 'not-a-semver' } as PlatformManifest;
    await expect(writeManifest(dir, bad)).rejects.toBeInstanceOf(ManifestError);
  });
});
