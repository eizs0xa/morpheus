/**
 * `agentic validate` — structural health check for a Morpheus project.
 *
 * Reads `.agent/platform-manifest.json`, confirms every declared module
 * exists at the declared version, every contributed file was rendered to
 * its expected on-disk location, composition rules still hold, and any
 * `.agent/schemas/*.json` is a valid draft-07 schema.
 *
 * Exit codes (when invoked from the CLI):
 *   0 — clean
 *   1 — warnings only
 *   2 — errors present
 *
 * Tests invoke `validate({ exitOnCompletion: false })` to get the raw
 * report without triggering `process.exit`.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readManifest, type PlatformManifest } from '../util/manifest.js';
import { ManifestError } from '../util/errors.js';
import { loadAllModules, type ModuleMeta } from '../detectors/stack.js';
import {
  addError,
  addWarning,
  emptyReport,
  exitCodeFor,
  renderHuman,
  renderJson,
  type ValidationFinding,
  type ValidationReport,
} from './_shared/report.js';

export type { ValidationReport, ValidationFinding } from './_shared/report.js';

export interface ValidateOptions {
  projectRoot?: string;
  verbose?: boolean;
  json?: boolean;
  /**
   * Internal: suppress `process.exit` after rendering. Defaults to `true`
   * (exit on non-zero). Tests pass `false`.
   */
  exitOnCompletion?: boolean;
}

const MANIFEST_SUBPATH = path.join('.agent', 'platform-manifest.json');
const AGENT_DIR = '.agent';

interface ProfileSpec {
  skills_enabled?: 'all' | string[];
}

/**
 * Resolve the Morpheus platform root (the checkout that contains
 * `modules/`). In order:
 *   1. `MORPHEUS_PLATFORM_ROOT` env var (CI + tests)
 *   2. Walk up from this file: dist/commands/*.js → dist → cli → morpheus
 *   3. Walk up from process.cwd()
 */
export async function findPlatformRoot(): Promise<string> {
  const envOverride = process.env.MORPHEUS_PLATFORM_ROOT;
  if (envOverride !== undefined && envOverride.length > 0) {
    return path.resolve(envOverride);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '..', '..', '..'),
    path.resolve(here, '..', '..'),
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '..', '..'),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(path.join(candidate, 'modules', 'core', 'module.yaml'));
      return candidate;
    } catch {
      // keep looking
    }
  }
  return process.cwd();
}

type ContribType = 'skills' | 'workflows' | 'templates' | 'schemas' | 'instructions' | 'hooks';

/** Map a contribution path to its rendered on-disk location in a project. */
export function renderedPathFor(
  projectRoot: string,
  contribType: ContribType,
  contribPath: string,
): string {
  const typeDirMap: Record<ContribType, string> = {
    skills: path.join(AGENT_DIR, 'skills'),
    workflows: path.join('.github', 'workflows'),
    templates: path.join(AGENT_DIR, 'templates'),
    schemas: path.join(AGENT_DIR, 'schemas'),
    instructions: path.join('.github', 'instructions'),
    hooks: path.join(AGENT_DIR, 'hooks'),
  };
  let rel = contribPath;
  const typePrefix = `${contribType}/`;
  if (rel.startsWith(typePrefix)) rel = rel.slice(typePrefix.length);
  if (rel.endsWith('.tmpl')) rel = rel.slice(0, -'.tmpl'.length);
  return path.join(projectRoot, typeDirMap[contribType], rel);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function loadProfiles(platformRoot: string): Promise<Record<string, ProfileSpec>> {
  const profilesPath = path.join(platformRoot, 'modules', 'core', 'profiles.yaml');
  try {
    const raw = await fs.readFile(profilesPath, 'utf-8');
    const parsed = YAML.parse(raw) as { profiles?: Record<string, ProfileSpec> } | null;
    return parsed?.profiles ?? {};
  } catch {
    return {};
  }
}

/**
 * Given a profile's `skills_enabled`, decide whether a skill file path
 * (e.g. `skills/spec-author.md`) should be required. `all` → always
 * required. A list → require only when the skill's basename (with a
 * trailing `-read` suffix stripped) appears in the list.
 */
function skillRequired(skillsEnabled: 'all' | string[] | undefined, contribPath: string): boolean {
  if (skillsEnabled === undefined || skillsEnabled === 'all') return true;
  const base = path.basename(contribPath).replace(/\.md$/, '');
  const normalized = new Set(
    skillsEnabled.map((s) => (s.endsWith('-read') ? s.slice(0, -'-read'.length) : s)),
  );
  return normalized.has(base);
}

interface ContribCheck {
  type: ContribType;
  moduleName: string;
  contribPath: string;
  expectedPath: string;
}

function enumerateContributions(
  module: ModuleMeta,
  projectRoot: string,
  skillsEnabled: 'all' | string[] | undefined,
): ContribCheck[] {
  const out: ContribCheck[] = [];
  const contributes = (module.raw.contributes as Record<string, unknown> | undefined) ?? {};
  const types: ContribType[] = [
    'skills',
    'workflows',
    'templates',
    'schemas',
    'instructions',
    'hooks',
  ];
  for (const t of types) {
    const list = contributes[t];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== 'string') continue;
      if (t === 'skills' && !skillRequired(skillsEnabled, item)) continue;
      out.push({
        type: t,
        moduleName: module.name,
        contribPath: item,
        expectedPath: renderedPathFor(projectRoot, t, item),
      });
    }
  }
  return out;
}

