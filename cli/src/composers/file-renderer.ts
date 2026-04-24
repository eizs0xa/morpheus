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

  try {
    await execa('copier', args, { stdio: 'pipe' });
  } catch (err) {
    const e = err as ExecaError;
    const notFound =
      (e as unknown as { code?: string }).code === 'ENOENT' ||
      /not found|no such file/i.test(e.message ?? '');
    if (notFound) {
      throw new TemplateError(
        'The `copier` binary was not found on PATH.',
        'Install copier with `pipx install copier` (preferred) or `pip install copier`, then re-run.',
      );
    }
    throw new TemplateError(
      `copier failed: ${e.stderr?.toString() ?? e.message}`,
      'Inspect the copier error above, fix the template or answers, and re-run.',
    );
  }

  const filesWritten = await walkFiles(input.targetPath);
  return { filesWritten };
}
