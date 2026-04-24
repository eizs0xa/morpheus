#!/usr/bin/env node
/**
 * Morpheus CLI entrypoint.
 *
 * Wires commander subcommands. Individual commands live under `./commands/`
 * and are imported lazily so a single failing command does not crash the
 * whole CLI at load time.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { AgenticError } from './util/errors.js';

const program = new Command();

program
  .name('agentic')
  .description('Morpheus agentic development platform CLI')
  .version('0.1.0')
  .option('--non-interactive', 'run without interactive prompts', false)
  .option('--profile <name>', 'pre-select a profile (builder|verifier|author|explorer|steward)')
  .option('--verbose', 'verbose logging', false);

program
  .command('init')
  .description('Scaffold or overlay a Morpheus project')
  .option('--resume', 're-run init against an already-initialized project', false)
  .option('--answers-file <path>', 'YAML answers file for non-interactive runs')
  .action(async (localOpts: { resume?: boolean; answersFile?: string }) => {
    const mod = await import('./commands/init.js');
    const global = program.opts<{
      nonInteractive?: boolean;
      profile?: string;
    }>();
    await mod.init({
      nonInteractive: global.nonInteractive === true,
      profile: global.profile as
        | 'builder'
        | 'verifier'
        | 'author'
        | 'explorer'
        | 'steward'
        | undefined,
      resume: localOpts.resume === true,
      answersFile: localOpts.answersFile,
    });
  });

program
  .command('validate')
  .description('Validate an existing Morpheus project against its manifest')
  .option('--json', 'emit JSON report instead of human text', false)
  .option('--skip-external', 'accepted for symmetry with doctor; no-op for validate', false)
  .option('--verbose', 'verbose output', false)
  .action(async (localOpts: { json?: boolean; skipExternal?: boolean; verbose?: boolean }) => {
    const mod = await import('./commands/validate.js');
    await mod.validate({
      json: localOpts.json === true,
      verbose: localOpts.verbose === true,
    });
  });

program
  .command('doctor')
  .description('Deeper health check: validate plus stale modules, creds, orphans')
  .option('--json', 'emit JSON report instead of human text', false)
  .option('--skip-external', 'skip checks that hit remote services', false)
  .option('--verbose', 'verbose output', false)
  .action(async (localOpts: { json?: boolean; skipExternal?: boolean; verbose?: boolean }) => {
    const mod = await import('./commands/doctor.js');
    await mod.doctor({
      json: localOpts.json === true,
      skipExternal: localOpts.skipExternal === true,
      verbose: localOpts.verbose === true,
    });
  });

program
  .command('add <module>')
  .description('Add a module to the current project (future)')
  .action(async (moduleName: string) => {
    const mod = await import('./commands/add.js');
    await mod.add(moduleName);
  });

program
  .command('remove <module>')
  .description('Remove a module from the current project (future)')
  .action(async (moduleName: string) => {
    const mod = await import('./commands/remove.js');
    await mod.remove(moduleName);
  });

program.showHelpAfterError();

program.exitOverride((err) => {
  // Unknown commands/flags: commander emits exit 1 with usage already.
  process.exit(err.exitCode ?? 1);
});

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof AgenticError) {
      process.stderr.write(`${chalk.red(`[${err.code}]`)} ${err.message}\n`);
      process.stderr.write(`${chalk.yellow('→')} ${err.remediation}\n`);
      process.exit(1);
    }
    process.stderr.write(`${chalk.red('unexpected error:')} ${(err as Error).message}\n`);
    process.exit(1);
  }
}

void main();
