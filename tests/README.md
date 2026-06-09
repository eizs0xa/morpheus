# Morpheus tests

This directory validates the repo-first, chat-orchestrated Morpheus module catalog. It no longer exercises a CLI runtime.

## Running

```bash
npm test
```

## What is checked

- Every module manifest parses well enough for repository validation.
- Every module declares required fields.
- Every contributed skill, workflow, template, schema, hook, and instruction file exists.
- No CLI package is required to validate the repository shape.
