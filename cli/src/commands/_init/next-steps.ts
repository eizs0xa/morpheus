/**
 * Profile-aware "what to do next" message — Artifact B §8.
 */
import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ProfileName } from '../../composers/module-resolver.js';
import type { PostInitTaskResult } from './post-init-tasks.js';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function printNextSteps(
  projectRoot: string,
  profile: ProfileName,
  postInitTasks?: PostInitTaskResult,
): Promise<void> {
  const lines: string[] = [];
  lines.push('');
  lines.push(chalk.bold.green('✓ Morpheus scaffolding is in place.'));
  lines.push('');

  // For brownfield (post-init tasks present) — collapse everything to one
  // simple instruction the user can act on without thinking.
  if (postInitTasks?.constitutionTask) {
    lines.push(chalk.bold('Next step — one action:'));
    lines.push('');
    lines.push(
      '  ' +
        chalk.yellow.bold('Type ') +
        chalk.yellow.bold.underline('/morpheus') +
        chalk.yellow.bold(' in your agent prompt window and press send.'),
    );
    lines.push('');
    lines.push(
      chalk.dim('  Your agent will read .agent/skills/morpheus-orchestrator.md and'),
    );
    lines.push(
      chalk.dim('  drive every pending task in .agent/tasks/ to completion. When it'),
    );
    lines.push(
      chalk.dim('  finishes you will get a single MORPHEUS_INIT_REPORT.md at the repo'),
    );
    lines.push(
      chalk.dim('  root showing what changed, why, and how the new system works.'),
    );
    lines.push('');
    process.stdout.write(lines.join('\n'));
    return;
  }

  // Greenfield / resume — short profile-aware hint, then a single command.
  lines.push(chalk.bold('Next step:'));
  switch (profile) {
    case 'author':
      lines.push('  • ' + chalk.cyan('morpheus feature new --intent=prd <JIRA>'));
      lines.push('    draft a PRD from a Jira ticket.');
      break;
    case 'explorer':
      lines.push('  • ' + chalk.cyan('morpheus tour'));
      lines.push('    take a guided read-only walk of the repo.');
      break;
    case 'steward': {
      const hasConstitution = await exists(path.join(projectRoot, 'CONSTITUTION.md'));
      if (!hasConstitution) {
        lines.push('  • ' + chalk.cyan('morpheus constitution author'));
        lines.push('    no CONSTITUTION.md was detected — author one.');
      } else {
        lines.push('  • ' + chalk.cyan('morpheus feature new <JIRA>'));
        lines.push('    start a new feature (CONSTITUTION.md detected).');
      }
      break;
    }
    case 'verifier':
    case 'builder':
    default:
      lines.push('  • ' + chalk.cyan('morpheus feature new <JIRA>'));
      lines.push('    kick off a new feature slice.');
      break;
  }

  lines.push('  • ' + chalk.cyan('morpheus validate'));
  lines.push('    confirm the manifest + modules are healthy.');
  lines.push('');
  process.stdout.write(lines.join('\n'));
}
