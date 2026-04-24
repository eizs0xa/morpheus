/**
 * Preflight: Jira Initiative linkage check.
 *
 * Per platform constitution §6.6, Jira validation MUST NOT expand beyond
 * initiative existence. This preflight returns a WARNING (never an error,
 * never a throw) when no matching initiative is found — surfacing
 * remediation options to the user without blocking the init flow.
 *
 * This module is a stub: network clients are documented but not implemented
 * here. The CLI (WS-10/11) imports `checkInitiative` and wires it to a real
 * Jira client. Keep the public surface (types + function signature) stable.
 */

export interface JiraConfig {
  /** Jira site URL, e.g. "company.atlassian.net". */
  site: string;
  /** Jira project key, e.g. "PROJ". */
  projectKey: string;
}

export interface InitiativeSummary {
  key: string;
  summary: string;
}

export interface InitiativeCheckResult {
  status: 'ok' | 'warning' | 'error';
  message: string;
  initiative?: InitiativeSummary;
  /**
   * Human-readable remediation options. Populated on 'warning' so the CLI can
   * render an interactive picker. The stop-line (§6.6) prevents turning any
   * of these into a hard block.
   */
  remediation?: string[];
}

/**
 * Remediation options offered when no initiative is found. Kept as a module
 * constant so the CLI prompt and doctor command agree on the exact wording.
 */
export const NO_INITIATIVE_REMEDIATION: readonly string[] = [
  'Create new initiative',
  'Link to existing initiative',
  'Skip (small project or internal tool)',
];

// TODO: real Jira client — replace the three stubs below with a thin wrapper
// around @atlassian/jira-api or the @modelcontextprotocol/server-jira MCP.

/**
 * Verify the configured Jira site is reachable with current credentials.
 * Stub: returns true. Real impl should call GET /rest/api/3/myself.
 */
async function canConnect(_config: JiraConfig): Promise<boolean> {
  // TODO: real Jira client
  return true;
}

/**
 * Fetch the Jira project by key to confirm it exists and the caller has access.
 * Stub: returns a minimal synthetic object. Real impl should call
 * GET /rest/api/3/project/{key}.
 */
async function getProject(config: JiraConfig): Promise<{ key: string } | null> {
  // TODO: real Jira client
  return { key: config.projectKey };
}

/**
 * Search for Initiatives linked to the given project + repo URL.
 * Stub: returns an empty list. Real impl should issue a JQL search for
 * `issuetype = Initiative AND project = <key> AND <repo-url-custom-field> ~ "<repoUrl>"`
 * or fall back to summary contains.
 */
async function searchInitiatives(
  _config: JiraConfig,
  _repoUrl: string,
): Promise<InitiativeSummary[]> {
  // TODO: real Jira client
  return [];
}

/**
 * Check whether the project has a linked Jira Initiative.
 *
 * Returns:
 *   - `ok` when exactly one initiative is found.
 *   - `warning` when zero initiatives are found, with remediation options.
 *   - `warning` when multiple are found, asking the caller to disambiguate.
 *   - `error` ONLY when Jira is completely unreachable or the project key
 *     does not exist (i.e. configuration is broken, not missing linkage).
 *
 * Per stop-line §6.6 this function NEVER blocks on a missing initiative;
 * the CLI treats `warning` as advisory.
 */
export async function checkInitiative(
  config: JiraConfig,
  repoUrl: string,
): Promise<InitiativeCheckResult> {
  const connected = await canConnect(config);
  if (!connected) {
    return {
      status: 'error',
      message: `Cannot reach Jira site ${config.site}. Check credentials and network.`,
    };
  }

  const project = await getProject(config);
  if (!project) {
    return {
      status: 'error',
      message: `Jira project '${config.projectKey}' not found or not accessible.`,
    };
  }

  const initiatives = await searchInitiatives(config, repoUrl);

  if (initiatives.length === 0) {
    return {
      status: 'warning',
      message:
        `No Jira Initiative is linked to repository ${repoUrl} in project ${config.projectKey}.`,
      remediation: [...NO_INITIATIVE_REMEDIATION],
    };
  }

  if (initiatives.length > 1) {
    return {
      status: 'warning',
      message:
        `Multiple Initiatives match repository ${repoUrl}; pick one to link.`,
      remediation: initiatives.map((i) => `Link to ${i.key} — ${i.summary}`),
    };
  }

  return {
    status: 'ok',
    message: `Linked to Initiative ${initiatives[0].key}.`,
    initiative: initiatives[0],
  };
}
