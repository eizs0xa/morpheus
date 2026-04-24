# ADR-002 — Copier vs cookiecutter

- Status: accepted
- Date: 2025-01-08
- Supersedes: —
- Superseded by: —

## Context

Morpheus scaffolds projects from templates and must also **update** existing projects to newer platform versions without blowing away local customizations. A file a user customized between releases must not be silently overwritten; the tool must emit a diff, let the user choose, and record the answers used so future updates can find them.

Two mature Python-based template engines compete in this space:

1. **[Cookiecutter](https://cookiecutter.readthedocs.io/)** — ubiquitous, simple, one-shot rendering. Re-running against an existing project overwrites. It has no first-class update path.
2. **[Copier](https://copier.readthedocs.io/)** — newer, declarative answers file (`.copier-answers.yml`), **native `copier update` command** with three-way merge, Jinja2 templates, conditional files via YAML, per-file `when:` clauses, and arbitrary post-render tasks (`_tasks`).

## Decision

**Copier.**

## Rationale

- **Native `update` support.** Our value proposition depends on in-place platform updates. Cookiecutter has no built-in update. Copier's `update` command performs a three-way merge between the ancestor (prior version), theirs (new template), and ours (current project). This is exactly what we need.
- **Answers file.** Copier writes `.copier-answers.yml` at render time, recording every variable used. We read this file on update to know what the user answered originally. Cookiecutter requires hand-rolling this persistence.
- **Conditional files.** Copier supports per-file `when:` clauses driven by template variables. Profiles like `author` render only a subset of files — Copier does this declaratively.
- **Post-render tasks.** The brownfield overlay runs `preserve-existing.sh` and `append-existing.sh` via Copier's `_tasks`. Cookiecutter has hooks but they're less expressive.
- **Active development.** Copier is the more-invested-in engine as of this writing. Cookiecutter has been stable-to-dormant.

## Consequences

Positive:

- Update flow is a thin wrapper around `copier update` — we inherit a battle-tested merge semantics instead of writing it.
- Answers persistence is automatic.
- Conditional rendering per profile is declarative.
- Post-render automation for brownfield is straightforward.

Negative:

- Users need Python + Copier installed. The CLI shells out to `copier` as a subprocess. This adds a dependency on the user's machine. Acceptable — Copier installs via `pipx install copier` in ~5 seconds.
- Jinja2 is Python-flavored templating. Contributors used to Mustache or Handlebars need to learn it. Acceptable — the templates Morpheus ships are small and well-commented.
- Our CLI is Node+TypeScript; invoking Copier via subprocess adds complexity in error handling. We wrap it in `composers/file-renderer.ts` and test the wrapper directly.

## Tradeoffs considered

- **Hand-rolled template engine.** Rejected. Writing a three-way merge right is a multi-year effort. No reason to relitigate this in Morpheus.
- **Yeoman.** Considered. Mature and Node-native. But Yeoman's update story is weaker than Copier's, and Yeoman's generator abstraction is heavier than we need.
- **Plop.js.** Rejected. Plop is a file-scaffolder, not a project-scaffolder with update semantics.
- **Cruft (a Cookiecutter wrapper adding update).** Considered. Cruft adds update to Cookiecutter but with worse ergonomics than Copier's native implementation. Not worth the composition.

## Reversibility

Reversible with effort. If Copier development stalls or we hit an architectural ceiling, we could migrate by:

1. Freezing current `copier.yml` variables as the answers contract.
2. Porting the `template/` tree to the replacement engine's format.
3. Porting the `_tasks` into CLI-invoked steps.
4. Writing a migration script that converts `.copier-answers.yml` to the new engine's persistence format.

This would be a MAJOR platform bump. No such pressure today.

## Related

- [CLI `file-renderer`](../../cli/src/composers/file-renderer.ts)
- [Template `new-project`](../../templates/new-project/)
- [Template `brownfield-overlay`](../../templates/brownfield-overlay/)
- [Updating the platform](../for-engineers/updating-the-platform.md)
