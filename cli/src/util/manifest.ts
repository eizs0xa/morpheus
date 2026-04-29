import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ManifestError } from './errors.js';

export interface DetectedHardware {
  os: string;
  arch: string;
  shell?: string;
}

export interface PlatformManifest {
  platform_version: string;
  profile: 'builder' | 'verifier' | 'author' | 'explorer' | 'steward';
  detected_hardware: DetectedHardware;
  project_type:
    | 'fullstack-web'
    | 'frontend-only'
    | 'backend-service'
    | 'data-engineering'
    | 'mobile-app'
    | 'library-or-sdk'
    | 'new-empty'
    | 'unclassified';
  modules: Record<string, string>;
  governance: {
    risk_tier: number;
    agent_registry_id?: string;
    intake_record_id?: string;
    review_track?: 'accelerated' | 'standard' | 'enhanced' | 'board';
    kill_switch?: {
      mechanism: 'feature_flag' | 'env_var' | 'api_disable' | 'deploy_rollback' | 'manual';
      owner: string;
      reference?: string;
    };
    decommission?: {
      planned_date?: string;
      status?: 'active' | 'deprecated' | 'sunset-scheduled' | 'decommissioned';
      successor_agent_registry_id?: string;
    };
  };
  initialized_by: string;
  initialized_at: string;
  last_updated_at: string;
}

const MANIFEST_FILENAME = 'platform-manifest.json';

/**
 * Resolve the path to the bundled platform-manifest JSON schema.
 *
 * We walk up from the CLI package root to find `modules/core/schemas/`.
 * The CLI runs either from `cli/dist/` (built) or `cli/src/` (dev),
 * so we probe a handful of candidate roots.
 */
async function resolveSchemaPath(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // dist/util -> cli/dist -> cli -> morpheus
    path.resolve(here, '..', '..', '..', 'modules', 'core', 'schemas', 'platform-manifest.schema.json'),
    // src/util -> cli/src -> cli -> morpheus
    path.resolve(here, '..', '..', '..', 'modules', 'core', 'schemas', 'platform-manifest.schema.json'),
    // when run from morpheus root
    path.resolve(process.cwd(), 'modules', 'core', 'schemas', 'platform-manifest.schema.json'),
    // when run from cli/
    path.resolve(process.cwd(), '..', 'modules', 'core', 'schemas', 'platform-manifest.schema.json'),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  throw new ManifestError(
    'Unable to locate platform-manifest.schema.json.',
    'Run the CLI from inside a Morpheus checkout, or set the working directory to the morpheus root.',
  );
}

let cachedSchema: unknown | null = null;

async function loadSchema(): Promise<unknown> {
  if (cachedSchema !== null) return cachedSchema;
  const schemaPath = await resolveSchemaPath();
  const raw = await fs.readFile(schemaPath, 'utf-8');
  cachedSchema = JSON.parse(raw);
  return cachedSchema;
}

function buildAjv(): Ajv {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

/**
 * Validate an arbitrary value against the platform-manifest schema.
 * Returns a structured result rather than throwing, so callers may
 * choose whether to surface a `ManifestError` or a friendlier message.
 */
export function validateManifest(value: unknown): { valid: boolean; errors: string[] } {
  // Synchronous wrapper that requires the schema to be loaded first.
  // We cache the compiled validator lazily via a module-level promise.
  if (cachedValidator === null) {
    throw new ManifestError(
      'Manifest validator not initialized.',
      'Call readManifest(...) or ensureValidatorLoaded() before validateManifest().',
    );
  }
  const valid = cachedValidator(value);
  if (valid) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: (cachedValidator.errors ?? []).map(formatAjvError),
  };
}

type CompiledValidator = ((data: unknown) => boolean) & { errors?: ErrorObject[] | null };
let cachedValidator: CompiledValidator | null = null;

export async function ensureValidatorLoaded(): Promise<void> {
  if (cachedValidator !== null) return;
  const schema = await loadSchema();
  const ajv = buildAjv();
  cachedValidator = ajv.compile(schema as object) as CompiledValidator;
}

function formatAjvError(err: ErrorObject): string {
  const pointer = err.instancePath || '(root)';
  return `${pointer} ${err.message ?? 'failed validation'}`.trim();
}

export async function readManifest(projectRoot: string): Promise<PlatformManifest | null> {
  const manifestPath = path.join(projectRoot, MANIFEST_FILENAME);
  let raw: string;
  try {
    raw = await fs.readFile(manifestPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new ManifestError(
      `Failed to read ${MANIFEST_FILENAME}: ${(err as Error).message}`,
      'Check file permissions and that the project root is correct.',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ManifestError(
      `Invalid JSON in ${MANIFEST_FILENAME}: ${(err as Error).message}`,
      'Repair or delete the manifest and re-run `agentic init`.',
    );
  }
  await ensureValidatorLoaded();
  const result = validateManifest(parsed);
  if (!result.valid) {
    throw new ManifestError(
      `platform-manifest.json failed schema validation:\n  - ${result.errors.join('\n  - ')}`,
      'Fix the listed fields or regenerate the manifest via `agentic init`.',
    );
  }
  return parsed as PlatformManifest;
}

export async function writeManifest(
  projectRoot: string,
  manifest: PlatformManifest,
): Promise<void> {
  await ensureValidatorLoaded();
  const result = validateManifest(manifest);
  if (!result.valid) {
    throw new ManifestError(
      `Refusing to write invalid manifest:\n  - ${result.errors.join('\n  - ')}`,
      'Correct the failing fields before writing.',
    );
  }
  const manifestPath = path.join(projectRoot, MANIFEST_FILENAME);
  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(manifestPath, body, 'utf-8');
}
