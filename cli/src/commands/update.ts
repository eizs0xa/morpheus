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
}
