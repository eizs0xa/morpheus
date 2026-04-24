/**
 * Morpheus integration test runner.
 *
 * Discovers every `*.test.mjs` under `tests/integration/`, spawns each in a
 * fresh `node` subprocess, and aggregates pass / fail / skip counts.
 *
 * Exit-code convention per test file:
 *   0 — pass
 *   1 — fail
 *   2 — skip (with reason on stdout, prefixed `SKIP:`)
 *
 * Runner exit code:
 *   0 — all tests passed (skips are allowed)
 *   1 — one or more tests failed
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const integrationDir = path.join(here, 'integration');

async function discoverTests() {
  const entries = await fs.readdir(integrationDir);
  return entries
    .filter((n) => n.endsWith('.test.mjs'))
    .sort()
    .map((n) => path.join(integrationDir, n));
}

function runTest(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ file, code: code ?? 1, stdout, stderr }));
    child.on('error', (err) => resolve({ file, code: 1, stdout, stderr: String(err) }));
  });
}

function summarize(stdout) {
  const lines = stdout.split('\n');
  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const l of lines) {
    if (l.startsWith('PASS:')) counts.pass += 1;
    else if (l.startsWith('FAIL:')) counts.fail += 1;
    else if (l.startsWith('SKIP:')) counts.skip += 1;
  }
  return counts;
}

async function main() {
  const files = await discoverTests();
  if (files.length === 0) {
    process.stderr.write('No integration test files found under tests/integration/.\n');
    process.exit(1);
  }

  process.stdout.write(`\nMorpheus integration tests — ${files.length} file(s)\n`);
  process.stdout.write('='.repeat(60) + '\n');

  const results = [];
  let totalPass = 0;
  let totalFail = 0;
  let totalSkip = 0;

  for (const file of files) {
    const rel = path.relative(here, file);
    process.stdout.write(`\n── ${rel} ──\n`);
    const start = Date.now();
    const r = await runTest(file);
    const ms = Date.now() - start;
    const counts = summarize(r.stdout);
    totalPass += counts.pass;
    totalFail += counts.fail;
    totalSkip += counts.skip;

    if (r.stdout.length > 0) process.stdout.write(r.stdout);
    if (r.stderr.length > 0) process.stderr.write(r.stderr);

    const status =
      r.code === 0 ? 'OK' : r.code === 2 ? 'SKIPPED (file-level)' : 'FAILED';
    process.stdout.write(
      `  → ${status} in ${ms}ms  (${counts.pass} pass / ${counts.fail} fail / ${counts.skip} skip)\n`,
    );
    results.push({ file: rel, exit: r.code, ...counts, ms });
  }

  process.stdout.write('\n' + '='.repeat(60) + '\n');
  process.stdout.write('Summary\n');
  for (const r of results) {
    process.stdout.write(
      `  ${r.file.padEnd(50)} pass=${r.pass} fail=${r.fail} skip=${r.skip}\n`,
    );
  }
  process.stdout.write(
    `\nTOTAL: pass=${totalPass} fail=${totalFail} skip=${totalSkip}\n`,
  );

  const anyFail = results.some((r) => r.exit === 1);
  process.exit(anyFail ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`runner crashed: ${err?.stack ?? err}\n`);
  process.exit(1);
});
