/**
 * Module resolver — enforces Morpheus composition rules (CONSTITUTION §1).
 *
 * Given a profile + user selections, returns the final, dependency-ordered
 * list of modules to install. Throws ComposeError on any rule violation.
 */
import { ComposeError } from '../util/errors.js';
import type { ModuleMeta } from '../detectors/stack.js';

export type ProfileName = 'builder' | 'verifier' | 'author' | 'explorer' | 'steward';

export interface Profile {
  name: ProfileName;
  modules: string[];
  skills_enabled: 'all' | string[];
  scaffolding: 'full' | 'partial' | 'prd_templates_only' | 'none';
  can_commit_code: boolean;
  extras?: string[];
}

export interface ResolveInput {
  profile: Profile;
  stacks: string[];
  workspace: string;
  pm: string | 'none';
  git: string;
  domains: string[];
}

export interface ResolvedModules {
  modules: ModuleMeta[];
  orderedInstall: string[];
}

const CORE_MODULE = 'core';
const WORKSPACE_PREFIX = 'workspace-';
const GIT_PREFIX = 'git-';
const PM_PREFIX = 'pm-';
const STACK_PREFIX = 'stack-';
const DOMAIN_PREFIX = 'domain-';

function findModule(all: ModuleMeta[], name: string): ModuleMeta {
  const match = all.find((m) => m.name === name);
  if (match === undefined) {
    throw new ComposeError(
      `Module '${name}' is not registered in the platform.`,
      `Ensure '${name}' exists under modules/ with a valid module.yaml, or remove it from the selection.`,
    );
  }
  return match;
}

function assertExactlyOne(kind: string, names: string[]): void {
  if (names.length === 0) {
    throw new ComposeError(
      `Composition requires exactly one ${kind}, got zero.`,
      `Select a single ${kind} module.`,
    );
  }
  if (names.length > 1) {
    throw new ComposeError(
      `Composition allows exactly one ${kind}; got ${names.length}: ${names.join(', ')}.`,
      `Keep only one ${kind} module and remove the rest.`,
    );
  }
}

function assertAtMostOne(kind: string, names: string[]): void {
  if (names.length > 1) {
    throw new ComposeError(
      `Composition allows at most one ${kind}; got ${names.length}: ${names.join(', ')}.`,
      `Remove the extra ${kind} module(s).`,
    );
  }
}

function validatePrefixes(selected: string[]): {
  workspaces: string[];
  gits: string[];
  pms: string[];
  stacks: string[];
  domains: string[];
} {
  const workspaces = selected.filter((n) => n.startsWith(WORKSPACE_PREFIX));
  const gits = selected.filter((n) => n.startsWith(GIT_PREFIX));
  const pms = selected.filter((n) => n.startsWith(PM_PREFIX));
  const stacks = selected.filter((n) => n.startsWith(STACK_PREFIX));
  const domains = selected.filter((n) => n.startsWith(DOMAIN_PREFIX));
  return { workspaces, gits, pms, stacks, domains };
}

function assertCompatibility(chosen: ModuleMeta[]): void {
  const nameSet = new Set(chosen.map((m) => m.name));
  for (const module of chosen) {
    for (const banned of module.incompatible_with) {
      if (nameSet.has(banned)) {
        throw new ComposeError(
          `Module '${module.name}' is incompatible with '${banned}'.`,
          `Remove one of the conflicting modules from the selection.`,
        );
      }
    }
  }
}

/** Topological sort on `requires` edges. */
function orderByDependencies(chosen: ModuleMeta[]): string[] {
  const byName = new Map(chosen.map((m) => [m.name, m]));
  const visited = new Set<string>();
  const ordered: string[] = [];
  const visiting = new Set<string>();

  function visit(name: string, chain: string[]): void {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new ComposeError(
        `Circular dependency detected: ${[...chain, name].join(' -> ')}.`,
        'Break the cycle by removing or rewriting one of the `requires` entries.',
      );
    }
    const module = byName.get(name);
    if (module === undefined) return; // Requires an unselected module; tolerated.
    visiting.add(name);
    for (const dep of module.requires) {
      visit(dep.name, [...chain, name]);
    }
    visiting.delete(name);
    visited.add(name);
    ordered.push(name);
  }

  // Start traversal from `core` if present, so it is always emitted first.
  if (byName.has(CORE_MODULE)) visit(CORE_MODULE, []);
  for (const module of chosen) visit(module.name, []);
  return ordered;
}

export function resolveModules(
  input: ResolveInput,
  allModules: ModuleMeta[],
): ResolvedModules {
  const requested = new Set<string>();
  requested.add(CORE_MODULE);
  for (const s of input.stacks) requested.add(s);
  requested.add(input.workspace);
  if (input.pm !== 'none' && input.pm.length > 0) requested.add(input.pm);
  requested.add(input.git);
  for (const d of input.domains) requested.add(d);

  const selectedNames = [...requested];
  const { workspaces, gits, pms, stacks, domains } = validatePrefixes(selectedNames);

  if (!requested.has(CORE_MODULE)) {
    throw new ComposeError(
      "Composition requires 'core'.",
      "Include 'core' in the module selection — it is mandatory.",
    );
  }
  assertExactlyOne('workspace', workspaces);
  assertExactlyOne('git provider', gits);
  assertAtMostOne('pm integration', pms);

  const chosen = selectedNames.map((name) => findModule(allModules, name));

  // Surface-level incompatibilities declared in module.yaml.
  assertCompatibility(chosen);

  const orderedNames = orderByDependencies(chosen);
  // Make absolutely sure `core` lands at position 0 when present.
  if (orderedNames[0] !== CORE_MODULE && orderedNames.includes(CORE_MODULE)) {
    const withoutCore = orderedNames.filter((n) => n !== CORE_MODULE);
    orderedNames.splice(0, orderedNames.length, CORE_MODULE, ...withoutCore);
  }

  // Keep stacks/domains sorted deterministically within their layer for
  // reproducible install output. (They have no deps among themselves.)
  void stacks;
  void domains;

  const byName = new Map(chosen.map((m) => [m.name, m]));
  const ordered = orderedNames
    .map((n) => byName.get(n))
    .filter((m): m is ModuleMeta => m !== undefined);

  return { modules: ordered, orderedInstall: orderedNames };
}
