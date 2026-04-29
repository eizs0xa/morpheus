/**
 * Write post-init agent task files into `.agent/tasks/` after a brownfield
 * overlay completes.
 *
 * Two tasks are produced:
 *  01-author-constitution.md  — always written; tells the agent to invoke
 *                               constitution-author and fill the placeholder.
 *  02-audit-docs.md           — written only when existing docs are detected;
 *                               tells the agent to restructure them into the
 *                               Morpheus role-based docs layout.
 */
import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';
import type { ResolvedAnswers } from './answer-sources.js';
import type { InitMode } from './mode-detect.js';

// Files written by Morpheus itself — do not treat as "existing docs" to migrate.
const MORPHEUS_GENERATED = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'copilot-instructions.md',
  'CONSTITUTION.md',
  'platform-manifest.json',
  'CHANGELOG.md',
  'LICENSE',
]);

/** Recursively collect .md files under a directory. */
async function collectMd(dir: string, base: string): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent<string>[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true, encoding: 'utf8' }) as Dirent<string>[];
  } catch {
    return results;
  }
  for (const entry of entries) {
    const name = entry.name;
    const full = path.join(dir, name);
    if (entry.isDirectory()) {
      results.push(...(await collectMd(full, base)));
    } else if (entry.isFile() && name.endsWith('.md')) {
      results.push(path.relative(base, full));
    }
  }
  return results;
}

/**
 * Detect documentation files that pre-date the Morpheus overlay and should be
 * migrated.  Scans root-level .md files (excluding Morpheus-generated ones)
 * and anything under docs/.
 */
