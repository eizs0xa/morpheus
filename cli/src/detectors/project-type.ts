/**
 * Project-type detection — Artifact B §6.
 *
 * Scans a project root for well-known signals and classifies the project
 * into one of the eight canonical types. Designed to be cheap: we cap
 * file discovery so huge repos don't cause long init times.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ProjectType =
  | 'fullstack-web'
  | 'frontend-only'
  | 'backend-service'
  | 'data-engineering'
  | 'mobile-app'
  | 'library-or-sdk'
  | 'new-empty'
  | 'unclassified';

export interface ProjectSignals {
  hasPackageJson: boolean;
  hasReact: boolean;
  hasVue: boolean;
  hasNextJs: boolean;
  hasExpress: boolean;
  hasPython: boolean;
  hasDjango: boolean;
  hasFastApi: boolean;
  hasDbt: boolean;
  hasAirflow: boolean;
  hasPrisma: boolean;
  hasMobile: boolean;
  hasDockerfile: boolean;
  hasMigrations: boolean;
  fileCount: number;
}

/** Upper bound on files we touch during a scan. Keeps init O(1) on giant monorepos. */
const FILE_SCAN_CAP = 200;

/** Folders we skip when walking — noise that wouldn't change classification. */
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  'target',
  '.cache',
  'coverage',
  '.idea',
  '.vscode',
]);

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(p: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readTextIfPresent(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, 'utf-8');
  } catch {
    return null;
  }
}

function hasDep(pkg: Record<string, unknown> | null, name: string): boolean {
  if (!pkg) return false;
  const deps = (pkg.dependencies ?? {}) as Record<string, unknown>;
  const dev = (pkg.devDependencies ?? {}) as Record<string, unknown>;
  const peer = (pkg.peerDependencies ?? {}) as Record<string, unknown>;
  return name in deps || name in dev || name in peer;
}

async function walkLimited(root: string, cap: number): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0 && out.length < cap) {
    const dir = stack.pop();
    if (dir === undefined) break;
    let entries: Array<{ name: string; isDir: boolean; isFile: boolean }>;
    try {
      const raw = await fs.readdir(dir, { withFileTypes: true });
      entries = raw.map((e) => ({ name: e.name, isDir: e.isDirectory(), isFile: e.isFile() }));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (out.length >= cap) break;
      if (entry.isDir) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        stack.push(path.join(dir, entry.name));
      } else if (entry.isFile) {
        out.push(path.join(dir, entry.name));
      }
    }
  }
  return out;
}

function anyFileMatches(files: string[], basenames: string[]): boolean {
  const wanted = new Set(basenames);
  return files.some((f) => wanted.has(path.basename(f)));
}

async function scanForAirflow(files: string[]): Promise<boolean> {
  // Airflow DAGs are plain Python files importing the airflow package.
  // Scan at most the first ~50 python files to keep cost bounded.
  const pyFiles = files.filter((f) => f.endsWith('.py')).slice(0, 50);
  for (const f of pyFiles) {
    const body = await readTextIfPresent(f);
    if (body && /\bfrom\s+airflow\b|\bimport\s+airflow\b/.test(body)) return true;
  }
  return false;
}

export async function scanSignals(root: string): Promise<ProjectSignals> {
  const pkgPath = path.join(root, 'package.json');
  const pkg = await readJsonIfPresent(pkgPath);
  const hasPackageJson = pkg !== null;

  const pyProjectPath = path.join(root, 'pyproject.toml');
  const requirementsPath = path.join(root, 'requirements.txt');
  const pyProject = await readTextIfPresent(pyProjectPath);
  const requirements = await readTextIfPresent(requirementsPath);
  const hasPython =
    (await fileExists(pyProjectPath)) ||
    (await fileExists(requirementsPath)) ||
    (await fileExists(path.join(root, 'setup.py')));

  const pythonCorpus = `${pyProject ?? ''}\n${requirements ?? ''}`.toLowerCase();
  const hasDjango = /\bdjango\b/.test(pythonCorpus);
  const hasFastApi = /\bfastapi\b/.test(pythonCorpus);
  const hasAirflowDep = /\bapache-airflow\b|\bairflow\b/.test(pythonCorpus);
  const hasDbtFile =
    (await fileExists(path.join(root, 'dbt_project.yml'))) ||
    (await fileExists(path.join(root, 'dbt_project.yaml')));

  const files = await walkLimited(root, FILE_SCAN_CAP);
  const fileCount = files.length;

  const hasReact = hasDep(pkg, 'react') || hasDep(pkg, 'react-dom');
  const hasVue = hasDep(pkg, 'vue') || hasDep(pkg, 'nuxt');
  const hasNextJs = hasDep(pkg, 'next');
  const hasExpress = hasDep(pkg, 'express') || hasDep(pkg, 'fastify') || hasDep(pkg, 'koa');
  const hasPrisma = hasDep(pkg, 'prisma') || hasDep(pkg, '@prisma/client');
  const hasMobile =
    hasDep(pkg, 'react-native') ||
    hasDep(pkg, 'expo') ||
    (await fileExists(path.join(root, 'ios'))) ||
    (await fileExists(path.join(root, 'android'))) ||
    anyFileMatches(files, ['Podfile', 'AndroidManifest.xml']);

  const hasDockerfile =
    (await fileExists(path.join(root, 'Dockerfile'))) ||
    files.some((f) => path.basename(f).startsWith('Dockerfile'));
  const hasMigrations =
    (await fileExists(path.join(root, 'migrations'))) ||
    (await fileExists(path.join(root, 'prisma', 'migrations'))) ||
    (await fileExists(path.join(root, 'alembic')));

  const hasDbt = hasDbtFile;
  const hasAirflow = hasAirflowDep || (await scanForAirflow(files));

  return {
    hasPackageJson,
    hasReact,
    hasVue,
    hasNextJs,
    hasExpress,
    hasPython,
    hasDjango,
    hasFastApi,
    hasDbt,
    hasAirflow,
    hasPrisma,
    hasMobile,
    hasDockerfile,
    hasMigrations,
    fileCount,
  };
}

/** Minimum files a directory needs before we stop treating it as "empty". */
const EMPTY_PROJECT_THRESHOLD = 5;

export function classify(s: ProjectSignals): ProjectType {
  // Specific positive signals beat emptiness: a 2-file dbt project is still
  // a data-engineering project, not an empty one.
  if (s.hasMobile) return 'mobile-app';
  if (s.hasDbt || s.hasAirflow) return 'data-engineering';

  if (s.fileCount < EMPTY_PROJECT_THRESHOLD && !s.hasPackageJson && !s.hasPython) {
    return 'new-empty';
  }

  const hasFrontend = s.hasReact || s.hasVue || s.hasNextJs;
  const hasBackend = s.hasExpress || s.hasDjango || s.hasFastApi;

  if (hasFrontend && (hasBackend || s.hasPrisma || s.hasMigrations)) {
    return 'fullstack-web';
  }
  if (hasBackend) return 'backend-service';
  if (hasFrontend) return 'frontend-only';

  // Library-or-SDK heuristic: a package.json/pyproject with no app frameworks
  // and no app-server signals. Common for npm libraries or Python SDKs.
  if (s.hasPackageJson || s.hasPython) return 'library-or-sdk';

  return 'unclassified';
}
