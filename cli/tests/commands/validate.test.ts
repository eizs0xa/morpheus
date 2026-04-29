import { describe, it, expect, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { validate, runValidateChecks } from '../../src/commands/validate.js';
import type { PlatformManifest } from '../../src/util/manifest.js';
import { loadAllModules, type ModuleMeta } from '../../src/detectors/stack.js';

const PLATFORM_ROOT = path.resolve(__dirname, '..', '..', '..');

const tmpDirs: string[] = [];

async function makeTmp(prefix = 'ws12-validate-'): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}

async function writeFile(p: string, body: string): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body, 'utf-8');
}

function baseManifest(modules: Record<string, string>): PlatformManifest {
  return {
    platform_version: '0.1.0',
    profile: 'builder',
    detected_hardware: { os: 'darwin', arch: 'arm64', shell: 'zsh' },
    project_type: 'fullstack-web',
    modules,
    governance: {
      risk_tier: 1,
      decommission: { status: 'active' },
    },
    initialized_by: 'ada@example.com',
    initialized_at: '2026-04-23T12:00:00Z',
    last_updated_at: '2026-04-23T12:00:00Z',
  };
}

/**
 * Render every file a module contributes into its on-disk location
 * inside the fixture project, optionally filtering skills for non-all
 * profiles.
 */
async function renderModuleContributions(
  module: ModuleMeta,
  projectRoot: string,
  opts: { onlySkills?: string[] | 'all' } = {},
): Promise<void> {
  const contributes = (module.raw.contributes ?? {}) as Record<string, unknown>;
  const typeMap: Record<string, string> = {
    skills: path.join('.agent', 'skills'),
    workflows: path.join('.github', 'workflows'),
    templates: path.join('.agent', 'templates'),
    schemas: path.join('.agent', 'schemas'),
    instructions: path.join('.github', 'instructions'),
    hooks: path.join('.agent', 'hooks'),
  };
  for (const [type, dir] of Object.entries(typeMap)) {
    const list = contributes[type];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== 'string') continue;
      if (type === 'skills' && opts.onlySkills !== undefined && opts.onlySkills !== 'all') {
        const base = path.basename(item).replace(/\.md$/, '');
        const normalized = new Set(
          opts.onlySkills.map((s) => (s.endsWith('-read') ? s.slice(0, -'-read'.length) : s)),
        );
        if (!normalized.has(base)) continue;
      }
      let rel = item;
      const prefix = `${type}/`;
      if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
      if (rel.endsWith('.tmpl')) rel = rel.slice(0, -'.tmpl'.length);
      const dest = path.join(projectRoot, dir, rel);
      if (type === 'schemas') {
        // Copy the real schema so SCHEMA_REFS passes.
        const source = path.join(module.path, item);
        const body = await fs.readFile(source, 'utf-8');
        await writeFile(dest, body);
      } else {
        await writeFile(dest, `# stub for ${item}\n`);
      }
    }
  }
}

