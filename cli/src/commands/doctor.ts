/**
 * `agentic doctor` — runs every `validate` check plus deeper health
 * probes: stale module versions, orphaned workflow files, CODEOWNERS
 * sanity, best-effort Jira reachability, constitution presence, and
 * git repo sanity.
 *
 * Exit codes mirror `validate`: 0 / 1 / 2.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  runValidateChecks,
  renderReport,
  type ValidationReport,
  type ValidationFinding,
} from './validate.js';
import {
  addError,
  addWarning,
  compareSemver,
  exitCodeFor,
} from './_shared/report.js';
import type { PlatformManifest } from '../util/manifest.js';
import type { ModuleMeta } from '../detectors/stack.js';

export interface DoctorOptions {
  projectRoot?: string;
  verbose?: boolean;
  json?: boolean;
  skipExternal?: boolean;
  /** Internal: suppress process.exit. Defaults to true. */
  exitOnCompletion?: boolean;
}

const PLATFORM_WORKFLOW_PATTERNS = [
  /^agent-pr-gate/,
  /^merge-queue/,
  /^release-train/,
  /^jira-/,
  /^morpheus-/,
];

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function safeReadDir(p: string): Promise<string[]> {
  try {
    return await fs.readdir(p);
  } catch {
    return [];
  }
}

function expectedWorkflowSet(
  manifest: PlatformManifest,
  allModules: ModuleMeta[],
): Set<string> {
  const expected = new Set<string>();
  for (const name of Object.keys(manifest.modules)) {
    const meta = allModules.find((m) => m.name === name);
    if (meta === undefined) continue;
    const contributes = (meta.raw.contributes as Record<string, unknown> | undefined) ?? {};
    const list = contributes.workflows;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== 'string') continue;
      let rel = item;
      if (rel.startsWith('workflows/')) rel = rel.slice('workflows/'.length);
      if (rel.endsWith('.tmpl')) rel = rel.slice(0, -'.tmpl'.length);
      expected.add(path.basename(rel));
    }
  }
  return expected;
}

async function checkStaleVersions(
  manifest: PlatformManifest,
  allModules: ModuleMeta[],
): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  for (const [name, declared] of Object.entries(manifest.modules)) {
    const meta = allModules.find((m) => m.name === name);
    if (meta === undefined) continue;
    if (compareSemver(declared, meta.version) < 0) {
      findings.push({
        code: 'STALE_MODULE_VERSIONS',
        message: `Module '${name}' pinned at ${declared}; platform ships ${meta.version}.`,
        remediation: `Run \`agentic update ${name}\` to upgrade.`,
      });
    }
  }
  return findings;
}

async function checkOrphanedWorkflows(
  projectRoot: string,
  manifest: PlatformManifest,
  allModules: ModuleMeta[],
): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  const wfDir = path.join(projectRoot, '.github', 'workflows');
  const entries = await safeReadDir(wfDir);
  const expected = expectedWorkflowSet(manifest, allModules);
  for (const name of entries) {
    if (!name.endsWith('.yml') && !name.endsWith('.yaml')) continue;
    const isPlatformish = PLATFORM_WORKFLOW_PATTERNS.some((re) => re.test(name));
    if (!isPlatformish) continue;
    if (!expected.has(name)) {
      findings.push({
        code: 'ORPHANED_WORKFLOWS',
        message: `Workflow '${name}' appears to be Morpheus-related but is not contributed by any installed module.`,
        path: path.join(wfDir, name),
        remediation: 'Remove the file or re-install the module that used to contribute it.',
      });
    }
  }
  return findings;
}

async function checkCodeowners(
  projectRoot: string,
  manifest: PlatformManifest,
): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  const hasPm = Object.keys(manifest.modules).some((n) => n.startsWith('pm-'));
  if (!hasPm) return findings;
  const candidates = [
    path.join(projectRoot, 'CODEOWNERS'),
    path.join(projectRoot, '.github', 'CODEOWNERS'),
    path.join(projectRoot, 'docs', 'CODEOWNERS'),
  ];
  let found: string | null = null;
  for (const c of candidates) {
    if (await exists(c)) {
      found = c;
      break;
    }
  }
  if (found === null) {
    findings.push({
      code: 'CODEOWNERS_UNCONFIGURED',
      message: 'CODEOWNERS not found but a pm integration is installed.',
      remediation: 'Create a CODEOWNERS file mapping paths to real GitHub handles.',
    });
    return findings;
  }
  const body = await fs.readFile(found, 'utf-8');
  const hasRealHandle = /@[a-zA-Z0-9][a-zA-Z0-9-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9-]*)?/m.test(body);
  const isPlaceholder = /@platform-team\b/.test(body) || !hasRealHandle;
  if (isPlaceholder) {
    findings.push({
      code: 'CODEOWNERS_UNCONFIGURED',
      message: 'CODEOWNERS contains placeholder handle(s) (e.g. @platform-team) or no real handles.',
      path: found,
      remediation: 'Replace placeholders with actual GitHub usernames or team slugs.',
    });
  }
  return findings;
}

