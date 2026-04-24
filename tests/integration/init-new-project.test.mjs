/**
 * init-new-project.test.mjs
 *
 * For each of the 5 profiles: copy `tests/fixtures/empty-project/` to a
 * tmpdir, invoke `agentic init --non-interactive` with the minimum env
 * vars, and assert the expected profile-specific files are present/absent.
 *
 * Requires: copier on PATH and a built CLI at cli/dist/index.js.
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
} from '../helpers.mjs';

const t = new TestContext('init-new-project');

const PROFILES = ['builder', 'verifier', 'author', 'explorer', 'steward'];

async function prechecks() {
  if (!(await cliIsBuilt())) {
    t.skip('prereq', 'cli/dist/index.js not built — run `pnpm --filter cli build`');
    return false;
  }
  if (!hasCopier()) {
    t.skip('prereq', 'copier not on PATH — install via `pipx install copier`');
    return false;
  }
  return true;
}

async function initOne(profile) {
  const project = await makeTmp(`morpheus-it-${profile}-`);
  // Seed from empty fixture (just a .gitkeep).
  await copyDir(path.join(FIXTURES, 'empty-project'), project);

  const r = await runCli(['init', '--non-interactive'], {
    cwd: project,
    env: baseInitEnv(profile),
    timeoutMs: 120000,
  });
  return { project, result: r };
}

async function assertManifestValid(project, profile) {
  const manifestPath = path.join(project, '.agent', 'platform-manifest.json');
  const exists = await fileExists(manifestPath);
  if (!t.assert(exists, `[${profile}] manifest written`, manifestPath)) return null;

  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  } catch (err) {
    t.fail(`[${profile}] manifest parses as JSON`, String(err));
    return null;
  }
  t.pass(`[${profile}] manifest parses as JSON`);
  t.assert(
    manifest.profile === profile,
    `[${profile}] manifest.profile matches`,
    `got: ${manifest.profile}`,
  );
  t.assert(
    typeof manifest.platform_version === 'string' && /^\d+\.\d+\.\d+$/.test(manifest.platform_version),
    `[${profile}] manifest.platform_version is semver`,
    `got: ${manifest.platform_version}`,
  );
  t.assert(
    manifest.modules && typeof manifest.modules === 'object' && 'core' in manifest.modules,
    `[${profile}] manifest.modules includes core`,
  );
  return manifest;
}

async function perProfileAssertions(project, profile) {
  const agentDir = path.join(project, '.agent');
  const ghWorkflowsDir = path.join(project, '.github', 'workflows');

  switch (profile) {
    case 'builder':
    case 'steward':
      await t.assertFileExists(
        path.join(ghWorkflowsDir, 'agent-pr-gate.yml'),
        `[${profile}] agent-pr-gate.yml present`,
      );
      await t.assertFileExists(
        path.join(agentDir, 'skills', 'spec-author.md'),
        `[${profile}] spec-author skill present`,
      );
      break;
    case 'verifier': {
      await t.assertFileExists(
        path.join(agentDir, 'skills', 'evaluator.md'),
        `[verifier] evaluator skill present`,
      );
      // No stacks selected → no coding-agent-*.md skills present regardless,
      // but the VERIFIER_DENY rule guarantees their absence. Check directly.
      const offenders = ['coding-agent-node.md', 'coding-agent-python.md', 'coding-agent-react.md'];
      for (const s of offenders) {
        await t.assertFileAbsent(
          path.join(agentDir, 'skills', s),
          `[verifier] ${s} absent`,
        );
      }
      break;
    }
    case 'author': {
      await t.assertFileExists(
        path.join(agentDir, 'skills', 'spec-author.md'),
        `[author] spec-author.md present`,
      );
      const wfExists = await fileExists(ghWorkflowsDir);
      t.assert(!wfExists, `[author] .github/workflows/ absent`);
      break;
    }
    case 'explorer': {
      const ghExists = await fileExists(path.join(project, '.github'));
      t.assert(!ghExists, `[explorer] .github/ absent`);
      // Count total files. Allowlist pruning keeps a very small set.
      const count = await countFiles(project);
      t.assert(
        count <= 8,
        `[explorer] file count small (≤ 8)`,
        `got: ${count}`,
      );
      await t.assertFileExists(
        path.join(agentDir, 'skills', 'lore-reader.md'),
        `[explorer] lore-reader.md present`,
      );
      break;
    }
    default:
      break;
  }
}

async function countFiles(root) {
  let total = 0;
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else total += 1;
    }
  }
  await walk(root);
  return total;
}

async function runValidateSmoke(project, profile) {
  const r = await runCli(['validate', '--json'], { cwd: project, timeoutMs: 30000 });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    /* ignore */
  }
  t.assert(
    parsed !== null && typeof parsed === 'object' && 'ok' in parsed && 'errors' in parsed,
    `[${profile}] validate --json emits structured report`,
    `exit=${r.code} stdout-head=${r.stdout.slice(0, 120)}`,
  );
}

async function main() {
  if (!(await prechecks())) {
    t.exit();
    return;
  }

  for (const profile of PROFILES) {
    const { project, result } = await initOne(profile);
    if (result.code !== 0) {
      t.fail(
        `[${profile}] init exits 0`,
        `exit=${result.code}\nstderr=${result.stderr.slice(0, 500)}`,
      );
      continue;
    }
    t.pass(`[${profile}] init exits 0`);
    const manifest = await assertManifestValid(project, profile);
    if (manifest !== null) {
      await perProfileAssertions(project, profile);
      await runValidateSmoke(project, profile);
    }
  }

  t.exit();
}

main().catch((err) => {
  process.stderr.write(`init-new-project.test crashed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
