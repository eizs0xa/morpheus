/**
 * `morpheus update` — pull the latest Morpheus platform from GitHub,
 * rebuild the CLI, and re-apply the overlay on the current project.
 *
 * Steps:
 *  1. Locate the Morpheus platform root (the git repo that owns modules/ and templates/).
 *  2. `git pull --ff-only` that repo to fetch the latest published version.
 *  3. `pnpm install && pnpm build` in platform-root/cli/ to rebuild the binary.
 *  4. Run `init --resume` on the current project so any new module contributions,
 *     template updates, and manifest schema changes are applied.
 *
 * The currently-running binary drives step 4 from memory; the rebuilt binary
 * takes effect on the next invocation.
 */
import path from 'node:path';
import { execa } from 'execa';
import chalk from 'chalk';
import { resolvePlatformRoot } from './_init/platform-root.js';
import { ValidationError } from '../util/errors.js';
import { loadAllModules } from '../detectors/stack.js';

export interface UpdateOptions {
  /** Skip the git pull step (useful in CI where the checkout is managed externally). */
  skipPull?: boolean;
  /** Skip the npm/pnpm rebuild step. */
  skipBuild?: boolean;
  /** Skip re-running init --resume on the current project. */
  skipOverlay?: boolean;
  /** Project root to update. Defaults to process.cwd(). */
  projectRoot?: string;
  nonInteractive?: boolean;
  profile?: string;
}

// ---------------------------------------------------------------------------
// Changelog helpers
// ---------------------------------------------------------------------------

const CONTRIB_TYPES = ['skills', 'workflows', 'templates', 'schemas', 'instructions', 'hooks'] as const;
type ContribType = (typeof CONTRIB_TYPES)[number];

interface ModuleSnapshot {
  name: string;
  version: string;
  contributes: Record<ContribType, string[]>;
}

/** Best-effort snapshot of every module's version and contribution lists. */
async function snapshotModules(platformRoot: string): Promise<Map<string, ModuleSnapshot>> {
  const map = new Map<string, ModuleSnapshot>();
  try {
    const allModules = await loadAllModules(platformRoot);
    for (const m of allModules) {
      const raw = (m.raw.contributes as Record<string, unknown> | undefined) ?? {};
      const toList = (key: string): string[] => {
        const v = raw[key];
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
      };
      map.set(m.name, {
        name: m.name,
        version: m.version,
        contributes: {
          skills: toList('skills'),
          workflows: toList('workflows'),
          templates: toList('templates'),
          schemas: toList('schemas'),
          instructions: toList('instructions'),
          hooks: toList('hooks'),
        },
      });
    }
  } catch {
    // Non-fatal — changelog degrades gracefully.
  }
  return map;
}