function checkJiraReachable(
  manifest: PlatformManifest,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const hasJira = Object.keys(manifest.modules).includes('pm-jira');
  if (!hasJira) return findings;
  // TODO: real Jira ping — for now we just sanity-check the manifest.
  // The manifest schema doesn't currently carry jira_site_url, so until
  // init starts persisting per-module config we can only warn on the
  // absence of that signal.
  const record = manifest as unknown as Record<string, unknown>;
  const cfg = record.integrations as Record<string, unknown> | undefined;
  const jiraCfg = cfg?.jira as Record<string, unknown> | undefined;
  const url = jiraCfg?.jira_site_url;
  if (typeof url !== 'string' || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.replace(/^https?:\/\//, ''))) {
    findings.push({
      code: 'JIRA_UNREACHABLE',
      message: 'pm-jira is installed but no valid jira_site_url was recorded in the manifest.',
      remediation:
        'Run `agentic init --resume` and provide the Jira site URL, or set it in manifest.integrations.jira.jira_site_url.',
    });
  }
  return findings;
}

async function checkConstitutionPresent(projectRoot: string): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  const p = path.join(projectRoot, '.agent', 'constitution.md');
  try {
    const stat = await fs.stat(p);
    if (stat.size === 0) {
      findings.push({
        code: 'CONSTITUTION_EMPTY',
        message: '.agent/constitution.md exists but is empty.',
        path: p,
        remediation: 'Populate the constitution or re-run `agentic init`.',
      });
    }
  } catch {
    findings.push({
      code: 'CONSTITUTION_MISSING',
      message: '.agent/constitution.md is missing.',
      path: p,
      remediation: 'Create the project constitution via `agentic init` or manual copy from templates.',
    });
  }
  return findings;
}

async function checkGitSane(projectRoot: string): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  const gitDir = path.join(projectRoot, '.git');
  if (!(await exists(gitDir))) {
    findings.push({
      code: 'GIT_MISSING',
      message: 'No .git directory found.',
      path: gitDir,
      remediation: 'Initialize the repository with `git init`.',
    });
    return findings;
  }
  try {
    const head = await fs.readFile(path.join(gitDir, 'HEAD'), 'utf-8');
    const match = /^ref:\s*refs\/heads\/(.+)\s*$/m.exec(head);
    if (match !== null && (match[1] === 'main' || match[1] === 'master')) {
      findings.push({
        code: 'GIT_DEFAULT_BRANCH',
        message: `Current branch is '${match[1]}'. Consider working on a feature branch.`,
        remediation: 'Create a feature branch before making changes: `git checkout -b <branch>`.',
      });
    }
  } catch {
    // HEAD unreadable — skip silently; not worth a warning.
  }
  return findings;
}

export async function runDoctorChecks(
  projectRoot: string,
  skipExternal: boolean,
): Promise<ValidationReport> {
  const { report, manifest, allModules } = await runValidateChecks(projectRoot);
  // If validate bailed out before manifest load, nothing deeper to check.
  if (manifest === null) return report;

  for (const f of await checkStaleVersions(manifest, allModules)) addWarning(report, f);
  for (const f of await checkOrphanedWorkflows(projectRoot, manifest, allModules)) {
    addWarning(report, f);
  }
  for (const f of await checkCodeowners(projectRoot, manifest)) addWarning(report, f);
  if (!skipExternal) {
    for (const f of checkJiraReachable(manifest)) addWarning(report, f);
  }
  for (const f of await checkConstitutionPresent(projectRoot)) {
    // Missing constitution is a hard error; empty is a warning.
    if (f.code === 'CONSTITUTION_MISSING') addError(report, f);
    else addWarning(report, f);
  }
  for (const f of await checkGitSane(projectRoot)) addWarning(report, f);
  return report;
}

export async function doctor(options: DoctorOptions = {}): Promise<ValidationReport> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const json = options.json ?? process.argv.includes('--json');
  const verbose = options.verbose ?? process.argv.includes('--verbose');
  const skipExternal = options.skipExternal ?? process.argv.includes('--skip-external');
  const exitOnCompletion = options.exitOnCompletion ?? true;

  const report = await runDoctorChecks(projectRoot, skipExternal);

  process.stdout.write(`${renderReport(report, { json, verbose })}\n`);
  const code = exitCodeFor(report);
  if (exitOnCompletion && code !== 0) {
    process.exit(code);
  }
  return report;
}

export type { ValidationReport, ValidationFinding } from './_shared/report.js';