async function buildValidFixture(
  moduleSet: string[] = ['core', 'workspace-microsoft', 'git-github'],
  profile: PlatformManifest['profile'] = 'builder',
): Promise<string> {
  const projectRoot = await makeTmp();
  const modules = await loadAllModules(PLATFORM_ROOT);
  const manifestModules: Record<string, string> = {};
  for (const name of moduleSet) {
    const meta = modules.find((m) => m.name === name);
    if (meta === undefined) throw new Error(`Test setup: module ${name} not found on disk`);
    manifestModules[name] = meta.version;
  }
  const manifest: PlatformManifest = { ...baseManifest(manifestModules), profile };

  // Determine skills filter from the real profile spec.
  const profilesRaw = await fs.readFile(
    path.join(PLATFORM_ROOT, 'modules', 'core', 'profiles.yaml'),
    'utf-8',
  );
  const profiles = (YAML.parse(profilesRaw) as { profiles: Record<string, { skills_enabled?: 'all' | string[] }> }).profiles;
  const onlySkills = profiles[profile]?.skills_enabled;

  for (const name of moduleSet) {
    const meta = modules.find((m) => m.name === name)!;
    await renderModuleContributions(meta, projectRoot, { onlySkills });
  }
  // Write manifest
  await writeFile(
    path.join(projectRoot, '.agent', 'platform-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return projectRoot;
}

let prevEnv: string | undefined;
beforeEach(() => {
  prevEnv = process.env.MORPHEUS_PLATFORM_ROOT;
  process.env.MORPHEUS_PLATFORM_ROOT = PLATFORM_ROOT;
});
afterEach(() => {
  if (prevEnv === undefined) delete process.env.MORPHEUS_PLATFORM_ROOT;
  else process.env.MORPHEUS_PLATFORM_ROOT = prevEnv;
});

afterAll(async () => {
  for (const d of tmpDirs) await fs.rm(d, { recursive: true, force: true });
});

describe('validate', () => {
  it('V1: happy path on a fully rendered fixture', async () => {
    const projectRoot = await buildValidFixture();
    const { report } = await runValidateChecks(projectRoot);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('V2: missing manifest reports MANIFEST_MISSING', async () => {
    const projectRoot = await makeTmp();
    const { report } = await runValidateChecks(projectRoot);
    expect(report.ok).toBe(false);
    expect(report.errors.map((e) => e.code)).toContain('MANIFEST_MISSING');
  });

  it('V3: corrupt manifest JSON reports MANIFEST_INVALID', async () => {
    const projectRoot = await makeTmp();
    await writeFile(path.join(projectRoot, '.agent', 'platform-manifest.json'), '{ not valid json');
    const { report } = await runValidateChecks(projectRoot);
    expect(report.ok).toBe(false);
    expect(report.errors.map((e) => e.code)).toContain('MANIFEST_INVALID');
  });

  it('V4: a removed contributed file reports MODULE_FILE_MISSING with its path', async () => {
    const projectRoot = await buildValidFixture();
    const skill = path.join(projectRoot, '.agent', 'skills', 'spec-author.md');
    await fs.rm(skill);
    const { report } = await runValidateChecks(projectRoot);
    expect(report.ok).toBe(false);
    const missing = report.errors.find((e) => e.code === 'MODULE_FILE_MISSING' && e.path === skill);
    expect(missing).toBeDefined();
  });

  it('V5: two workspaces in the manifest reports COMPOSITION_VIOLATION', async () => {
    const projectRoot = await buildValidFixture();
    // Mutate the manifest to also reference workspace-google.
    const mpath = path.join(projectRoot, '.agent', 'platform-manifest.json');
    const raw = await fs.readFile(mpath, 'utf-8');
    const parsed = JSON.parse(raw) as PlatformManifest;
    parsed.modules['workspace-google'] = '0.1.0';
    await fs.writeFile(mpath, JSON.stringify(parsed, null, 2), 'utf-8');
    // Render workspace-google's minimal contributions too so the ONLY
    // error is the composition violation.
    const modules = await loadAllModules(PLATFORM_ROOT);
    const gws = modules.find((m) => m.name === 'workspace-google');
    if (gws !== undefined) {
      await renderModuleContributions(gws, projectRoot, { onlySkills: 'all' });
    }
    const { report } = await runValidateChecks(projectRoot);
    expect(report.ok).toBe(false);
    expect(report.errors.map((e) => e.code)).toContain('COMPOSITION_VIOLATION');
  });

  it('V6: profile=author only needs author-scoped skills present', async () => {
    // Author profile installs only core + workspace + pm (no stacks, no git).
    // Since composition requires a git module, we need to include one in
    // the manifest — but the test spec says "author-scoped files present"
    // should pass. Author is actually expected to have some git in real
    // setups; we use workspace-microsoft + git-github + pm-jira and a
    // profile of `author` and confirm the skill filter applied.
    const projectRoot = await buildValidFixture(
      ['core', 'workspace-microsoft', 'git-github', 'pm-jira'],
      'author',
    );
    const { report } = await runValidateChecks(projectRoot);
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('validate() surfaces MANIFEST_MISSING and returns ok=false when exitOnCompletion=false', async () => {
    const projectRoot = await makeTmp();
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const report = await validate({ projectRoot, exitOnCompletion: false, json: true });
    writeSpy.mockRestore();
    expect(report.ok).toBe(false);
    expect(report.errors.map((e) => e.code)).toContain('MANIFEST_MISSING');
  });
});
