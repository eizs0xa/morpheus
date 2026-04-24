import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanSignals, classify } from '../../src/detectors/project-type.js';

async function makeTmp(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), `ws10-${prefix}-`));
}

async function writeJson(p: string, obj: unknown): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2));
}

async function writeText(p: string, body: string): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body);
}

describe('scanSignals + classify', () => {
  const tmpDirs: string[] = [];

  afterAll(async () => {
    for (const d of tmpDirs) {
      await fs.rm(d, { recursive: true, force: true });
    }
  });

  it("classifies Node+React+Express+Prisma as 'fullstack-web'", async () => {
    const dir = await makeTmp('fw');
    tmpDirs.push(dir);
    await writeJson(path.join(dir, 'package.json'), {
      name: 'fw',
      dependencies: { react: '19.0.0', 'react-dom': '19.0.0', express: '4.19.0' },
      devDependencies: { prisma: '5.0.0' },
    });
    await writeText(path.join(dir, 'prisma', 'schema.prisma'), 'datasource db {}\n');
    const signals = await scanSignals(dir);
    expect(signals.hasReact).toBe(true);
    expect(signals.hasExpress).toBe(true);
    expect(signals.hasPrisma).toBe(true);
    expect(classify(signals)).toBe('fullstack-web');
  });

  it("classifies a Python+Django project as 'backend-service'", async () => {
    const dir = await makeTmp('bs');
    tmpDirs.push(dir);
    await writeText(
      path.join(dir, 'pyproject.toml'),
      '[tool.poetry]\nname="svc"\n[tool.poetry.dependencies]\ndjango="5.0"\n',
    );
    await writeText(path.join(dir, 'manage.py'), '# django manage\n');
    const signals = await scanSignals(dir);
    expect(signals.hasPython).toBe(true);
    expect(signals.hasDjango).toBe(true);
    expect(classify(signals)).toBe('backend-service');
  });

  it("classifies a near-empty directory as 'new-empty'", async () => {
    const dir = await makeTmp('empty');
    tmpDirs.push(dir);
    await writeText(path.join(dir, 'README.md'), '# empty\n');
    const signals = await scanSignals(dir);
    expect(signals.fileCount).toBeLessThan(5);
    expect(classify(signals)).toBe('new-empty');
  });

  it("classifies a dbt project as 'data-engineering'", async () => {
    const dir = await makeTmp('de');
    tmpDirs.push(dir);
    await writeText(path.join(dir, 'dbt_project.yml'), "name: 'analytics'\nversion: '1.0.0'\n");
    await writeText(path.join(dir, 'models', 'my_model.sql'), 'select 1 as x');
    const signals = await scanSignals(dir);
    expect(signals.hasDbt).toBe(true);
    expect(classify(signals)).toBe('data-engineering');
  });

  it("classifies a React-only project as 'frontend-only'", async () => {
    const dir = await makeTmp('fe');
    tmpDirs.push(dir);
    await writeJson(path.join(dir, 'package.json'), {
      name: 'fe',
      dependencies: { react: '19.0.0', 'react-dom': '19.0.0' },
      devDependencies: { vite: '5.0.0' },
    });
    await writeText(path.join(dir, 'src', 'App.tsx'), 'export default () => null;');
    const signals = await scanSignals(dir);
    expect(signals.hasReact).toBe(true);
    expect(signals.hasExpress).toBe(false);
    expect(classify(signals)).toBe('frontend-only');
  });
});
