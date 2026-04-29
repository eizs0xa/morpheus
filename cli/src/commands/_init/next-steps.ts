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
  lines.push(chalk.bold('Next steps:'));

  // Brownfield post-init tasks always take priority over generic next steps.
  if (postInitTasks?.constitutionTask) {
    lines.push(
      '  • ' +
        chalk.yellow('Open .agent/tasks/01-author-constitution.md in your IDE'),
    );
    lines.push(
      '    Ask your agent to complete it — it contains a ready-to-run prompt.',
    );
    if (postInitTasks.docsTask) {
      lines.push(
        '  • ' +
          chalk.yellow('Open .agent/tasks/02-audit-docs.md in your IDE'),
      );
      lines.push(
        '    Ask your agent to restructure the detected existing docs into Morpheus format.',
      );
    }
    lines.push('');
    lines.push(chalk.dim('  Then continue with:'));
  }

  switch (profile) {
    case 'author':
      lines.push('  • ' + chalk.cyan('agentic feature new --intent=prd <JIRA>'));
      lines.push('    draft a PRD from a Jira ticket.');
      break;
    case 'explorer':
      lines.push('  • ' + chalk.cyan('agentic tour'));
      lines.push('    take a guided read-only walk of the repo.');
      break;
    case 'steward': {
      const hasConstitution = await exists(path.join(projectRoot, 'CONSTITUTION.md'));
      if (!hasConstitution && !postInitTasks?.constitutionTask) {
        lines.push('  • ' + chalk.cyan('agentic constitution author'));
        lines.push('    no CONSTITUTION.md was detected — author one.');
      } else {
        lines.push('  • ' + chalk.cyan('agentic feature new <JIRA>'));
        lines.push('    start a new feature (CONSTITUTION.md detected).');
      }
      break;
    }
    case 'verifier':
    case 'builder':
    default:
      lines.push('  • ' + chalk.cyan('agentic feature new <JIRA>'));
      lines.push('    kick off a new feature slice.');
      break;
  }

  lines.push('  • ' + chalk.cyan('agentic validate'));
  lines.push('    confirm the manifest + modules are healthy.');
  lines.push('');
  process.stdout.write(lines.join('\n'));
}
