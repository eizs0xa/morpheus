/**
 * Stack detection — reads every `module.yaml` under
 * `{platformRoot}/modules/{stacks,workspaces,integrations,domains}/*`
 * and returns the names of `stack-*` modules whose detection markers
 * match the target project root.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { DetectionError } from '../util/errors.js';

export interface ModuleDetection {
  file_markers: string[];
  content_markers: { file: string; contains: string }[];
}

export interface ModuleMeta {
  name: string;
  version: string;
  path: string;
  requires: { name: string; version_range: string }[];
  incompatible_with: string[];
  detection?: ModuleDetection;
  raw: Record<string, unknown>;
}

const MODULE_CATEGORIES = ['stacks', 'workspaces', 'integrations', 'domains'] as const;

async function safeReadDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function parseModuleFile(modulePath: string): Promise<ModuleMeta | null> {
  const raw = await fs.readFile(modulePath, 'utf-8').catch(() => null);
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = YAML.parse(raw);
  } catch (err) {
    throw new DetectionError(
      `Failed to parse ${modulePath}: ${(err as Error).message}`,
      'Fix the YAML syntax in the module manifest.',
    );
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name : null;
  const version = typeof obj.version === 'string' ? obj.version : null;
  if (name === null || version === null) return null;

  const requires = Array.isArray(obj.requires)
    ? (obj.requires as Array<Record<string, unknown>>)
        .filter((r) => typeof r.name === 'string' && typeof r.version_range === 'string')
        .map((r) => ({ name: r.name as string, version_range: r.version_range as string }))
    : [];

  const incompatibleWith = Array.isArray(obj.incompatible_with)
    ? (obj.incompatible_with as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  let detection: ModuleDetection | undefined;
  if (obj.detection !== null && typeof obj.detection === 'object') {
    const det = obj.detection as Record<string, unknown>;
    const fileMarkers = Array.isArray(det.file_markers)
      ? (det.file_markers as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];
    const contentMarkers = Array.isArray(det.content_markers)
      ? (det.content_markers as Array<Record<string, unknown>>)
          .filter((c) => typeof c.file === 'string' && typeof c.contains === 'string')
          .map((c) => ({ file: c.file as string, contains: c.contains as string }))
      : [];
    if (fileMarkers.length > 0 || contentMarkers.length > 0) {
      detection = { file_markers: fileMarkers, content_markers: contentMarkers };
    }
  }

  return {
    name,
    version,
    path: path.dirname(modulePath),
    requires,
    incompatible_with: incompatibleWith,
    detection,
    raw: obj,
  };
}

export async function loadAllModules(platformRoot: string): Promise<ModuleMeta[]> {
  const modules: ModuleMeta[] = [];

  // Always include `modules/core` when present.
  const corePath = path.join(platformRoot, 'modules', 'core', 'module.yaml');
  const core = await parseModuleFile(corePath);
  if (core !== null) modules.push(core);

  for (const category of MODULE_CATEGORIES) {
    const categoryDir = path.join(platformRoot, 'modules', category);
    const children = await safeReadDir(categoryDir);
    for (const child of children) {
      if (child.startsWith('.')) continue;
      const moduleYaml = path.join(categoryDir, child, 'module.yaml');
      const parsed = await parseModuleFile(moduleYaml);
      if (parsed !== null) modules.push(parsed);
    }
  }
  return modules;
}

async function fileMarkerMatches(projectRoot: string, marker: string): Promise<boolean> {
  // Trailing slash or dir-style markers: treat as directory presence.
  const target = path.join(projectRoot, marker);
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function contentMarkerMatches(
  projectRoot: string,
  marker: { file: string; contains: string },
): Promise<boolean> {
  try {
    const body = await fs.readFile(path.join(projectRoot, marker.file), 'utf-8');
    return body.includes(marker.contains);
  } catch {
    return false;
  }
}

export async function moduleMatches(projectRoot: string, module: ModuleMeta): Promise<boolean> {
  const det = module.detection;
  if (det === undefined) return false;
  for (const marker of det.file_markers) {
    if (await fileMarkerMatches(projectRoot, marker)) {
      // For stacks that share a file marker (e.g. package.json), we further
      // require any declared content marker to also match — otherwise
      // stack-node and stack-react would both light up on any JS project.
      if (det.content_markers.length === 0) return true;
      for (const cm of det.content_markers) {
        if (await contentMarkerMatches(projectRoot, cm)) return true;
      }
    }
  }
  // If only content markers were declared, scan them directly.
  if (det.file_markers.length === 0) {
    for (const cm of det.content_markers) {
      if (await contentMarkerMatches(projectRoot, cm)) return true;
    }
  }
  return false;
}

export async function matchStacks(
  projectRoot: string,
  modules: ModuleMeta[],
): Promise<string[]> {
  const stacks = modules.filter((m) => m.name.startsWith('stack-'));
  const matched: string[] = [];
  for (const stack of stacks) {
    if (await moduleMatches(projectRoot, stack)) matched.push(stack.name);
  }
  return matched;
}
