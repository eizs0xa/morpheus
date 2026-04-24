/**
 * Mode detection for `agentic init`.
 *
 * NEW         — no `.git/` present
 * BROWNFIELD  — `.git/` present but no platform manifest
 * INITIALIZED — `.git/` + platform manifest both present
 *
 * The platform manifest can live at the project root (default, per
 * `util/manifest.ts`) or under `.agent/` (per the brownfield overlay's
 * preserve-script convention). We check both.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type InitMode = 'new' | 'brownfield' | 'initialized';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectMode(projectRoot: string): Promise<InitMode> {
  const hasGit = await exists(path.join(projectRoot, '.git'));
  const hasRootManifest = await exists(path.join(projectRoot, 'platform-manifest.json'));
  const hasAgentManifest = await exists(
    path.join(projectRoot, '.agent', 'platform-manifest.json'),
  );
  const hasManifest = hasRootManifest || hasAgentManifest;

  if (hasManifest) return 'initialized';
  if (!hasGit) return 'new';
  return 'brownfield';
}
