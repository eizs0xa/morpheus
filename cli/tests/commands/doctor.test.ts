import { describe, it, expect, afterAll, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { doctor } from '../../src/commands/doctor.js';
import type { PlatformManifest } from '../../src/util/manifest.js';
import { loadAllModules, type ModuleMeta } from '../../src/detectors/stack.js';

const PLATFORM_ROOT = path.resolve(__dirname, '..', '..', '..');

const tmpDirs: string[] = [];

async function makeTmp(prefix = 'ws12-doctor-'): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}

async function writeFile(p: string, body: string): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body, 'utf-8');
}

async function renderModuleContributions(
  module: ModuleMeta,
  projectRoot: string,
  onlySkills: string[] | 'all',
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
      if (type === 'skills' && onlySkills !== 'all') {
        const base = path.basename(item).replace(/\.md$/, '');
        const normalized = new Set(
          onlySkills.map((s) => (s.endsWith('-read') ? s.slice(0, -'-read'.length) : s)),
        );
        if (!normalized.has(base)) continue;
      }
      let rel = item;
      const prefix = `${type}/`;
      if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
      if (rel.endsWith('.tmpl')) rel = rel.slice(0, -'.tmpl'.length);
      const dest = path.join(projectRoot, dir, rel);
      if (type === 'schemas') {
        const source = path.join(module.path, item);
        const body = await fs.readFile(source, 'utf-8');
        await writeFile(dest, body);
      } else {
        await writeFile(dest, `# stub for ${item}\n`);
      }
    }
  }
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

async function buildFixture(
  moduleSet: string[] = ['core', 'workspace-microsoft', 'git-github', 'pm-jira'],
  profile: PlatformManifest['profile'] = 'builder',
): Promise<{ projectRoot: string; manifest: PlatformManifest; manifestPath: string }> {
  const projectRoot = await makeTmp();
  const modules = await loadAllModules(PLATFORM_ROOT);
  const manifestModules: Record<string, string> = {};
  for (const name of moduleSet) {
    const meta = modules.find((m) => m.name === name)!;
    manifestModules[name] = meta.version;
  }
  const manifest: PlatformManifest = { ...baseManifest(manifestModules), profile };
  const profilesRaw = await fs.readFile(
    path.join(PLATFORM_ROOT, 'modules', 'core', 'profiles.yaml'),
    'utf-8',
  );
  const profiles = (
    YAML.parse(profilesRaw) as {
      profiles: Record<string, { skills_enabled?: 'all' | string[] }>;
    }
  ).profiles;
  const skillsEnabled = profiles[profile]?.skills_enabled ?? 'all';

  for (const name of moduleSet) {
    const meta = modules.find((m) => m.name === name)!;
    await renderModuleContributions(meta, projectRoot, skillsEnabled);
  }

  // .agent/constitution.md + fake .git dir so CONSTITUTION_PRESENT and
  // GIT_SANE pass cleanly.
  await writeFile(path.join(projectRoot, '.agent', 'constitution.md'), '# Constitution\n');
  await writeFile(path.join(projectRoot, '.git', 'HEAD'), 'ref: refs/heads/feature/ws12\n');
  // Realistic CODEOWNERS with real handle.
  await writeFile(path.join(projectRoot, 'CODEOWNERS'), '* @ada-owner @example-org/platform\n');
  const manifestPath = path.join(projectRoot, '.agent', 'platform-manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { projectRoot, manifest, manifestPath };
}

async function rewriteManifest(manifestPath: string, mutate: (m: PlatformManifest) => void): Promise<void> {
  const raw = await fs.readFile(manifestPath, 'utf-8');
  const parsed = JSON.parse(raw) as PlatformManifest;
  mutate(parsed);
  await fs.writeFile(manifestPath, JSON.stringify(parsed, null, 2), 'utf-8');
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

// Shared options to silence stdout and suppress exit.
async function runDoctor(projectRoot: string, opts: { skipExternal?: boolean } = {}): ReturnType<typeof doctor> {
  const originalWrite = process.stdout.write.bind(process.stdout);
  (process.stdout.write as unknown) = () => true;
  try {
    return await doctor({
      projectRoot,
      exitOnCompletion: false,
      json: true,
      skipExternal: opts.skipExternal,
    });
  } finally {
    (process.stdout.write as unknown) = originalWrite;
  }
}

describe('doctor', () => {
  it('D1: happy path fixture produces no errors', async () => {
    const { projectRoot } = await buildFixture();
    const report = await runDoctor(projectRoot);
    expect(report.errors).toEqual([]);
    // Warnings may be zero or near-zero; we only assert no errors.
    expect(report.ok).toBe(true);
  });

  it('D2: stale module version surfaces STALE_MODULE_VERSIONS', async () => {
    const { projectRoot, manifestPath } = await buildFixture();
    await rewriteManifest(manifestPath, (m) => {
      m.modules['core'] = '0.0.5';
    });
    const report = await runDoctor(projectRoot);
    expect(report.warnings.map((w) => w.code)).toContain('STALE_MODULE_VERSIONS');
  });

  it('D3: orphaned platform workflow surfaces ORPHANED_WORKFLOWS', async () => {
    const { projectRoot } = await buildFixture();
    await writeFile(
      path.join(projectRoot, '.github', 'workflows', 'morpheus-ghost.yml'),
      'name: ghost\n',
    );
    const report = await runDoctor(projectRoot);
    expect(report.warnings.map((w) => w.code)).toContain('ORPHANED_WORKFLOWS');
  });

  it('D4: placeholder CODEOWNERS surfaces CODEOWNERS_UNCONFIGURED', async () => {
    const { projectRoot } = await buildFixture();
    await fs.writeFile(
      path.join(projectRoot, 'CODEOWNERS'),
      '* @platform-team\n',
      'utf-8',
    );
    const report = await runDoctor(projectRoot);
    expect(report.warnings.map((w) => w.code)).toContain('CODEOWNERS_UNCONFIGURED');
  });

  it('D5: --skipExternal suppresses the Jira check', async () => {
    const { projectRoot } = await buildFixture();
    // pm-jira is installed in the fixture but the manifest carries no
    // jira_site_url, so JIRA_UNREACHABLE is expected to warn by default.
    const withCheck = await runDoctor(projectRoot, { skipExternal: false });
    expect(withCheck.warnings.map((w) => w.code)).toContain('JIRA_UNREACHABLE');

    const skipped = await runDoctor(projectRoot, { skipExternal: true });
    expect(skipped.warnings.map((w) => w.code)).not.toContain('JIRA_UNREACHABLE');
  });
});
