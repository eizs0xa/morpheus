/**
 * validate-doctor.test.mjs
 *
 * Scaffolds a minimal valid project via the validate test harness (not
 * copier) so this file can run even without copier installed. Exercises:
 *   - `validate --json` returns structured output
 *   - Deleting a required skill → MODULE_FILE_MISSING
 *   - Corrupting the manifest → MANIFEST_INVALID
 *   - `doctor --skip-external --json` emits valid JSON
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  TestContext,
  PLATFORM_ROOT,
  cliIsBuilt,
  fileExists,
  makeTmp,
  runCli,
} from '../helpers.mjs';

const t = new TestContext('validate-doctor');

// -----------------------------------------------------------------------
// Build a minimal valid project tree on disk without copier.
// We mirror what validate expects: .agent/skills/<all contribs> etc.
// -----------------------------------------------------------------------

async function readYaml(p) {
  // Tiny YAML reader for the narrow cases we need: list under `contributes.skills`.
  const body = await fs.readFile(p, 'utf-8');
  return body;
}

async function loadModuleContribs(modulePath) {
  const yaml = await readYaml(path.join(modulePath, 'module.yaml'));
  const result = { skills: [], schemas: [], workflows: [], templates: [], instructions: [], hooks: [] };
  const sectionRe = /^([a-z_]+):\s*$/;
  let section = null;
  let inContributes = false;
  for (const line of yaml.split('\n')) {
    if (/^contributes:\s*$/.test(line)) {
      inContributes = true;
      continue;
    }
    if (inContributes && /^[a-z_]+:/.test(line) && !line.startsWith('  ')) {
      inContributes = false;
    }
    if (!inContributes) continue;
    const m = line.match(/^\s{2}([a-z_]+):/);
    if (m) {
      section = m[1];
      continue;
    }
    const item = line.match(/^\s{4}-\s*(\S+)\s*$/);
    if (item && section && result[section] !== undefined) {
      result[section].push(item[1]);
    }
  }
  return result;
}

const TYPE_DIR = {
  skills: path.join('.agent', 'skills'),
  workflows: path.join('.github', 'workflows'),
  templates: path.join('.agent', 'templates'),
  schemas: path.join('.agent', 'schemas'),
  instructions: path.join('.github', 'instructions'),
  hooks: path.join('.agent', 'hooks'),
};

async function renderContribs(modulePath, projectRoot, skillFilter) {
  const c = await loadModuleContribs(modulePath);
  for (const [type, list] of Object.entries(c)) {
    const dir = TYPE_DIR[type];
    if (!dir) continue;
    for (const item of list) {
      if (type === 'skills' && skillFilter && !skillFilter(item)) continue;
      let rel = item;
      const prefix = `${type}/`;
      if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
      if (rel.endsWith('.tmpl')) rel = rel.slice(0, -'.tmpl'.length);
      const dest = path.join(projectRoot, dir, rel);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      if (type === 'schemas') {
        // Copy real schema so SCHEMA_REFS passes.
        const src = path.join(modulePath, item);
        const body = await fs.readFile(src, 'utf-8');
        await fs.writeFile(dest, body);
      } else {
        await fs.writeFile(dest, `# stub for ${item}\n`);
      }
    }
  }
}

async function buildFixture({ profile = 'builder' } = {}) {
  const project = await makeTmp('morpheus-vd-');
  const modulesDir = path.join(PLATFORM_ROOT, 'modules');
  const core = path.join(modulesDir, 'core');
  const workspace = path.join(modulesDir, 'workspaces', 'workspace-microsoft');
  const git = path.join(modulesDir, 'integrations', 'git-github');

  // Builder profile → all skills. For simplicity we always render all
  // contributions here.
  await renderContribs(core, project);
  await renderContribs(workspace, project);
  await renderContribs(git, project);

  const manifest = {
    platform_version: '0.1.0',
    profile,
    detected_hardware: { os: 'linux', arch: 'x64' },
    project_type: 'new-empty',
    modules: {
      core: '0.1.0',
      'workspace-microsoft': '0.1.0',
      'git-github': '0.1.0',
    },
    initialized_by: 'it@example.com',
    initialized_at: '2026-04-23T00:00:00Z',
    last_updated_at: '2026-04-23T00:00:00Z',
  };
  const manifestPath = path.join(project, '.agent', 'platform-manifest.json');
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  // Provide a constitution — doctor wants it.
  await fs.writeFile(path.join(project, '.agent', 'constitution.md'), '# constitution\n');
  return { project, manifestPath };
}

async function readManifestVersions(project) {
  const body = await fs.readFile(
    path.join(project, '.agent', 'platform-manifest.json'),
    'utf-8',
  );
  const m = JSON.parse(body);
  return { platform_version: m.platform_version, modules: m.modules };
}

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

async function prechecks() {
  if (!(await cliIsBuilt())) {
    t.skip('prereq', 'cli/dist/index.js not built');
    return false;
  }
  return true;
}

async function test_validate_happy() {
  const { project } = await buildFixture();
  const r = await runCli(['validate', '--json'], { cwd: project, timeoutMs: 15000 });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    /* ignore */
  }
  t.assert(parsed !== null, 'validate happy: JSON parses');
  if (parsed) {
    t.assert(
      parsed.ok === true,
      'validate happy: ok === true',
      `errors=${JSON.stringify(parsed.errors)}`,
    );
    t.assert(r.code === 0, 'validate happy: exit 0', `code=${r.code}`);
  }
}

