/**
 * File renderer — thin wrapper over the `copier` CLI.
 *
 * We spawn copier as a subprocess rather than re-implementing its template
 * engine. Artifact A §11 locks this decision: copier is the canonical
 * scaffolder.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execa, ExecaError } from 'execa';
import { TemplateError } from '../util/errors.js';

export interface RenderInput {
  templatePath: string;
  targetPath: string;
  answers: Record<string, unknown>;
  defaults?: Record<string, unknown>;
}

export interface RenderResult {
  filesWritten: string[];
}

type ExecaFailure = ExecaError & { code?: string };

function isNotFound(err: unknown): boolean {
  const e = err as ExecaFailure;
  return e.code === 'ENOENT' || /not found|no such file/i.test(e.message ?? '');
}

function outputOf(err: unknown): string {
  const e = err as ExecaError;
  const stderr = e.stderr?.toString() ?? '';
  if (stderr.length > 0) return stderr;
  return e.message ?? String(err);
}

async function runCopier(args: string[]): Promise<void> {
  try {
    await execa('copier', args, { stdio: 'pipe' });
    return;
  } catch (err) {
    if (!isNotFound(err)) {
      throw new TemplateError(
        `copier failed: ${outputOf(err)}`,
        'Inspect the copier error above, fix the template or answers, and re-run.',
      );
    }
  }

  try {
    await execa('python3', ['-m', 'copier', ...args], { stdio: 'pipe' });
  } catch (err) {
    const detail = outputOf(err).trim();
    throw new TemplateError(
      'Copier was not found as a PATH binary, and `python3 -m copier` did not run.',
      `Install copier with \`pipx install copier\` (preferred) or \`python3 -m pip install --user copier\`, then re-run. Detail: ${detail}`,
    );
  }
}

export async function ensureCopierAvailable(): Promise<void> {
  await runCopier(['--version']);
}

function buildDataArgs(answers: Record<string, unknown>): string[] {
  const args: string[] = [];
  for (const [key, value] of Object.entries(answers)) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    args.push('--data', `${key}=${serialized}`);
  }
  return args;
}

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function recur(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await recur(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await recur(root);
  return out;
}

export async function renderTemplate(input: RenderInput): Promise<RenderResult> {
  const merged: Record<string, unknown> = { ...(input.defaults ?? {}), ...input.answers };
  const args = [
    'copy',
    ...buildDataArgs(merged),
    input.templatePath,
    input.targetPath,
    '--trust',
    '--force',
  ];

  await runCopier(args);

  const filesWritten = await walkFiles(input.targetPath);
  return { filesWritten };
}
