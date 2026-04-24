/**
 * Jira preflight — STUB wrapper.
 *
 * TODO: wire this to `modules/integrations/pm-jira/preflight/initiative-check.ts`
 * once the module-to-CLI import path is designed (today the CLI is a separate
 * TS package under `cli/` and cannot import TS sources that live outside its
 * `rootDir`). The permanent design options on the table are:
 *   (a) compile the preflight TS alongside the CLI via a shared tsconfig;
 *   (b) ship the preflight check as a JS asset inside the module and
 *       dynamic-import it by absolute path;
 *   (c) expose the preflight as a subprocess (`node --import tsx ...`) from
 *       the module itself.
 *
 * Until a decision lands, this stub always returns a `warning` status with
 * clear remediation. The real network call has never been made here — it is
 * intentionally a no-op so `agentic init --non-interactive` stays hermetic.
 */
export type PreflightStatus = 'ok' | 'warning' | 'error';

export interface PreflightResult {
  status: PreflightStatus;
  remediation: string[];
  /** Marker so tests and the summary output can prove the stub was invoked. */
  stubbed: true;
}

export interface PreflightInput {
  projectKey?: string;
  siteUrl?: string;
  initiativeKey?: string;
}

export async function checkInitiative(input: PreflightInput): Promise<PreflightResult> {
  const remediation: string[] = [];
  if (!input.projectKey) {
    remediation.push('Set MORPHEUS_JIRA_PROJECT_KEY or pass jira_project_key in answers.');
  }
  if (!input.siteUrl) {
    remediation.push('Set MORPHEUS_JIRA_SITE_URL or pass jira_site_url in answers.');
  }
  remediation.push(
    'Full Jira preflight is stubbed until the module-to-CLI import path is finalized.',
    'Track: modules/integrations/pm-jira/preflight/initiative-check.ts',
  );
  return {
    status: 'warning',
    remediation,
    stubbed: true,
  };
}
