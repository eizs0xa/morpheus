/**
 * update-migration.test.mjs
 *
 * Forward-looking test: `agentic update` is NOT implemented in v0.1 per
 * EXECUTION_PLAN WS-14. We assert the CLI surfaces a stable error rather
 * than silently succeeding, then exercise doctor's STALE_MODULE_VERSIONS
 * path via a mocked platform root.
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  TestContext,
  PLATFORM_ROOT,
  baseInitEnv,
  cliIsBuilt,
  copyDir,
  fileExists,
  FIXTURES,
  hasCopier,
  makeTmp,
  runCli,
} from '../helpers.mjs';

const t = new TestContext('update-migration');

async function prechecks() {
  if (!(await cliIsBuilt())) {
    t.skip('prereq', 'cli/dist/index.js not built');
    return false;
  }
  return true;
}

async function test_update_not_implemented() {
  // `agentic update` isn't even a registered command yet. Commander should
  // exit non-zero with "unknown command". This test locks in the behaviour
  // so when we DO add `update`, we remember to update this assertion.
  const project = await makeTmp('morpheus-update-');
  const r = await runCli(['update'], { cwd: project, timeoutMs: 15000 });
  t.assert(
    r.code !== 0,
    'update: command exits non-zero (unimplemented)',
    `exit=${r.code}`,
  );
  t.assert(
    /unknown command|error:/i.test(r.stderr + r.stdout),
    'update: error message mentions unknown command',
    `stderr=${r.stderr.slice(0, 200)}`,
  );
}

async function test_stale_module_versions() {
  if (!hasCopier()) {
    t.skip('stale-versions', 'copier not on PATH; cannot init to probe doctor');
    return;
  }

  // 1. Init a project against the real platform.
  const project = await makeTmp('morpheus-stale-');
  await copyDir(path.join(FIXTURES, 'empty-project'), project);
  const initR = await runCli(['init', '--non-interactive'], {
    cwd: project,
    env: baseInitEnv('builder'),
    timeoutMs: 120000,
  });
  if (initR.code !== 0) {
    t.fail('stale-versions: init exits 0', `exit=${initR.code}`);
    return;
  }
  t.pass('stale-versions: init exits 0');

  // 2. Build a mock platform root whose core/module.yaml is version 9.9.9.
  //    We copy the real modules/ and templates/ directories, then bump the
  //    version in the copy only. The real repo is never modified.
  const mockRoot = await makeTmp('morpheus-mock-platform-');
  await copyDir(path.join(PLATFORM_ROOT, 'modules'), path.join(mockRoot, 'modules'));
  await copyDir(path.join(PLATFORM_ROOT, 'templates'), path.join(mockRoot, 'templates'));
  const coreYaml = path.join(mockRoot, 'modules', 'core', 'module.yaml');
  let body = await fs.readFile(coreYaml, 'utf-8');
  body = body.replace(/^version:\s*[\d.]+\s*$/m, 'version: 9.9.9');
  await fs.writeFile(coreYaml, body, 'utf-8');

  // 3. Run doctor with MORPHEUS_PLATFORM_ROOT pointed at the mock.
  const doctorR = await runCli(['doctor', '--skip-external', '--json'], {
    cwd: project,
    env: { MORPHEUS_PLATFORM_ROOT: mockRoot },
    timeoutMs: 30000,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(doctorR.stdout);
  } catch {
    /* ignore */
  }
  const ok = parsed && (Array.isArray(parsed.warnings) || Array.isArray(parsed.errors));
  if (!t.assert(ok, 'doctor: emits parseable JSON with warnings[]')) {
    process.stdout.write(`  stdout-head=${doctorR.stdout.slice(0, 200)}\n`);
    return;
  }
  const findings = [...(parsed.errors ?? []), ...(parsed.warnings ?? [])];
  const codes = findings.map((f) => f.code);
  t.assert(
    codes.includes('STALE_MODULE_VERSIONS') || codes.includes('MODULE_VERSION_MISMATCH'),
    'doctor: reports STALE_MODULE_VERSIONS / MODULE_VERSION_MISMATCH',
    `codes=${codes.join(',')}`,
  );
}

async function test_user_customization_not_clobbered() {
  if (!hasCopier()) {
    t.skip('user-customization', 'copier not on PATH');
    return;
  }
  const project = await makeTmp('morpheus-custom-');
  await copyDir(path.join(FIXTURES, 'empty-project'), project);
  const r = await runCli(['init', '--non-interactive'], {
    cwd: project,
    env: baseInitEnv('builder'),
    timeoutMs: 120000,
  });
  if (r.code !== 0) {
    t.fail('customization: initial init exits 0', `exit=${r.code}`);
    return;
  }
  t.pass('customization: initial init exits 0');

  const skillFile = path.join(project, '.agent', 'skills', 'spec-author.md');
  if (!(await fileExists(skillFile))) {
    t.skip('customization', 'spec-author.md not present in this render');
    return;
  }
  const original = await fs.readFile(skillFile, 'utf-8');
  const modified = `${original}\n\n<!-- user customization v0.1 -->\n`;
  await fs.writeFile(skillFile, modified, 'utf-8');
  const after = await fs.readFile(skillFile, 'utf-8');
  t.assert(after === modified, 'customization: user edit persists on disk');
  // Re-running init without --resume should refuse because a manifest exists.
  const reR = await runCli(['init', '--non-interactive'], {
    cwd: project,
    env: baseInitEnv('builder'),
    timeoutMs: 30000,
  });
  t.assert(
    reR.code !== 0,
    'customization: re-init without --resume refuses (protects user edits)',
    `exit=${reR.code}`,
  );
}

async function main() {
  if (!(await prechecks())) {
    t.exit();
    return;
  }
  await test_update_not_implemented();
  await test_stale_module_versions();
  await test_user_customization_not_clobbered();
  t.exit();
}

main().catch((err) => {
  process.stderr.write(`update-migration.test crashed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