function renderChangelog(
  before: Map<string, ModuleSnapshot>,
  after: Map<string, ModuleSnapshot>,
  commits: string[],
  oldSha: string,
  newSha: string,
): void {
  const hr = chalk.dim('─'.repeat(58));
  process.stdout.write(`\n${hr}\n`);
  process.stdout.write(chalk.bold('  Update summary\n'));
  process.stdout.write(`${hr}\n`);

  if (oldSha !== '' && oldSha === newSha) {
    process.stdout.write(chalk.dim('  Already up to date — no platform changes.\n'));
    process.stdout.write(`${hr}\n`);
    return;
  }

  // Commits section
  if (commits.length > 0) {
    process.stdout.write(chalk.bold('\n  New commits:\n'));
    for (const line of commits.slice(0, 20)) {
      process.stdout.write(chalk.dim(`    · ${line}\n`));
    }
    if (commits.length > 20) {
      process.stdout.write(chalk.dim(`    · … and ${commits.length - 20} more\n`));
    }
  }

  // Module-level diff
  const moduleLines: string[] = [];
  const allNames = new Set([...before.keys(), ...after.keys()]);
  const newSkills: string[] = [];
  const newWorkflows: string[] = [];

  for (const name of [...allNames].sort()) {
    const b = before.get(name);
    const a = after.get(name);

    if (a === undefined) {
      moduleLines.push(chalk.red(`  - ${name} (removed)`));
      continue;
    }
    if (b === undefined) {
      moduleLines.push(chalk.green(`  + ${name} v${a.version} (new module)`));
      for (const s of a.contributes.skills) newSkills.push(path.basename(s, '.md'));
      for (const w of a.contributes.workflows) newWorkflows.push(path.basename(w).replace(/\.yml\.tmpl$|\.yml$/, ''));
      continue;
    }

    const diffs: string[] = [];
    if (b.version !== a.version) diffs.push(chalk.yellow(`    v${b.version} → v${a.version}`));

    for (const type of CONTRIB_TYPES) {
      const bSet = new Set(b.contributes[type]);
      const aArr = a.contributes[type];
      for (const item of aArr) {
        if (!bSet.has(item)) {
          const label = type.slice(0, -1); // 'skills' → 'skill'
          diffs.push(chalk.green(`    + ${item} (new ${label})`));
          if (type === 'skills') newSkills.push(path.basename(item, '.md'));
          if (type === 'workflows') newWorkflows.push(path.basename(item).replace(/\.yml\.tmpl$|\.yml$/, ''));
        }
      }
      const aSet = new Set(aArr);
      for (const item of b.contributes[type]) {
        if (!aSet.has(item)) {
          const label = type.slice(0, -1);
          diffs.push(chalk.red(`    - ${item} (removed ${label})`));
        }
      }
    }

    if (diffs.length > 0) {
      moduleLines.push(`\n  ~ ${chalk.cyan(name)}`);
      for (const d of diffs) moduleLines.push(d);
    }
  }

  if (moduleLines.length > 0) {
    process.stdout.write(chalk.bold('\n  Platform changes:\n'));
    for (const l of moduleLines) process.stdout.write(`${l}\n`);
  }

  // Impact notes
  process.stdout.write(chalk.bold('\n  Impact on your project:\n'));
  process.stdout.write(chalk.dim('    · Skills in .agent/skills/ and workflows in .github/workflows/\n'));
  process.stdout.write(chalk.dim('      have been refreshed with the latest platform versions.\n'));
  process.stdout.write(chalk.dim('    · Reload your IDE agent context for new skills to take effect.\n'));

  if (newSkills.length > 0) {
    process.stdout.write(chalk.dim(`\n    New skills: ${newSkills.join(', ')}\n`));
    process.stdout.write(chalk.dim('    Open .agent/skills/<name>.md for usage instructions.\n'));
  }
  if (newWorkflows.length > 0) {
    process.stdout.write(chalk.dim(`\n    New CI workflows: ${newWorkflows.join(', ')}\n`));
    process.stdout.write(chalk.dim('    Review .github/workflows/ and commit any new files to your repo.\n'));
  }
  if (newSkills.length === 0 && newWorkflows.length === 0 && moduleLines.length === 0) {
    process.stdout.write(chalk.dim('    · Module contributions refreshed — no new skills or workflows.\n'));
  }

  process.stdout.write(`\n${hr}\n`);
}

function step(n: number, total: number, msg: string): void {
  process.stdout.write(chalk.bold(`\n[${n}/${total}] ${msg}\n`));
}

function ok(msg: string): void {
  process.stdout.write(chalk.green(`✓ ${msg}\n`));
}

function note(msg: string): void {
  process.stdout.write(chalk.dim(`  · ${msg}\n`));
}

