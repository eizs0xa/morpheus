import { describe, it, expect } from 'vitest';
import { resolveModules, type Profile } from '../../src/composers/module-resolver.js';
import type { ModuleMeta } from '../../src/detectors/stack.js';
import { ComposeError } from '../../src/util/errors.js';

const PROFILE_BUILDER: Profile = {
  name: 'builder',
  modules: ['core'],
  skills_enabled: 'all',
  scaffolding: 'full',
  can_commit_code: true,
};

function mod(
  name: string,
  opts: Partial<Pick<ModuleMeta, 'requires' | 'incompatible_with' | 'version'>> = {},
): ModuleMeta {
  return {
    name,
    version: opts.version ?? '0.1.0',
    path: `/fake/${name}`,
    requires: opts.requires ?? [],
    incompatible_with: opts.incompatible_with ?? [],
    raw: {},
  };
}

describe('resolveModules', () => {
  const registry: ModuleMeta[] = [
    mod('core'),
    mod('stack-node', { requires: [{ name: 'core', version_range: '>=0.1.0' }] }),
    mod('stack-react', { requires: [{ name: 'core', version_range: '>=0.1.0' }] }),
    mod('workspace-microsoft', {
      requires: [{ name: 'core', version_range: '>=0.1.0' }],
      incompatible_with: ['workspace-google'],
    }),
    mod('workspace-google', {
      requires: [{ name: 'core', version_range: '>=0.1.0' }],
      incompatible_with: ['workspace-microsoft'],
    }),
    mod('git-github', {
      requires: [{ name: 'core', version_range: '>=0.1.0' }],
      incompatible_with: ['git-gitlab'],
    }),
    mod('pm-jira', {
      requires: [{ name: 'core', version_range: '>=0.1.0' }],
      incompatible_with: ['pm-linear'],
    }),
  ];

  it('happy path: resolves builder + stacks + workspace + git, core first', () => {
    const result = resolveModules(
      {
        profile: PROFILE_BUILDER,
        stacks: ['stack-node', 'stack-react'],
        workspace: 'workspace-microsoft',
        pm: 'pm-jira',
        git: 'git-github',
        domains: [],
      },
      registry,
    );
    expect(result.orderedInstall[0]).toBe('core');
    expect(result.orderedInstall).toContain('stack-node');
    expect(result.orderedInstall).toContain('stack-react');
    expect(result.orderedInstall).toContain('workspace-microsoft');
    expect(result.orderedInstall).toContain('git-github');
    expect(result.orderedInstall).toContain('pm-jira');
  });

  it('throws ComposeError when two workspaces are requested', () => {
    const registryTwo = [...registry, mod('workspace-microsoft-extra')];
    // Emulate a second workspace slipping into the 'workspace' slot via the
    // stacks bucket (the typical real-world shape of this bug).
    expect(() =>
      resolveModules(
        {
          profile: PROFILE_BUILDER,
          stacks: ['workspace-google'],
          workspace: 'workspace-microsoft',
          pm: 'none',
          git: 'git-github',
          domains: [],
        },
        registryTwo,
      ),
    ).toThrowError(ComposeError);
  });

  it('throws ComposeError when incompatible modules are selected together', () => {
    // workspace-microsoft declares workspace-google in incompatible_with.
    expect(() =>
      resolveModules(
        {
          profile: PROFILE_BUILDER,
          stacks: [],
          workspace: 'workspace-microsoft',
          pm: 'none',
          git: 'git-github',
          // Slip workspace-google in via domains to bypass the slot check
          // and exercise the compatibility matrix.
          domains: ['workspace-google'],
        },
        registry,
      ),
    ).toThrowError(ComposeError);
  });

  it('throws ComposeError when zero git providers are chosen', () => {
    expect(() =>
      resolveModules(
        {
          profile: PROFILE_BUILDER,
          stacks: [],
          workspace: 'workspace-microsoft',
          pm: 'none',
          git: '',
          domains: [],
        },
        registry,
      ),
    ).toThrowError(ComposeError);
  });

  it('places core at position 0 in orderedInstall', () => {
    const result = resolveModules(
      {
        profile: PROFILE_BUILDER,
        stacks: ['stack-react', 'stack-node'],
        workspace: 'workspace-microsoft',
        pm: 'none',
        git: 'git-github',
        domains: [],
      },
      registry,
    );
    expect(result.orderedInstall[0]).toBe('core');
  });
});
