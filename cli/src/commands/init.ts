/**
 * `agentic init` — scaffold a new Morpheus project or overlay an existing
 * repository with the platform, producing `platform-manifest.json` and
 * writing the core scaffolding/templates.
 *
 * See EXECUTION_PLAN.md §3 WS-11 and Artifact B §2 for the design.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import chalk from 'chalk';
import {
  AgenticError,
  ComposeError,
  ManifestError,
  TemplateError,
  ValidationError,
} from '../util/errors.js';
import {
  readManifest,
  writeManifest,
  type PlatformManifest,
} from '../util/manifest.js';
import { detectHardware } from '../detectors/hardware.js';
import { classify, scanSignals } from '../detectors/project-type.js';
import { loadAllModules, matchStacks, type ModuleMeta } from '../detectors/stack.js';
import {
  resolveModules,
  type Profile,
  type ProfileName,
} from '../composers/module-resolver.js';
import { ensureCopierAvailable, renderTemplate } from '../composers/file-renderer.js';
import { renderModuleContributions } from '../composers/module-contribution-renderer.js';
import { askInitQuestions } from '../prompts/index.js';
import { detectMode, type InitMode } from './_init/mode-detect.js';
import { resolvePlatformRoot } from './_init/platform-root.js';
import { resolveAnswers, type ResolvedAnswers } from './_init/answer-sources.js';
import { checkInitiative } from './_init/jira-preflight.js';
import { printNextSteps } from './_init/next-steps.js';
import { writePostInitTasks } from './_init/post-init-tasks.js';
import { printBanner, progress, note, success, warn } from './_init/banner.js';

const PLATFORM_VERSION = '0.1.0';

export interface InitOptions {
  profile?: ProfileName;
  resume?: boolean;
  nonInteractive?: boolean;
  answersFile?: string;
  projectRoot?: string;
}

/**
 * Build a minimal Profile struct for the module resolver. The resolver reads
 * stacks/workspace/pm/git/domains directly from the input — the Profile
 * object is currently metadata only.
 */
function buildProfile(name: ProfileName): Profile {
  return {
    name,
    modules: ['core'],
    skills_enabled: 'all',
    scaffolding: 'full',
    can_commit_code: name === 'builder' || name === 'verifier' || name === 'steward',
  };
}

/** Map `detected_hardware.os` to the copier `hardware_os` enum. */
function hardwareOsForTemplate(os: string): 'darwin' | 'linux' | 'win32' {
  if (os === 'darwin' || os === 'linux' || os === 'win32') return os;
  return 'linux';
}

/**
 * Translate ResolvedAnswers into the exact payload copier's new-project
 * template expects. Keep keys aligned with `templates/new-project/copier.yml`.
 */
function buildNewProjectAnswers(
  ans: ResolvedAnswers,
  hardwareOs: string,
): Record<string, unknown> {
  return {
    project_name: ans.project_name,
    project_description: ans.project_description,
    profile: ans.profile,
    primary_owner_email: ans.primary_owner_email,
    workspace: ans.workspace,
    git_provider: ans.git,
    pm_tool: ans.pm,
    stacks: ans.stacks,
    hardware_os: hardwareOsForTemplate(hardwareOs),
    release_cadence: ans.release_cadence,
    jira_project_key: ans.jira_project_key,
    jira_site_url: ans.jira_site_url,
    initiative_key: ans.initiative_key,
    teams_webhook_url: ans.teams_webhook_url,
    primary_channel_id: ans.primary_channel_id,
    chat_space_id: ans.chat_space_id,
    primary_channel_name: ans.primary_channel_name,
    node_version: ans.node_version,
    package_manager_node: ans.package_manager_node,
    python_version: ans.python_version,
    package_manager_python: ans.package_manager_python,
  };
}

/** Same mapping for the brownfield overlay template. */
function buildBrownfieldAnswers(
  ans: ResolvedAnswers,
): Record<string, unknown> {
  return {
    project_name: ans.project_name,
    profile: ans.profile,
    stacks: ans.stacks.join(','),
    workspace: ans.workspace,
    pm: ans.pm === 'none' ? '' : ans.pm,
    git: ans.git,
    jira_project_key: ans.jira_project_key,
    primary_stacks: ans.stacks.join(','),
    pm_tool: ans.pm,
    git_provider: ans.git,
    platform_version: PLATFORM_VERSION,
    teams_webhook_url: ans.teams_webhook_url,
    primary_channel_id: ans.primary_channel_id,
    primary_channel_name: ans.primary_channel_name,
    chat_space_id: ans.chat_space_id,
    existing_conventions_preserved: true,
    // Non-interactive overlays bypass the literal consent prompt; the gate
    // the CLI actually enforces is `mode === 'brownfield'` + mode-detect.
    consent_to_overlay: 'I UNDERSTAND',
  };
}

/**
 * Build the final PlatformManifest from resolved answers + detection +
 * composed modules. Pins every module to PLATFORM_VERSION for now — a
 * future WS will read real module versions from their manifests.
 */