function checkComposition(
  manifestModules: string[],
  allModules: ModuleMeta[],
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const workspaces = manifestModules.filter((m) => m.startsWith('workspace-'));
  const gits = manifestModules.filter((m) => m.startsWith('git-'));
  const pms = manifestModules.filter((m) => m.startsWith('pm-'));

  if (workspaces.length !== 1) {
    findings.push({
      code: 'COMPOSITION_VIOLATION',
      message: `Composition requires exactly one workspace module; found ${workspaces.length}: ${workspaces.join(', ') || '(none)'}.`,
      remediation: 'Remove extra workspace modules or add one. Re-run `agentic init` if unsure.',
    });
  }
  if (gits.length !== 1) {
    findings.push({
      code: 'COMPOSITION_VIOLATION',
      message: `Composition requires exactly one git provider; found ${gits.length}: ${gits.join(', ') || '(none)'}.`,
      remediation: 'Keep exactly one git-* module in the manifest.',
    });
  }
  if (pms.length > 1) {
    findings.push({
      code: 'COMPOSITION_VIOLATION',
      message: `Composition allows at most one pm integration; found ${pms.length}: ${pms.join(', ')}.`,
      remediation: 'Remove the extra pm-* module from the manifest.',
    });
  }

  const installedSet = new Set(manifestModules);
  for (const name of manifestModules) {
    const meta = allModules.find((m) => m.name === name);
    if (meta === undefined) continue;
    for (const banned of meta.incompatible_with) {
      if (installedSet.has(banned)) {
        findings.push({
          code: 'COMPOSITION_VIOLATION',
          message: `Module '${name}' is incompatible with '${banned}', but both are installed.`,
          remediation: `Remove either '${name}' or '${banned}' from the manifest.`,
        });
      }
    }
  }
  return findings;
}

async function checkSchemaFiles(projectRoot: string): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  const schemasDir = path.join(projectRoot, AGENT_DIR, 'schemas');
  let entries: string[];
  try {
    entries = await fs.readdir(schemasDir);
  } catch {
    return findings;
  }
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  for (const name of entries) {
    if (!name.endsWith('.json')) continue;
    const full = path.join(schemasDir, name);
    try {
      const raw = await fs.readFile(full, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        (parsed as { $schema?: unknown }).$schema === undefined
      ) {
        (parsed as { $schema: string }).$schema = 'http://json-schema.org/draft-07/schema#';
      }
      ajv.compile(parsed as object);
    } catch (err) {
      findings.push({
        code: 'SCHEMA_INVALID',
        message: `Schema '${name}' is not a valid JSON Schema: ${(err as Error).message}`,
        path: full,
        remediation: 'Repair the schema, or re-run `agentic init` to restore it.',
      });
    }
  }
  return findings;
}

/**
 * Core check pipeline. Returns the raw report plus context used by
 * `doctor` to extend the analysis.
 */