async function scanExistingDocs(projectRoot: string): Promise<string[]> {
  const found: string[] = [];

  // Root-level markdown
  const rootEntries = await fs.readdir(projectRoot, { withFileTypes: true, encoding: 'utf8' }) as Dirent<string>[];
  for (const entry of rootEntries) {
    const name = entry.name;
    if (
      entry.isFile() &&
      name.endsWith('.md') &&
      !MORPHEUS_GENERATED.has(name)
    ) {
      found.push(name);
    }
  }

  // Entire docs/ tree
  const docsDir = path.join(projectRoot, 'docs');
  found.push(...(await collectMd(docsDir, projectRoot)));

  return found;
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildConstitutionPrompt(answers: ResolvedAnswers): string {
  const stackList = answers.stacks.join(', ') || '(detect from repo)';
  return `---
task: author-constitution
skill: constitution-author
priority: critical
status: pending
---

# Task: Author the project constitution

The project was just initialised by Morpheus. A \`constitution.md\` placeholder has been
written to \`.agent/constitution.md\` but is full of \`<fill in>\` markers. This file is
your instruction to complete it.

## Why this must be done first

Every subsequent skill — planner, spec-author, reviewer, fixer — cites the constitution as
the source of non-negotiables and scope boundaries. An unfilled constitution means agents
operate without rules.

## How to complete this task

1. Open \`.agent/skills/constitution-author.md\` and read the full skill.
2. Pre-fill the fields below from \`platform-manifest.json\` (do not re-ask):

| Field | Pre-filled value |
|---|---|
| project_name | ${answers.project_name} |
| profile | ${answers.profile} |
| primary_stacks | ${stackList} |
| workspace | ${answers.workspace} |
| pm_tool | ${answers.pm} |
| git_provider | ${answers.git} |

3. Work through interview blocks A–F in the skill. If the steward of record is not present
   in this session, produce a **draft** — mark every section you cannot confirm with
   \`<!-- draft: needs steward review -->\`.
4. Replace every \`<fill in>\` and \`<bullet>\` placeholder in \`.agent/constitution.md\`
   with the interview output.
5. Open a PR titled \`docs: author project constitution\` and request steward review before
   merging.
6. Update \`status: done\` in this file once the PR is open.

## Notes

- Never weaken platform stop-lines (listed in §3 of the template).
- If a section is genuinely not applicable (e.g. no third-party integrations), write
  \`N/A — <reason>\` rather than leaving the placeholder.
- The interview transcript should be saved alongside the constitution at
  \`.agent/constitution-interview.md\` for future amendments.
`;
}

function buildDocsAuditPrompt(existingDocs: string[], answers: ResolvedAnswers): string {
  const stackList = answers.stacks.join(', ') || '(detect from repo)';
  const docList = existingDocs.map(d => `- \`${d}\``).join('\n');
  return `---
task: audit-and-rewrite-docs
skill: lore-curator
priority: high
status: pending
---

# Task: Audit and restructure existing documentation

Morpheus was overlaid on an existing repository. The following documentation files were
detected that pre-date the overlay. They contain institutional knowledge that must be
preserved and restructured into the Morpheus role-based documentation format.

## Detected existing docs

${docList}

## Target structure

Morpheus organises documentation by reader role under \`docs/\`:

\`\`\`
docs/
  getting-started.md          ← "zero to first run" for any new contributor
  for-engineers/              ← implementation guides, walkthroughs
  for-eng-managers/           ← rollout, escalation, measuring impact
  for-authors/                ← PRD-to-spec workflow
  for-explorers/              ← read-only codebase tour
  for-stewards/               ← constitution, governance, amendments
  for-verifiers/              ← test plans, holdout authoring
  reference/                  ← schemas, CLI reference, module catalog
  decisions/                  ← ADRs (one file per decision, adr-NNN-title.md)
\`\`\`

## How to complete this task

1. Read every file listed above in full. Do not skim.
2. Classify each document's primary audience:
   - Setup / onboarding → \`docs/getting-started.md\`
   - Engineering how-tos → \`docs/for-engineers/<name>.md\`
   - API / schema reference → \`docs/reference/<name>.md\`
   - Architecture decisions → \`docs/decisions/adr-NNN-<title>.md\`
   - Governance / ownership → \`docs/for-stewards/<name>.md\`
   - Manager-facing → \`docs/for-eng-managers/<name>.md\`
3. Rewrite each document using:
   - Plain, declarative language (active voice, present tense)
   - H1 = document title, H2 = major section, H3 = subsection
   - Numbered lists for ordered steps; bullet lists for unordered items
   - Code blocks for every command, snippet, or config excerpt
4. Move the rewritten file to the correct \`docs/<role>/\` location.
5. At the top of each **original** file, prepend:
   \`<!-- migrated to docs/<role>/<file>.md — do not edit here -->\`
   Do NOT delete the original files in this PR; deletion is a follow-up after review.
6. If \`README.md\` exists at the root:
   - Extract "getting started" content → \`docs/getting-started.md\`
   - Extract reference/API content → \`docs/reference/\`
   - Reduce \`README.md\` to a short overview + links to \`docs/\`
7. Open a single PR titled \`docs: migrate existing docs to Morpheus structure\` covering
   all moves and rewrites.
8. Update \`status: done\` in this file once the PR is open.

## Project context

| Field | Value |
|---|---|
| project_name | ${answers.project_name} |
| profile | ${answers.profile} |
| primary_stacks | ${stackList} |
| workspace | ${answers.workspace} |
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PostInitTaskResult {
  constitutionTask: string;
  docsTask: string | null;
}

/**
 * Write post-init agent task files.  Only runs for brownfield overlays; is a
 * no-op for new-project and re-init (resume) modes.
 */
export async function writePostInitTasks(
  projectRoot: string,
  mode: InitMode,
  answers: ResolvedAnswers,
): Promise<PostInitTaskResult> {
  if (mode !== 'brownfield') {
    return { constitutionTask: '', docsTask: null };
  }

  const tasksDir = path.join(projectRoot, '.agent', 'tasks');
  await fs.mkdir(tasksDir, { recursive: true });

  // 1. Constitution task — always written for brownfield
  const constitutionTaskPath = path.join(tasksDir, '01-author-constitution.md');
  await fs.writeFile(constitutionTaskPath, buildConstitutionPrompt(answers), 'utf8');

  // 2. Docs audit task — only when existing docs are found
  const existingDocs = await scanExistingDocs(projectRoot);
  let docsTaskRel: string | null = null;
  if (existingDocs.length > 0) {
    const docsTaskPath = path.join(tasksDir, '02-audit-docs.md');
    await fs.writeFile(docsTaskPath, buildDocsAuditPrompt(existingDocs, answers), 'utf8');
    docsTaskRel = path.relative(projectRoot, docsTaskPath);
  }

  return {
    constitutionTask: path.relative(projectRoot, constitutionTaskPath),
    docsTask: docsTaskRel,
  };
}
