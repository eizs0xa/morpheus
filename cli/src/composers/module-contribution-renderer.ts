import { promises as fs } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { ModuleMeta } from '../detectors/stack.js';

type ContribType = 'skills' | 'workflows' | 'templates' | 'schemas' | 'instructions' | 'hooks';

interface RenderAnswers {
  profile: string;
  stacks: string[];
  project_name: string;
  workspace: string;
  pm: string;
  git: string;
  primary_owner_email: string;
  node_version: string;
  python_version: string;
  package_manager_node: string;
  package_manager_python: string;
  teams_webhook_url: string;
  primary_channel_id: string;
  primary_channel_name: string;
  chat_space_id: string;
  jira_project_key?: string;
  jira_site_url?: string;
  initiative_key?: string;
}

export interface RenderModuleContributionsInput {
  platformRoot: string;
  projectRoot: string;
  modules: ModuleMeta[];
  answers: RenderAnswers;
}

interface ProfileSpec {
  skills_enabled?: 'all' | string[];
}

const TARGET_DIR: Record<ContribType, string> = {
  skills: path.join('.agent', 'skills'),
  workflows: path.join('.github', 'workflows'),
  templates: path.join('.agent', 'templates'),
  schemas: path.join('.agent', 'schemas'),
  instructions: path.join('.github', 'instructions'),
  hooks: path.join('.agent', 'hooks'),
};

async function loadProfiles(platformRoot: string): Promise<Record<string, ProfileSpec>> {
  try {
    const raw = await fs.readFile(
      path.join(platformRoot, 'modules', 'core', 'profiles.yaml'),
      'utf-8',
    );
    const parsed = YAML.parse(raw) as { profiles?: Record<string, ProfileSpec> } | null;
    return parsed?.profiles ?? {};
  } catch {
    return {};
  }
}

function skillEnabled(skillsEnabled: 'all' | string[] | undefined, item: string): boolean {
  if (skillsEnabled === undefined || skillsEnabled === 'all') return true;
  const base = path.basename(item).replace(/\.md$/, '');
  const normalized = new Set(
    skillsEnabled.map((s) => (s.endsWith('-read') ? s.slice(0, -'-read'.length) : s)),
  );
  return normalized.has(base);
}

function destinationFor(projectRoot: string, type: ContribType, item: string): string {
  const prefix = `${type}/`;
  let rel = item.startsWith(prefix) ? item.slice(prefix.length) : item;
  if (rel.endsWith('.tmpl')) rel = rel.slice(0, -'.tmpl'.length);
  return path.join(projectRoot, TARGET_DIR[type], rel);
}

function templateVariables(answers: RenderAnswers, moduleName: string): Record<string, string> {
  const pmTool = answers.pm === 'none' ? '' : answers.pm;
  const packageManager = moduleName === 'stack-python'
    ? answers.package_manager_python
    : answers.package_manager_node;
  return {
    project_name: answers.project_name,
    profile: answers.profile,
    primary_stacks: answers.stacks.join(', '),
    workspace: answers.workspace,
    pm: pmTool,
    pm_tool: pmTool,
    git: answers.git,
    git_provider: answers.git,
    primary_owner_email: answers.primary_owner_email,
    node_version: answers.node_version,
    python_version: answers.python_version,
    package_manager: packageManager,
    package_manager_node: answers.package_manager_node,
    package_manager_python: answers.package_manager_python,
    test_runner: 'pytest',
    linter: 'ruff',
    teams_webhook_url: answers.teams_webhook_url,
    primary_channel_id: answers.primary_channel_id,
    primary_channel_name: answers.primary_channel_name,
    chat_space_id: answers.chat_space_id,
    jira_project_key: answers.jira_project_key ?? '',
    jira_site_url: answers.jira_site_url ?? '',
    initiative_key: answers.initiative_key ?? '',
    risk_tier: '1',
    agent_registry_id: '',
    branch_prefix_pattern: '^(feat|fix|chore|docs|refactor|test|style)/',
    default_branch: 'main',
    release_cadence: 'weekly',
  };
}

function renderTemplateText(body: string, vars: Record<string, string>): string {
  return body
    .replace(/{{\s*primary_stacks\s*\|[^}]+}}/g, vars.primary_stacks ?? '')
    .replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, (_match, key: string) => vars[key] ?? '');
}

async function writeContribution(
  source: string,
  dest: string,
  vars: Record<string, string>,
): Promise<void> {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const sourceStat = await fs.stat(source);
  if (source.endsWith('.tmpl')) {
    const rendered = renderTemplateText(await fs.readFile(source, 'utf-8'), vars);
    await fs.writeFile(dest, rendered, 'utf-8');
  } else {
    await fs.copyFile(source, dest);
  }
  await fs.chmod(dest, sourceStat.mode);
}

export async function renderModuleContributions(
  input: RenderModuleContributionsInput,
): Promise<void> {
  const profiles = await loadProfiles(input.platformRoot);
  const skillsEnabled = profiles[input.answers.profile]?.skills_enabled;
  const types: ContribType[] = [
    'skills',
    'workflows',
    'templates',
    'schemas',
    'instructions',
    'hooks',
  ];

  for (const module of input.modules) {
    const vars = templateVariables(input.answers, module.name);
    const contributes = (module.raw.contributes as Record<string, unknown> | undefined) ?? {};
    for (const type of types) {
      const list = contributes[type];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (typeof item !== 'string') continue;
        if (type === 'skills' && !skillEnabled(skillsEnabled, item)) continue;
        const source = path.join(module.path, item);
        const dest = destinationFor(input.projectRoot, type, item);
        await writeContribution(source, dest, vars);
      }
    }
  }
}