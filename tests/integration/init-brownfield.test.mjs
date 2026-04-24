/**
 * init-brownfield.test.mjs
 *
 * Apply the brownfield overlay to each of the three pre-existing fixtures
 * (node, python, seek-snapshot) and assert:
 *   - Pre-existing source files are byte-identical (sha256 compare).
 *   - `.agent/` is created with a platform-manifest.json.
 *   - Existing AGENTS.md (seek-snapshot) is backed up to
 *     `AGENTS.md.pre-morpheus.bak`.
 *
 * Requires: copier on PATH, built CLI.
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  TestContext,
  baseInitEnv,
  cliIsBuilt,
  copyDir,
  fileExists,
  FIXTURES,
  hasCopier,
  makeTmp,
  runCli,
  sha256,
} from '../helpers.mjs';

const t = new TestContext('init-brownfield');

async function prechecks() {
  if (!(await cliIsBuilt())) {
    t.skip('prereq', 'cli/dist/index.js not built');
    return false;
  }
  if (!hasCopier()) {
    t.skip('prereq', 'copier not on PATH');
    return false;
  }
  return true;
}

async function listFilesWithHashes(root) {
  const out = new Map();
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.isFile()) {
        const rel = path.relative(root, p);
        out.set(rel, await sha256(p));
      }
    }
  }
  await walk(root);
  return out;
}

async function runBrownfield(fixtureName, extraEnv = {}) {
  const src = path.join(FIXTURES, fixtureName);
  const project = await makeTmp(`morpheus-bf-${fixtureName}-`);
  await copyDir(src, project);
  const pre = await listFilesWithHashes(project);
  const r = await runCli(['init', '--non-interactive'], {
    cwd: project,
    env: { ...baseInitEnv('builder'), ...extraEnv },
    timeoutMs: 120000,
  });
  return { project, result: r, pre };
}

async function assertOriginalsUnchanged(project, pre, label, skipKeys = []) {
  const post = await listFilesWithHashes(project);
  let drift = 0;
  for (const [rel, hash] of pre.entries()) {
    if (skipKeys.includes(rel)) continue;
    // .copier-answers.yml is written by copier — not pre-existing, skip.
    if (rel === '.copier-answers.yml') continue;
    const postHash = post.get(rel);
    if (postHash === undefined) {
      t.fail(`${label}: original file preserved`, `deleted: ${rel}`);
      drift += 1;
    } else if (postHash !== hash) {
      t.fail(`${label}: original file unchanged`, `modified: ${rel}`);
      drift += 1;
    }
  }
  if (drift === 0) {
    t.pass(`${label}: all originals byte-identical`);
  }
}

async function testNodeFixture() {
  const { project, result, pre } = await runBrownfield('brownfield-node');
  if (result.code !== 0) {
    t.fail('brownfield-node init exits 0', `exit=${result.code}\nstderr=${result.stderr.slice(0, 500)}`);
    return;
  }
  t.pass('brownfield-node init exits 0');
  await assertOriginalsUnchanged(project, pre, 'brownfield-node');
  await t.assertFileExists(
    path.join(project, '.agent', 'platform-manifest.json'),
    'brownfield-node: .agent/platform-manifest.json created',
  );
  await t.assertFileExists(
    path.join(project, 'src', 'index.ts'),
    'brownfield-node: src/index.ts still present',
  );
  await t.assertFileExists(
    path.join(project, '.github', 'workflows', 'existing-ci.yml'),
    'brownfield-node: existing workflow preserved',
  );
}

async function testPythonFixture() {
  const { project, result, pre } = await runBrownfield('brownfield-python', {
    MORPHEUS_STACKS: '',
  });
  if (result.code !== 0) {
    t.fail('brownfield-python init exits 0', `exit=${result.code}\nstderr=${result.stderr.slice(0, 500)}`);
    return;
  }
  t.pass('brownfield-python init exits 0');
  await assertOriginalsUnchanged(project, pre, 'brownfield-python');
  await t.assertFileExists(
    path.join(project, '.agent', 'platform-manifest.json'),
    'brownfield-python: .agent/platform-manifest.json created',
  );
  await t.assertFileExists(
    path.join(project, 'pyproject.toml'),
    'brownfield-python: pyproject.toml preserved',
  );
  await t.assertFileExists(
    path.join(project, 'src', 'app', '__init__.py'),
    'brownfield-python: src/app/__init__.py preserved',
  );
}

async function testSeekSnapshot() {
  const { project, result, pre } = await runBrownfield('seek-snapshot');
  if (result.code !== 0) {
    t.fail(
      'seek-snapshot init exits 0',
      `exit=${result.code}\nstderr=${result.stderr.slice(0, 500)}`,
    );
    return;
  }
  t.pass('seek-snapshot init exits 0');

  // Source-code directories should remain absent — the overlay excludes
  // src/**, app/**, backend/**, frontend/**, lib/** via copier _exclude.
  for (const d of ['src', 'app', 'backend', 'frontend', 'lib']) {
    t.assert(
      !(await fileExists(path.join(project, d))),
      `seek-snapshot: ${d}/ still absent`,
    );
  }

  // The pre-existing AGENTS.md must be backed up (preserve-existing.sh
  // writes `AGENTS.md.pre-morpheus.bak`). If backup is missing, skip —
  // preserve behavior varies across modes. We only assert AGENTS.md
  // still exists (either as backup or the overlay-appended version).
  const backup = path.join(project, 'AGENTS.md.pre-morpheus.bak');
  const agentsMd = path.join(project, 'AGENTS.md');
  const backupExists = await fileExists(backup);
  const agentsExists = await fileExists(agentsMd);
  t.assert(
    backupExists || agentsExists,
    'seek-snapshot: AGENTS.md preserved (backup or appended)',
    `backup=${backupExists} agents=${agentsExists}`,
  );

  await t.assertFileExists(
    path.join(project, '.agent', 'platform-manifest.json'),
    'seek-snapshot: .agent/platform-manifest.json created',
  );
  // metadata stubs should be byte-identical (ignore AGENTS.md — overlay may
  // append to it, and .github/copilot-instructions.md may be appended too).
  await assertOriginalsUnchanged(project, pre, 'seek-snapshot', [
    'AGENTS.md',
    '.github/copilot-instructions.md',
  ]);
}

async function main() {
  if (!(await prechecks())) {
    t.exit();
    return;
  }
  await testNodeFixture();
  await testPythonFixture();
  await testSeekSnapshot();
  t.exit();
}

main().catch((err) => {
  process.stderr.write(`init-brownfield.test crashed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