function buildManifest(
  ans: ResolvedAnswers,
  hardware: { os: string; arch: string; shell?: string },
  projectType: PlatformManifest['project_type'],
  modulesOrdered: ModuleMeta[],
  previous: PlatformManifest | null,
): PlatformManifest {
  const now = new Date().toISOString();
  const modules: Record<string, string> = {};
  for (const m of modulesOrdered) {
    modules[m.name] = m.version;
  }
  return {
    platform_version: previous?.platform_version ?? PLATFORM_VERSION,
    profile: ans.profile,
    detected_hardware: {
      os: hardware.os,
      arch: hardware.arch,
      ...(hardware.shell ? { shell: hardware.shell } : {}),
    },
    project_type: projectType,
    modules,
    governance: previous?.governance ?? {
      risk_tier: 1,
      decommission: { status: 'active' },
    },
    initialized_by: previous?.initialized_by ?? ans.primary_owner_email,
    initialized_at: previous?.initialized_at ?? now,
    last_updated_at: now,
  };
}

async function mirrorManifestToAgent(projectRoot: string): Promise<void> {
  const rootManifest = path.join(projectRoot, 'platform-manifest.json');
  const agentDir = path.join(projectRoot, '.agent');
  const agentManifest = path.join(agentDir, 'platform-manifest.json');
  await fs.mkdir(agentDir, { recursive: true });
  await fs.copyFile(rootManifest, agentManifest);
}

async function runPreserveScript(
  platformRoot: string,
  projectRoot: string,
): Promise<void> {
  const script = path.join(
    platformRoot,
    'templates',
    'brownfield-overlay',
    'scripts',
    'preserve-existing.sh',
  );
  try {
    await fs.access(script);
  } catch {
    throw new TemplateError(
      `Brownfield preserve script not found at ${script}.`,
      'Run the CLI from a Morpheus checkout that includes templates/brownfield-overlay/.',
    );
  }
  try {
    await execa('bash', [script, '--target', projectRoot, '--force'], { stdio: 'pipe' });
  } catch (err) {
    const e = err as { stderr?: unknown; stdout?: unknown; message?: string };
    const stderr =
      typeof e.stderr === 'string'
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString()
          : '';
    const msg = stderr.length > 0 ? stderr : (e.message ?? 'preserve-existing.sh failed');
    throw new TemplateError(
      `Brownfield preserve step failed: ${msg.trim()}`,
      'Inspect the script output above. Typical causes: the repo already has .agent/platform-manifest.json (run `agentic update`), or a prior overlay run aborted and .morpheus-preflight.json lingers.',
    );
  }
}

