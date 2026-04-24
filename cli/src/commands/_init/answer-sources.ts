/**
 * Answer source merger for `agentic init`.
 *
 * Precedence (highest wins):
 *   1. InitOptions explicit flags (e.g. options.profile)
 *   2. YAML answers file (when options.answersFile is set)
 *   3. MORPHEUS_* environment variables
 *   4. Detected / default values
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ValidationError } from '../../util/errors.js';
import type { ProfileName } from '../../composers/module-resolver.js';

export interface ResolvedAnswers {
  profile: ProfileName;
  stacks: string[];
  workspace: string;
  pm: string; // 'none' | 'pm-jira' | ...
  git: string;
  domains: string[];
  project_name: string;
  project_description: string;
  primary_owner_email: string;
  jira_project_key: string;
  jira_site_url: string;
  initiative_key: string;
  release_cadence: string;
  node_version: string;
  python_version: string;
  package_manager_node: string;
  package_manager_python: string;
  teams_webhook_url: string;
  primary_channel_id: string;
  primary_channel_name: string;
  chat_space_id: string;
}

const VALID_PROFILES: ProfileName[] = [
  'builder',
  'verifier',
  'author',
  'explorer',
  'steward',
];

function parseProfile(value: string | undefined, fallback: ProfileName): ProfileName {
  if (value === undefined || value.length === 0) return fallback;
  if (!VALID_PROFILES.includes(value as ProfileName)) {
    throw new ValidationError(
      `Invalid profile '${value}'. Expected one of: ${VALID_PROFILES.join(', ')}.`,
      'Pass --profile <builder|verifier|author|explorer|steward> or set MORPHEUS_PROFILE.',
    );
  }
  return value as ProfileName;
}

function parseList(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return [];
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function loadAnswersFile(filePath: string): Promise<Record<string, unknown>> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new ValidationError(
      `Unable to read answers file '${filePath}': ${(err as Error).message}`,
      'Point --answers-file at a readable YAML file.',
    );
  }
  let parsed: unknown;
  try {
    parsed = YAML.parse(raw);
  } catch (err) {
    throw new ValidationError(
      `Answers file '${filePath}' is not valid YAML: ${(err as Error).message}`,
      'Fix the YAML syntax and re-run.',
    );
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError(
      `Answers file '${filePath}' must be a YAML mapping of key: value.`,
      'Rewrite the file as a top-level mapping (no leading list or scalar).',
    );
  }
  return parsed as Record<string, unknown>;
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

function list(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') return parseList(v);
  return undefined;
}

export interface AnswerInput {
  profileOverride?: ProfileName;
  answersFile?: string;
  projectRoot: string;
  detectedStacks: string[];
}

export async function resolveAnswers(input: AnswerInput): Promise<ResolvedAnswers> {
  const file =
    input.answersFile !== undefined && input.answersFile.length > 0
      ? await loadAnswersFile(input.answersFile)
      : {};
  const env = process.env;

  const pick = (fileKey: string, envKey: string, fallback: string): string =>
    str(file[fileKey]) ?? env[envKey] ?? fallback;

  const pickList = (fileKey: string, envKey: string, fallback: string[]): string[] =>
    list(file[fileKey]) ?? parseList(env[envKey]) ?? fallback;

  const profile = parseProfile(
    input.profileOverride ?? str(file.profile) ?? env.MORPHEUS_PROFILE,
    'builder',
  );

  const projectName =
    str(file.project_name) ??
    env.MORPHEUS_PROJECT_NAME ??
    path.basename(input.projectRoot) ??
    'morpheus-project';

  return {
    profile,
    stacks: pickList('stacks', 'MORPHEUS_STACKS', input.detectedStacks),
    workspace: pick('workspace', 'MORPHEUS_WORKSPACE', 'workspace-microsoft'),
    pm: pick('pm', 'MORPHEUS_PM', 'none'),
    git: pick('git', 'MORPHEUS_GIT', 'git-github'),
    domains: pickList('domains', 'MORPHEUS_DOMAINS', []),
    project_name: projectName,
    project_description: pick(
      'project_description',
      'MORPHEUS_PROJECT_DESCRIPTION',
      `${projectName} — bootstrapped by Morpheus`,
    ),
    primary_owner_email: pick(
      'primary_owner_email',
      'MORPHEUS_PRIMARY_OWNER_EMAIL',
      'owner@example.com',
    ),
    jira_project_key: pick('jira_project_key', 'MORPHEUS_JIRA_PROJECT_KEY', ''),
    jira_site_url: pick('jira_site_url', 'MORPHEUS_JIRA_SITE_URL', ''),
    initiative_key: pick('initiative_key', 'MORPHEUS_JIRA_INITIATIVE_KEY', ''),
    release_cadence: pick('release_cadence', 'MORPHEUS_RELEASE_CADENCE', 'weekly'),
    node_version: pick('node_version', 'MORPHEUS_NODE_VERSION', '20'),
    python_version: pick('python_version', 'MORPHEUS_PYTHON_VERSION', '3.12'),
    package_manager_node: pick(
      'package_manager_node',
      'MORPHEUS_PACKAGE_MANAGER_NODE',
      'pnpm',
    ),
    package_manager_python: pick(
      'package_manager_python',
      'MORPHEUS_PACKAGE_MANAGER_PYTHON',
      'pip',
    ),
    teams_webhook_url: pick('teams_webhook_url', 'MORPHEUS_TEAMS_WEBHOOK_URL', ''),
    primary_channel_id: pick('primary_channel_id', 'MORPHEUS_PRIMARY_CHANNEL_ID', ''),
    primary_channel_name: pick(
      'primary_channel_name',
      'MORPHEUS_PRIMARY_CHANNEL_NAME',
      'general',
    ),
    chat_space_id: pick('chat_space_id', 'MORPHEUS_CHAT_SPACE_ID', ''),
  };
}
