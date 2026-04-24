/**
 * The 5-question interview — Artifact B §2.
 *
 * Question 1 is informational (hardware display).
 * In `--non-interactive` mode every answer is sourced from env/flags.
 */
import { confirm, select } from '@inquirer/prompts';
import type { Hardware } from '../detectors/hardware.js';
import type { ProjectType } from '../detectors/project-type.js';
import type { ProfileName } from '../composers/module-resolver.js';

export interface InitContext {
  hardware: Hardware;
  detectedProjectType: ProjectType;
  matchedStacks: string[];
  hasJiraCreds: boolean;
  nonInteractive: boolean;
  profileOverride?: ProfileName;
  pmOverride?: string;
}

export interface InitAnswers {
  profile: ProfileName;
  confirmedProjectType: ProjectType;
  pmIntegration: string | 'none';
  proceed: boolean;
}

const PROFILE_CHOICES: { value: ProfileName; name: string; description: string }[] = [
  { value: 'builder', name: 'builder', description: 'writes and ships code' },
  { value: 'verifier', name: 'verifier', description: 'writes tests, holdouts, acceptance' },
  { value: 'author', name: 'author', description: 'writes specs, PRDs, design docs' },
  { value: 'explorer', name: 'explorer', description: 'reads and maps, read-only' },
  { value: 'steward', name: 'steward', description: 'owns constitution and conventions' },
];

const PROJECT_TYPE_CHOICES: ProjectType[] = [
  'fullstack-web',
  'frontend-only',
  'backend-service',
  'data-engineering',
  'mobile-app',
  'library-or-sdk',
  'new-empty',
  'unclassified',
];

export async function askInitQuestions(ctx: InitContext): Promise<InitAnswers> {
  if (ctx.nonInteractive) {
    return {
      profile: ctx.profileOverride ?? 'builder',
      confirmedProjectType: ctx.detectedProjectType,
      pmIntegration: ctx.pmOverride ?? 'none',
      proceed: true,
    };
  }

  // Q1 — hardware is display only (no prompt).
  // Q2 — profile.
  const profile = (await select({
    message: 'Which profile fits your work?',
    choices: PROFILE_CHOICES.map((c) => ({ value: c.value, name: `${c.name} — ${c.description}` })),
    default: 'builder',
  })) as ProfileName;

  // Q3 — project type confirm or change.
  const accept = await confirm({
    message: `Detected project type '${ctx.detectedProjectType}'. Use this classification?`,
    default: true,
  });
  const confirmedProjectType = accept
    ? ctx.detectedProjectType
    : ((await select({
        message: 'Pick a project type',
        choices: PROJECT_TYPE_CHOICES.map((t) => ({ value: t, name: t })),
        default: ctx.detectedProjectType,
      })) as ProjectType);

  // Q4 — Jira preflight, only when a pm integration is chosen.
  let pmIntegration: string | 'none' = ctx.pmOverride ?? 'none';
  if (pmIntegration === 'pm-jira' && !ctx.hasJiraCreds) {
    const confirmContinue = await confirm({
      message:
        'Jira credentials were not detected in env. Continue without preflight? (initiative link will be skipped)',
      default: false,
    });
    if (!confirmContinue) pmIntegration = 'none';
  }

  // Q5 — proceed.
  const proceed = await confirm({
    message: 'Proceed with scaffolding?',
    default: true,
  });

  return { profile, confirmedProjectType, pmIntegration, proceed };
}