/** Wrap unknown errors in a generic ValidationError. */
function classifyError(err: unknown): AgenticError {
  if (err instanceof AgenticError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  return new ValidationError(msg, 'See logs for details.');
}

export async function init(options: InitOptions = {}): Promise<void> {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const nonInteractive = options.nonInteractive === true;

  printBanner(projectRoot);

  // ------------------------------------------------------------------
  // [1/5] mode + detection
  // ------------------------------------------------------------------
  progress(1, 'Detecting project mode and stack');
  const mode: InitMode = await detectMode(projectRoot);

  if (mode === 'initialized' && options.resume !== true) {
    throw new ValidationError(
      `Project at ${projectRoot} is already initialized (platform-manifest.json exists).`,
      'Run `agentic update` to refresh modules, or pass `--resume` to re-run init against the existing manifest.',
    );
  }

  note(`mode: ${mode === 'initialized' ? 'initialized (--resume)' : mode}`);

  const hardware = detectHardware();
  note(`hardware: ${hardware.os}/${hardware.arch} (${hardware.shell ?? 'unknown shell'})`);

  const platformRoot = await resolvePlatformRoot();
  const allModules = await loadAllModules(platformRoot);
  const detectedStacks =
    mode === 'new' ? [] : await matchStacks(projectRoot, allModules);
  const signals = await scanSignals(projectRoot);
  const projectType = classify(signals);
  note(`project type: ${projectType}`);
  if (detectedStacks.length > 0) {
    note(`detected stacks: ${detectedStacks.join(', ')}`);
  }

  const previousManifest =
    mode === 'initialized' ? await readManifest(projectRoot) : null;

  // ------------------------------------------------------------------
  // [2/5] answers
  // ------------------------------------------------------------------
  progress(2, 'Resolving answers');

  // When resuming, seed defaults from the previous manifest where present.
  const answers = await resolveAnswers({
    profileOverride: options.profile ?? previousManifest?.profile,
    answersFile: options.answersFile,
    projectRoot,
    detectedStacks,
  });

  // An explicit `--profile` flag always wins over the previous manifest.
  if (options.profile !== undefined) {
    answers.profile = options.profile;
  }

  if (!nonInteractive) {
    // Lightweight interactive confirmation; the full Artifact B interview
    // lives in prompts/index.ts.
    const resp = await askInitQuestions({
      hardware,
      detectedProjectType: projectType,
      matchedStacks: detectedStacks,
      hasJiraCreds:
        (process.env.JIRA_API_TOKEN ?? '').length > 0 &&
        (process.env.JIRA_EMAIL ?? '').length > 0,
      nonInteractive,
      profileOverride: answers.profile,
      pmOverride: answers.pm,
    });
    if (!resp.proceed) {
      throw new ValidationError('User aborted init.', 'Re-run `agentic init` when ready.');
    }
    answers.profile = resp.profile;
    answers.pm = resp.pmIntegration;
  }

  note(`profile: ${answers.profile}`);
  note(`workspace: ${answers.workspace}`);
  note(`git: ${answers.git}`);
  note(`pm: ${answers.pm}`);
  note(`stacks: ${answers.stacks.length > 0 ? answers.stacks.join(', ') : '(none)'}`);

  // ------------------------------------------------------------------
  // [3/5] compose modules + preflights
  // ------------------------------------------------------------------
  progress(3, 'Composing modules');
  let composed: { modules: ModuleMeta[]; orderedInstall: string[] };
  try {
    composed = resolveModules(
      {
        profile: buildProfile(answers.profile),
        stacks: answers.stacks,
        workspace: answers.workspace,
        pm: answers.pm,
        git: answers.git,
        domains: answers.domains,
      },
      allModules,
    );
  } catch (err) {
    if (err instanceof ComposeError) throw err;
    throw classifyError(err);
  }
  note(`install order: ${composed.orderedInstall.join(' → ')}`);

  if (answers.pm === 'pm-jira') {
    const preflight = await checkInitiative({
      projectKey: answers.jira_project_key || undefined,
      siteUrl: answers.jira_site_url || undefined,
      initiativeKey: answers.initiative_key || undefined,
    });
    // The stub always returns `warning` — surface it so users know the
    // full initiative-link preflight hasn't been wired yet.
    warn(
      `jira preflight (stubbed): ${preflight.status}. ` +
        preflight.remediation.join(' · '),
    );
  }

  // ------------------------------------------------------------------
  // [4/5] render templates
  // ------------------------------------------------------------------
  progress(4, `Rendering ${mode === 'brownfield' ? 'brownfield overlay' : 'new-project template'}`);

  await ensureCopierAvailable();

  if (mode === 'brownfield') {
    note('running preserve-existing.sh');
    await runPreserveScript(platformRoot, projectRoot);
  }

  const templateSubdir = mode === 'brownfield' ? 'brownfield-overlay' : 'new-project';
  const templatePath = path.join(platformRoot, 'templates', templateSubdir);
  const templateAnswers =
    mode === 'brownfield'
      ? buildBrownfieldAnswers(answers)
      : buildNewProjectAnswers(answers, hardware.os);

  try {
    await renderTemplate({
      templatePath,
      targetPath: projectRoot,
      answers: templateAnswers,
    });
  } catch (err) {
    if (err instanceof TemplateError) throw err;
    throw new TemplateError(
      `Template render failed: ${(err as Error).message}`,
      'Inspect the copier output and re-run. Typical causes: missing copier binary, answers file malformed.',
    );
  }
  success('templates rendered');

  await renderModuleContributions({
    platformRoot,
    projectRoot,
    modules: composed.modules,
    answers,
  });
  success('module contributions rendered');

  // brownfield append-existing is invoked via copier `_tasks` in
  // templates/brownfield-overlay/copier.yml — we do NOT re-run it here.
  if (mode === 'brownfield') {
    note('append-existing.sh executed by copier _tasks (skipping re-run)');
  }

  // ------------------------------------------------------------------
  // [5/5] manifest + next steps
  // ------------------------------------------------------------------
  progress(5, 'Writing platform manifest');
  const manifest = buildManifest(
    answers,
    hardware,
    projectType === 'unclassified' && mode === 'new' ? 'new-empty' : projectType,
    composed.modules,
    previousManifest,
  );
  try {
    await writeManifest(projectRoot, manifest);
    await mirrorManifestToAgent(projectRoot);
  } catch (err) {
    if (err instanceof ManifestError) throw err;
    throw new ManifestError(
      `Failed to write platform-manifest.json: ${(err as Error).message}`,
      'Check write permissions on the project root and re-run.',
    );
  }
  success(`platform-manifest.json written (profile=${manifest.profile})`);

  // Write agent task files that guide subsequent IDE-agent work.
  const postInitTasks = await writePostInitTasks(projectRoot, mode, answers);
  if (postInitTasks.constitutionTask) {
    success(`post-init tasks written → ${postInitTasks.constitutionTask}`);
    if (postInitTasks.docsTask) {
      note(`docs audit task written → ${postInitTasks.docsTask}`);
    }
  }

  await printNextSteps(projectRoot, answers.profile, postInitTasks);

  process.stdout.write(chalk.green('\n✓ Morpheus init complete.\n'));
}
