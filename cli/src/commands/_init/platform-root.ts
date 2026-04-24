/**
 * Resolve the Morpheus platform root (the repo that contains `modules/`
 * and `templates/`).
 *
 * The CLI may run either from `cli/dist/` (built) or `cli/src/` (tsx dev)
 * or as an installed binary. We probe a short list of candidates rooted
 * in the current module URL and the working directory.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function hasPlatformMarkers(dir: string): Promise<boolean> {
  try {
    await fs.access(path.join(dir, 'modules', 'core', 'module.yaml'));
    await fs.access(path.join(dir, 'templates', 'new-project', 'copier.yml'));
    return true;
  } catch {
    return false;
  }
}

export async function resolvePlatformRoot(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // dist/commands/_init -> dist/commands -> dist -> cli -> morpheus
    path.resolve(here, '..', '..', '..', '..'),
    // src/commands/_init -> src/commands -> src -> cli -> morpheus
    path.resolve(here, '..', '..', '..', '..'),
    // dist/commands -> dist -> cli -> morpheus
    path.resolve(here, '..', '..', '..'),
    path.resolve(process.cwd()),
    path.resolve(process.cwd(), '..'),
  ];
  for (const c of candidates) {
    if (await hasPlatformMarkers(c)) return c;
  }
  // Last resort: return the best guess; callers will get a clear error
  // from downstream module-loading when files cannot be read.
  return candidates[0]!;
}
