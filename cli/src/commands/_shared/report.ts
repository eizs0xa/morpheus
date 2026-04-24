/**
 * Shared rendering + exit-code helpers for the `validate` and `doctor`
 * commands.
 *
 * The JSON shape produced here is the integration contract — third-party
 * automation (CI lanes, IDE lint bridges) depends on `ok`, `errors`,
 * `warnings`, and each finding's `code` field.
 */
import chalk from 'chalk';

export interface ValidationFinding {
  code: string;
  message: string;
  path?: string;
  remediation?: string;
}

export interface ValidationReport {
  ok: boolean;
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
}

export function emptyReport(): ValidationReport {
  return { ok: true, errors: [], warnings: [] };
}

export function addError(report: ValidationReport, f: ValidationFinding): void {
  report.errors.push(f);
  report.ok = false;
}

export function addWarning(report: ValidationReport, f: ValidationFinding): void {
  report.warnings.push(f);
}

export function exitCodeFor(report: ValidationReport): 0 | 1 | 2 {
  if (report.errors.length > 0) return 2;
  if (report.warnings.length > 0) return 1;
  return 0;
}

export function renderJson(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}

export function renderHuman(report: ValidationReport, verbose: boolean): string {
  const lines: string[] = [];
  if (report.errors.length === 0 && report.warnings.length === 0) {
    lines.push(chalk.green('✓ All checks passed.'));
    return lines.join('\n');
  }
  for (const e of report.errors) {
    lines.push(`${chalk.red('✗')} ${chalk.red(`[${e.code}]`)} ${e.message}`);
    if (e.path !== undefined) lines.push(`   ${chalk.dim('path:')} ${e.path}`);
    if (e.remediation !== undefined && (verbose || true)) {
      lines.push(`   ${chalk.yellow('→')} ${e.remediation}`);
    }
  }
  for (const w of report.warnings) {
    lines.push(`${chalk.yellow('!')} ${chalk.yellow(`[${w.code}]`)} ${w.message}`);
    if (w.path !== undefined) lines.push(`   ${chalk.dim('path:')} ${w.path}`);
    if (w.remediation !== undefined && (verbose || true)) {
      lines.push(`   ${chalk.yellow('→')} ${w.remediation}`);
    }
  }
  const err = report.errors.length;
  const warn = report.warnings.length;
  lines.push('');
  lines.push(
    report.ok
      ? chalk.yellow(`Finished with ${warn} warning(s).`)
      : chalk.red(`Finished with ${err} error(s) and ${warn} warning(s).`),
  );
  return lines.join('\n');
}

/** Compare two semver-looking strings. Returns -1 / 0 / 1. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('-')[0]!.split('.').map((x) => parseInt(x, 10));
  const pb = b.split('-')[0]!.split('.').map((x) => parseInt(x, 10));
  for (let i = 0; i < 3; i += 1) {
    const ai = pa[i] ?? 0;
    const bi = pb[i] ?? 0;
    if (ai < bi) return -1;
    if (ai > bi) return 1;
  }
  return 0;
}
