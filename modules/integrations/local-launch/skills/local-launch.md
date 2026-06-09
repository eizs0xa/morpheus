---
name: local-launch
version: 0.1.0
tier: integration
description: Generate and maintain OS-aware local launch tasks for macOS and Windows, including environment overlays and safe Okta/local-auth testing guidance.
when_to_use: |
  - A team wants one-click local launch for testing from VS Code tasks.
  - The project has different macOS and Windows environment variable behavior.
  - Local auth, Okta bypass, mock auth, or redirect URL differences make startup fragile.
when_not_to_use: |
  - The repo has no local development runtime.
  - The user asks to bypass production authentication controls.
inputs:
  - project.config.json
  - .env.example
  - product repo README/start scripts
outputs:
  - .vscode/tasks.json or task snippet
  - .agent/launch/morpheus-launch.sh
  - .agent/launch/morpheus-launch.ps1
  - local-launch.env.example
---

# local-launch

## Purpose

Make local testing easy and consistent across macOS and Windows without weakening production auth. The module creates launch options that normalize env files, ports, shell differences, and local auth toggles.

## Design rules

1. Detect OS first: `darwin`, `linux`, or `win32`.
2. Load env in layers: shared `.env`, then OS overlay, then process env.
3. Treat auth bypass as local-only and explicit.
4. Never write real secrets into generated scripts or tasks.
5. Prefer existing repo start scripts over invented commands.
6. Keep frontend and backend launch commands configurable.

## Recommended env contract

```bash
MORPHEUS_LAUNCH_MODE=fullstack
MORPHEUS_BACKEND_DIR=../focal-backend
MORPHEUS_FRONTEND_DIR=../focal-frontend
MORPHEUS_BACKEND_COMMAND=python -m flask run --port 8080
MORPHEUS_FRONTEND_COMMAND=pnpm dev --host 0.0.0.0 --port 8000
MORPHEUS_AUTH_PROVIDER=okta
MORPHEUS_LOCAL_AUTH_MODE=mock
MORPHEUS_OKTA_REDIRECT_URI=http://localhost:8000/login/callback
```

## Okta/local auth guidance

- Local auth bypass must be opt-in and visible in `.env.local` or an OS overlay.
- Production auth variables must not be changed by generated launch scripts.
- Prefer mock auth for local UI development when the app supports it.
- If real Okta is used locally, generated docs must call out redirect URI and issuer requirements.

## Procedure

1. Read `project.config.json` to find repo roles.
2. Inspect product repo package scripts and README startup commands.
3. Detect auth provider references: Okta, Entra, mock auth, or none.
4. Generate OS-aware scripts from templates.
5. Generate a VS Code task named `Morpheus: Launch Local App`.
6. Run a dry-run validation that prints commands without starting servers.
7. Tell the user which env variables still need local values.

## Stop lines

- Never commit `.env` or local secret files.
- Never disable production auth settings.
- Never embed tokens, cookies, passwords, or client secrets in launch tasks.
- Never assume macOS shell syntax works on Windows PowerShell.