async function test_validate_missing_skill() {
  const { project } = await buildFixture();
  const victim = path.join(project, '.agent', 'skills', 'spec-author.md');
  await fs.rm(victim);
  const r = await runCli(['validate', '--json'], { cwd: project, timeoutMs: 15000 });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    /* ignore */
  }
  t.assert(parsed !== null, 'validate missing-skill: JSON parses');
  if (parsed) {
    const codes = (parsed.errors ?? []).map((e) => e.code);
    t.assert(
      codes.includes('MODULE_FILE_MISSING'),
      'validate missing-skill: MODULE_FILE_MISSING reported',
      `codes=${codes.join(',')}`,
    );
    t.assert(r.code === 2, 'validate missing-skill: exit 2', `code=${r.code}`);
  }
}

async function test_validate_corrupt_manifest() {
  const { project, manifestPath } = await buildFixture();
  await fs.writeFile(manifestPath, '{ not valid json', 'utf-8');
  const r = await runCli(['validate', '--json'], { cwd: project, timeoutMs: 15000 });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    /* ignore */
  }
  t.assert(parsed !== null, 'validate corrupt: JSON parses');
  if (parsed) {
    const codes = (parsed.errors ?? []).map((e) => e.code);
    t.assert(
      codes.includes('MANIFEST_INVALID'),
      'validate corrupt: MANIFEST_INVALID reported',
      `codes=${codes.join(',')}`,
    );
  }
}

async function test_doctor_json() {
  const { project } = await buildFixture();
  const r = await runCli(['doctor', '--skip-external', '--json'], {
    cwd: project,
    timeoutMs: 15000,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    /* ignore */
  }
  t.assert(parsed !== null, 'doctor --skip-external --json: JSON parses');
  if (parsed) {
    t.assert(
      'ok' in parsed && Array.isArray(parsed.errors) && Array.isArray(parsed.warnings),
      'doctor: shape { ok, errors[], warnings[] }',
    );
  }
}

async function test_manifest_version_pinning() {
  const { project } = await buildFixture();
  const v = await readManifestVersions(project);
  t.assert(v.platform_version === '0.1.0', 'manifest: platform_version = 0.1.0');
  t.assert(v.modules.core === '0.1.0', 'manifest: core pinned to 0.1.0');
}

async function main() {
  if (!(await prechecks())) {
    t.exit();
    return;
  }
  await test_validate_happy();
  await test_validate_missing_skill();
  await test_validate_corrupt_manifest();
  await test_doctor_json();
  await test_manifest_version_pinning();
  t.exit();
}

main().catch((err) => {
  process.stderr.write(`validate-doctor.test crashed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
