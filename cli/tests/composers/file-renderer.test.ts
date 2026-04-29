import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import { TemplateError } from '../../src/util/errors.js';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

const { ensureCopierAvailable, renderTemplate } = await import(
  '../../src/composers/file-renderer.js'
);

function enoent(): Error & { code: string } {
  const err = new Error('spawn copier ENOENT') as Error & { code: string };
  err.code = 'ENOENT';
  return err;
}

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'morpheus-renderer-'));
}

describe('file renderer', () => {
  beforeEach(() => {
    vi.mocked(execa).mockReset();
  });

  it('uses python3 -m copier when the copier binary is not on PATH', async () => {
    const targetPath = await tempDir();
    vi.mocked(execa)
      .mockRejectedValueOnce(enoent())
      .mockResolvedValueOnce({} as never);

    await renderTemplate({
      templatePath: '/tmp/template',
      targetPath,
      answers: { project_name: 'demo' },
    });

    expect(execa).toHaveBeenNthCalledWith(
      1,
      'copier',
      expect.arrayContaining(['copy', '--data', 'project_name=demo']),
      { stdio: 'pipe' },
    );
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'python3',
      expect.arrayContaining(['-m', 'copier', 'copy', '--data', 'project_name=demo']),
      { stdio: 'pipe' },
    );
  });

  it('checks copier availability without rendering into the target', async () => {
    vi.mocked(execa).mockResolvedValueOnce({} as never);

    await ensureCopierAvailable();

    expect(execa).toHaveBeenCalledWith('copier', ['--version'], { stdio: 'pipe' });
  });

  it('surfaces a clear install error when neither copier path works', async () => {
    vi.mocked(execa)
      .mockRejectedValueOnce(enoent())
      .mockRejectedValueOnce(Object.assign(new Error('No module named copier'), {
        stderr: 'No module named copier',
      }));

    const result = ensureCopierAvailable();
    await expect(result).rejects.toBeInstanceOf(TemplateError);
    await expect(result).rejects.toMatchObject({
      code: 'E_TEMPLATE',
    });
  });
});