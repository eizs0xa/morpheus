# Morpheus Releases

Releases are first-class because they cut across features.

A release usually maps to a Jira fixVersion, release train, deployment window, or production change event.

## Expected Release Shape

```text
releases/<release-or-fixversion>/
  README.md
  release-plan.md
  scope.md
  feature-manifest.md
  readiness-checklist.md
  deployment-plan.md
  rollback-plan.md
  release-notes.md
  stakeholder-summary.md
  qa-signoff.md
  changelog.md
  artifacts/
```

## Why This Exists

Feature docs explain what was built. Release docs explain what is going out, when, with what risk, with what validation, and with what communication.

Release skills should be added only after a real release workflow is exercised.