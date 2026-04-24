/**
 * Typed error hierarchy for the Morpheus CLI.
 *
 * Every error carries a stable `code` and a human-readable `remediation`
 * so callers (commands, tests) can surface actionable messages.
 */
export abstract class AgenticError extends Error {
  public abstract readonly code: string;
  public readonly remediation: string;

  constructor(message: string, remediation: string) {
    super(message);
    this.name = new.target.name;
    this.remediation = remediation;
  }
}

export class ComposeError extends AgenticError {
  public readonly code = 'E_COMPOSE';
}

export class ValidationError extends AgenticError {
  public readonly code = 'E_VALIDATION';
}

export class TemplateError extends AgenticError {
  public readonly code = 'E_TEMPLATE';
}

export class ManifestError extends AgenticError {
  public readonly code = 'E_MANIFEST';
}

export class DetectionError extends AgenticError {
  public readonly code = 'E_DETECTION';
}

export class NotImplementedError extends AgenticError {
  public readonly code = 'E_NOT_IMPLEMENTED';

  constructor(feature: string, owner: string) {
    super(
      `NOT_IMPLEMENTED — ${feature}`,
      `This command is owned by workstream ${owner}. It will be wired up once that workstream ships.`,
    );
  }
}