async function detectPackageManager(dir: string): Promise<'pnpm' | 'npm'> {
  try {
    const { execa: run } = await import('execa');
    await run('pnpm', ['--version'], { cwd: dir, stdio: 'pipe' });
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

export async function update(options: UpdateOptions = {}): Promise<void> {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const platformRoot = await resolvePlatformRoot();
  const cliDir = path.join(platformRoot, 'cli');
  const TOTAL = 3;

  process.stdout.write(
    chalk.bold('\n🔄 Morpheus update\n') +
      chalk.dim(`  platform root: ${platformRoot}\n`) +
      chalk.dim(`  project root:  ${projectRoot}\n`),
  );

  // Snapshot platform state before the pull (best-effort, for changelog).
  const beforeSnapshot = await snapshotModules(platformRoot);
  let oldSha = '';
  let newSha = '';
  let commits: string[] = [];

  // ------------------------------------------------------------------
  // [1/3] git pull
  // ------------------------------------------------------------------
  step(1, TOTAL, 'Pulling latest Morpheus platform from GitHub');

  if (options.skipPull) {
    note('skipped (--skip-pull)');
  } else {
    // Verify this is a git repo with a remote.
    let currentBranch = 'main';
    try {
      const { stdout } = await execa('git', ['-C', platformRoot, 'rev-parse', '--abbrev-ref', 'HEAD'], {
        stdio: 'pipe',
      });
      currentBranch = stdout.trim();
    } catch {
      throw new ValidationError(
        `Platform root ${platformRoot} is not a git repository.`,
        'Clone Morpheus via git before using `morpheus update`. See docs/getting-started.md.',
      );
    }

    note(`branch: ${currentBranch}`);

    // Capture the SHA before the pull so the changelog can show new commits.
    try {
      const { stdout: shaOut } = await execa('git', ['-C', platformRoot, 'rev-parse', 'HEAD'], { stdio: 'pipe' });
      oldSha = shaOut.trim();
    } catch {
      // Non-fatal.
    }

    // Check for uncommitted changes in the platform repo that would block ff-only.
    const { stdout: statusOut } = await execa(
      'git',
      ['-C', platformRoot, 'status', '--porcelain'],
      { stdio: 'pipe' },
    );
    if (statusOut.trim().length > 0) {
      throw new ValidationError(
        'Morpheus platform repo has uncommitted local changes — refusing to pull.',
        `Commit or stash your changes in ${platformRoot} before running \`morpheus update\`.`,
      );
    }

    try {
      const { stdout: pullOut } = await execa(
        'git',
        ['-C', platformRoot, 'pull', '--ff-only', 'origin', currentBranch],
        { stdio: 'pipe' },
      );
      note(pullOut.trim() || 'already up to date');
    } catch (err) {
      const msg = (err as { stderr?: string }).stderr ?? (err as Error).message ?? '';
      throw new ValidationError(
        `git pull failed: ${msg.trim()}`,
        `Resolve merge conflicts in ${platformRoot} then retry, or pass --skip-pull to skip the pull step.`,
      );
    }

    // Capture new SHA and commit list for the changelog.
    try {
      const { stdout: newShaOut } = await execa('git', ['-C', platformRoot, 'rev-parse', 'HEAD'], { stdio: 'pipe' });
      newSha = newShaOut.trim();
      if (oldSha !== '' && oldSha !== newSha) {
        const { stdout: logOut } = await execa(
          'git',
          ['-C', platformRoot, 'log', '--oneline', `${oldSha}..HEAD`],
          { stdio: 'pipe' },
        );
        commits = logOut.trim().split('\n').filter((l) => l.length > 0);
      }
    } catch {
      // Non-fatal.
    }

    ok('platform repo up to date');
  }

  // ------------------------------------------------------------------
  // [2/3] rebuild CLI
  // ------------------------------------------------------------------
  step(2, TOTAL, 'Rebuilding Morpheus CLI');

  if (options.skipBuild) {
    note('skipped (--skip-build)');
  } else {
    const pm = await detectPackageManager(cliDir);
    note(`package manager: ${pm}`);

    try {
      await execa(pm, ['install', '--frozen-lockfile'], {
        cwd: cliDir,
        stdio: 'pipe',
      });
    } catch {
      // Non-fatal: lockfile may not be frozen in dev setups; try plain install.
      await execa(pm, ['install'], { cwd: cliDir, stdio: 'pipe' });
    }

    await execa(pm, ['run', 'build'], { cwd: cliDir, stdio: 'pipe' });
    ok('CLI rebuilt');
  }

  // ------------------------------------------------------------------
  // [3/3] re-apply overlay (init --resume)
  // ------------------------------------------------------------------
  step(3, TOTAL, 'Re-applying Morpheus overlay to current project');

  if (options.skipOverlay) {
    note('skipped (--skip-overlay)');
  } else {
    const { init } = await import('./init.js');
    try {
      await init({
        projectRoot,
        resume: true,
        nonInteractive: options.nonInteractive ?? true,
        profile: options.profile as
          | 'builder'
          | 'verifier'
          | 'author'
          | 'explorer'
          | 'steward'
          | undefined,
      });
    } catch (err) {
      // If the project isn't initialized yet, give a clearer message.
      const msg = (err as Error).message ?? '';
      if (msg.includes('already initialized')) {
        // --resume should have handled this; fall through.
      } else if (msg.includes('platform-manifest.json')) {
        throw new ValidationError(
          'This project has not been initialized with Morpheus yet.',
          'Run `morpheus invoke` first to initialise the project, then `morpheus update` to keep it current.',
        );
      }
      throw err;
    }
    ok('overlay re-applied');
  }

  process.stdout.write(chalk.green('\n✓ Morpheus update complete.\n'));
  process.stdout.write(
    chalk.dim(
      '  The rebuilt binary takes effect on the next command invocation.\n',
    ),
  );

  // Snapshot after the overlay has been re-applied and print the summary.
  const afterSnapshot = await snapshotModules(platformRoot);
  renderChangelog(beforeSnapshot, afterSnapshot, commits, oldSha, newSha);
}
