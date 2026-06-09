import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const modulesRoot = path.join(root, 'modules');
const categories = ['core', 'stacks', 'workspaces', 'integrations', 'domains'];

let pass = 0;
let fail = 0;

function ok(message) {
  pass += 1;
  process.stdout.write(`PASS: ${message}\n`);
}

function bad(message) {
  fail += 1;
  process.stdout.write(`FAIL: ${message}\n`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseScalar(line) {
  const idx = line.indexOf(':');
  if (idx === -1) return null;
  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function parseModuleYaml(raw) {
  const lines = raw.split('\n');
  const result = { contributes: {} };
  let inContributes = false;
  let currentContrib = null;

  for (const line of lines) {
    if (/^\s*$/.test(line) || /^\s*#/.test(line)) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const trimmed = line.trim();

    if (indent === 0) {
      inContributes = trimmed === 'contributes:';
      currentContrib = null;
      const scalar = parseScalar(trimmed);
      if (scalar && scalar.value.length > 0) result[scalar.key] = scalar.value;
      continue;
    }

    if (inContributes && indent === 2 && trimmed.endsWith(':')) {
      currentContrib = trimmed.slice(0, -1);
      result.contributes[currentContrib] = [];
      continue;
    }

    if (inContributes && currentContrib && indent >= 4 && trimmed.startsWith('- ')) {
      result.contributes[currentContrib].push(trimmed.slice(2).trim());
    }
  }

  return result;
}

async function findModuleManifests() {
  const manifests = [];
  for (const category of categories) {
    const categoryPath = path.join(modulesRoot, category);
    if (!(await exists(categoryPath))) continue;
    if (category === 'core') {
      const modulePath = path.join(categoryPath, 'module.yaml');
      if (await exists(modulePath)) manifests.push(modulePath);
      continue;
    }
    const entries = await fs.readdir(categoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const modulePath = path.join(categoryPath, entry.name, 'module.yaml');
      if (await exists(modulePath)) manifests.push(modulePath);
    }
  }
  return manifests.sort();
}

async function validateModule(modulePath) {
  const raw = await fs.readFile(modulePath, 'utf8');
  const parsed = parseModuleYaml(raw);
  const rel = path.relative(root, modulePath);
  const moduleDir = path.dirname(modulePath);

  for (const field of ['name', 'version', 'description']) {
    if (parsed[field]) ok(`${rel}: ${field} present`);
    else bad(`${rel}: missing ${field}`);
  }

  for (const [type, items] of Object.entries(parsed.contributes)) {
    for (const item of items) {
      if (type === 'hooks' && !item.includes('/')) {
        ok(`${rel}: contributes.${type} declares event hook: ${item}`);
        continue;
      }
      const target = path.join(moduleDir, item);
      if (await exists(target)) ok(`${rel}: contributes.${type} exists: ${item}`);
      else bad(`${rel}: missing contributes.${type}: ${item}`);
    }
  }
}

async function main() {
  const manifests = await findModuleManifests();
  if (manifests.length === 0) {
    bad('No module manifests found');
  }
  for (const manifest of manifests) {
    await validateModule(manifest);
  }
  process.stdout.write(`\nTOTAL: pass=${pass} fail=${fail}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exit(1);
});
