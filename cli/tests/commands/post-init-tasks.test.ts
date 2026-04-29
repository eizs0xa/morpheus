/**
 * Unit tests for writePostInitTasks.
 *
 * Verifies that:
 *  - brownfield mode writes 01-author-constitution.md
 *  - brownfield mode with existing docs also writes 02-audit-docs.md
 *  - new-project mode writes nothing
 *  - constitution prompt contains pre-filled manifest values
 *  - docs prompt lists detected files
 */
import { describe, it, expect, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { writePostInitTasks } from '../../src/commands/_init/post-init-tasks.js';
import type { ResolvedAnswers } from '../../src/commands/_init/answer-sources.js';

const tmpDirs: string[] = [];

async function makeTmp(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `pit-${prefix}-`));
  tmpDirs.push(dir);
  return dir;
}

afterAll(async () => {
  for (const d of tmpDirs) await fs.rm(d, { recursive: true, force: true });
});

const baseAnswers: ResolvedAnswers = {
  profile: 'builder',
  stacks: ['stack-python'],
  workspace: 'workspace-microsoft',
  pm: 'none',
  git: 'git-github',
  project_name: 'test-project',
  primary_owner_email: 'owner@example.com',
  jira_project_key: '',
  jira_site_url: '',
  initiative_key: '',
  release_cadence: 'weekly',
  teams_webhook_url: '',
  primary_channel_id: '',
  primary_channel_name: '',
  chat_space_id: '',
  node_version: '',
  package_manager_node: 'pnpm',
  python_version: '3.12',
  package_manager_python: 'pip',
  project_description: '',
  domains: [],
};

describe('writePostInitTasks', () => {
  it('new-project mode writes no task files', async () => {
    const root = await makeTmp('new');
    const result = await writePostInitTasks(root, 'new', baseAnswers);

    expect(result.constitutionTask).toBe('');
    expect(result.docsTask).toBeNull();
    expect(result.finalReportTask).toBe('');

    // .agent/tasks/ should not have been created
    await expect(fs.access(path.join(root, '.agent', 'tasks'))).rejects.toThrow();
  });

  it('brownfield mode always writes 01-author-constitution.md', async () => {
    const root = await makeTmp('bf-nomdocs');
    await fs.mkdir(path.join(root, '.git'), { recursive: true });

    const result = await writePostInitTasks(root, 'brownfield', baseAnswers);

    expect(result.constitutionTask).toBe(path.join('.agent', 'tasks', '01-author-constitution.md'));
    expect(result.docsTask).toBeNull(); // no existing docs in empty root
    expect(result.finalReportTask).toBe(path.join('.agent', 'tasks', '99-finalize-report.md'));

    const content = await fs.readFile(
      path.join(root, '.agent', 'tasks', '01-author-constitution.md'),
      'utf-8',
    );
    expect(content).toContain('task: author-constitution');
    expect(content).toContain('skill: constitution-author');
    expect(content).toContain('test-project');
    expect(content).toContain('builder');
    expect(content).toContain('stack-python');
    expect(content).toContain('workspace-microsoft');

    const finalContent = await fs.readFile(
      path.join(root, '.agent', 'tasks', '99-finalize-report.md'),
      'utf-8',
    );
    expect(finalContent).toContain('task: finalize-init-report');
    expect(finalContent).toContain('skill: morpheus-orchestrator');
    expect(finalContent).toContain('MORPHEUS_INIT_REPORT.md');
  });

  it('brownfield mode with existing .md docs writes 02-audit-docs.md listing them', async () => {
    const root = await makeTmp('bf-docs');
    await fs.mkdir(path.join(root, '.git'), { recursive: true });
    // Place a non-Morpheus root doc
    await fs.writeFile(path.join(root, 'ARCHITECTURE.md'), '# Arch\n', 'utf-8');
    // And a docs/ subdirectory
    await fs.mkdir(path.join(root, 'docs'), { recursive: true });
    await fs.writeFile(path.join(root, 'docs', 'setup.md'), '# Setup\n', 'utf-8');

    const result = await writePostInitTasks(root, 'brownfield', baseAnswers);

    expect(result.docsTask).toBe(path.join('.agent', 'tasks', '02-audit-docs.md'));

    const content = await fs.readFile(
      path.join(root, '.agent', 'tasks', '02-audit-docs.md'),
      'utf-8',
    );
    expect(content).toContain('task: audit-and-rewrite-docs');
    expect(content).toContain('ARCHITECTURE.md');
    expect(content).toContain(path.join('docs', 'setup.md'));
    expect(content).toContain('test-project');
  });

  it('brownfield mode skips Morpheus-generated files from doc list', async () => {
    const root = await makeTmp('bf-skip');
    await fs.mkdir(path.join(root, '.git'), { recursive: true });
    // These are Morpheus-generated — should NOT appear in the audit task
    for (const f of ['AGENTS.md', 'CLAUDE.md', 'CONSTITUTION.md']) {
      await fs.writeFile(path.join(root, f), `# ${f}\n`, 'utf-8');
    }
    // This is a real user doc — should appear
    await fs.writeFile(path.join(root, 'RUNBOOK.md'), '# Runbook\n', 'utf-8');

    const result = await writePostInitTasks(root, 'brownfield', baseAnswers);

    expect(result.docsTask).not.toBeNull();
    const content = await fs.readFile(
      path.join(root, result.docsTask!),
      'utf-8',
    );
    expect(content).toContain('RUNBOOK.md');
    expect(content).not.toContain('AGENTS.md');
    expect(content).not.toContain('CLAUDE.md');
    expect(content).not.toContain('CONSTITUTION.md');
  });

  it('initialized (resume) mode writes no task files', async () => {
    const root = await makeTmp('resume');
    const result = await writePostInitTasks(root, 'initialized', baseAnswers);

    expect(result.constitutionTask).toBe('');
    expect(result.docsTask).toBeNull();
    expect(result.finalReportTask).toBe('');
  });
});
