/**
 * Chalk-styled banner + progress markers for `agentic init`.
 *
 * Artifact B §8 specifies a `👋 Setting up...` banner followed by
 * `[n/N]` progress markers. We keep styling minimal so the output remains
 * readable when piped to a file.
 */
import chalk from 'chalk';

const TOTAL_STEPS = 5;

export function printBanner(projectRoot: string): void {
  process.stdout.write(`${chalk.bold('👋 Setting up Morpheus')} — ${chalk.dim(projectRoot)}\n`);
}

export function progress(step: number, label: string): void {
  const marker = chalk.cyan(`[${step}/${TOTAL_STEPS}]`);
  process.stdout.write(`${marker} ${label}\n`);
}

export function note(msg: string): void {
  process.stdout.write(`${chalk.dim('·')} ${chalk.dim(msg)}\n`);
}

export function success(msg: string): void {
  process.stdout.write(`${chalk.green('✓')} ${msg}\n`);
}

export function warn(msg: string): void {
  process.stdout.write(`${chalk.yellow('!')} ${msg}\n`);
}