export async function runValidateChecks(projectRoot: string): Promise<{
  report: ValidationReport;
  manifest: PlatformManifest | null;
  allModules: ModuleMeta[];
  platformRoot: string;
}> {
  const report = emptyReport();
  const manifestPath = path.join(projectRoot, MANIFEST_SUBPATH);

  // 1. MANIFEST_PRESENT
  if (!(await fileExists(manifestPath))) {
    addError(report, {
      code: 'MANIFEST_MISSING',
      message: 'platform-manifest.json not found.',
      path: manifestPath,
      remediation: 'Run `agentic init` in this project root.',
    });
    return {
      report,
      manifest: null,
      allModules: [],
      platformRoot: await findPlatformRoot(),
    };
  }

  // 2. MANIFEST_VALID
  let manifest: PlatformManifest | null = null;
  try {
    manifest = await readManifest(path.join(projectRoot, AGENT_DIR));
  } catch (err) {
    if (err instanceof ManifestError) {
      addError(report, {
        code: 'MANIFEST_INVALID',
        message: err.message,
        path: manifestPath,
        remediation: err.remediation,
      });
      return {
        report,
        manifest: null,
        allModules: [],
        platformRoot: await findPlatformRoot(),
      };
    }
    throw err;
  }
  if (manifest === null) {
    addError(report, {
      code: 'MANIFEST_MISSING',
      message: 'platform-manifest.json not found.',
      path: manifestPath,
      remediation: 'Run `agentic init` in this project root.',
    });
    return {
      report,
      manifest: null,
      allModules: [],
      platformRoot: await findPlatformRoot(),
    };
  }

  const platformRoot = await findPlatformRoot();
  const allModules = await loadAllModules(platformRoot);
  const manifestModuleNames = Object.keys(manifest.modules);

  // 3. MODULES_EXIST
  for (const name of manifestModuleNames) {
    const meta = allModules.find((m) => m.name === name);
    if (meta === undefined) {
      addError(report, {
        code: 'MODULE_FILE_MISSING',
        message: `Module '${name}' referenced by the manifest does not exist in the platform.`,
        remediation: `Install module '${name}' or remove it from the manifest.`,
      });
      continue;
    }
    const declaredVersion = manifest.modules[name];
    if (declaredVersion !== meta.version) {
      addWarning(report, {
        code: 'MODULE_VERSION_MISMATCH',
        message: `Module '${name}' is pinned at ${declaredVersion} in the manifest, but platform ships ${meta.version}.`,
        remediation: `Run \`agentic update ${name}\` to re-pin.`,
      });
    }
  }

  // 4. CONTRIBUTIONS_PRESENT
  const profiles = await loadProfiles(platformRoot);
  const profileSpec: ProfileSpec | undefined = profiles[manifest.profile];
  const skillsEnabled = profileSpec?.skills_enabled;
  for (const name of manifestModuleNames) {
    const meta = allModules.find((m) => m.name === name);
    if (meta === undefined) continue;
    const checks = enumerateContributions(meta, projectRoot, skillsEnabled);
    for (const chk of checks) {
      if (!(await fileExists(chk.expectedPath))) {
        addError(report, {
          code: 'MODULE_FILE_MISSING',
          message: `Module '${chk.moduleName}' contributes '${chk.contribPath}' but the rendered file is missing.`,
          path: chk.expectedPath,
          remediation: 'Re-run `agentic init` or restore the file from source control.',
        });
      }
    }
  }

  // 5. COMPOSITION_RULES
  for (const f of checkComposition(manifestModuleNames, allModules)) {
    addError(report, f);
  }

  // 6. SCHEMA_REFS
  for (const f of await checkSchemaFiles(projectRoot)) {
    addError(report, f);
  }

  return { report, manifest, allModules, platformRoot };
}

export function renderReport(
  report: ValidationReport,
  opts: { json?: boolean; verbose?: boolean } = {},
): string {
  return opts.json === true ? renderJson(report) : renderHuman(report, opts.verbose === true);
}

export async function validate(options: ValidateOptions = {}): Promise<ValidationReport> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const json = options.json ?? process.argv.includes('--json');
  const verbose = options.verbose ?? process.argv.includes('--verbose');
  const exitOnCompletion = options.exitOnCompletion ?? true;

  const { report } = await runValidateChecks(projectRoot);

  const rendered = renderReport(report, { json, verbose });
  process.stdout.write(`${rendered}\n`);
  const code = exitCodeFor(report);
  if (exitOnCompletion && code !== 0) {
    process.exit(code);
  }
  return report;
}
